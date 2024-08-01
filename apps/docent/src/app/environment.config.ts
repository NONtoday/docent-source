import { InjectionToken } from '@angular/core';

/**
 * Dit is de interface voor de environment configuratie.
 * De daadwerkelijke waardes worden ingeladen vanuit assets/environment-config.json.
 *
 * Voordat de angular applicatie wordt opgestart wordt dit bestand opgehaald
 * en worden de waardes ervan ingelezen en gebruikt bij het initialiseren van de applicatie.
 *
 * De environment waardes zijn beschikbaar in de applicatie via een `inject(ENVIRONMENT_CONFIG)`.
 *
 * Voor de omgeving specifieke waardes, deze worden gevuld via de helm charts.
 * In helm/docenttoday-angular/values.yaml staan on `environmentVariables` de default values.
 * De worden samengevoegd met de waardes uit `environmentVariables` in de values.yaml op de
 * branch van de omgeving waar het om gaat in de docenttoday-infra repo.
 *
 * Deze waardes worden gebruikt in de configmap.yaml in de helm templates map.
 * Bij het neerzetten van de applicatie op de omgeving worden deze weggeschreven naar
 * assets/environment-config.json (wat weer wordt ingeladen bij het starten van de applicatie).
 *
 * Tldr: Ik moet een een waarde hiervan aanpassen, waar moet ik dan zijn?
 *
 * lokaal: assets/environment-config.json
 *
 * omgeving: helm/docenttoday-angular/values.yaml voor de default values (wijzig je dan voor elke omgeving).
 * en values.yaml op de branch van de omgeving waar het om gaat in de docenttoday-infra repo, voor de omgeving specifieke waardes.
 */
export interface EnvironmentConfiguration {
    production: boolean;
    graphQLUri: string;
    useAuthenticator: boolean;
    apiEndpointStorageKey: string;
    tagManagerId: string;
    gtmAuthId: string;
    gtmEnv: string; // google tag manager omgeving env variable
    transloaditUrl: string;
    clientId: string;
    skipIssuerCheck: boolean;
    useServiceWorkers: boolean;
    connectEnvironment: string;
    googleClientId: string;
    msGraphClientId: string;
    corePr: string;
}
export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfiguration>('Environment_Configuration');
