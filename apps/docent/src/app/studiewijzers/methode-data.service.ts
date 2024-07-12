import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    HoofdstukkenDocument,
    HoofdstukkenQuery,
    Methode,
    MethodenDocument,
    MethodenQuery,
    RecenteMethodesDocument,
    RecenteMethodesQuery,
    UpdateRecenteMethodesDocument
} from '../../generated/_types';
import { Optional } from '../rooster-shared/utils/utils';

@Injectable({
    providedIn: 'root'
})
export class MethodeDataService {
    private dataClient = inject(Apollo);

    public getMethoden(vakcodes?: string[]): Observable<MethodenQuery['methoden']> {
        return this.dataClient
            .query({
                query: MethodenDocument,
                variables: {
                    vakcodes
                }
            })
            .pipe(map((result) => result.data.methoden));
    }

    public getHoofdstukken(publisherId: Optional<string>, methodeId: string): Observable<HoofdstukkenQuery['hoofdstukken']> {
        return this.dataClient
            .query({
                query: HoofdstukkenDocument,
                variables: {
                    publisherId,
                    methodeId
                }
            })
            .pipe(map((result) => result.data.hoofdstukken));
    }

    public getRecenteMethodes(medewerkerUuid: string): Observable<RecenteMethodesQuery['recenteMethodes']> {
        return this.dataClient
            .query({
                query: RecenteMethodesDocument,
                variables: {
                    medewerkerUuid
                }
            })
            .pipe(map((result) => result.data.recenteMethodes));
    }

    public updateRecenteMethodes(medewerkerUuid: string, methode: Methode) {
        return this.dataClient
            .mutate({
                mutation: UpdateRecenteMethodesDocument,
                variables: {
                    medewerkerUuid,
                    methodeInput: {
                        id: methode.id,
                        publisher: methode.publisher!,
                        naam: methode.naam!,
                        editie: methode.editie
                    }
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    updateRecenteMethodes: true
                },
                update: (cache) => {
                    cache.evict({ fieldName: 'recenteMethodes' });
                    cache.gc();
                }
            })
            .subscribe();
    }
}
