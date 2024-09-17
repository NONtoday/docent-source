import { Injectable, inject } from '@angular/core';
import { ApolloCache, Reference } from '@apollo/client/core';
import {
    AfspraakNaarAfspraakDocument,
    AfspraakNaarDagDocument,
    AfspraakNaarWeekDocument,
    AfspraakToekenning,
    DagNaarAfspraakDocument,
    DagNaarDagDocument,
    DagNaarWeekDocument,
    DagToekenning,
    RoosterDagenDocument,
    SjabloonViewDocument,
    SjabloonViewQuery,
    SjabloonWeek,
    SorteerSjabloonToekenningDocument,
    SorteerToekenningenDocument,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerViewDocument,
    StudiewijzerViewQuery,
    StudiewijzerWeek,
    Toekenning,
    ToekenningSortering,
    WeekNaarAfspraakDocument,
    WeekNaarDagDocument,
    WeekNaarWeekDocument,
    WeekToekenning
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { getISOWeek, getYear, isSameDay } from 'date-fns';
import { curry, get } from 'lodash-es';
import flatMap from 'lodash-es/flatMap';
import reject from 'lodash-es/reject';
import { all, matching, mod, set, updateAll } from 'shades';
import { toekenningFields } from '../../generated/_operations';
import {
    convertToAfspraakToekenningInput,
    convertToDagToekenningInput,
    convertToWeekToekenningInput,
    createAfspraakToekenningOptimisticResponse,
    createDagToekenningOptimisticResponse,
    createWeekToekenningOptimisticResponse
} from '../core/converters/toekenningen.converters';
import { DragDropData, StudiewijzerContent } from '../core/models/studiewijzers/studiewijzer.model';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { convertToLocalDate } from '../rooster-shared/utils/date.utils';
import { matchtAfspraak, matchtDag, removeItem } from '../rooster-shared/utils/utils';
import { insertInArray, moveItemInArray } from '../shared/utils/array.utils';
import { updateSortering } from '../shared/utils/toekenning.utils';

const identifyAfspraak = (id: string) => ({
    __typename: 'StudiewijzerAfspraak',
    afspraak: {
        id
    }
});

const insertAndSort = curry(<T>(index: number, item: T, array: Toekenning[]) => insertInArray(index, item, array).map(updateSortering));
const moveAndSort = curry((van: number, naar: number, array: Toekenning[]) => moveItemInArray(van, naar, array).map(updateSortering));

@Injectable({
    providedIn: 'root'
})
export class StudiewijzerDragDropDataService {
    private apollo = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);

    public afspraakNaarAfspraak(
        { abstractStudiewijzerId, lesgroepId, afkomst, toekenning, destAfspraakId, destinationDate, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstAfspraakId = (<StudiewijzerAfspraak>afkomst).afspraak.id;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: AfspraakNaarAfspraakDocument,
                variables: {
                    afspraakToekenning: convertToAfspraakToekenningInput(
                        toekenning as AfspraakToekenning,
                        abstractStudiewijzerId,
                        destinationDate,
                        null,
                        toekenningenSortering
                    ),
                    lesgroepId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    afspraakNaarAfspraak: {
                        ...createAfspraakToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex),
                        __typename: 'AfspraakToekenning'
                    }
                },
                refetchQueries: [
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear(destinationDate!),
                            week: getISOWeek(destinationDate!)
                        }
                    },
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear((<StudiewijzerAfspraak>afkomst).afspraak.begin),
                            week: getISOWeek((<StudiewijzerAfspraak>afkomst).afspraak.begin)
                        }
                    }
                ],
                update: (cache, response) => {
                    const nieuweToekenning = response.data!.afspraakNaarAfspraak;
                    // verwijder uit de oude afspraak
                    cache.modify({
                        id: cache.identify(identifyAfspraak(afkomstAfspraakId)),
                        fields: {
                            toekenningen: (toekenningen: Reference[], { readField }) =>
                                toekenningen.filter((tRef) => readField('id', tRef) !== toekenningId)
                        },
                        broadcast: false
                    });

                    const newToekenningCacheRef = cache.writeFragment({
                        data: {
                            ...nieuweToekenning,
                            isStartInleverperiode: false
                        },
                        fragment: toekenningFields,
                        fragmentName: 'toekenningFields'
                    });

                    // voeg toe aan de nieuwe afspraak
                    cache.modify({
                        id: cache.identify(identifyAfspraak(destAfspraakId!)),
                        fields: {
                            toekenningen: (toekenningen: Reference[]) => [...toekenningen, newToekenningCacheRef]
                        }
                    });
                }
            })
            .subscribe();
    }

    public dagNaarAfspraak(
        { abstractStudiewijzerId, lesgroepId, afkomst, toekenning, destAfspraakId, destinationDate, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstDag = (<StudiewijzerDag>afkomst).dag;
        const toekenningId = toekenning.id;

        let mutation: any;
        let variables;
        let mutationString: string;

        if ((<DagToekenning>toekenning).datum) {
            mutation = DagNaarAfspraakDocument;
            mutationString = 'dagNaarAfspraak';
            variables = {
                dagToekenning: convertToDagToekenningInput(
                    toekenning as DagToekenning,
                    abstractStudiewijzerId,
                    null,
                    null,
                    toekenningenSortering
                ),
                lesgroepId,
                datum: convertToLocalDate(destinationDate!)
            };
        }

        if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            mutation = AfspraakNaarAfspraakDocument;
            mutationString = 'afspraakNaarAfspraak';
            variables = {
                afspraakToekenning: convertToAfspraakToekenningInput(
                    toekenning as AfspraakToekenning,
                    abstractStudiewijzerId,
                    destinationDate,
                    null,
                    toekenningenSortering
                ),
                lesgroepId
            };
        }

        const optimisticResponse: any = {
            __typename: 'Mutation'
        };
        optimisticResponse[mutationString!] = {
            ...createAfspraakToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex),
            __typename: 'AfspraakToekenning'
        };

        /***
         * Omdat in een dag zowel dagtoekenningen als afspraaktoekenningen kunnen zitten (zwevend huiswerk/inleverperiodes uit oude data)
         * bepalen we hierboven welke mutation met bijhorende optimistic response er gedaan moet worden.
         */
        return this.apollo
            .mutate({
                mutation,
                variables,
                optimisticResponse,
                refetchQueries: [
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear(destinationDate!),
                            week: getISOWeek(destinationDate!)
                        }
                    }
                ],
                update: (cache, { data }) => {
                    const result = data[mutationString];
                    const newToekenning = { ...result, isStartInleverperiode: false } as Toekenning;
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        }
                    })!.studiewijzerView;

                    const zelfdeDag = curry((andereDag: Date, _dag: Date) => isSameDay(andereDag, _dag));
                    const removeFromDag = mod(
                        'weken',
                        all(),
                        'dagen',
                        matching({ dag: zelfdeDag(afkomstDag) }),
                        'toekenningen'
                    )(removeItem(toekenningId));

                    const addToAfspraak = mod(
                        'weken',
                        all(),
                        'dagen',
                        all(),
                        'afspraken',
                        matchtAfspraak(destAfspraakId!)
                    )((sw: StudiewijzerViewQuery['studiewijzerView']['weken'][number]['dagen'][number]['afspraken'][number]) => ({
                        ...sw,
                        toekenningen: insertInArray(toekenningIndex, newToekenning, sw.toekenningen).map(updateSortering as any)
                    }));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromDag, addToAfspraak)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public weekNaarAfspraak(
        { abstractStudiewijzerId, afkomst, toekenning, destAfspraakId, destinationDate, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstWeeknummer = (<StudiewijzerWeek>afkomst).weeknummer;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: WeekNaarAfspraakDocument,
                variables: {
                    weekToekenning: convertToWeekToekenningInput(
                        toekenning as WeekToekenning,
                        abstractStudiewijzerId,
                        null,
                        toekenningenSortering
                    ),
                    datum: convertToLocalDate(destinationDate!) as any
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    weekNaarAfspraak: {
                        ...createAfspraakToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex),
                        __typename: 'AfspraakToekenning'
                    }
                },
                refetchQueries: [
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear(destinationDate!),
                            week: getISOWeek(destinationDate!)
                        }
                    }
                ],
                update: (cache, { data }) => {
                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);
                    const newToekenning = { ...data?.weekNaarAfspraak, isStartInleverperiode: false };

                    const removeFromWeek = mod(
                        'weken',
                        matching({ weeknummer: afkomstWeeknummer }),
                        'toekenningen'
                    )(removeItem(toekenningId));

                    const addToAfspraak = mod(
                        'weken',
                        all(),
                        'dagen',
                        all(),
                        'afspraken',
                        matchtAfspraak(destAfspraakId!)
                    )((sw: StudiewijzerViewQuery['studiewijzerView']['weken'][number]['dagen'][number]['afspraken'][number]) => ({
                        ...sw,
                        toekenningen: insertInArray(toekenningIndex, newToekenning, sw.toekenningen).map(updateSortering as any)
                    }));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromWeek, addToAfspraak)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public afspraakNaarDag(
        { abstractStudiewijzerId, lesgroepId, afkomst, toekenning, destinationDate, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const destDagLocalDate = convertToLocalDate(destinationDate!);
        const afkomstAfspraakId = (<StudiewijzerAfspraak>afkomst).afspraak.id;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: AfspraakNaarDagDocument,
                variables: {
                    afspraakToekenning: convertToAfspraakToekenningInput(
                        toekenning as AfspraakToekenning,
                        abstractStudiewijzerId,
                        destinationDate,
                        null,
                        toekenningenSortering
                    ),
                    lesgroepId,
                    dag: destDagLocalDate as any
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    afspraakNaarDag: {
                        ...createDagToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex),
                        __typename: 'DagToekenning'
                    }
                },
                refetchQueries: [
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear((<StudiewijzerAfspraak>afkomst).afspraak.begin),
                            week: getISOWeek((<StudiewijzerAfspraak>afkomst).afspraak.begin)
                        }
                    }
                ],
                update: (cache, { data }) => {
                    cache.modify({
                        id: cache.identify(identifyAfspraak(afkomstAfspraakId)),
                        fields: {
                            toekenningen: (toekenningen: Reference[], { readField }) =>
                                toekenningen.filter((tRef) => readField('id', tRef) !== toekenningId)
                        }
                    });

                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);
                    const newToekenning = { ...data?.afspraakNaarDag, isStartInleverperiode: false };

                    view = mod(
                        'weken',
                        all(),
                        'dagen',
                        matchtDag(destinationDate!),
                        'toekenningen'
                    )(insertAndSort(toekenningIndex, newToekenning))(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public dagNaarDag(
        {
            abstractStudiewijzerId,
            lesgroepId,
            afkomst,
            toekenning,
            destinationDate,
            isStartInleverperiode,
            inleverperiodeWijziging,
            toekenningIndex
        }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstDag = (<StudiewijzerDag>afkomst).dag;
        const toekenningId = toekenning.id;

        let mutation: any;
        let variables: any;
        let mutationString: string;

        if ((<DagToekenning>toekenning).datum) {
            mutationString = 'dagNaarDag';
            mutation = DagNaarDagDocument;
            variables = {
                dagToekenning: convertToDagToekenningInput(
                    toekenning as DagToekenning,
                    abstractStudiewijzerId,
                    destinationDate,
                    get(inleverperiodeWijziging, 'nieuweDatums'),
                    toekenningenSortering
                ),
                lesgroepId
            };
        }

        if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            mutationString = 'afspraakNaarDag';
            mutation = AfspraakNaarDagDocument;
            variables = {
                afspraakToekenning: convertToAfspraakToekenningInput(
                    toekenning as AfspraakToekenning,
                    abstractStudiewijzerId,
                    null,
                    get(inleverperiodeWijziging, 'nieuweDatums'),
                    toekenningenSortering
                ),
                dag: convertToLocalDate(destinationDate!),
                lesgroepId
            };
        }

        const optimisticResponse: any = {
            __typename: 'Mutation'
        };
        optimisticResponse[mutationString!] = {
            ...createDagToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex, inleverperiodeWijziging),
            __typename: 'DagToekenning'
        };

        return this.apollo
            .mutate({
                mutation,
                variables,
                optimisticResponse,
                update: (cache, { data }) => {
                    let nieuweToekenning = { ...data[mutationString] };

                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);

                    const dagen = flatMap(view.weken, (w) => w.dagen);

                    const originDag = dagen.find((dag) => isSameDay(dag.dag, afkomstDag));
                    const modOrigin = mod('weken', all(), 'dagen', matchtDag(afkomstDag), 'toekenningen');
                    const modDestination = mod('weken', all(), 'dagen', matchtDag(destinationDate!), 'toekenningen');

                    const meerdereToekenningenOpDezelfdeDag = originDag!.toekenningen.filter((item) => item.id === toekenningId).length > 1;

                    if (meerdereToekenningenOpDezelfdeDag) {
                        // verwijder start of eind toekenning uit de oude dag
                        // we willen de gesleepte inleverperiode toekenning verwijderen uit de dag,
                        // dus verwijderen we alle toekenningen weg met hetzelfde id en isStart.
                        view = modOrigin(
                            (toekenningen: StudiewijzerViewQuery['studiewijzerView']['weken'][number]['dagen'][number]['toekenningen']) =>
                                reject(
                                    toekenningen,
                                    (item) => item.id === toekenningId && item.isStartInleverperiode === isStartInleverperiode
                                )
                        )(view);
                    } else {
                        // verwijder toekenning uit de oude dag
                        view = modOrigin(removeItem(toekenningId))(view);
                    }
                    if (nieuweToekenning.studiewijzeritem.inleverperiode) {
                        const originalInleverperiode = toekenning.studiewijzeritem.inleverperiode;

                        nieuweToekenning = updateAll<any>(
                            set('isStartInleverperiode')(isStartInleverperiode),
                            set('studiewijzeritem', 'inleverperiode', 'inleveringenAantal')(originalInleverperiode!.inleveringenAantal),
                            set('studiewijzeritem', 'inleverperiode', 'inleveringenVerwacht')(originalInleverperiode!.inleveringenVerwacht)
                        )(nieuweToekenning);

                        const bijhorendeIsStart = !isStartInleverperiode;
                        const nieuweStart = inleverperiodeWijziging!.nieuweDatums.start;
                        const nieuwEind = inleverperiodeWijziging!.nieuweDatums.eind;

                        const nieuweBijhorendeToekenning = {
                            ...nieuweToekenning,
                            datum: bijhorendeIsStart ? nieuweStart : nieuwEind,
                            isStartInleverperiode: bijhorendeIsStart
                        };

                        // begin van de inleverperiode versleept
                        if (isStartInleverperiode) {
                            const deadlineDag = dagen.find((dag) => isSameDay(dag.dag, inleverperiodeWijziging!.oudeDatums.eind));
                            const modDeadlineDag = mod(
                                'weken',
                                all(),
                                'dagen',
                                matchtDag(inleverperiodeWijziging!.oudeDatums.eind),
                                'toekenningen'
                            );
                            if (deadlineDag) {
                                // wanneer de deadline ook is verplaatst, stop hem dan in de nieuwe dag, anders terug in zijn oude
                                if (inleverperiodeWijziging!.deadlineVerplaatst) {
                                    const updateDeadlineDag = modDeadlineDag(
                                        (
                                            toekenningen: StudiewijzerViewQuery['studiewijzerView']['weken'][number]['dagen'][number]['toekenningen']
                                        ) => reject(toekenningen, (item) => item.id === toekenningId && !item.isStartInleverperiode)
                                    );

                                    const updateDestination = modDestination(insertInArray(toekenningIndex, nieuweBijhorendeToekenning));

                                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(updateDeadlineDag, updateDestination)(view);
                                } else {
                                    view = modDeadlineDag(
                                        set(matching({ id: toekenningId, isStartInleverperiode: false }))(nieuweBijhorendeToekenning)
                                    )(view);
                                }
                            } else {
                                // Bijvoorbeeld als het vorige einde in het weekend was.
                                view = mod(
                                    'weken',
                                    all(),
                                    'dagen',
                                    matchtDag(nieuweToekenning.studiewijzeritem.inleverperiode.eind),
                                    'toekenningen'
                                )(insertInArray(toekenningIndex, nieuweBijhorendeToekenning))(view);
                            }
                        } else {
                            // eind van de inleverperiode versleept
                            const startDag = dagen.find((dag) => isSameDay(dag.dag, inleverperiodeWijziging!.oudeDatums.start));
                            const modStartDag = mod(
                                'weken',
                                all(),
                                'dagen',
                                matchtDag(inleverperiodeWijziging!.oudeDatums.start),
                                'toekenningen'
                            );
                            if (startDag) {
                                // wanneer de start ook is verplaatst, stop hem dan in de nieuwe dag, anders terug in zijn oude
                                if (inleverperiodeWijziging!.startVerplaatst) {
                                    const updateStartDag = modStartDag((toekenningen: Toekenning[]) =>
                                        reject(toekenningen, (item) => item.id === toekenningId && item.isStartInleverperiode)
                                    );
                                    const updateDestDag = modDestination(insertInArray(toekenningIndex, nieuweBijhorendeToekenning));
                                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(updateStartDag as any, updateDestDag)(view);
                                } else {
                                    view = modStartDag(
                                        set(matching({ id: toekenningId, isStartInleverperiode: true }))(nieuweBijhorendeToekenning)
                                    )(view);
                                }
                            } else {
                                // Bijvoorbeeld als de vorige start in het weekend was.
                                view = mod(
                                    'weken',
                                    all(),
                                    'dagen',
                                    matchtDag(nieuweToekenning.studiewijzeritem.inleverperiode.begin),
                                    'toekenningen'
                                )(insertInArray(toekenningIndex, nieuweBijhorendeToekenning))(view);
                            }
                        }
                    } else {
                        nieuweToekenning = set('isStartInleverperiode')(false)(nieuweToekenning);
                    }

                    // voeg toekenning toe aan de nieuwe dag
                    view = modDestination(insertAndSort(toekenningIndex, nieuweToekenning))(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public weekNaarDag(
        { abstractStudiewijzerId, afkomst, toekenning, destinationDate, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const destDagLocalDate = convertToLocalDate(destinationDate!);
        const afkomstWeeknummer = (<StudiewijzerWeek>afkomst).weeknummer;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: WeekNaarDagDocument,
                variables: {
                    weekToekenning: convertToWeekToekenningInput(
                        toekenning as WeekToekenning,
                        abstractStudiewijzerId,
                        null,
                        toekenningenSortering
                    ),
                    dag: destDagLocalDate as any
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    weekNaarDag: {
                        ...createDagToekenningOptimisticResponse(toekenning, destinationDate, toekenningIndex),
                        __typename: 'DagToekenning'
                    }
                },
                update: (cache, { data }) => {
                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);

                    const newToekenning = { ...data?.weekNaarDag, isStartInleverperiode: false };
                    const removeFromWeek = mod(
                        'weken',
                        matching({ weeknummer: afkomstWeeknummer }),
                        'toekenningen'
                    )(removeItem(toekenningId));
                    const addToDag = mod(
                        'weken',
                        all(),
                        'dagen',
                        matchtDag(destinationDate!),
                        'toekenningen'
                    )(insertAndSort(toekenningIndex, newToekenning));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromWeek, addToDag)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public afspraakNaarWeek(
        { abstractStudiewijzerId, lesgroepId, afkomst, toekenning, destWeeknummer, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstAfspraakId = (<StudiewijzerAfspraak>afkomst).afspraak.id;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: AfspraakNaarWeekDocument,
                variables: {
                    afspraakToekenning: convertToAfspraakToekenningInput(
                        toekenning as AfspraakToekenning,
                        abstractStudiewijzerId,
                        null,
                        null,
                        toekenningenSortering
                    ),
                    lesgroepId,
                    weeknummer: destWeeknummer
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    afspraakNaarWeek: {
                        ...createWeekToekenningOptimisticResponse(toekenning, destWeeknummer, toekenningIndex),
                        __typename: 'WeekToekenning'
                    }
                },
                refetchQueries: [
                    {
                        query: RoosterDagenDocument,
                        variables: {
                            medewerkerId: this.medewerkerDataService.medewerkerId,
                            jaar: getYear((<StudiewijzerAfspraak>afkomst).afspraak.begin),
                            week: getISOWeek((<StudiewijzerAfspraak>afkomst).afspraak.begin)
                        }
                    }
                ],
                update: (cache, { data }) => {
                    cache.modify({
                        id: cache.identify(identifyAfspraak(afkomstAfspraakId)),
                        fields: {
                            toekenningen: (toekenningen: Reference[], { readField }) =>
                                toekenningen.filter((tRef) => readField('id', tRef) !== toekenningId)
                        }
                    });

                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);

                    const newToekenning = { ...data?.afspraakNaarWeek, isStartInleverperiode: false };
                    view = mod(
                        'weken',
                        matching({ weeknummer: destWeeknummer }),
                        'toekenningen'
                    )(insertAndSort(toekenningIndex, newToekenning))(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public dagNaarWeek(
        { abstractStudiewijzerId, lesgroepId, afkomst, toekenning, destWeeknummer, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstDag = (<StudiewijzerDag>afkomst).dag;
        const toekenningId = toekenning.id;

        let mutation: any;
        let mutationString: string;
        let variables = {
            lesgroepId,
            weeknummer: destWeeknummer
        };

        if ((<DagToekenning>toekenning).datum) {
            mutationString = 'dagNaarWeek';
            mutation = DagNaarWeekDocument;
            variables = Object.assign(
                {},
                { ...variables },
                {
                    dagToekenning: convertToDagToekenningInput(
                        toekenning as DagToekenning,
                        abstractStudiewijzerId,
                        null,
                        null,
                        toekenningenSortering
                    )
                }
            );
        }

        if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            mutationString = 'afspraakNaarWeek';
            mutation = AfspraakNaarWeekDocument;
            variables = Object.assign(
                {},
                { ...variables },
                {
                    afspraakToekenning: convertToAfspraakToekenningInput(
                        toekenning as AfspraakToekenning,
                        abstractStudiewijzerId,
                        null,
                        null,
                        toekenningenSortering
                    )
                }
            );
        }

        const optimisticResponse: any = {
            __typename: 'Mutation'
        };
        optimisticResponse[mutationString!] = {
            ...createWeekToekenningOptimisticResponse(toekenning, destWeeknummer, toekenningIndex),
            __typename: 'WeekToekenning'
        };

        return this.apollo
            .mutate({
                mutation,
                variables,
                optimisticResponse,
                update: (cache, { data }) => {
                    const nieuweToekenning = data[mutationString];
                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);

                    const newToekenning = { ...nieuweToekenning, isStartInleverperiode: false };
                    const removeFromDag = mod('weken', all(), 'dagen', matchtDag(afkomstDag), 'toekenningen')(removeItem(toekenningId));
                    const addToWeek = mod(
                        'weken',
                        matching({ weeknummer: destWeeknummer }),
                        'toekenningen'
                    )(insertAndSort(toekenningIndex, newToekenning));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromDag, addToWeek)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public sjabloonNaarWeek(
        {
            abstractStudiewijzerId,
            afkomst,
            toekenning,
            destWeeknummer,
            toekenningIndex,
            conceptInleveropdrachtWijziging: wijziging
        }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstWeeknummer = (<SjabloonWeek>afkomst).weeknummer;

        return this.apollo
            .mutate({
                mutation: WeekNaarWeekDocument,
                variables: {
                    weekToekenning: convertToWeekToekenningInput(
                        toekenning as WeekToekenning,
                        abstractStudiewijzerId,
                        destWeeknummer,
                        toekenningenSortering
                    )
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    weekNaarWeek: {
                        ...createWeekToekenningOptimisticResponse(toekenning, destWeeknummer, toekenningIndex),
                        __typename: 'WeekToekenning'
                    }
                },
                update: (cache, { data }) => {
                    let view = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: abstractStudiewijzerId
                        }
                    })!.sjabloonView;

                    // we verplaatsen eerste de versleepte toekenning naar de nieuwe week.
                    const versleepteToekenningDestinationWeekComponent = this.findWeek(view, destWeeknummer!);
                    view = this.verplaatsToekenningNaarWeek(
                        view,
                        data!.weekNaarWeek,
                        !!toekenning.isStartInleverperiode,
                        this.findWeek(view, afkomstWeeknummer)!,
                        versleepteToekenningDestinationWeekComponent!,
                        toekenningIndex,
                        !!toekenning.studiewijzeritem.conceptInleveropdracht
                    );

                    if (toekenning.studiewijzeritem.conceptInleveropdracht) {
                        // De bijhorende toekenning moet ook geupdate worden, dus zoeken we het weeknummer op waar deze in staat.
                        const andereToekenningWeekNummer = wijziging?.startVerplaatst ? wijziging.oudeWeekEind : wijziging?.oudeWeekStart;
                        const startVoorEindGesleept = toekenning.isStartInleverperiode && destWeeknummer! > wijziging!.oudeWeekEind;
                        const eindVoorStartGesleept = !toekenning.isStartInleverperiode && destWeeknummer! < wijziging!.oudeWeekStart;

                        // kijken of de andere toekenning ook verplaatst moet worden, ofdat die moet blijven staan.
                        const andereToekenningDestinationWeekNummer =
                            startVoorEindGesleept || eindVoorStartGesleept ? destWeeknummer : andereToekenningWeekNummer;
                        const andereToekenningIndex = startVoorEindGesleept || eindVoorStartGesleept ? toekenningIndex! + 1 : undefined;

                        // updaten en mogelijk verplaatsen de bijhorende toekenning
                        view = this.verplaatsToekenningNaarWeek(
                            view,
                            data!.weekNaarWeek,
                            !toekenning.isStartInleverperiode,
                            this.findWeek(view, andereToekenningWeekNummer!)!,
                            this.findWeek(view, andereToekenningDestinationWeekNummer!)!,
                            andereToekenningIndex,
                            true
                        );
                    }

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: abstractStudiewijzerId
                        },
                        data: { sjabloonView: view }
                    });
                }
            })
            .subscribe();
    }

    public weekNaarWeek(
        { abstractStudiewijzerId, afkomst, toekenning, destWeeknummer, toekenningIndex }: DragDropData,
        toekenningenSortering: ToekenningSortering[]
    ) {
        const afkomstWeeknummer = (<StudiewijzerWeek>afkomst).weeknummer;
        const toekenningId = toekenning.id;

        return this.apollo
            .mutate({
                mutation: WeekNaarWeekDocument,
                variables: {
                    weekToekenning: convertToWeekToekenningInput(
                        toekenning as WeekToekenning,
                        abstractStudiewijzerId,
                        destWeeknummer,
                        toekenningenSortering
                    )
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    weekNaarWeek: {
                        ...createWeekToekenningOptimisticResponse(toekenning, destWeeknummer, toekenningIndex),
                        __typename: 'WeekToekenning'
                    }
                },
                update: (cache, { data }) => {
                    let view = this.readStudiewijzerViewFromStore(cache, abstractStudiewijzerId);

                    const newToekenning = { ...data?.weekNaarWeek, isStartInleverperiode: false };
                    const removeFromWeek = mod(
                        'weken',
                        matching({ weeknummer: afkomstWeeknummer }),
                        'toekenningen'
                    )(removeItem(toekenningId));
                    const addToWeek = mod(
                        'weken',
                        matching({ weeknummer: destWeeknummer }),
                        'toekenningen'
                    )(insertAndSort(toekenningIndex, newToekenning));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(removeFromWeek, addToWeek)(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: abstractStudiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    public sorteerToekenningen(
        studiewijzerId: string,
        container: StudiewijzerContent,
        vanIndex: number,
        naarIndex: number,
        toekenningenSortering: ToekenningSortering[],
        suffix: string
    ) {
        return this.apollo
            .mutate({
                mutation: SorteerToekenningenDocument,
                variables: {
                    toekenningenSortering,
                    suffix
                },
                optimisticResponse: { sorteerToekenningen: true },
                update: (cache) => {
                    let view = this.readStudiewijzerViewFromStore(cache, studiewijzerId);

                    if ((<StudiewijzerWeek>container).weeknummer) {
                        const weeknummer = (<StudiewijzerWeek>container).weeknummer;
                        view = mod('weken', matching({ weeknummer }), 'toekenningen')(moveAndSort(vanIndex, naarIndex) as any)(view);
                    } else if ((<StudiewijzerDag>container).dag) {
                        const dag = (<StudiewijzerDag>container).dag;
                        view = mod('weken', all(), 'dagen', matchtDag(dag), 'toekenningen')(moveAndSort(vanIndex, naarIndex) as any)(view);
                    } else {
                        const beginAfspraak = (<StudiewijzerAfspraak>container).afspraak.begin;
                        const afspraakId = (<StudiewijzerAfspraak>container).afspraak.id;
                        view = mod(
                            'weken',
                            all(),
                            'dagen',
                            matchtDag(beginAfspraak),
                            'afspraken',
                            matchtAfspraak(afspraakId)
                        )(mod('toekenningen')(moveAndSort(vanIndex, naarIndex)))(view);
                    }

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        },
                        data: { studiewijzerView: view }
                    });
                }
            })
            .subscribe();
    }

    private readStudiewijzerViewFromStore<T>(cache: ApolloCache<T>, studiewijzerId: string) {
        return cache.readQuery({
            query: StudiewijzerViewDocument,
            variables: {
                studiewijzer: studiewijzerId
            }
        })!.studiewijzerView;
    }

    public sorteerSjabloonToekenning(
        sjabloonId: string,
        weeknummer: number,
        vanIndex: number,
        naarIndex: number,
        toekenningenSortering: ToekenningSortering[]
    ) {
        return this.apollo
            .mutate({
                mutation: SorteerSjabloonToekenningDocument,
                variables: {
                    toekenningenSortering,
                    suffix: 'studiewijzeritemweektoekenningen'
                },
                optimisticResponse: { sorteerToekenningen: true },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        }
                    })!.sjabloonView;

                    view = mod('weken', matching({ weeknummer }), 'toekenningen')(moveAndSort(vanIndex, naarIndex) as any)(view);

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        },
                        data: { sjabloonView: view }
                    });
                }
            })
            .subscribe();
    }

    private findWeek = (sjabloonView: SjabloonViewQuery['sjabloonView'], week: number) =>
        sjabloonView.weken.find((w) => w.weeknummer === week);

    private verplaatsToekenningNaarWeek(
        view: SjabloonViewQuery['sjabloonView'],
        toekenning: SjabloonViewQuery['sjabloonView']['weken'][number]['toekenningen'][number],
        isStart: boolean,
        origin: SjabloonViewQuery['sjabloonView']['weken'][number],
        destination: SjabloonViewQuery['sjabloonView']['weken'][number],
        index?: number,
        isInleveropdracht = false
    ) {
        const newIndex = index
            ? index
            : origin.toekenningen.findIndex((t) => t.id === toekenning.id && isStart === Boolean(t.isStartInleverperiode));
        const newToekenning = isInleveropdracht
            ? {
                  ...toekenning,
                  isStartInleverperiode: isStart
              }
            : { ...toekenning, isStartInleverperiode: false };

        const isDeToekenning = (t: Toekenning) => t.id === toekenning.id && isStart === Boolean(t.isStartInleverperiode);

        const removeFromWeek = mod(
            'weken',
            matching({ weeknummer: origin.weeknummer }),
            'toekenningen'
        )((toekenningen: SjabloonViewQuery['sjabloonView']['weken'][number]['toekenningen']) => reject(toekenningen, isDeToekenning));

        const addToWeek = mod(
            'weken',
            matching({ weeknummer: destination.weeknummer }),
            'toekenningen'
        )(insertAndSort(newIndex, newToekenning));

        return updateAll<SjabloonViewQuery['sjabloonView']>(removeFromWeek, addToWeek)(view);
    }
}
