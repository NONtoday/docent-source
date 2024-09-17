import { inject, Injectable } from '@angular/core';
import { IsFeatureDisabledDocument, IsFeatureDisabledQuery } from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

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
