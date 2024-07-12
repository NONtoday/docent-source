import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import Bugsnag from '@bugsnag/js';
import { VERSION } from 'version-generator';
import { AppComponent } from './app/app.component';
import { createAppConfig } from './app/app.config';
import { detectEnvironment } from './app/detect-environment';
import { EnvironmentConfiguration } from './app/environment.config';
import { safeParseJSON } from './app/rooster-shared/utils/utils';

interface FailedRequestInformation {
    url: string;
    statusCode: number;
    response: string;
}

fetch('./assets/environment-config.json')
    .then((resp) => resp.json())
    .then((envConfig: EnvironmentConfiguration) => {
        if (envConfig.production) {
            enableProdMode();
        }

        Bugsnag.start({
            apiKey: '54c84bfc468d451311520b2fc95e8251',
            appType: 'Angular Client',
            appVersion: VERSION || '0.0.0',
            releaseStage: detectEnvironment(),
            enabledReleaseStages: ['productie', 'inkijk', 'test', 'acceptatie', 'nightly', 'develop'],
            collectUserIp: false,
            onError: (event) => {
                event.clearMetadata('angular', 'component');
                event.clearMetadata('angular', 'context');

                if (event.errors.some((error) => safeParseJSON<FailedRequestInformation>(error.errorMessage)?.statusCode === 401)) {
                    return false;
                }
            }
        });

        registerLocaleData(localeNl);

        // merge de waardes uit de environment-config.json met de waardes die meegegeven worden bij het opstarten (zie npm start-mock script in package.json)
        const updatedConfig = {
            ...envConfig,
            useAuthenticator:
                process.env.NG_APP_USE_AUTH !== undefined ? process.env.NG_APP_USE_AUTH !== 'false' : envConfig.useAuthenticator
        } satisfies EnvironmentConfiguration;

        if ('serviceWorker' in navigator && !updatedConfig.useServiceWorkers) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        }

        bootstrapApplication(AppComponent, createAppConfig(updatedConfig)).catch(console.error);
    });
