import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthorizationHeaderService } from 'iridium-authorization-header';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { ENVIRONMENT_CONFIG } from '../environment.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const environment = inject(ENVIRONMENT_CONFIG);
    const authorizationHeaderService = inject(AuthorizationHeaderService);
    if (req.url === environment.graphQLUri && authorizationHeaderService.isRefreshable()) {
        return authorizationHeaderService.getValidAuthorizationHeader().pipe(
            catchError(() => {
                // cancel request
                return EMPTY;
            }),
            map((authorizationHeader) => req.clone({ setHeaders: { Authorization: authorizationHeader } })),
            switchMap((req) => next(req))
        );
    } else {
        return next(req);
    }
};
