import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { WerkdrukVoorMentorLeerlingenDocument, WerkdrukVoorSelectieDocument } from '../../../../generated/_types';
import { convertToLocalDate } from '../../utils/date.utils';

@Injectable({
    providedIn: 'root'
})
export class WerkdrukDataService {
    private dataClient = inject(Apollo);

    public getWerkdrukWeekVoorSelectie(lesgroepIds: string[], peildatum: Date) {
        return this.dataClient.watchQuery({
            query: WerkdrukVoorSelectieDocument,
            variables: {
                lesgroepIds,
                peildatum: convertToLocalDate(peildatum) as any
            },
            useInitialLoading: true,
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'cache-first'
        }).valueChanges;
    }

    public getWerkdrukWeekVoorMentorLeerlingen(leerlingIds: string[], peildatum: Date) {
        return this.dataClient.watchQuery({
            query: WerkdrukVoorMentorLeerlingenDocument,
            variables: {
                leerlingIds,
                peildatum: convertToLocalDate(peildatum) as any
            },
            useInitialLoading: true,
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'cache-first'
        }).valueChanges;
    }
}
