import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthConfig, NullValidationHandler, OAuthService } from 'angular-oauth2-oidc';
import { addMinutes } from 'date-fns';
import { Observable, map, of } from 'rxjs';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { ENVIRONMENT_CONFIG } from '../environment.config';
import { formatNL, isStringNullOrEmpty } from '../rooster-shared/utils/utils';
import { cleanLocalStorage, cleanLocalStorageMisc } from './auth.utils';
import { cookieStorage, localOrCookieStorage } from './storage-config';
import { UriService } from './uri-service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private oauthService = inject(OAuthService);
    private router = inject(Router);
    public uriService = inject(UriService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private environment = inject(ENVIRONMENT_CONFIG);
    public get userName() {
        return this.getClaimValue('name');
    }

    get isUseAuthenticator() {
        return this.environment.useAuthenticator;
    }

    get apiEndpointStorageKey() {
        return this.environment.apiEndpointStorageKey;
    }

    constructor() {
        this.initOAuthService();
    }

    public isLoggedIn(): boolean {
        if (this.isUseAuthenticator) {
            return this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken();
        } else {
            return true; // Mockmode altijd ingelogd.
        }
    }

    /**
     * Removes all tokens and logs the user out.
     */
    public logoff() {
        if (this.isUseAuthenticator) {
            const logoutId = localStorage.getItem('single_logout_identifier');
            if (isStringNullOrEmpty(logoutId)) {
                cleanLocalStorageMisc();
                this.oauthService.logOut();
            } else {
                window.location.assign(`${this.uriService.getSomtodayCoreUrl()}/deeplink?action=INVALIDATE&id=${logoutId}`);
            }
        } else {
            cleanLocalStorage();
            this.router.navigate(['/logout']);
        }
    }

    public get requestedUrl() {
        return sessionStorage.getItem('requestedUrl');
    }

    public get oauthUrlTree(): UrlTree {
        return this.router.parseUrl('/oauth');
    }

    public get somtodayApiUrl(): string {
        return this.oauthService.getCustomTokenResponseProperty(this.apiEndpointStorageKey);
    }

    private getClaimValue(key: any) {
        const claims = this.oauthService.getIdentityClaims();
        if (!claims) {
            return null;
        }
        return (<any>claims)[key];
    }

    private initOAuthService() {
        this.oauthService.configure(this.authConfig);
        this.oauthService.setStorage(localOrCookieStorage);
        this.oauthService.tokenValidationHandler = new NullValidationHandler();
    }

    public resetCookieStore() {
        cookieStorage.clear();
    }

    public useCookieStorageAndRetryLogin() {
        cookieStorage.setItem('sd_init_key_e0b9b7a8cd3f', 'broken_session_storage');
        this.oauthService.configure(this.authConfig);
        this.oauthService.setStorage(cookieStorage);
        this.oauthService.tokenValidationHandler = new NullValidationHandler();
        this.oauthService.initCodeFlow();
    }

    public mockLogin(url?: string) {
        cleanLocalStorage();
        localStorage.setItem(this.apiEndpointStorageKey, this.uriService.authServerURI);
        localStorage.setItem('access_token', 'dt-dummy-token');
        localStorage.setItem('id_token_claims_obj', '{"name":"Mees Kees"}');
        localStorage.setItem('expires_at', formatNL(addMinutes(new Date(), 24 * 60), 'T'));
        localStorage.setItem('mockLogin', 'loggedin mock');
        this.router.navigateByUrl(url ?? '/rooster');
    }

    /**
     * Controleert of het id van de medewerker al eens is opgehaald.
     * Zo niet, haal hem dan alsnog een keer op.
     */
    public fetchIngelogdeMedewerker(): Observable<boolean> {
        if (this.medewerkerDataService.medewerkerId) {
            return of(true);
        }

        return this.medewerkerDataService.getMedewerker().pipe(map((medewerker) => !!(medewerker && medewerker.id)));
    }

    private get authConfig() {
        return {
            // in het geval van een core PR, gebruik de lokale nightly client id
            clientId: this.environment.corePr ? '0577D7AC-68AC-11E8-ADC0-FA7AE01BBEBC' : this.environment.clientId,
            customQueryParams: {
                claims: '{ "id_token": { "name": null} }'
            },
            issuer: this.uriService.authServerURI,
            loginUrl: this.uriService.oAuthEndpoint + '/authorize',
            tokenEndpoint: this.uriService.oAuthEndpoint + '/token',
            logoutUrl: this.uriService.oAuthEndpoint + '/logout',
            redirectUri: this.uriService.callBackURI,
            scope: 'openid',
            oidc: true,
            postLogoutRedirectUri: this.uriService.postLogoutRedirectUri,
            skipIssuerCheck: this.environment.skipIssuerCheck,
            customTokenParameters: ['somtoday_api_url', 'somtoday_oop_url'],
            responseType: 'code',

            requireHttps: false // TEMP TEMP TEMP TEMP TEMP TEMP TEMP TEMP
        } as AuthConfig;
    }
}
