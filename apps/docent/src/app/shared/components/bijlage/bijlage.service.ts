import { inject, Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { combineLatest, firstValueFrom, Observable, of } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { UrlValidatie, ValidateUrlDocument, ValidateUrlQuery } from '../../../../generated/_types';

interface UrlValidationResponse {
    validateUrl: {
        statusCode: number;
        protocolChange: boolean;
        contentType: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class BijlageService {
    private dataClient = inject(Apollo);

    async isUrlValid(control: AbstractControl): Promise<{ isValid: boolean; contentType: string }> {
        const lowerCaseUrl = control.value.toLowerCase();
        if (!lowerCaseUrl.startsWith('https://') && !lowerCaseUrl.startsWith('http://')) {
            control.setValue('http://' + String(control.value));
        }

        return firstValueFrom(
            this.validateUrl(control.value).pipe(
                switchMap((response: UrlValidatie) => {
                    if (response.protocolChange && (response.statusCode === 301 || response.statusCode === 302)) {
                        let protocolChangeRetryUrl = '';
                        if (lowerCaseUrl.startsWith('https://')) {
                            protocolChangeRetryUrl = control.value.replace('https://', 'http://');
                        } else if (lowerCaseUrl.startsWith('http://')) {
                            protocolChangeRetryUrl = control.value.replace('http://', 'https://');
                        }
                        return combineLatest([this.validateUrl(protocolChangeRetryUrl), of(protocolChangeRetryUrl)]);
                    }
                    return combineLatest([of(response), of(undefined)]);
                }),
                map(([response, url]) => {
                    const isValid =
                        response.statusCode !== -1 &&
                        !((response.statusCode === 301 || response.statusCode === 302) && response.protocolChange === true);
                    if (isValid && url) {
                        control.setValue(url);
                    }
                    return {
                        isValid: isValid,
                        contentType: response.contentType ?? ''
                    };
                }),
                take(1)
            )
        );
    }

    private validateUrl(url: string): Observable<ValidateUrlQuery['validateUrl']> {
        return this.dataClient
            .query<UrlValidationResponse>({
                query: ValidateUrlDocument,
                fetchPolicy: 'network-only',
                variables: {
                    url
                }
            })
            .pipe(
                filter((result) => Boolean(result.data)),
                map((result) => result.data.validateUrl)
            );
    }
}
