import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LesgroepDocument, LesgroepenMetDossierDocument, LesgroepenMetDossierQuery } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class LesgroepDataService {
    private apollo = inject(Apollo);

    public getLesgroepenMetDossier(lesgroepIds: string[]): Observable<LesgroepenMetDossierQuery['lesgroepenMetDossier']> {
        return this.apollo
            .watchQuery({
                query: LesgroepenMetDossierDocument,
                variables: {
                    lesgroepIds
                }
            })
            .valueChanges.pipe(map((result) => result.data.lesgroepenMetDossier));
    }

    public getLesgroep(id: string) {
        return this.apollo
            .watchQuery({
                query: LesgroepDocument,
                variables: {
                    id
                }
            })
            .valueChanges.pipe(map((result) => result.data.lesgroep));
    }
}
