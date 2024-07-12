import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { take, tap } from 'rxjs/operators';
import { AuthService } from '../../auth';
import { storeRequestedUrl } from '../../auth/auth.utils';
import { MedewerkerDataService } from '../services/medewerker-data.service';

export const toegangTotEloEnSwGuard: CanMatchFn = () => {
    const medewerkerService = inject(MedewerkerDataService);
    const router = inject(Router);
    const authService = inject(AuthService);

    if (authService.isLoggedIn()) {
        return medewerkerService.heeftToegangTotEloEnSw().pipe(
            take(1),
            tap((heeftToegang) => {
                if (!heeftToegang) {
                    router.navigate(['/rooster']);
                }
            })
        );
    } else {
        // Pathname + search, zodat query parameters ook meegenomen worden.
        storeRequestedUrl(window.location.pathname + window.location.search);
        return authService.oauthUrlTree;
    }
};
