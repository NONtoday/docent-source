import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { IsFeatureDisabledDocument, IsFeatureDisabledQuery } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class FeatureService {
    private dataClient = inject(Apollo);

    public isFeatureDisabled(moduleNaam: string, featureNaam: string): Observable<IsFeatureDisabledQuery['isFeatureDisabled']> {
        return this.dataClient
            .watchQuery({
                query: IsFeatureDisabledDocument,
                variables: {
                    moduleNaam,
                    featureNaam
                }
            })
            .valueChanges.pipe(map(({ data }) => data.isFeatureDisabled));
    }
}
