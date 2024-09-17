import { Injectable, inject } from '@angular/core';
import { ApolloQueryResult, DocumentNode, FetchResult } from '@apollo/client/core';
import {
    AantalZwevendeLesitemsDocument,
    AfspraakQuery,
    AfspraakToekenning,
    AfspraakToekenningInput,
    DagToekenning,
    DagToekenningInput,
    DeleteAfspraakToekenningDocument,
    DeleteDagToekenningDocument,
    DeleteWeekToekenningDocument,
    HerplanAfspraakToekenningenDocument,
    HuiswerkType,
    LesgroepStudiewijzerDocument,
    LesgroepStudiewijzerQuery,
    LesplanningAfspraakNaarDagDocument,
    LesplanningDagNaarAfspraakDocument,
    LesplanningDocument,
    LesplanningQuery,
    LesplanningRoosterPreviewDocument,
    LesplanningVoorWeekDocument,
    LesplanningVoorWeekQuery,
    SaveAfspraakToekenningObsDocument,
    SaveDagToekenningMutation,
    SaveDagToekenningObsDocument,
    SaveWeekToekenningDocument,
    Toekenning,
    ToekomendeAfsprakenDocument,
    ToekomendeAfsprakenVanLesgroepenDocument,
    VerwijderBulkStudiewijzerDocument,
    WeekToekenning,
    WeekToekenningInput,
    ZwevendeLesitemsDocument,
    ZwevendeLesitemsQuery,
    namedOperations
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { endOfDay, startOfDay } from 'date-fns';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { all, matching, mod, set, updateAll } from 'shades';
import {
    convertToAfspraakToekenningInput,
    convertToDagToekenningInput,
    convertToWeekToekenningInput
} from '../../core/converters/toekenningen.converters';
import { LesplanningType } from '../../core/models/lesplanning.model';
import { convertToLocalDate } from '../../rooster-shared/utils/date.utils';
import { addItem, notEqualsId, removeItem, toId } from '../../rooster-shared/utils/utils';

@Injectable({
    providedIn: 'root'
})
export class LesplanningDataService {
    private dataClient = inject(Apollo);

    public getLesplanning(id: string, begin: Date, eind: Date, type: LesplanningType = 'afspraak', lesgroepen: string[]) {
        return this.dataClient
            .watchQuery({
                query: LesplanningDocument,
                variables: {
                    afspraakId: id,
                    begin: convertToLocalDate(begin) as any,
                    eind: convertToLocalDate(eind) as any,
                    type,
                    lesgroepen
                }
            })
            .valueChanges.pipe(filter((result) => !!result.data));
    }

    public getLesplanningVoorWeek(
        id: string,
        lesgroepen: string[],
        weeknr: number,
        jaar: number
    ): Observable<ApolloQueryResult<LesplanningVoorWeekQuery>> {
        return this.dataClient
            .watchQuery({
                query: LesplanningVoorWeekDocument,
                variables: {
                    afspraakId: id,
                    lesgroepen,
                    weeknr,
                    jaar
                }
            })
            .valueChanges.pipe(filter((result) => !!result.data));
    }

    public afspraakNaarDagToekenning(
        afspraakToekenning: AfspraakToekenning,
        dagToekenning: DagToekenning,
        afspraak: AfspraakQuery['afspraak'],
        lesgroepen: string[]
    ) {
        this.dataClient
            .mutate({
                mutation: LesplanningAfspraakNaarDagDocument,
                variables: {
                    afspraaktoekenning: convertToAfspraakToekenningInput(afspraakToekenning),
                    dagtoekenning: convertToDagToekenningInput(dagToekenning)
                },
                refetchQueries: [namedOperations.Query.lesplanNavigatieWeek, namedOperations.Query.roosterDagen],
                update: (cache) => {
                    let viewData = cache.readQuery({
                        query: LesplanningDocument,
                        variables: {
                            afspraakId: afspraak.id,
                            begin: convertToLocalDate(afspraak.begin) as any,
                            eind: convertToLocalDate(afspraak.eind) as any,
                            type: 'afspraak',
                            lesgroepen
                        }
                    })!;

                    viewData = updateAll<LesplanningQuery>(
                        mod('lesplanning', 'items')(removeItem(afspraakToekenning.id)),
                        mod('lesplanning', 'toekomendeItems')(removeItem(afspraakToekenning.id))
                    )(viewData);

                    cache.writeQuery({
                        query: LesplanningDocument,
                        data: viewData,
                        variables: {
                            afspraakId: afspraak.id,
                            begin: convertToLocalDate(afspraak.begin) as any,
                            eind: convertToLocalDate(afspraak.eind) as any,
                            type: 'afspraak',
                            lesgroepen
                        }
                    });

                    // roosterdagen updaten
                    const verplaatstHuiswerkType = afspraakToekenning.studiewijzeritem.huiswerkType;
                    const heeftGeenOvergeblevenToekenningVanVerplaatstType = !viewData.lesplanning.items.some(
                        (toekenning: LesplanningQuery['lesplanning']['items'][number]) =>
                            toekenning.studiewijzeritem.huiswerkType === verplaatstHuiswerkType
                    );

                    if (heeftGeenOvergeblevenToekenningVanVerplaatstType) {
                        cache.modify({
                            id: cache.identify({ __typename: 'Afspraak', id: afspraak.id }),
                            fields: this.getHuiswerkTypeFieldModifier(verplaatstHuiswerkType, false) as any
                        });
                    }
                }
            })
            .subscribe();
    }

    private getHuiswerkTypeFieldModifier(verplaatstHuiswerkType: HuiswerkType, fieldValue: boolean) {
        switch (verplaatstHuiswerkType) {
            case HuiswerkType.HUISWERK:
                return { huiswerk: () => fieldValue };
            case HuiswerkType.LESSTOF:
                return { lesstof: () => fieldValue };
            case HuiswerkType.TOETS:
                return { toets: () => fieldValue };
            case HuiswerkType.GROTE_TOETS:
                return { groteToets: () => fieldValue };
        }
    }

    public dagNaarAfspraakToekenning(
        dagToekenning: DagToekenning,
        afspraakToekenning: AfspraakToekenning,
        afspraak: AfspraakQuery['afspraak'],
        lesgroepIds: string[]
    ) {
        this.dataClient
            .mutate({
                mutation: LesplanningDagNaarAfspraakDocument,
                variables: {
                    dagtoekenning: convertToDagToekenningInput(dagToekenning),
                    afspraaktoekenning: convertToAfspraakToekenningInput(afspraakToekenning)
                },
                refetchQueries: [namedOperations.Query.lesplanNavigatieWeek],
                update: (cache) => {
                    let viewData = cache.readQuery({
                        query: LesplanningDocument,
                        variables: {
                            afspraakId: afspraak.id,
                            begin: convertToLocalDate(startOfDay(new Date(dagToekenning.datum))) as any,
                            eind: convertToLocalDate(endOfDay(new Date(dagToekenning.datum))) as any,
                            type: 'dag',
                            lesgroepen: lesgroepIds
                        }
                    })!;

                    viewData = {
                        lesplanning: {
                            ...viewData.lesplanning,
                            items: viewData.lesplanning.items.filter(notEqualsId(dagToekenning.id))
                        }
                    };

                    cache.writeQuery({
                        query: LesplanningDocument,
                        data: viewData,
                        variables: {
                            afspraakId: afspraak.id,
                            begin: convertToLocalDate(startOfDay(new Date(dagToekenning.datum))) as any,
                            eind: convertToLocalDate(endOfDay(new Date(dagToekenning.datum))) as any,
                            type: 'dag',
                            lesgroepen: lesgroepIds
                        }
                    });

                    // roosterdagen updaten
                    cache.modify({
                        id: cache.identify({ __typename: 'Afspraak', id: afspraak.id }),
                        fields: this.getHuiswerkTypeFieldModifier(dagToekenning.studiewijzeritem.huiswerkType, true) as any
                    });
                }
            })
            .subscribe();
    }

    public saveAfspraakToekenning$(toekenningen: AfspraakToekenning[]) {
        const toSaveToekenningen: AfspraakToekenningInput[] = toekenningen.map((toekenning: AfspraakToekenning) =>
            convertToAfspraakToekenningInput(toekenning)
        );

        return this.dataClient.mutate({
            mutation: SaveAfspraakToekenningObsDocument,
            variables: {
                toekenningInput: toSaveToekenningen
            },
            update: (cache) => {
                cache.evict({ fieldName: 'lesplanning' });
                cache.evict({ fieldName: 'roosterDagen' });
                cache.evict({ fieldName: 'werkdrukVoorSelectie' });
            }
        });
    }

    public saveAfspraakToekenning(toekenningen: AfspraakToekenning[]) {
        this.saveAfspraakToekenning$(toekenningen).subscribe();
    }

    // bij aanroep vanuit het share-content component is afspraak en baseAfspraakId leeg
    public saveDagToekenning$(
        toekenningen: DagToekenning[],
        afspraak?: AfspraakQuery['afspraak'],
        baseAfspraakId?: string
    ): Observable<FetchResult<SaveDagToekenningMutation>> {
        const newItem = !(toekenningen.length === 1 && toekenningen[0].id);
        const toSaveToekenningen: DagToekenningInput[] = toekenningen.map((toekenning: DagToekenning) =>
            convertToDagToekenningInput(toekenning)
        );

        return this.dataClient.mutate({
            mutation: SaveDagToekenningObsDocument,
            variables: {
                toekenningInput: toSaveToekenningen
            },
            refetchQueries: [namedOperations.Query.inleveropdrachten],
            update: (cache, response) => {
                cache.evict({ fieldName: 'lesplanNavigatieWeek' });
                cache.evict({ fieldName: 'werkdrukVoorSelectie' });

                const lesgroepIds = afspraak!.lesgroepen.map(toId);
                const args = {
                    afspraakId: baseAfspraakId!,
                    begin: convertToLocalDate(startOfDay(toekenningen[0].datum)) as any,
                    eind: convertToLocalDate(endOfDay(toekenningen[0].datum)) as any,
                    type: 'dag',
                    lesgroepen: lesgroepIds
                };

                let viewData = cache.readQuery({
                    query: LesplanningDocument,
                    variables: args
                });

                if (viewData !== null) {
                    const responseData = response.data;
                    const nieuweToekenningen = updateAll<DagToekenning[]>(set(all(), 'isStartInleverperiode')(false as any))(
                        responseData!.saveDagToekenning.toekenningen as DagToekenning[]
                    );
                    nieuweToekenningen.forEach((newToekenning: DagToekenning) => {
                        if (newToekenning.studiewijzeritem.inleverperiode) {
                            return; // inleveropdrachten niet tonen in de lesplanning.
                        }

                        if (newItem) {
                            viewData = mod('lesplanning', 'items')(addItem(newToekenning))(viewData as any);
                        } else {
                            viewData = set(
                                'lesplanning',
                                'items',
                                matching({ id: newToekenning.id })
                            )(newToekenning as LesplanningQuery['lesplanning']['items'][number])(viewData as any);
                        }
                    });

                    cache.writeQuery({
                        query: LesplanningDocument,
                        data: viewData,
                        variables: args
                    });
                }
            }
        });
    }

    public saveDagToekenning(toekenningen: DagToekenning[], afspraak?: AfspraakQuery['afspraak']) {
        this.saveDagToekenning$(toekenningen, afspraak).subscribe();
    }

    public saveWeekToekenning(toekenningen: WeekToekenning[], afspraak: AfspraakQuery['afspraak'], jaar: number) {
        const newItem = !(toekenningen.length === 1 && toekenningen[0].id);
        const toSaveToekenningen: WeekToekenningInput[] = toekenningen.map((toekenning: WeekToekenning) =>
            convertToWeekToekenningInput(toekenning)
        );

        this.dataClient
            .mutate({
                mutation: SaveWeekToekenningDocument,
                variables: {
                    toekenningInput: toSaveToekenningen
                },
                refetchQueries: [namedOperations.Query.lesplanning],
                update: (cache, response) => {
                    cache.evict({ fieldName: 'werkdrukVoorSelectie' });

                    const lesgroepIds = afspraak.lesgroepen.map(toId);
                    let viewData = cache.readQuery({
                        query: LesplanningVoorWeekDocument,
                        variables: {
                            afspraakId: afspraak.id,
                            weeknr: toekenningen[0].startWeek,
                            jaar,
                            lesgroepen: lesgroepIds
                        }
                    });

                    if (viewData) {
                        response.data!.saveWeekToekenning.toekenningen.forEach(
                            (toekenning: LesplanningVoorWeekQuery['lesplanningVoorWeek']['items'][number]) => {
                                toekenning = set('isStartInleverperiode')(false)(toekenning as any);
                                if (newItem) {
                                    viewData = mod('lesplanningVoorWeek', 'items')(addItem(toekenning))(viewData as any);
                                } else {
                                    viewData = set('lesplanningVoorWeek', 'items', matching({ id: toekenning.id }))(toekenning)(
                                        viewData as any
                                    );
                                }
                            }
                        );

                        cache.writeQuery({
                            query: LesplanningVoorWeekDocument,
                            data: viewData,
                            variables: {
                                afspraakId: afspraak.id,
                                weeknr: toekenningen[0].startWeek,
                                jaar,
                                lesgroepen: lesgroepIds
                            }
                        });
                    }
                }
            })
            .subscribe();
    }

    public deleteToekenning(
        toekenning: Toekenning,
        afspraak: AfspraakQuery['afspraak'],
        verwijderUitSjabloon: boolean,
        week?: number,
        jaar?: number,
        dag?: Date
    ) {
        const lesgroepen = afspraak.lesgroepen.map((lesgroep) => lesgroep.id);
        let query;
        let updateQuery: DocumentNode;
        let updateProperties: any;

        if (week && jaar) {
            query = DeleteWeekToekenningDocument;

            updateQuery = LesplanningVoorWeekDocument;
            updateProperties = {
                afspraakId: afspraak.id,
                weeknr: week,
                jaar,
                lesgroepen,
                verwijderUitSjabloon
            };
        } else if (dag) {
            query = DeleteDagToekenningDocument;

            updateQuery = LesplanningDocument;
            updateProperties = {
                afspraakId: afspraak.id,
                begin: convertToLocalDate(startOfDay(new Date(dag))),
                eind: convertToLocalDate(endOfDay(new Date(dag))),
                type: 'dag',
                lesgroepen
            };
        } else {
            query = DeleteAfspraakToekenningDocument;

            updateQuery = LesplanningDocument;
            updateProperties = {
                afspraakId: afspraak.id,
                begin: convertToLocalDate(afspraak.begin),
                eind: convertToLocalDate(afspraak.eind),
                type: 'afspraak',
                lesgroepen
            };
        }

        this.dataClient
            .mutate({
                mutation: query,
                variables: { toekenningId: toekenning.id, verwijderUitSjabloon },
                update: (cache) => {
                    let viewData: LesplanningVoorWeekQuery | LesplanningQuery = cache.readQuery({
                        query: updateQuery,
                        variables: updateProperties
                    })!;

                    if (week && jaar) {
                        viewData = updateAll<LesplanningVoorWeekQuery>(
                            mod('lesplanningVoorWeek', 'items')(removeItem(toekenning.id)),
                            mod('lesplanningVoorWeek', 'toekomendeItems')(removeItem(toekenning.id))
                        )(viewData as LesplanningVoorWeekQuery);
                    } else {
                        viewData = updateAll<LesplanningQuery>(
                            mod('lesplanning', 'items')(removeItem(toekenning.id)),
                            mod('lesplanning', 'toekomendeItems')(removeItem(toekenning.id))
                        )(viewData as LesplanningQuery);

                        viewData.lesplanning.items = viewData.lesplanning.items.filter(
                            (foundToekenning: LesplanningQuery['lesplanning']['items'][number]) => foundToekenning.id !== toekenning.id
                        );

                        viewData.lesplanning.toekomendeItems = viewData.lesplanning.toekomendeItems.filter(
                            (foundToekenning: LesplanningQuery['lesplanning']['toekomendeItems'][number]) =>
                                foundToekenning.id !== toekenning.id
                        );

                        // bij afspraak en dag de lesplanning uit de cache gooien ivm 'toekomende items'
                        // op andere dagen waarvan we de query niet hebben
                        cache.evict({ fieldName: 'lesplanning' });
                        cache.gc();

                        // roosterdagen updaten
                        if (!dag) {
                            const verplaatstHuiswerkType = toekenning.studiewijzeritem.huiswerkType;
                            const heeftGeenOvergeblevenToekenningVanVerplaatstType = !viewData.lesplanning.items.some(
                                (foundToekenning: LesplanningQuery['lesplanning']['items'][number]) =>
                                    foundToekenning.studiewijzeritem.huiswerkType === verplaatstHuiswerkType
                            );

                            if (heeftGeenOvergeblevenToekenningVanVerplaatstType) {
                                cache.modify({
                                    id: cache.identify({ __typename: 'Afspraak', id: afspraak.id }),
                                    fields: this.getHuiswerkTypeFieldModifier(verplaatstHuiswerkType, false) as any
                                });
                            }
                        }
                    }

                    cache.writeQuery({
                        query: updateQuery,
                        data: viewData,
                        variables: updateProperties
                    });
                }
            })
            .subscribe();
    }

    public getToekomendeAfspraken(afspraakId: string) {
        return this.dataClient
            .query({
                query: ToekomendeAfsprakenDocument,
                variables: { afspraakId }
            })
            .pipe(
                filter((result) => !!result.data),
                map((res) => res.data.toekomendeAfspraken)
            );
    }

    public getToekomendeAfsprakenVanLesgroepen(lesgroepen: string[]) {
        return this.dataClient
            .query({
                query: ToekomendeAfsprakenVanLesgroepenDocument,
                variables: {
                    lesgroepen,
                    // codegen zorgt voor types van scalar LocalDate -> Date, alleen bij het opsturen moet het een string zijn,
                    // maar dit is niet alleen voor variables aan te geven
                    vanafDatum: convertToLocalDate(new Date()) as any
                }
            })
            .pipe(
                filter((result) => !!result.data),
                map((res) => res.data.toekomendeAfsprakenVanLesgroepen)
            );
    }

    public getZwevendeItems(afspraakId: string): Observable<ZwevendeLesitemsQuery['zwevendeLesitems']> {
        return this.dataClient
            .watchQuery({
                query: ZwevendeLesitemsDocument,
                variables: {
                    afspraakId
                }
            })
            .valueChanges.pipe(map((res) => res.data.zwevendeLesitems));
    }

    public getAantalZwevendeItems(afspraakId: string) {
        return this.dataClient
            .watchQuery({
                query: AantalZwevendeLesitemsDocument,
                variables: {
                    afspraakId
                }
            })
            .valueChanges.pipe(
                map((res) => {
                    if (res.data.aantalZwevendeLesitems) {
                        return res.data.aantalZwevendeLesitems;
                    }
                })
            );
    }

    public getRoosterPreview(afspraakId: string, afspraakBegin: Date, afspraakEind: Date, huiswerkType: HuiswerkType) {
        return this.dataClient
            .query({
                query: LesplanningRoosterPreviewDocument,
                variables: {
                    afspraakId,
                    afspraakBegin: convertToLocalDate(afspraakBegin) as any,
                    afspraakEind: convertToLocalDate(afspraakEind) as any,
                    huiswerkType
                },
                fetchPolicy: 'network-only'
            })
            .pipe(
                map((res) => {
                    if (res.data.lesplanningRoosterPreview) {
                        return res.data.lesplanningRoosterPreview;
                    }
                })
            );
    }

    public herplanAfspraakToekenningen$(afspraakToekenningIds: string[], afspraak: AfspraakQuery['afspraak']) {
        const herplanAfspraakToekenningenInput = {
            swiAfspraakToekenningIds: afspraakToekenningIds,
            datumTijd: convertToLocalDate(afspraak.begin) as any
        };

        return this.dataClient.mutate({
            mutation: HerplanAfspraakToekenningenDocument,
            variables: {
                herplanAfspraakToekenningen: herplanAfspraakToekenningenInput
            },
            refetchQueries: [
                namedOperations.Query.lesplanning,
                namedOperations.Query.lesplanningVoorWeek,
                namedOperations.Query.aantalZwevendeLesitems,
                namedOperations.Query.roosterDagen
            ],
            awaitRefetchQueries: true,
            update: (cache) => {
                cache.evict({
                    fieldName: 'zwevendeLesitems',
                    args: {
                        afspraakId: afspraak.id
                    }
                });
                cache.gc();
            }
        });
    }

    public verwijderZwevendeItems(studiewijzeritemIds: string[], verwijderUitSjabloon: boolean) {
        this.dataClient
            .mutate({
                mutation: VerwijderBulkStudiewijzerDocument,
                variables: {
                    studiewijzeritemIds,
                    verwijderUitSjabloon
                },
                refetchQueries: [namedOperations.Query.aantalZwevendeLesitems, namedOperations.Query.roosterDagen]
            })
            .subscribe();
    }

    public getLesgroepStudiewijzers(
        lesgroepIds: string[]
    ): Observable<Map<string, LesgroepStudiewijzerQuery['lesgroepStudiewijzers'][number]>> {
        return this.dataClient
            .watchQuery({
                query: LesgroepStudiewijzerDocument,
                variables: {
                    lesgroepIds
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => {
                    const studiewijzerMap = new Map<string, LesgroepStudiewijzerQuery['lesgroepStudiewijzers'][number]>();
                    result.data.lesgroepStudiewijzers.forEach((studiewijzer) =>
                        studiewijzerMap.set(studiewijzer.lesgroep.id, studiewijzer)
                    );
                    return studiewijzerMap;
                })
            );
    }
}
