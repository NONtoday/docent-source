import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { VERSION } from 'version-generator';
import { CurrentVersionDocument, StamgroepDocument } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class SharedDataService {
    private dataClient = inject(Apollo);
    private appRef = inject(ApplicationRef);

    public isUpdateBeschikbaar(): Observable<boolean> {
        return this.appRef.isStable.pipe(
            first((isStable) => isStable === true),
            switchMap(
                () =>
                    this.dataClient.watchQuery({
                        query: CurrentVersionDocument,
                        fetchPolicy: 'network-only',
                        pollInterval: 7200000 // twee uur
                    }).valueChanges
            ),
            map((result) => result.data.currentVersion),
            map((graphQLVersie: string) => this.parseVersionToNumber(graphQLVersie) > this.parseVersionToNumber(VERSION))
        );
    }

    private parseVersionToNumber(toParseVersion: string): number {
        return parseInt(toParseVersion.replace(/\./g, ''), 10);
    }

    public getStamgroep(id: string) {
        return this.dataClient
            .watchQuery({
                query: StamgroepDocument,
                variables: { id }
            })
            .valueChanges.pipe(map((result) => result.data.stamgroep));
    }
}
