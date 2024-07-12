import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { storeRequestedUrl } from './auth.utils';

export const authGuard: CanActivateFn = (_, state) => {
    const authService = inject(AuthService);
    storeRequestedUrl(state.url);
    if (authService.isLoggedIn()) {
        return true;
    } else {
        return authService.oauthUrlTree;
    }
};
