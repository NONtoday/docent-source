import { Injectable, inject } from '@angular/core';
import { ApolloCache, FetchResult } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { getISOWeek, getYear, isEqual, isSameDay } from 'date-fns';
import { remove, sortBy } from 'lodash-es';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { all, get, matching, mod, set, updateAll } from 'shades';
import { studiewijzerOverzichtView, studiewijzercategorieEditMode, studiewijzeritemIsNieuw } from '../../generated/_operations';
import {
    Afspraak,
    AfspraakFieldsFragment,
    AfspraakToekenning,
    AfspraakToekenningenVoorLesgroepenDocument,
    AfspraakToekenningenVoorLesgroepenQuery,
    CijferPeriodeWekenMetVakantiesVanLesgroepDocument,
    CijferPeriodeWekenMetVakantiesVanLesgroepQuery,
    CijferPeriodeWekenVanLesgroepDocument,
    CijferPeriodeWekenVanLesgroepQuery,
    CijferPeriodesDocument,
    CijferPeriodesQuery,
    DagToekenning,
    DeleteStudiewijzerCategorieDocument,
    DeleteStudiewijzerDocument,
    Differentiatiegroep,
    DupliceerToekenningInStudiewijzerDocument,
    ExporteerToekenningenUitStudiewijzerDocument,
    GetLesgroepenDocument,
    GetLesgroepenQuery,
    ImporteerSjablonenDocument,
    InleveroverzichtDocument,
    InleveroverzichtQuery,
    KopieerToekenningenNaarStudiewijzerDatumDocument,
    KopieerToekenningenNaarStudiewijzerWeekDocument,
    KoppelToekenningDocument,
    Leerling,
    LeerlingenMetAccountDocument,
    LeerlingenMetAccountQuery,
    MoveStudiewijzerCategorieDocument,
    OntkoppelToekenningDocument,
    SaveDagToekenningDocument,
    SaveDagToekenningMutation,
    SaveStudiewijzerCategorieDocument,
    SaveStudiewijzerDocument,
    SaveWeekToekenningObsDocument,
    Studiewijzer,
    StudiewijzerCategorie,
    StudiewijzerDocument,
    StudiewijzerOverzichtViewDocument,
    StudiewijzerOverzichtViewQuery,
    StudiewijzerQuery,
    StudiewijzerSaveAfspraakToekenningObsDocument,
    StudiewijzerViewDocument,
    StudiewijzerViewQuery,
    Studiewijzeritem,
    SynchronisatieStudiewijzerOverzichtViewDocument,
    SynchronisatieStudiewijzerOverzichtViewQuery,
    SynchroniseerMetSjablonenDocument,
    ToekenningFieldsFragment,
    UpdateZichtbaarheidToekenningDocument,
    VerplaatsStudiewijzerDocument,
    VerschuifPlanningDocument,
    VerwijderAfspraakToekenningDocument,
    VerwijderDagToekenningDocument,
    VerwijderToekenningDifferentiatiesDocument,
    VerwijderWeekToekenningDocument,
    WeekToekenning,
    namedOperations
} from '../../generated/_types';
import { StudiewijzerViewAfspraakToekenning, StudiewijzerViewDagToekenning } from '../core/models/studiewijzers/studiewijzer.model';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { convertToLocalDate } from '../rooster-shared/utils/date.utils';
import { addItem, addItems, matchtDag, removeItem, sortLocale } from '../rooster-shared/utils/utils';
import { insertInArray, moveItemInArray } from '../shared/utils/array.utils';
import { createBijhorendeStartInleveropdrachtToekenningen } from '../shared/utils/toekenning.utils';
import {
    convertToAfspraakToekenningInput,
    convertToDagToekenningInput,
    convertToWeekToekenningInput
} from './../core/converters/toekenningen.converters';
import { PlanningVerschuifDirection } from './verschuif-planning-popup/verschuif-planning-popup.component';

@Injectable({
    providedIn: 'root'
})
export class StudiewijzerDataService {
    private dataClient = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);
    private _cache: ApolloCache<any>;
    private toekenningTypes = ['AfspraakToekenning', 'DagToekenning', 'WeekToekenning'];

    constructor() {
        this._cache = this.dataClient.client.cache;
    }

    public getStudiewijzerOverzichtView(
        schooljaar: number,
        medewerkerUuid: string
    ): Observable<StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']> {
        return this.dataClient
            .watchQuery({
                query: StudiewijzerOverzichtViewDocument,
                variables: {
                    schooljaar,
                    medewerkerUuid
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.studiewijzerOverzichtView)
            );
    }

    public getSynchronisatieStudiewijzerOverzichtView(
        schooljaren: number[],
        medewerkerUuid: string
    ): Observable<SynchronisatieStudiewijzerOverzichtViewQuery['synchronisatieStudiewijzerOverzichtView']> {
        return this.dataClient
            .watchQuery({
                query: SynchronisatieStudiewijzerOverzichtViewDocument,
                variables: {
                    schooljaren,
                    medewerkerUuid
                },
                fetchPolicy: 'network-only',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.synchronisatieStudiewijzerOverzichtView)
            );
    }

    public getStudiewijzer(studiewijzerId: string): Observable<StudiewijzerQuery['studiewijzer']> {
        return this.dataClient
            .watchQuery({
                query: StudiewijzerDocument,
                variables: {
                    id: studiewijzerId
                }
            })
            .valueChanges.pipe(map((result) => result.data.studiewijzer));
    }

    public getCijferPeriodes(studiewijzer: string): Observable<CijferPeriodesQuery['cijferPeriodes']> {
        return this.dataClient
            .watchQuery({
                query: CijferPeriodesDocument,
                variables: {
                    studiewijzer
                }
            })
            .valueChanges.pipe(map((result) => result.data.cijferPeriodes));
    }

    public getCijferPeriodeWeken(lesgroep: string): Observable<CijferPeriodeWekenVanLesgroepQuery['cijferPeriodeWekenVanLesgroep']> {
        return this.dataClient
            .watchQuery({
                query: CijferPeriodeWekenVanLesgroepDocument,
                variables: {
                    lesgroep
                }
            })
            .valueChanges.pipe(map((result) => result.data.cijferPeriodeWekenVanLesgroep));
    }

    public getCijferPeriodeWekenMetVakantie(
        lesgroep: string,
        studiewijzer: string
    ): Observable<CijferPeriodeWekenMetVakantiesVanLesgroepQuery['cijferPeriodeWekenMetVakantiesVanLesgroep']> {
        return this.dataClient
            .query({
                query: CijferPeriodeWekenMetVakantiesVanLesgroepDocument,
                variables: {
                    lesgroep,
                    studiewijzer
                }
            })
            .pipe(map((result) => result.data.cijferPeriodeWekenMetVakantiesVanLesgroep));
    }

    public getStudiewijzerView(studiewijzerId: string): Observable<StudiewijzerViewQuery['studiewijzerView']> {
        return this.dataClient
            .watchQuery({
                query: StudiewijzerViewDocument,
                variables: {
                    studiewijzer: studiewijzerId
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.studiewijzerView)
            );
    }

    public getLesgroepen(schooljaar: number, medewerkerId: string): Observable<GetLesgroepenQuery['lesgroepen']> {
        return this.dataClient
            .watchQuery({
                query: GetLesgroepenDocument,
                variables: {
                    schooljaar,
                    medewerkerId
                }
            })
            .valueChanges.pipe(map((result) => result.data.lesgroepen));
    }

    public getInleveroverzicht(toekenningId: string): Observable<InleveroverzichtQuery['inleveroverzicht']> {
        return this.dataClient
            .watchQuery({
                query: InleveroverzichtDocument,
                variables: {
                    toekenningId
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.inleveroverzicht)
            );
    }

    public createStudiewijzer(studiewijzer: Studiewijzer, schooljaar: number, medewerkerUuid: string) {
        const studiewijzerInput = {
            naam: studiewijzer.naam,
            lesgroep: studiewijzer.lesgroep.id
        };

        return this.dataClient.mutate({
            mutation: SaveStudiewijzerDocument,
            variables: {
                studiewijzer: studiewijzerInput
            },
            refetchQueries: [namedOperations.Query.studiewijzerOverzichtView],
            update: (cache, { data }) => {
                let view = cache.readQuery({
                    query: StudiewijzerOverzichtViewDocument,
                    variables: {
                        schooljaar,
                        medewerkerUuid
                    }
                })!;

                const bestaandeSws = view.studiewijzerOverzichtView.studiewijzers;
                view = set('studiewijzerOverzichtView', 'studiewijzers')([data!.saveStudiewijzer, ...bestaandeSws])(view as any);

                cache.writeQuery({
                    query: StudiewijzerOverzichtViewDocument,
                    variables: {
                        schooljaar,
                        medewerkerUuid
                    },
                    data: view
                });
            }
        });
    }

    public verschuifPlanning(studiewijzerId: string, vanafWeeknummer: number, aantalWeken: number, direction: PlanningVerschuifDirection) {
        return this.dataClient.mutate({
            mutation: VerschuifPlanningDocument,
            variables: {
                studiewijzerId,
                vanafWeeknummer,
                aantalWeken,
                direction
            },
            refetchQueries: [namedOperations.Query.studiewijzerView]
        });
    }

    public editStudiewijzer(studiewijzer: Studiewijzer) {
        const studiewijzerInput = {
            id: studiewijzer.id,
            naam: studiewijzer.naam,
            lesgroep: studiewijzer.lesgroep.id
        };

        this.dataClient
            .mutate({
                mutation: SaveStudiewijzerDocument,
                optimisticResponse: {
                    __typename: 'Mutation',
                    saveStudiewijzer: {
                        __typename: 'Studiewijzer',
                        ...studiewijzer
                    }
                },
                variables: {
                    studiewijzer: studiewijzerInput
                }
            })
            .subscribe();
    }

    deleteStudiewijzer(studiewijzer: Studiewijzer, medewerkerUuid: string) {
        this.dataClient
            .mutate({
                mutation: DeleteStudiewijzerDocument,
                optimisticResponse: {
                    __typename: 'Mutation',
                    deleteStudiewijzer: true
                },
                variables: { studiewijzerId: studiewijzer.id },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar: studiewijzer.schooljaar,
                            medewerkerUuid
                        }
                    })!.studiewijzerOverzichtView;

                    view = updateAll<StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']>(
                        mod('studiewijzers')(removeItem(studiewijzer.id)),
                        mod('categorieen', all(), 'studiewijzers')(removeItem(studiewijzer.id))
                    )(view);

                    cache.writeQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar: studiewijzer.schooljaar,
                            medewerkerUuid
                        },
                        data: { studiewijzerOverzichtView: view }
                    });
                }
            })
            .subscribe();
    }

    public saveWeekToekenning$(toekenningen: WeekToekenning[], studiewijzerId: string, sjabloonSyncId?: string) {
        const isNewItem = toekenningen[0].id === undefined;
        const toSaveToekenningenInputs = toekenningen.map((toekenning) => convertToWeekToekenningInput(toekenning, studiewijzerId));

        return this.dataClient.mutate({
            mutation: SaveWeekToekenningObsDocument,
            variables: {
                toekenningInput: toSaveToekenningenInputs,
                sjabloonSyncId
            },
            update: (cache, response) => {
                cache.evict({ fieldName: 'werkdrukVoorSelectie' });

                let view = cache.readQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                })!.studiewijzerView;

                const nieuweToekenningen = updateAll<WeekToekenning[]>(
                    set(all(), 'studiewijzeritem', 'isNieuw')(isNewItem as any),
                    set(all(), 'isStartInleverperiode')(false as any)
                )(response.data!.saveWeekToekenning.toekenningen as WeekToekenning[]);

                nieuweToekenningen.forEach((newToekenning) => {
                    if (isNewItem) {
                        view = mod('weken', matching({ weeknummer: newToekenning.startWeek }), 'toekenningen')(addItem(newToekenning))(
                            view
                        );
                    } else {
                        view = set(
                            'weken',
                            matching({ weeknummer: newToekenning.startWeek }),
                            'toekenningen',
                            matching({ id: newToekenning.id })
                        )(<ToekenningFieldsFragment>newToekenning)(view);
                    }
                });

                cache.writeQuery({
                    query: StudiewijzerViewDocument,
                    data: { studiewijzerView: view },
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                });
            }
        });
    }

    public saveDagToekenning$(toekenningen: DagToekenning[], studiewijzerId: string): Observable<FetchResult<SaveDagToekenningMutation>> {
        const newItem = toekenningen[0].id === undefined;
        const toSaveToekenningen = toekenningen.map((toekenning) => convertToDagToekenningInput(toekenning, studiewijzerId));

        return this.dataClient.mutate({
            mutation: SaveDagToekenningDocument,
            variables: {
                toekenningInput: toSaveToekenningen
            },
            update: (cache, response) => {
                cache.evict({ fieldName: 'werkdrukVoorSelectie' });

                let view = cache.readQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                })!.studiewijzerView;

                const toekenning = toekenningen[0];
                const responseToekenning = response.data!.saveDagToekenning.toekenningen[0];

                const inleverperiode = toekenning.studiewijzeritem.inleverperiode;

                if (inleverperiode) {
                    const modStartToekenningen = mod('weken', all(), 'dagen', matchtDag(inleverperiode.begin), 'toekenningen');
                    const modEindToekenningen = mod('weken', all(), 'dagen', matchtDag(inleverperiode.eind), 'toekenningen');

                    const newStart = { ...responseToekenning, isStartInleverperiode: true };
                    const newEind = { ...responseToekenning, isStartInleverperiode: false };

                    if (newItem) {
                        const addStart = modStartToekenningen(addItem(newStart));
                        const addEind = modEindToekenningen(addItem(newEind));

                        view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addStart, addEind)(view);
                    } else {
                        // uit 'oude' dagen verwijderen
                        view = mod('weken', all(), 'dagen', all(), 'toekenningen')(removeItem(toekenning.id))(view);

                        let correctie = 0;
                        if (
                            isSameDay(inleverperiode.begin, inleverperiode.eind) &&
                            inleverperiode.startSortering > inleverperiode.eindSortering
                        ) {
                            correctie = 1;
                        }

                        const addStart = modStartToekenningen(insertInArray(inleverperiode.startSortering - correctie, newStart));
                        const addEind = modEindToekenningen(insertInArray(inleverperiode.eindSortering - correctie, newEind));

                        view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addStart, addEind)(view);
                    }
                } else {
                    const nieuweToekenningen = updateAll<DagToekenning[]>(
                        set(all(), 'studiewijzeritem', 'isNieuw')(newItem as any),
                        set(all(), 'isStartInleverperiode')(false as any)
                    )(response.data!.saveDagToekenning.toekenningen as DagToekenning[]);

                    nieuweToekenningen.forEach((newToekenning) => {
                        if (newItem) {
                            view = mod('weken', all(), 'dagen', matchtDag(toekenning.datum), 'toekenningen')(addItem(newToekenning))(view);
                        } else {
                            view = set(
                                'weken',
                                all(),
                                'dagen',
                                matchtDag(toekenning.datum),
                                'toekenningen',
                                matching({ id: newToekenning.id })
                            )(<ToekenningFieldsFragment>newToekenning)(view);
                        }
                    });
                }

                cache.writeQuery({
                    query: StudiewijzerViewDocument,
                    data: { studiewijzerView: view },
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                });
            }
        });
    }

    public saveAfspraakToekenning$(
        toekenningen: AfspraakToekenning[],
        studiewijzerId: string,
        lesgroepId: string,
        sjabloonSyncId?: string
    ) {
        const newItem: boolean = toekenningen[0].id === undefined;
        const toSaveToekenningen = toekenningen.map((toekenning) => convertToAfspraakToekenningInput(toekenning, studiewijzerId));

        toekenningen.forEach((toekenning) => {
            this._cache.evict({
                fieldName: 'roosterDagen',
                args: {
                    medewerkerId: this.medewerkerDataService.medewerkerId,
                    jaar: getYear(toekenning.afgerondOpDatumTijd),
                    week: getISOWeek(toekenning.afgerondOpDatumTijd)
                }
            });
        });

        return this.dataClient.mutate({
            mutation: StudiewijzerSaveAfspraakToekenningObsDocument,
            variables: {
                toekenningInput: toSaveToekenningen,
                sjabloonSyncId
            },
            update: (cache, response) => {
                cache.evict({ fieldName: 'werkdrukVoorSelectie' });

                let view = cache.readQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                })!.studiewijzerView;

                const toekenning = toekenningen.find((toekenning) => toekenning.lesgroep?.id === lesgroepId) || toekenningen[0];
                const toekenningResponse =
                    response.data!.saveAfspraakToekenning.toekenningen.find((toekenning) => toekenning.lesgroep?.id === lesgroepId) ||
                    response.data!.saveAfspraakToekenning.toekenningen[0];

                const inleverperiode = toekenning.studiewijzeritem.inleverperiode;
                if (inleverperiode) {
                    // uit 'oude' dagen verwijderen
                    view = mod('weken', all(), 'dagen', all(), 'toekenningen')(removeItem(toekenning.id))(view);

                    let correctie = 0;
                    if (
                        isSameDay(inleverperiode.begin, inleverperiode.eind) &&
                        inleverperiode.startSortering > inleverperiode.eindSortering
                    ) {
                        correctie = 1;
                    }

                    const modStartToekenningen = mod('weken', all(), 'dagen', matchtDag(inleverperiode.begin), 'toekenningen');
                    const modEindToekenningen = mod('weken', all(), 'dagen', matchtDag(inleverperiode.eind), 'toekenningen');

                    const newStart = { ...toekenningResponse, isStartInleverperiode: true };
                    const newEind = { ...toekenningResponse, isStartInleverperiode: false };

                    const addStart = modStartToekenningen(insertInArray(inleverperiode.startSortering - correctie, newStart));
                    const addEind = modEindToekenningen(insertInArray(inleverperiode.eindSortering - correctie, newEind));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addStart, addEind)(view);
                } else {
                    const matchtAfspraak = matching({
                        afspraak: (afspraak: AfspraakFieldsFragment) => isEqual(afspraak.begin, toekenning.afgerondOpDatumTijd)
                    });

                    const nieuweToekenningenRes = response.data!.saveAfspraakToekenning.toekenningen.filter(
                        (newToekenning) => newToekenning.lesgroep?.id === lesgroepId
                    );

                    const nieuweToekenningen = updateAll<StudiewijzerViewAfspraakToekenning[] | StudiewijzerViewDagToekenning[]>(
                        set(all(), 'studiewijzeritem', 'isNieuw')(newItem as any),
                        set(all(), 'isStartInleverperiode')(false as any)
                    )(nieuweToekenningenRes as StudiewijzerViewAfspraakToekenning[] | StudiewijzerViewDagToekenning[]);

                    nieuweToekenningen.forEach((newToekenning) => {
                        if (newItem) {
                            view = mod(
                                'weken',
                                all(),
                                'dagen',
                                matchtDag(toekenning.afgerondOpDatumTijd),
                                'afspraken',
                                matchtAfspraak
                            )(mod('toekenningen')(addItem(newToekenning)))(view);
                        } else {
                            const isAfspraak =
                                get('weken', all(), 'dagen', matchtDag(toekenning.afgerondOpDatumTijd), 'afspraken', matchtAfspraak)
                                    .length > 0;

                            if (isAfspraak) {
                                view = mod(
                                    'weken',
                                    all(),
                                    'dagen',
                                    matchtDag(toekenning.afgerondOpDatumTijd),
                                    'afspraken',
                                    matchtAfspraak
                                )(mod('toekenningen', matching({ id: newToekenning.id }))(() => newToekenning))(view);
                            } else {
                                view = mod(
                                    'weken',
                                    all(),
                                    'dagen',
                                    matchtDag(toekenning.afgerondOpDatumTijd),
                                    'toekenningen',
                                    matching({ id: newToekenning.id })
                                )(() => newToekenning)(view);
                            }
                        }
                    });
                }

                cache.writeQuery({
                    query: StudiewijzerViewDocument,
                    data: { studiewijzerView: view },
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                });
            }
        });
    }

    public verwijderWeekToekenning(toekenning: WeekToekenning, studiewijzerId: string, verwijderUitSjabloon = false) {
        this.dataClient
            .mutate({
                mutation: VerwijderWeekToekenningDocument,
                variables: {
                    toekenningId: toekenning.id,
                    verwijderUitSjabloon
                },
                optimisticResponse: {
                    deleteWeekToekenning: {
                        __typename: 'deletePayload',
                        succes: true
                    }
                },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    })!.studiewijzerView;

                    view = mod('weken', matching({ weeknummer: toekenning.startWeek }), 'toekenningen')(removeItem(toekenning.id))(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        data: { studiewijzerView: view },
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public verwijderDagToekenning(toekenning: DagToekenning, studiewijzerId: string, verwijderUitSjabloon = false) {
        this.dataClient
            .mutate({
                mutation: VerwijderDagToekenningDocument,
                variables: {
                    toekenningId: toekenning.id,
                    verwijderUitSjabloon
                },
                optimisticResponse: {
                    deleteDagToekenning: {
                        __typename: 'deletePayload',
                        succes: true
                    }
                },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    })!.studiewijzerView;

                    const inleverperiode = toekenning.studiewijzeritem.inleverperiode;
                    const datums = inleverperiode ? [inleverperiode.begin, inleverperiode.eind] : [toekenning.datum];
                    datums.forEach((datum) => {
                        view = mod('weken', all(), 'dagen', matchtDag(datum), 'toekenningen')(removeItem(toekenning.id))(view);
                    });

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        data: { studiewijzerView: view },
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public verwijderAfspraakToekenning(toekenning: AfspraakToekenning, studiewijzerId: string, verwijderUitSjabloon = false) {
        this.dataClient
            .mutate({
                mutation: VerwijderAfspraakToekenningDocument,
                variables: {
                    toekenningId: toekenning.id,
                    verwijderUitSjabloon
                },
                optimisticResponse: {
                    deleteAfspraakToekenning: {
                        __typename: 'deletePayload',
                        succes: true
                    }
                },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    })!.studiewijzerView;

                    const matchtAfspraak = matching({
                        afspraak: (afspraak: AfspraakFieldsFragment) => isEqual(afspraak.begin, toekenning.afgerondOpDatumTijd)
                    });

                    const removeFromAfspraak = mod(
                        'weken',
                        all(),
                        'dagen',
                        matchtDag(toekenning.afgerondOpDatumTijd),
                        'afspraken',
                        matchtAfspraak
                    )(mod('toekenningen')(removeItem(toekenning.id)));

                    // verwijder evt. uit dag
                    const removeFromDag = mod(
                        'weken',
                        all(),
                        'dagen',
                        matchtDag(toekenning.afgerondOpDatumTijd),
                        'toekenningen'
                    )(removeItem(toekenning.id));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromAfspraak, removeFromDag)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        data: { studiewijzerView: view },
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public removeIsNieuw(studiewijzeritemId: string) {
        const id = `Studiewijzeritem:${studiewijzeritemId}`;

        const studiewijzeritemData = this._cache.readFragment<Studiewijzeritem>({
            id,
            fragment: studiewijzeritemIsNieuw
        });

        this._cache.writeFragment({
            fragment: studiewijzeritemIsNieuw,
            id,
            data: { ...studiewijzeritemData, isNieuw: false }
        });
    }

    public kopieerToekenningenNaarStudiewijzerWeek$(studiewijzerId: string, weeknummer: number, toekenningIds: string[]) {
        return this.dataClient.mutate({
            mutation: KopieerToekenningenNaarStudiewijzerWeekDocument,
            variables: { studiewijzerId, weeknummer, toekenningIds },
            update: (cache, response) => {
                let view = cache.readQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                })!.studiewijzerView;

                let nieuweToekenningen = response.data!.kopieerToekenningenNaarStudiewijzerWeek.toekenningen as (
                    | WeekToekenning
                    | DagToekenning
                )[];
                // zet van alle nieuwe toekenningen isNieuw op true, en voeg voor inleveropdrachten isStartInleverperiode toe
                nieuweToekenningen = updateAll<(WeekToekenning | DagToekenning)[]>(
                    set(all(), 'studiewijzeritem', 'isNieuw')(true as any),
                    set(all(), 'isStartInleverperiode')(false as any)
                )(nieuweToekenningen);

                const inleveropdrachtToekenningen = remove(nieuweToekenningen, (t) => t.studiewijzeritem.inleverperiode);

                inleveropdrachtToekenningen.forEach((eindToekenning) => {
                    const inleveropdracht = eindToekenning.studiewijzeritem.inleverperiode!;
                    const bijhorendeStartToekenning = { ...eindToekenning, isStartInleverperiode: true };

                    const addStart = mod(
                        'weken',
                        matching({ weeknummer }),
                        'dagen',
                        matchtDag(inleveropdracht.begin),
                        'toekenningen'
                    )(addItem(bijhorendeStartToekenning));

                    const addEind = mod(
                        'weken',
                        matching({ weeknummer: getISOWeek(inleveropdracht.eind) }),
                        'dagen',
                        matchtDag(inleveropdracht.eind),
                        'toekenningen'
                    )(addItem(eindToekenning));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addStart, addEind)(view);
                });

                view = mod('weken', matching({ weeknummer }), 'toekenningen')(addItems(nieuweToekenningen))(view);

                cache.writeQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    },
                    data: { studiewijzerView: view }
                });
            }
        });
    }
    public kopieerToekenningenNaarStudiewijzerDatum$(studiewijzerId: string, voorAfspraak: boolean, datum: Date, toekenningIds: string[]) {
        return this.dataClient.mutate({
            mutation: KopieerToekenningenNaarStudiewijzerDatumDocument,
            variables: {
                studiewijzerId,
                voorAfspraak,
                datum: convertToLocalDate(datum) as any,
                toekenningIds
            },
            update: (cache, response) => {
                let view = cache.readQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    }
                })!.studiewijzerView;

                // zet van alle nieuwe toekenningen isNieuw op true, en voeg voor inleveropdrachten isStartInleverperiode toe
                let nieuweToekenningen = response.data!.kopieerToekenningenNaarStudiewijzerDatum.toekenningen as DagToekenning[];
                // zet van alle nieuwe toekenningen isNieuw op true, en voeg voor inleveropdrachten isStartInleverperiode toe
                nieuweToekenningen = updateAll<DagToekenning[]>(
                    set(all(), 'studiewijzeritem', 'isNieuw')(true as any),
                    set(all(), 'isStartInleverperiode')(false as any)
                )(nieuweToekenningen);

                const inleveropdrachtStartToekenningen = createBijhorendeStartInleveropdrachtToekenningen(nieuweToekenningen);

                const modDag = mod('weken', all(), 'dagen', matchtDag(datum));
                if (voorAfspraak) {
                    const inleveropdrachtEindToekenningen = remove(nieuweToekenningen, (t) => t.studiewijzeritem.inleverperiode);

                    const isAfspraak = matching({ afspraak: (afspraak: Afspraak) => isEqual(afspraak.begin, datum) });

                    const addToekenningenToAfspraak = modDag(mod('afspraken', isAfspraak, 'toekenningen')(addItems(nieuweToekenningen)));

                    const addToekenningenToDag = modDag(
                        mod('toekenningen')(addItems([...inleveropdrachtStartToekenningen, ...inleveropdrachtEindToekenningen]))
                    );

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addToekenningenToAfspraak, addToekenningenToDag)(view);
                } else {
                    view = modDag(mod('toekenningen')(addItems([...nieuweToekenningen, ...inleveropdrachtStartToekenningen])))(view);
                }

                cache.writeQuery({
                    query: StudiewijzerViewDocument,
                    variables: {
                        studiewijzer: studiewijzerId
                    },
                    data: { studiewijzerView: view }
                });
            }
        });
    }

    updateZichtbaarheidToekenning(studiewijzeritemId: string, zichtbaarVoorLeerling: boolean) {
        this.dataClient
            .mutate({
                mutation: UpdateZichtbaarheidToekenningDocument,
                variables: {
                    zichtbaarVoorLeerling,
                    studiewijzeritemIds: [studiewijzeritemId]
                }
            })
            .subscribe();
    }

    importeerSjablonen$(studiewijzerId: string, sjablonen: { sjabloonId: string; weeknummer: number }[]) {
        return this.dataClient.mutate({
            mutation: ImporteerSjablonenDocument,
            variables: {
                studiewijzerId,
                sjablonen
            },
            refetchQueries: [namedOperations.Query.studiewijzerView]
        });
    }

    public dupliceerToekenning(toekenningId: string, studiewijzerId: string) {
        this.dataClient
            .mutate({
                mutation: DupliceerToekenningInStudiewijzerDocument,
                variables: { toekenningId },
                update: (cache, response) => {
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    })!.studiewijzerView;

                    const toekenning = set('studiewijzeritem', 'isNieuw')(true)(response.data!.dupliceerToekenningInStudiewijzer as any);
                    const inleveropdracht = toekenning.studiewijzeritem.inleverperiode;

                    if (inleveropdracht) {
                        const inleverstart = { ...toekenning, isStartInleverperiode: true };
                        const inlevereind = { ...toekenning, isStartInleverperiode: false };
                        const inleveropdrachtBegin = new Date(inleveropdracht.begin);
                        const inleveropdrachtEind = new Date(inleveropdracht.eind);
                        const weeknummerStart = getISOWeek(inleveropdrachtBegin);
                        const weeknummerEind = getISOWeek(inleveropdrachtEind);

                        const addStart = mod(
                            'weken',
                            matching({ weeknummer: weeknummerStart }),
                            'dagen',
                            matchtDag(inleveropdrachtBegin),
                            'toekenningen'
                        )(addItem(inleverstart));

                        const addEind = mod(
                            'weken',
                            matching({ weeknummer: weeknummerEind }),
                            'dagen',
                            matchtDag(inleveropdrachtEind),
                            'toekenningen'
                        )(addItem(inlevereind));

                        view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(addStart, addEind)(view);
                    } else {
                        let isWeekToekenning = true;
                        let weeknummer = (<WeekToekenning>toekenning).startWeek;
                        const datumDagToekenning = (<DagToekenning>toekenning).datum;
                        const datumAfspraakToekenning = (<AfspraakToekenning>toekenning).afgerondOpDatumTijd;
                        let datum = datumDagToekenning ?? datumAfspraakToekenning;
                        datum = new Date(datum);

                        if (!weeknummer) {
                            isWeekToekenning = false;
                            weeknummer = getISOWeek(datum);
                        }

                        if (isWeekToekenning) {
                            view = mod('weken', matching({ weeknummer }), 'toekenningen')(addItem(toekenning))(view);
                        } else {
                            if (datumDagToekenning) {
                                view = mod(
                                    'weken',
                                    matching({ weeknummer }),
                                    'dagen',
                                    matchtDag(datum),
                                    'toekenningen'
                                )(addItem(toekenning))(view);
                            } else {
                                const isAfspraak = matching({ afspraak: (afspraak: Afspraak) => isEqual(afspraak.begin, datum) });
                                const modAfspraken = mod('weken', matching({ weeknummer }), 'dagen', matchtDag(datum), 'afspraken');
                                view = modAfspraken(mod(isAfspraak, 'toekenningen')(addItem(toekenning)))(view);
                            }
                        }
                    }

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        },
                        data: {
                            studiewijzerView: {
                                ...view
                            }
                        }
                    });
                }
            })
            .subscribe();
    }

    public exporteerToekenningen(toekenningIds: string[], abstractStudiewijzerIds: string[]) {
        return this.dataClient.mutate({
            mutation: ExporteerToekenningenUitStudiewijzerDocument,
            variables: {
                toekenningIds,
                abstractStudiewijzerIds
            }
        });
    }

    public createStudiewijzerCategorie(medewerkerUuid: string, schooljaar: number) {
        const studiewijzerOverzichtViewRes = this._cache.readQuery({
            query: StudiewijzerOverzichtViewDocument,
            variables: {
                schooljaar,
                medewerkerUuid
            }
        })!.studiewijzerOverzichtView;

        const newView = {
            ...studiewijzerOverzichtViewRes,
            categorieen: [
                {
                    __typename: 'StudiewijzerCategorie',
                    id: '-1',
                    naam: '',
                    studiewijzers: [],
                    inEditMode: true
                } as StudiewijzerCategorie,
                ...studiewijzerOverzichtViewRes.categorieen
            ]
        };

        this._cache.writeQuery({
            query: studiewijzerOverzichtView,
            variables: {
                schooljaar,
                medewerkerUuid
            },
            data: { studiewijzerOverzichtView: newView }
        });
    }

    public saveStudiewijzerCategorie(medewerkerUuid: string, schooljaar: number, categorie: StudiewijzerCategorie) {
        const categorieInput = {
            id: categorie.id === '-1' ? null : categorie.id,
            naam: categorie.naam,
            studiewijzers: categorie.studiewijzers.map((s) => s.uuid)
        };

        return this.dataClient
            .mutate({
                mutation: SaveStudiewijzerCategorieDocument,
                variables: {
                    categorie: categorieInput,
                    medewerkerUuid,
                    schooljaar
                },
                update: (cache, { data }) => {
                    let overzichtView = cache.readQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        }
                    })!.studiewijzerOverzichtView;

                    overzichtView = {
                        ...overzichtView,
                        categorieen: overzichtView.categorieen
                            .filter((_categorie) => _categorie.id !== '-1')
                            .map((_categorie) => {
                                if (_categorie.id === categorie.id) {
                                    _categorie = {
                                        ...categorie,
                                        naam: data!.saveStudiewijzerCategorie.naam,
                                        inEditMode: false
                                    };
                                }
                                return _categorie;
                            })
                    };

                    if (categorie.id === '-1') {
                        overzichtView = {
                            ...overzichtView,
                            categorieen: [
                                {
                                    id: data?.saveStudiewijzerCategorie.id,
                                    naam: data?.saveStudiewijzerCategorie.naam,
                                    studiewijzers: categorie.studiewijzers,
                                    inEditMode: false,
                                    __typename: 'StudiewijzerCategorie'
                                } as StudiewijzerCategorie,
                                ...overzichtView.categorieen
                            ]
                        };
                    }

                    cache.writeQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        },
                        data: { studiewijzerOverzichtView: overzichtView }
                    });
                }
            })
            .subscribe();
    }

    public setStudiewijzerCategorieEditMode(categorieId: string, value: boolean) {
        const id = `StudiewijzerCategorie:${categorieId}`;

        const categorieData = this._cache.readFragment<StudiewijzerCategorie>({
            id,
            fragment: studiewijzercategorieEditMode
        });

        this._cache.writeFragment({
            fragment: studiewijzercategorieEditMode,
            id,
            data: { ...categorieData, inEditMode: value }
        });
    }

    public removeEmptyStudiewijzerCategorieen(schooljaar: number, medewerkerUuid: string) {
        let studiewijzerOverzichtViewRes = this.dataClient.client.readQuery({
            query: StudiewijzerOverzichtViewDocument,
            variables: {
                schooljaar,
                medewerkerUuid
            }
        })!.studiewijzerOverzichtView;

        studiewijzerOverzichtViewRes = {
            ...studiewijzerOverzichtViewRes,
            categorieen: studiewijzerOverzichtViewRes.categorieen.filter((_categorie) => _categorie.id !== '-1')
        };

        this.dataClient.client.writeQuery({
            query: StudiewijzerOverzichtViewDocument,
            variables: {
                schooljaar,
                medewerkerUuid
            },
            data: { studiewijzerOverzichtView: studiewijzerOverzichtViewRes }
        });
    }

    public deleteStudiewijzerCategorie(medewerkerUuid: string, schooljaar: number, categorie: StudiewijzerCategorie) {
        return this.dataClient
            .mutate({
                mutation: DeleteStudiewijzerCategorieDocument,
                variables: {
                    categorieId: categorie.id,
                    medewerkerUuid,
                    schooljaar
                },
                update: (cache) => {
                    let overzichtView = cache.readQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        }
                    })!.studiewijzerOverzichtView;

                    const studiewijzers = [
                        ...overzichtView.studiewijzers,
                        ...overzichtView.categorieen.find((cat) => cat.id === categorie.id)!.studiewijzers
                    ];

                    overzichtView = {
                        ...overzichtView,
                        studiewijzers: sortLocale(studiewijzers, ['naam']),
                        categorieen: overzichtView.categorieen.filter((cat) => cat.id !== categorie.id)
                    };

                    cache.writeQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        },
                        data: { studiewijzerOverzichtView: overzichtView }
                    });
                }
            })
            .subscribe();
    }

    public moveStudiewijzerCategorie(movePosition: number, medewerkerUuid: string, schooljaar: number, categorie: StudiewijzerCategorie) {
        return this.dataClient
            .mutate({
                mutation: MoveStudiewijzerCategorieDocument,
                variables: {
                    movePosition,
                    categorieId: categorie.id,
                    schooljaar,
                    medewerkerUuid
                },
                update: (cache) => {
                    let overzichtView = cache.readQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        }
                    })!.studiewijzerOverzichtView;

                    const currentIndex = overzichtView.categorieen.findIndex((cat) => cat.id === categorie.id);
                    const movedCategorieen = moveItemInArray(
                        currentIndex,
                        Math.max(Math.min(currentIndex + movePosition, overzichtView.categorieen.length), 0),
                        overzichtView.categorieen
                    );

                    overzichtView = set('categorieen')(movedCategorieen)(overzichtView);

                    cache.writeQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        },
                        data: { studiewijzerOverzichtView: overzichtView }
                    });
                }
            })
            .subscribe();
    }

    public verplaatsStudiewijzer(
        medewerkerUuid: string,
        schooljaar: number,
        studiewijzer: Studiewijzer,
        vanCategorie: StudiewijzerCategorie,
        naarCategorie: StudiewijzerCategorie
    ) {
        return this.dataClient
            .mutate({
                mutation: VerplaatsStudiewijzerDocument,
                variables: {
                    medewerkerUuid,
                    schooljaar,
                    studiewijzerUuid: studiewijzer.uuid,
                    vanCategorie: vanCategorie ? vanCategorie.id : null,
                    naarCategorie: naarCategorie ? naarCategorie.id : null
                },
                optimisticResponse: { verplaatsStudiewijzer: true },
                update: (cache) => {
                    let overzichtView = cache.readQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            schooljaar,
                            medewerkerUuid
                        }
                    })!.studiewijzerOverzichtView;

                    const fromMod: any = vanCategorie
                        ? mod('categorieen', matching({ id: vanCategorie.id }), 'studiewijzers')
                        : mod('studiewijzers');
                    overzichtView = fromMod(removeItem(studiewijzer.id))(overzichtView);

                    const toMod: any = naarCategorie
                        ? set('categorieen', matching({ id: naarCategorie.id }), 'studiewijzers')
                        : set('studiewijzers');
                    const to = naarCategorie ? overzichtView.categorieen.find((cat) => cat.id === naarCategorie.id)! : overzichtView;
                    overzichtView = toMod(sortBy([...to.studiewijzers, studiewijzer], 'lesgroep.naam'))(overzichtView);

                    cache.writeQuery({
                        query: StudiewijzerOverzichtViewDocument,
                        variables: {
                            medewerkerUuid,
                            schooljaar
                        },
                        data: { studiewijzerOverzichtView: overzichtView }
                    });
                }
            })
            .subscribe();
    }

    public synchroniseerMetSjablonen(studiewijzerId: string, sjablonen: { sjabloonId: string; weeknummer: number }[]) {
        return this.dataClient.mutate({
            mutation: SynchroniseerMetSjablonenDocument,
            variables: {
                studiewijzerId,
                sjablonen
            },
            refetchQueries: [namedOperations.Query.studiewijzerView]
        });
    }

    public ontkoppelToekenning(toekenningId: string, refetchQueries?: string[]) {
        return this.dataClient.mutate({
            mutation: OntkoppelToekenningDocument,
            variables: {
                toekenningId
            },
            refetchQueries
        });
    }

    public getAfspraakToekenningenVoorLesgroepen(
        afspraakId: string,
        lesgroepVanStudiewijzer: string
    ): Observable<AfspraakToekenningenVoorLesgroepenQuery['afspraakToekenningenVoorLesgroepen']> {
        return this.dataClient
            .watchQuery({
                query: AfspraakToekenningenVoorLesgroepenDocument,
                variables: {
                    afspraakId,
                    lesgroepVanStudiewijzer
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.afspraakToekenningenVoorLesgroepen)
            );
    }

    public koppelToekenning(sjabloonId: string, toekenningId: string) {
        return this.dataClient.mutate({
            mutation: KoppelToekenningDocument,
            variables: {
                sjabloonId,
                toekenningId
            },
            refetchQueries: [namedOperations.Query.studiewijzerView]
        });
    }

    public verwijderToekenningDifferentiaties(toekenningId: string, isInleverperiode: boolean) {
        return this.dataClient
            .mutate({
                mutation: VerwijderToekenningDifferentiatiesDocument,
                variables: {
                    toekenningId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderToekenningDifferentiaties: true
                },
                update: (cache) => {
                    this.toekenningTypes.forEach((typename) => {
                        cache.modify({
                            id: cache.identify({ __typename: typename, id: toekenningId }),
                            fields: {
                                differentiatiegroepen: () => [] as Differentiatiegroep[],
                                differentiatieleerlingen: () => [] as Leerling[]
                            }
                        });

                        if (isInleverperiode) {
                            cache.modify({
                                id: cache.identify({ __typename: typename, id: toekenningId, isStartInleverperiode: true }),
                                fields: {
                                    differentiatiegroepen: () => [] as Differentiatiegroep[],
                                    differentiatieleerlingen: () => [] as Leerling[]
                                }
                            });
                        }
                    });
                }
            })
            .subscribe();
    }

    public getLeerlingenMetAccount(studiewijzer: Studiewijzer): Observable<LeerlingenMetAccountQuery['leerlingenMetAccount']> {
        return this.dataClient
            .query({
                query: LeerlingenMetAccountDocument,
                variables: { studiewijzerId: studiewijzer.id }
            })
            .pipe(map((result) => result.data.leerlingenMetAccount));
    }
}
