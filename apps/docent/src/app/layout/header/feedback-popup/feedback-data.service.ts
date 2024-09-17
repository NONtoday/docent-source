import { Injectable, inject } from '@angular/core';
import { Medewerker, ProductboardTokenDocument, ProductboardTokenQuery, SendProductboardFeedbackDocument } from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';

@Injectable({
    providedIn: 'root'
})
export class FeedbackDataService {
    private apollo = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);

    public async sendFeedback(value: number, opmerking: string) {
        const medewerker = await this.medewerkerDataService.getMedewerkerPromise();
        if (!medewerker.email || !medewerker.school) {
            return of();
        }
        this.apollo
            .mutate({
                mutation: SendProductboardFeedbackDocument,
                variables: {
                    feedbackValue: value,
                    opmerking,
                    medewerker: {
                        voornaam: medewerker.voornaam,
                        tussenvoegsels: medewerker.tussenvoegsels,
                        achternaam: medewerker.achternaam,
                        email: medewerker.email,
                        school: medewerker.school
                    }
                }
            })
            .subscribe();
    }

    public getProductboardToken(medewerker: Medewerker): Observable<ProductboardTokenQuery['productboardToken']> {
        if (!medewerker.email || !medewerker.school) {
            return of(undefined);
        }
        return this.apollo
            .query({
                query: ProductboardTokenDocument,
                variables: {
                    medewerker: {
                        voornaam: medewerker.voornaam,
                        tussenvoegsels: medewerker.tussenvoegsels,
                        achternaam: medewerker.achternaam,
                        email: medewerker.email,
                        school: medewerker.school
                    }
                }
            })
            .pipe(map(({ data }) => data.productboardToken));
    }
}
