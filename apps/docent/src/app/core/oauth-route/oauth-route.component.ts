import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { IconDirective } from 'harmony';
import { IconSynchroniseren, provideIcons } from 'harmony-icons';
import { AuthService } from '../../auth';
import { cleanLocalStorage } from '../../auth/auth.utils';
import { isCookieStorageInit } from '../../auth/storage-config';
import { ENVIRONMENT_CONFIG } from '../../environment.config';

@Component({
    standalone: true,
    selector: 'dt-oauth-route',
    templateUrl: './oauth-route.component.html',
    styleUrls: ['./oauth-route.component.scss'],
    imports: [IconDirective],
    providers: [provideIcons(IconSynchroniseren)]
})
export class OAuthRouteComponent implements OnInit {
    private authService = inject(AuthService);
    private oauthService = inject(OAuthService);
    private router = inject(Router);
    heeftAuthenticatieError = false;

    private environment = inject(ENVIRONMENT_CONFIG);

    ngOnInit() {
        if (!this.isUseAuthenticator) {
            this.authService.mockLogin(this.authService.requestedUrl ?? '/rooster');
            return;
        }
        this.oauthService
            .tryLogin({ disableOAuth2StateCheck: true })
            .then(() => {
                if (this.authService.isLoggedIn()) {
                    this.authService.fetchIngelogdeMedewerker().subscribe(() => {
                        // Set timeout benodigd, omdat in sommige gevallen anders geen redirect plaatsvond.
                        setTimeout(() => {
                            this.router.navigateByUrl(this.authService.requestedUrl ?? '/rooster');
                        });
                    });
                } else {
                    this.oauthService.initCodeFlow();
                }
            })
            .catch(({ type }) => {
                if (type === 'invalid_nonce_in_state') {
                    if (!isCookieStorageInit) {
                        this.retryLogin();
                        return;
                    }
                }
                this.heeftAuthenticatieError = true;
            });
    }

    public retryLogin() {
        return this.authService.useCookieStorageAndRetryLogin();
    }

    public probeerOpnieuw() {
        cleanLocalStorage();
        window.location.reload();
    }

    get isUseAuthenticator() {
        return this.environment.useAuthenticator;
    }
}
