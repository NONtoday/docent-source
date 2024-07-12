import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { HeeftLeerlingExamendossierDocument, LeerlingDocument, LeerlingMetSchooljarenDocument } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class LeerlingDataService {
    private apollo = inject(Apollo);

    public heeftExamendossier(leerlingId: string) {
        return this.apollo
            .query({
                query: HeeftLeerlingExamendossierDocument,
                variables: {
                    leerlingId
                }
            })
            .pipe(map((result) => result.data.heeftLeerlingExamendossier));
    }

    public leerling(id: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingDocument,
                variables: {
                    id
                }
            })
            .valueChanges.pipe(map((result) => result.data.leerling));
    }

    public leerlingMetSchooljaren(id: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingMetSchooljarenDocument,
                variables: {
                    id
                }
            })
            .valueChanges.pipe(map((result) => result.data.leerling));
    }
}
