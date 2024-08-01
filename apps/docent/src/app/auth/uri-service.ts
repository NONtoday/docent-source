import { Injectable, inject } from '@angular/core';
import { isNull } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ENVIRONMENT_CONFIG } from '../environment.config';
import { isEmpty, isStringNullOrEmpty, notEmpty } from '../rooster-shared/utils/utils';
import { localOrCookieStorage } from './storage-config';

@Injectable({
    providedIn: 'root'
})
export class UriService {
    private coreReturnUrlSetSubject = new BehaviorSubject<boolean>(this.isCoreReturnUrlSet());
    private environment = inject(ENVIRONMENT_CONFIG);

    /**
     * Returns the URI of the authorization server, e.g. 'http://localhost:8080'.
     */
    public get authServerURI(): string {
        if (this.environment.corePr) {
            if (this.environment.corePr === 'nightly') {
                return 'https://inloggen.nightly.somtoday.build';
            }
            return `https://inloggen.pr-${this.environment.corePr}.somtoday.build`;
        }
        const host = this.host().toLocaleLowerCase();

        // Het eerste '.' in de url staat direct voor de omgeving waar we mee communiceren
        // bijvoorbeeld : https://docent.acceptatie.somtoday.nl
        const omgevingIndex = host.indexOf('.');
        const somtodayIndex = host.indexOf('.somtoday.nl');

        // Controleren of we met een somtoday omgeving communiceren
        if (somtodayIndex >= 0) {
            // Controleren of we met een omgeving communiceren afwijkend van productie.
            if (omgevingIndex >= 0 && omgevingIndex < somtodayIndex) {
                const omgeving = host.substring(omgevingIndex + 1, somtodayIndex);
                return `https://inloggen.${omgeving}.somtoday.nl`;
            } else {
                return 'https://inloggen.somtoday.nl';
            }
        } else if (host.indexOf('pre.docenttoday.build') >= 0 || host.indexOf('pre.topicusonderwijs.build') >= 0) {
            return 'https://inloggen.acceptatie.somtoday.nl';
        } else if (host.indexOf('docenttoday.build') >= 0 || host.indexOf('topicusonderwijs.build') >= 0) {
            return 'https://inloggen.nightly.somtoday.build';
        } else if (host.indexOf('docent.regressie.somtoday.build') >= 0) {
            return 'https://inloggen.regressie.somtoday.build';
        } else if (host.indexOf('docent.regressie-release.somtoday.build') >= 0) {
            return 'https://inloggen.regressie-release.somtoday.build';
        } else if (host.indexOf('localhost:4200') >= 0) {
            return 'http://localhost:8080';
        } else {
            return 'https://inloggen.somtoday.nl';
        }
    }

    /**
     * Returns the OAuth endpoint of the authorization server, e.g. 'http://localhost:8080/oauth2'.
     */
    public get oAuthEndpoint() {
        return this.authServerURI + '/oauth2';
    }

    /**
     * Get the client-side URI to return to after login on the authorization server.
     */
    public get callBackURI() {
        return this.protocol() + '//' + this.host() + '/oauth';
    }

    /**
     * Get the client-side URI to return to after logout on the authorization server.
     */
    public get postLogoutRedirectUri() {
        return this.protocol() + '//' + this.host() + '/rooster';
    }

    /**
     * Host en protocol functions zijn er om makkelijk de window waardes te mocken in de test
     */
    public host() {
        return window.location.host;
    }

    public protocol() {
        return window.location.protocol;
    }

    public url() {
        return window.location.href;
    }

    public pathWithParameters() {
        return window.location.pathname + window.location.search;
    }

    public navigateToSomtoday() {
        window.location.assign(this.getDeepLinkUrl());
    }

    public navigateToSomtodayStudiewijzerPreviewPage(lesgroepId: string, leerlingId?: string) {
        let parameters = `lesgroep=${lesgroepId}`;
        if (leerlingId) {
            parameters += `&leerling=${leerlingId}`;
        }
        window.open(this.getDeeplinkUrlForExternalTab(`/studiewijzerpreview/landing?${parameters}`), 'Preview', 'width=1100, height=800');
    }

    /**
     * Bepaalt de deeplink url met een optioneel path naar een pagina in core.
     * In het geval van een ontbrekend path wordt de CoreReturnUrl uit de localStorage gehaald, indien aanwezig,
     * en wordt deze gebruikt als path naar de pagina in core.
     * Ongeacht of de CoreReturnUrl wordt gebruikt of niet wordt deze uit de localStorage verwijderd.
     * Wegnavigeren dient de one time use ook te verwijderen.
     */
    public getDeepLinkUrl(corePath?: string | null): string {
        const pathWithParameters = this.pathWithParameters();
        const returnUrl = notEmpty(pathWithParameters) ? `&return_url=${encodeURIComponent(pathWithParameters)}` : '';
        const deeplinkUrl = this.getBaseDeeplinkUrl() + returnUrl;
        const coreReturnUrl = this.getAndRemoveCoreReturnUrl();
        const coreSuffix = notEmpty(corePath) ? corePath : coreReturnUrl;
        return notEmpty(coreSuffix) ? `${deeplinkUrl}&url=${encodeURIComponent(coreSuffix)}` : deeplinkUrl;
    }

    /**
     * Functie voor het bepalen van de deeplink url die geopend gaat worden in een external tab (Denk aan studiewijzer preview).
     * Dit zorgt ervoor dat het wel via het deeplink url endpoint in core gaat en dat de single logout identifier geset gaat worden,
     * maar deze functie doet niks met de core return url. Deze wordt niet meegegven en ook niet verwijderd uit de localstorage,
     * aangezien er niet gewisseld wordt tussen core en docent in het zelfde tabblad.
     *
     * Er worden geen input validaties gedaan op het meegegeven core path, deze dient een valide value te hebben.
     */
    public getDeeplinkUrlForExternalTab(corePath: string) {
        return `${this.getBaseDeeplinkUrl()}&url=${encodeURIComponent(corePath)}`;
    }

    /**
     * De basis url voor deeplinken met core inclusief de single logout identifier,
     * maar zonder de url waar de deeplink naar toe dient te gaan.
     */
    private getBaseDeeplinkUrl() {
        return `${this.getSomtodayCoreUrl()}/deeplink?id=${this.getOrCreateLogoutId()}`;
    }

    public getSomtodayCoreUrl(): string {
        // Ophalen van api url kan via OAuthService en die doet de JSON.Parse
        // voor je, alleen de uriservice kan niet overweg met DI vandaar zelf parsen.
        return JSON.parse(localOrCookieStorage.getItem('somtoday_oop_url')!);
    }

    private getOrCreateLogoutId(): string {
        let logoutId = localOrCookieStorage.getItem('single_logout_identifier');
        if (isNull(logoutId) || isEmpty(logoutId)) {
            logoutId = uuidv4();
            localOrCookieStorage.setItem('single_logout_identifier', logoutId);
        }
        return logoutId;
    }

    private getAndRemoveCoreReturnUrl(): string | null {
        const returnUrl = localOrCookieStorage.getItem('core_return_url');
        localOrCookieStorage.removeItem('core_return_url');
        return returnUrl;
    }

    public isCoreReturnUrlSet(): boolean {
        return !isStringNullOrEmpty(localOrCookieStorage.getItem('core_return_url'));
    }

    public getCoreReturnUrlSetObservable(): Observable<boolean> {
        return this.coreReturnUrlSetSubject.asObservable();
    }

    public notifyCoreUrlSet() {
        this.coreReturnUrlSetSubject.next(this.isCoreReturnUrlSet());
    }

    public getLesgroepExamendossierLink(lesgroepId: string) {
        return this.getDeepLinkUrl(`/lesgroep/${lesgroepId}/examendossier`);
    }

    public getKlassenboekLink(lesgroepId: string) {
        return this.getDeepLinkUrl(`/lesgroep/${lesgroepId}/klassenboek`);
    }

    public getLeerlingLink(leerlingnummer: number, page: string) {
        return this.getDeepLinkUrl(`/leerling/${leerlingnummer}/${page}`);
    }

    public getInleverperiodeDetailLink(lesgroepId: string, inleverperiodeId: string, isProjectgroepInlevering: boolean) {
        return this.getDeepLinkUrl(
            `/lesgroep/${lesgroepId}/inleverperioden/${isProjectgroepInlevering ? 'projectgroep' : 'leerling'}/${inleverperiodeId}`
        );
    }

    public getEphorusRapportageLink(inleveringId: string, documentGUID: string) {
        return this.getDeepLinkUrl(`/inlevering/${inleveringId}/ephorusrapportage/${documentGUID}`);
    }

    public getLeerlingNieuwBerichtLink(leerlingnummer: number) {
        return this.getDeepLinkUrl(`/berichten/nieuw?leerlingnummer=${leerlingnummer}`);
    }

    public getVerzorgerNieuwBerichtLink(verzorgerId: string) {
        return this.getDeepLinkUrl(`/berichten/nieuw?verzorger=${verzorgerId}`);
    }

    public getLeerlingVoortgangsdossier(leerlingnummer: number) {
        return this.getDeepLinkUrl(`/leerling/${leerlingnummer}/resultaten`);
    }

    public getLeerlingZorgvierkant(leerlingnummer: number) {
        return this.getDeepLinkUrl(`/leerling/${leerlingnummer}/begeleiding`);
    }

    public isTestEnvironment(): boolean {
        return this.host().includes('test.somtoday.nl');
    }
}
