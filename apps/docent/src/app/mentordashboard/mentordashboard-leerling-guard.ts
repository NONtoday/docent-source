import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';

export const mentordashboardLeerlingGuard: CanActivateFn = (_, state) => {
    const medewerkerDataService = inject(MedewerkerDataService);
    const router = inject(Router);
    // we zitten al op een leerling child route: geen redirect nodig
    if (MentordashboardChildRouteRegex.test(state.url)) {
        return true;
    }

    // we zitten op de leerling root route: redirect naar overzicht of profiel, afhankelijk van rechten
    return medewerkerDataService.heeftToegangTotMentordashboardCompleet().pipe(
        take(1),
        map((heeftToegang) => {
            if (heeftToegang) {
                router.navigateByUrl(state.url + '/overzicht');
            } else {
                router.navigateByUrl(state.url + '/profiel');
            }
            return false;
        })
    );
};

const MentordashboardChildRouteRegex = /\/leerling\/\d+\/.+/;
