import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router, provideRouter, withPreloading } from '@angular/router';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { nl } from 'date-fns/locale';
import { ToastComponent, appViewContainerRefProvider } from 'harmony';
import { provideToastr } from 'ngx-toastr';
import { ENVIRONMENT_CONFIG, EnvironmentConfiguration } from './environment.config';

import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideAnimations, provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { QuicklinkStrategy, quicklinkProviders } from 'ngx-quicklink';
import { provideQuillConfig } from 'ngx-quill';
import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './auth/auth-interceptor';
import { apolloSetupFactory } from './core/apollo-setup';
import { ToastService } from './core/toast/toast.service';
import { detectEnvironment } from './detect-environment';

function isCypress(): boolean {
    return window && 'Cypress' in window;
}

export const createAppConfig = (envConfig: EnvironmentConfiguration): ApplicationConfig => ({
    providers: [
        { provide: ENVIRONMENT_CONFIG, useValue: envConfig },
        importProvidersFrom(BrowserModule, ApolloModule),
        provideServiceWorker('ngsw-worker.js', {
            enabled: envConfig.useServiceWorkers,
            registrationStrategy: 'registerWhenStable:10000'
        }),
        isCypress() ? provideNoopAnimations() : provideAnimations(),
        {
            provide: ErrorHandler,
            useFactory() {
                if (detectEnvironment() !== 'lokaal') {
                    return new BugsnagErrorHandler();
                }
                return new ErrorHandler();
            }
        },
        provideQuillConfig({
            formats: ['list', 'bold', 'italic', 'underline', 'script', 'link'],
            theme: 'snow'
        }),
        { provide: DateAdapter, useClass: DateFnsAdapter },
        { provide: LOCALE_ID, useValue: 'nl-NL' },
        { provide: MAT_DATE_LOCALE, useValue: nl },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'EEEE d MMMM'
                },
                display: {
                    dateInput: 'EEEE d MMMM',
                    monthYearLabel: 'LLLL y',
                    dateA11yLabel: 'MMMM d, y',
                    monthYearA11yLabel: 'MMMM y'
                }
            }
        },
        provideToastr({
            toastComponent: ToastComponent,
            timeOut: 3000,
            tapToDismiss: false,
            preventDuplicates: true
        }),
        provideOAuthClient(),
        provideHttpClient(withInterceptors([authInterceptor])),
        quicklinkProviders,
        appViewContainerRefProvider(),
        provideRouter(APP_ROUTES, withPreloading(QuicklinkStrategy)),
        {
            provide: APOLLO_OPTIONS,
            useFactory: apolloSetupFactory,
            deps: [HttpLink, OAuthService, Router, ToastService, ENVIRONMENT_CONFIG]
        }
    ]
});
