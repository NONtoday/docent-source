import { Injectable, inject } from '@angular/core';
import { FetchPolicy } from '@apollo/client/core';
import {
    AfspraakDocument,
    AfspraakQuery,
    AfspraakToekenning,
    DagToekenning,
    DeleteAfspraakToekenningDocument,
    DeleteDagToekenningDocument,
    InleveropdrachtenDocument,
    InleveropdrachtenQuery,
    LesplanNavigatieWeekDocument,
    LesplanNavigatieWeekQuery,
    SaveAfspraakToekenningDocument,
    Toekenning,
    UpdateToekenningZichtbaarheidDocument
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { matching, set } from 'shades';
import { convertToAfspraakToekenningInput, convertToDagToekenningInput } from '../core/converters/toekenningen.converters';
import { equalsId, notEqualsId } from '../rooster-shared/utils/utils';

@Injectable({
    providedIn: 'root'
})
export class LesDataService {
    private dataClient = inject(Apollo);

    public getAfspraak(id: string, fetchPolicy: FetchPolicy = 'cache-first'): Observable<AfspraakQuery['afspraak']> {
        return this.dataClient
            .query({
                query: AfspraakDocument,
                variables: {
                    id
                },
                fetchPolicy
            })
            .pipe(map((res) => res.data.afspraak));
    }

    public getAfspraakWatchQuery(id: string): Observable<AfspraakQuery['afspraak']> {
        return this.dataClient
            .watchQuery({
                query: AfspraakDocument,
                variables: {
                    id
                }
            })
            .valueChanges.pipe(map((res) => res.data.afspraak));
    }

    public getLesplanNavigatieWeek(
        afspraakId: string,
        lesgroepen: string[],
        jaar: number,
        weeknr: number
    ): Observable<LesplanNavigatieWeekQuery['lesplanNavigatieWeek']> {
        return this.dataClient
            .watchQuery({
                query: LesplanNavigatieWeekDocument,
                variables: {
                    afspraakId,
                    lesgroepen,
                    jaar,
                    week: weeknr
                }
            })
            .valueChanges.pipe(map((res) => res.data.lesplanNavigatieWeek));
    }

    public removeRegistratieAndLesplanningFromCache() {
        this.dataClient.client.cache.evict({ fieldName: 'lesRegistratie' });
        this.dataClient.client.cache.evict({ fieldName: 'lesplanning' });
        this.dataClient.client.cache.evict({ fieldName: 'lesplanningVoorWeek' });
        this.dataClient.client.cache.evict({ fieldName: 'zwevendeLesitems' });
        this.dataClient.client.cache.evict({ fieldName: 'aantalZwevendeLesitems' });
        this.dataClient.client.cache.gc();
    }

    public getInleveropdrachten(lesgroepen: string[]): Observable<InleveropdrachtenQuery['inleveropdrachten']> {
        return this.dataClient
            .watchQuery({
                query: InleveropdrachtenDocument,
                variables: {
                    lesgroepen
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((res) => !!res.data),
                map((res) => res.data.inleveropdrachten)
            );
    }

    public updateToekenningZichtbaarheid(lesgroepen: string[], toekenning: Toekenning, zichtbaarheid: boolean) {
        let query;
        let toekenningInput: any;

        let aanTePassenToekenning = { ...toekenning };
        aanTePassenToekenning = set('studiewijzeritem', 'zichtbaarVoorLeerling')(zichtbaarheid)(aanTePassenToekenning);

        if ((<DagToekenning>toekenning).datum) {
            query = UpdateToekenningZichtbaarheidDocument;

            toekenningInput = convertToDagToekenningInput(<DagToekenning>aanTePassenToekenning);
        } else if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            query = SaveAfspraakToekenningDocument;
            toekenningInput = convertToAfspraakToekenningInput(<AfspraakToekenning>aanTePassenToekenning);
        } else {
            return undefined;
        }

        return this.dataClient
            .mutate({
                mutation: query,
                variables: {
                    toekenningInput
                },
                update: (cache) => {
                    let toekenningData = cache.readQuery({
                        query: InleveropdrachtenDocument,
                        variables: {
                            lesgroepen
                        }
                    });

                    toekenningData = set(
                        'inleveropdrachten',
                        matching(equalsId(aanTePassenToekenning.id)),
                        'zichtbaarVoorLeerling'
                    )(zichtbaarheid)(toekenningData!);

                    cache.writeQuery({
                        query: InleveropdrachtenDocument,
                        data: toekenningData,
                        variables: {
                            lesgroepen
                        }
                    });
                }
            })
            .subscribe();
    }

    public verwijderToekenning(lesgroepen: string[], toekenning: Toekenning, verwijderUitSjabloon: boolean) {
        let query;

        if ((<DagToekenning>toekenning).datum) {
            query = DeleteDagToekenningDocument;
        } else if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            query = DeleteAfspraakToekenningDocument;
        } else {
            return;
        }

        return this.dataClient
            .mutate({
                mutation: query,
                variables: {
                    toekenningId: toekenning.id,
                    verwijderUitSjabloon
                },
                update: (cache) => {
                    const toekenningData = cache.readQuery({
                        query: InleveropdrachtenDocument,
                        variables: {
                            lesgroepen
                        }
                    });

                    const newData = {
                        ...toekenningData,
                        inleveropdrachten: toekenningData!.inleveropdrachten.filter(notEqualsId(toekenning.id))
                    };

                    cache.writeQuery({
                        query: InleveropdrachtenDocument,
                        data: newData,
                        variables: {
                            lesgroepen
                        }
                    });
                }
            })
            .subscribe();
    }
}
