import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';

import { LesDataService } from '../../les/les-data.service';

export const roosterAfspraakGuard: CanActivateFn = (route) => {
    const afspraakId = route.parent?.paramMap.get('id');
    if (!afspraakId) {
        return false;
    }

    const lesdataService = inject(LesDataService);
    const router = inject(Router);
    const isLesplanning = route.url.length > 0 && route.url[0].path === 'lesplanning';

    return lesdataService.getAfspraak(afspraakId).pipe(
        tap((afspraak) => {
            if (!afspraak) {
                router.navigate(['/rooster']);
                return;
            }

            if (isLesplanning && (!afspraak.heeftLesgroepen || afspraak.isKwt)) {
                router.navigate(['/rooster/les/' + afspraak.id + '/registratie']);
                return;
            }
        }),
        map((afspraak) => afspraak.isRoosterAfspraak || afspraak.presentieRegistratieVerplicht),
        tap((isRegistratieToegestaan) => {
            if (!isRegistratieToegestaan) {
                router.navigate(['/rooster']);
                return;
            }
        })
    );
};
