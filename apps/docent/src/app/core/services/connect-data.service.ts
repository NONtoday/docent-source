import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedLinkContextDocument, SharedLinkContextQuery } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class ConnectDataService {
    private apollo = inject(Apollo);

    public getSharedLinkContextHints(sharedLinkContextUuid: string): Observable<SharedLinkContextQuery['sharedLinkContext']> {
        return this.apollo
            .query({
                query: SharedLinkContextDocument,
                variables: {
                    sharedLinkContextUuid
                }
            })
            .pipe(map((result) => result.data.sharedLinkContext));
    }
}
