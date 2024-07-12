import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import Bugsnag from '@bugsnag/browser';
import { flow, isNull } from 'lodash-es';
import { isEmpty, isStringNullOrEmpty, stripIridiumFromStartOfLocalRelativeUrl } from '../../rooster-shared/utils/utils';
import { AuthService } from '../auth.service';
import { cleanLocalStorage } from '../auth.utils';
import { localOrCookieStorage } from '../storage-config';

/**
 * Component voor het deeplinken van core naar docent. Deze pagina heeft een id parameter die
 * gebruikt wordt om een core sessie en een Angular sessie aan elkaar te koppelen, zodat bij het
 * uiloggen zowel core als docent uitgelogd wordt indien dit id bekend is.
 *
 * Naast deeplinken wordt dit component ook gebruikt voor de afhandeling van Single logout. Core kan
 * de angular sessie via dit component invalideren waarna een redirect plaatsvindt naar het
 * uitlog-endpoint van core.
 *
 * Tot slot dient dit component ook als uitlog-endpoint na het invalideren van de core wicket
 * sessie.
 */
@Component({
    selector: 'dt-deep-link',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class DeepLinkComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);

    ngOnInit(): void {
        const paramMap = this.route.snapshot.queryParamMap;

        const id = paramMap.get('id');
        if (isNull(id) || isEmpty(id)) {
            this.redirectToHome();
            return;
        }

        const action = paramMap.get('action');
        if (isStringNullOrEmpty(action)) {
            this.deeplink(id, paramMap);
            return;
        }

        switch (action) {
            case 'INVALIDATE':
                this.invalidateSession(id);
                break;
            case 'LOGOUT':
                this.logout(id);
                break;
            default:
                this.deeplink(id, paramMap);
                break;
        }
    }

    private deeplink(id: string, paramMap: ParamMap) {
        localOrCookieStorage.setItem('single_logout_identifier', id);
        const url = paramMap.get('url');

        this.setCoreReturnUrl(paramMap.get('return_url'));

        if (isNull(url) || isEmpty(url)) {
            this.redirectToHome();
        } else {
            this.router.navigateByUrl(decodeURIComponent(url));
        }
    }

    /**
     * Verwijdert de authenticatie records uit de localstorage,
     * waarna een redirect plaatsvindt naar het uitlog-endpoint in core.
     */
    private invalidateSession(id: string) {
        const logoutId = localOrCookieStorage.getItem('single_logout_identifier');
        const logoutUrl = `${this.authService.uriService.getSomtodayCoreUrl()}/deeplink?action=LOGOUT&id=${id}`;
        if (isStringNullOrEmpty(logoutId) || logoutId === id) {
            cleanLocalStorage();
        } else {
            Bugsnag.notify({
                name: 'DeepLinkComponent#invalidateSession',
                message: 'Sessie geprobeerd te invalideren met onbekende logout identifier'
            });
        }
        this.windowAssign(logoutUrl);
    }

    /**
     * Callback-endpoint na het invalideren van de wicket sessie van core. Logt de applicatie uit
     * mits het id overeenkomt met het id in de sessie.
     */
    private logout(id: string) {
        const logoutId = localOrCookieStorage.getItem('single_logout_identifier');

        if (!isStringNullOrEmpty(logoutId) && logoutId === id) {
            localOrCookieStorage.removeItem('single_logout_identifier');
            this.authService.logoff();
        } else {
            this.redirectToHome();
        }
    }

    private redirectToHome() {
        this.router.navigate(['/']);
    }

    // Wrapper functie voor de unit tests...
    public windowAssign(url: string) {
        window.location.assign(url);
    }

    private setCoreReturnUrl(returnUrl: string | null) {
        if (isNull(returnUrl) || isEmpty(returnUrl)) {
            return;
        }
        const decodeReturnUrl = flow(decodeURIComponent, stripIridiumFromStartOfLocalRelativeUrl);
        localOrCookieStorage.setItem('core_return_url', decodeReturnUrl(returnUrl));
        this.authService.uriService.notifyCoreUrlSet();
    }
}
