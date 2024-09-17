import { Injectable, inject } from '@angular/core';
import { LesgroepDocument, LesgroepenMetDossierDocument, LesgroepenMetDossierQuery } from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
