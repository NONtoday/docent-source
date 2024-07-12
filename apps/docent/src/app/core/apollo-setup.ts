import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApolloClientOptions, ApolloLink, from } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpLink } from 'apollo-angular/http';
import { namedOperations } from '../../generated/_types';
import { cleanLocalStorageAuthentication, storeRequestedUrl } from '../auth/auth.utils';
import { EnvironmentConfiguration } from '../environment.config';
import { parseErrorMessage } from './../core/error-parser';
import { inMemoryCache } from './../core/store/cache';
import { ToastService } from './../core/toast/toast.service';
import { detectEnvironment } from './../detect-environment';

export const apolloSetupFactory = (
    httpLink: HttpLink,
    oAuthService: OAuthService,
    router: Router,
    toastService: ToastService,
    environment: EnvironmentConfiguration
): ApolloClientOptions<unknown> => {
    const http = httpLink.create({
        uri: environment.graphQLUri
    });

    const authMiddleware = new ApolloLink((operation, forward) => {
        // add the authorization to the headers
        if (environment.useAuthenticator) {
            operation.setContext({
                headers: new HttpHeaders().set(
                    'X-Somtoday-Api-Url',
                    oAuthService.getCustomTokenResponseProperty(environment.apiEndpointStorageKey)
                )
            });
        }

        return forward(operation);
    });

    const retryLink = new RetryLink({
        delay: {
            initial: 3000,
            jitter: true
        },
        attempts: {
            max: 5,
            retryIf: (error) => !!error
        }
    });

    const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
        const ignoredOperations = [namedOperations.Mutation.saveNotitie];
        if (ignoredOperations.includes(operation.operationName)) {
            forward(operation);
            return;
        }
        if (graphQLErrors) {
            graphQLErrors.forEach((error) => {
                if (error.extensions.code === 401) {
                    setTimeout(() => {
                        cleanLocalStorageAuthentication();
                        storeRequestedUrl(router.url);
                        router.navigateByUrl(router.parseUrl('/oauth'));
                    });
                }
                if (!error.extensions.customErrorHandling) {
                    if (detectEnvironment() !== 'productie') {
                        graphQLErrors.map(({ message, locations, path }) =>
                            console.error(
                                `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(
                                    path
                                )}`
                            )
                        );
                    }
                    if (error.extensions.code === 403) {
                        toastService.error('Sorry, je bent hiertoe niet bevoegd.');
                    } else if (error.message) {
                        toastService.error(parseErrorMessage(error.message));
                    }
                }
            });
        }
        if (networkError) {
            toastService.error(parseErrorMessage(networkError.message));
        }
    });

    return {
        cache: inMemoryCache,
        link: from([errorLink, retryLink, authMiddleware.concat(http)])
    };
};
