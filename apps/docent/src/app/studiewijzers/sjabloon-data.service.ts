import { Injectable, inject } from '@angular/core';
import { ApolloCache, Reference, WatchQueryFetchPolicy } from '@apollo/client/core';
import {
    AddLabelToSjabloonWeekDocument,
    CategorieEditModeFragmentDoc,
    CategorieFieldsFragmentDoc,
    DagToekenning,
    DeleteSjabloonCategorieDocument,
    DeleteSjabloonDocument,
    DupliceerToekenningInSjabloonDocument,
    ExporteerToekenningenUitSjabloonDocument,
    GesynchroniseerdeLesgroepenDocument,
    GesynchroniseerdeLesgroepenQuery,
    KopieerSjabloonDocument,
    KopieerToekenningenNaarSjabloonDocument,
    MoveSjabloonCategorieDocument,
    OntkoppelStudiewijzersVanSjablonenDocument,
    OntkoppelVanSjabloonDocument,
    RemoveLabelFromSjabloonWeekDocument,
    SaveSjabloonCategorieDocument,
    SaveSjabloonDocument,
    SaveSjabloonMutation,
    SaveSjabloonVanuitDetailDocument,
    SaveWeekToekenning2Document,
    SjablonenGekoppeldAanOudeStudiewijzersDocument,
    SjablonenGekoppeldAanOudeStudiewijzersQuery,
    Sjabloon,
    SjabloonCategorie,
    SjabloonDocument,
    SjabloonFieldsFragment,
    SjabloonIsNieuwFragmentDoc,
    SjabloonOverzichtViewDocument,
    SjabloonOverzichtViewQuery,
    SjabloonViewDocument,
    SjabloonViewQuery,
    Studiewijzer,
    SynchroniseerMetSjabloonDocument,
    Vaksectie,
    VaksectiesDocument,
    VaksectiesQuery,
    VerplaatsSjabloonDocument,
    VerschuifSjabloonContentDocument,
    VerschuifSjabloonPlanningDocument,
    VerwijderToekenningDocument,
    WeekToekenning,
    namedOperations
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { curry, flatMap } from 'lodash-es';
import orderBy from 'lodash-es/orderBy';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { all, get, into, matching, mod, not, set, filter as shadesFilter, updateAll } from 'shades';
import { convertToWeekToekenningInput } from '../core/converters/toekenningen.converters';
import { EditAction } from '../core/models/shared.model';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { Optional, addItem, addToFront, equalsId, removeItem, sortLocale } from '../rooster-shared/utils/utils';
import { moveItemInArray } from '../shared/utils/array.utils';
import { getHoogsteToekenningSortering } from '../shared/utils/toekenning.utils';
import { PlanningVerschuifDirection } from './verschuif-planning-popup/verschuif-planning-popup.component';

const hasItemWithId = curry((id: string, items: any[]) => items.some(equalsId(id)));
const sorteerSjablonenOpNaam = (sjablonen: SjabloonOverzichtViewQuery['sjabloonOverzichtView'][number]['sjablonen']) =>
    sortLocale(sjablonen, ['naam']);
const addSjabloonEnSorteer = curry(
    (
        sjabloon: SjabloonOverzichtViewQuery['sjabloonOverzichtView'][number]['sjablonen'][number],
        sjablonen: SjabloonOverzichtViewQuery['sjabloonOverzichtView'][number]['sjablonen']
    ) => sorteerSjablonenOpNaam([...sjablonen, sjabloon])
);
const bevatSjabloon = (id: string) => ({ sjablonen: hasItemWithId(id) });
const bevatToekenning = (id: string) => ({ toekenningen: hasItemWithId(id) });

@Injectable({
    providedIn: 'root'
})
export class SjabloonDataService {
    private dataClient = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);
    private _cache: ApolloCache<any>;

    constructor() {
        this._cache = this.dataClient.client.cache;
    }

    public getVaksecties(): Observable<VaksectiesQuery['vaksecties']> {
        return this.dataClient
            .query({
                query: VaksectiesDocument
            })
            .pipe(map((result) => result.data.vaksecties));
    }

    public getSjabloonOverzichtView(
        medewerkerUuid: string,
        fetchPolicy: WatchQueryFetchPolicy = 'cache-first'
    ): Observable<SjabloonOverzichtViewQuery['sjabloonOverzichtView']> {
        return this.dataClient
            .watchQuery({
                query: SjabloonOverzichtViewDocument,
                variables: {
                    medewerkerUuid
                },
                fetchPolicy,
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.sjabloonOverzichtView)
            );
    }

    public getSjabloon(sjabloonId: string) {
        return this.dataClient
            .watchQuery({
                query: SjabloonDocument,
                variables: {
                    id: sjabloonId
                }
            })
            .valueChanges.pipe(
                map((result) => {
                    if (result.data) {
                        return result.data.sjabloon;
                    }
                })
            );
    }

    public getSjabloonView(sjabloonId: string): Observable<SjabloonViewQuery['sjabloonView']> {
        return this.dataClient
            .watchQuery({
                query: SjabloonViewDocument,
                variables: {
                    sjabloon: sjabloonId
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.sjabloonView)
            );
    }

    public getSjablonenGekoppeldAanOudeStudiewijzers(): Observable<
        SjablonenGekoppeldAanOudeStudiewijzersQuery['sjablonenGekoppeldAanOudeStudiewijzers']
    > {
        return this.dataClient
            .watchQuery({
                query: SjablonenGekoppeldAanOudeStudiewijzersDocument,
                fetchPolicy: 'network-only',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.sjablonenGekoppeldAanOudeStudiewijzers)
            );
    }

    public getGesynchroniseerdeLesgroepen(sjabloon: string): Observable<GesynchroniseerdeLesgroepenQuery['gesynchroniseerdeLesgroepen']> {
        return this.dataClient
            .watchQuery({
                query: GesynchroniseerdeLesgroepenDocument,
                variables: {
                    sjabloon
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.gesynchroniseerdeLesgroepen)
            );
    }

    public ontkoppelStudiewijzersVanSjablonen(sjabloonIds: string[], isDetail?: boolean) {
        return this.dataClient
            .mutate({
                mutation: OntkoppelStudiewijzersVanSjablonenDocument,
                variables: {
                    sjabloonIds
                },
                refetchQueries: isDetail
                    ? [
                          {
                              // Query is zelf uitgeschreven om te voorkomen dat de vorige query met
                              // 'cache-and-network' uitgevoerd wordt, aangezien het eerste resultaat
                              // niet anders is wordt anders dezelfde popup nog een keer geopend.
                              query: SjabloonViewDocument,
                              variables: {
                                  sjabloon: sjabloonIds[0]
                              }
                          }
                      ]
                    : [namedOperations.Query.sjabloonOverzichtView]
            })
            .subscribe();
    }

    public createSjabloonCategorie(medewerkerUuid: string, vaksectieUuid: string) {
        const sjabloonOverzichtViewRes = this._cache.readQuery({
            query: SjabloonOverzichtViewDocument,
            variables: {
                medewerkerUuid
            }
        })!.sjabloonOverzichtView;

        const heeftVaksectieUuid = into({ vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === vaksectieUuid });
        const nieuweCategorie = {
            __typename: 'SjabloonCategorie',
            id: '-1',
            naam: '',
            sjablonen: [],
            vaksectieUuid,
            inEditMode: true
        } as SjabloonCategorie;

        const newView = mod(matching(heeftVaksectieUuid), 'categorieen')(addToFront(nieuweCategorie))(sjabloonOverzichtViewRes);
        this._cache.writeQuery({
            query: SjabloonOverzichtViewDocument,
            variables: {
                medewerkerUuid
            },
            data: { sjabloonOverzichtView: newView }
        });
    }

    public setSjabloonCategorieEditMode(categorieId: string, value: boolean) {
        const id = `SjabloonCategorie:${categorieId}`;

        const categorieData = this._cache.readFragment({
            id,
            fragment: CategorieEditModeFragmentDoc
        })!;

        this._cache.writeFragment({
            fragment: CategorieEditModeFragmentDoc,
            id,
            data: { ...categorieData, inEditMode: value }
        });
    }

    public removeEmptySjabloonCategorieen(medewerkerUuid: string) {
        const sjabloonOverzichtViewRes = this.dataClient.client.readQuery({
            query: SjabloonOverzichtViewDocument,
            variables: {
                medewerkerUuid
            }
        })!.sjabloonOverzichtView;

        const newView = sjabloonOverzichtViewRes.map((view) => ({
            ...view,
            categorieen: view.categorieen.filter((_categorie) => _categorie.id !== '-1')
        }));

        this.dataClient.client.writeQuery({
            query: SjabloonOverzichtViewDocument,
            variables: {
                medewerkerUuid
            },
            data: { sjabloonOverzichtView: newView }
        });
    }

    public saveSjabloonCategorie(medewerkerUuid: string, categorie: SjabloonCategorie) {
        const categorieInput = {
            id: categorie.id === '-1' ? null : categorie.id,
            vaksectieUuid: categorie.vaksectieUuid,
            naam: categorie.naam,
            sjablonen: categorie.sjablonen.map((c) => c.uuid)
        };

        return this.dataClient
            .mutate({
                mutation: SaveSjabloonCategorieDocument,
                variables: {
                    categorie: categorieInput,
                    medewerkerUuid
                },
                update: (cache, { data }) => {
                    const isNewCategorie = categorie.id === '-1';

                    if (isNewCategorie) {
                        const viewToUpdate = {
                            __typename: 'VaksectieView',
                            vaksectie: {
                                uuid: categorie.vaksectieUuid
                            }
                        };

                        const newCategorie = {
                            id: data?.saveSjabloonCategorie.id,
                            vaksectieUuid: data?.saveSjabloonCategorie.vaksectieUuid,
                            naam: data?.saveSjabloonCategorie.naam,
                            sjablonen: categorie.sjablonen,
                            inEditMode: false,
                            __typename: 'SjabloonCategorie'
                        } as SjabloonCategorie;

                        const newCategorieCacheRef = cache.writeFragment({
                            data: newCategorie,
                            fragment: CategorieFieldsFragmentDoc,
                            fragmentName: 'categorieFields'
                        });

                        cache.modify({
                            id: cache.identify(viewToUpdate),
                            fields: {
                                categorieen: (existingRefs: Reference[], { readField }) => [
                                    newCategorieCacheRef,
                                    ...existingRefs.filter((ref) => readField('id', ref) !== '-1')
                                ]
                            }
                        });
                    } else {
                        cache.modify({
                            id: cache.identify({ __typename: 'SjabloonCategorie', id: data?.saveSjabloonCategorie.id }),
                            fields: {
                                naam: () => data?.saveSjabloonCategorie.naam ?? null,
                                inEditMode: () => false
                            }
                        });
                    }
                }
            })
            .subscribe();
    }

    public deleteSjabloonCategorie(medewerkerUuid: string, categorie: SjabloonCategorie) {
        return this.dataClient
            .mutate({
                mutation: DeleteSjabloonCategorieDocument,
                variables: {
                    categorieId: categorie.id,
                    medewerkerUuid,
                    vaksectieUuid: categorie.vaksectieUuid
                },
                update: (cache) => {
                    const viewToUpdate = {
                        __typename: 'VaksectieView',
                        vaksectie: {
                            uuid: categorie.vaksectieUuid
                        }
                    };

                    cache.modify({
                        id: cache.identify(viewToUpdate),
                        fields: {
                            sjablonen: (existingRefs: Reference[], { readField }) => {
                                const categorieRefs: Readonly<Reference[]> = readField('categorieen')!;
                                const catRef = categorieRefs.find((c) => readField('id', c) === categorie.id);
                                const catSjablonenRefs: Readonly<Reference[]> = readField('sjablonen', catRef)!;

                                return orderBy(
                                    [...existingRefs, ...catSjablonenRefs],
                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                                    [(ref) => (<string>readField('naam', ref)).toLowerCase()],
                                    ['asc']
                                );
                            },
                            categorieen: (existingRefs: Reference[], { readField }) => [
                                ...existingRefs.filter((ref) => readField('id', ref) !== categorie.id)
                            ]
                        }
                    });
                }
            })
            .subscribe();
    }

    public moveSjabloonCategorie(movePosition: number, medewerkerUuid: string, categorie: SjabloonCategorie) {
        return this.dataClient
            .mutate({
                mutation: MoveSjabloonCategorieDocument,
                variables: {
                    movePosition,
                    categorieId: categorie.id,
                    vaksectieUuid: categorie.vaksectieUuid,
                    medewerkerUuid
                },
                update: (cache) => {
                    const viewToUpdate = {
                        __typename: 'VaksectieView',
                        vaksectie: {
                            uuid: categorie.vaksectieUuid
                        }
                    };

                    cache.modify({
                        id: cache.identify(viewToUpdate),
                        fields: {
                            categorieen: (existingRefs: Reference[], { readField }) => {
                                const curIndex = existingRefs.findIndex((ref) => readField('id', ref) === categorie.id);
                                return moveItemInArray(
                                    curIndex,
                                    Math.max(Math.min(curIndex + movePosition, existingRefs.length), 0),
                                    existingRefs
                                );
                            }
                        }
                    });
                }
            })
            .subscribe();
    }

    public verplaatsSjabloon(
        medewerkerUuid: string,
        sjabloon: Sjabloon,
        vanCategorie: SjabloonCategorie,
        naarCategorie: SjabloonCategorie
    ) {
        const vaksectieUuid = vanCategorie?.vaksectieUuid ?? naarCategorie.vaksectieUuid;
        return this.dataClient
            .mutate({
                mutation: VerplaatsSjabloonDocument,
                variables: {
                    medewerkerUuid,
                    vaksectieUuid,
                    sjabloonId: sjabloon.id,
                    vanCategorie: vanCategorie ? vanCategorie.id : null,
                    naarCategorie: naarCategorie ? naarCategorie.id : null,
                    sjabloonUuid: sjabloon.uuid
                },
                optimisticResponse: { verplaatsSjabloon: true },
                update: (cache) => {
                    let sjabloonOverzichtViewRes = cache.readQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid
                        }
                    })!.sjabloonOverzichtView;

                    const filterPredicate = (s: Sjabloon) => sjabloon.uuid !== s.uuid && sjabloon.id !== s.id;
                    const heeftVaksectieUuid = into({ vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === vaksectieUuid });
                    const removeSjabloon = (sjablonen: SjabloonOverzichtViewQuery['sjabloonOverzichtView'][number]['sjablonen']) =>
                        sjablonen.filter(filterPredicate);
                    if (vanCategorie) {
                        sjabloonOverzichtViewRes = mod(
                            matching(heeftVaksectieUuid),
                            'categorieen',
                            matching({ id: vanCategorie.id }),
                            'sjablonen'
                        )(removeSjabloon)(sjabloonOverzichtViewRes);
                    } else {
                        sjabloonOverzichtViewRes = mod(matching(heeftVaksectieUuid), 'sjablonen')(removeSjabloon)(sjabloonOverzichtViewRes);
                    }

                    if (naarCategorie) {
                        sjabloonOverzichtViewRes = mod(
                            matching(heeftVaksectieUuid),
                            'categorieen',
                            matching({ id: naarCategorie.id }),
                            'sjablonen'
                        )(addSjabloonEnSorteer(sjabloon))(sjabloonOverzichtViewRes);
                    } else {
                        sjabloonOverzichtViewRes = mod(matching(heeftVaksectieUuid), 'sjablonen')(addSjabloonEnSorteer(sjabloon))(
                            sjabloonOverzichtViewRes
                        );
                    }

                    cache.writeQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid
                        },
                        data: { sjabloonOverzichtView: sjabloonOverzichtViewRes }
                    });
                }
            })
            .subscribe();
    }

    public saveSjabloonVanuitOverzicht(
        sjabloon: Sjabloon,
        actie: EditAction,
        studiewijzerId?: Optional<string>,
        oudeVaksectieUuid?: Optional<string>
    ) {
        const optimisticResponse: Optional<SaveSjabloonMutation> =
            actie === EditAction.CREATE
                ? undefined
                : {
                      __typename: 'Mutation',
                      saveSjabloon: {
                          __typename: 'SjabloonPayload',
                          sjabloon: { ...sjabloon }
                      }
                  };

        return this.dataClient.mutate({
            mutation: SaveSjabloonDocument,
            variables: {
                sjabloon: {
                    id: sjabloon.id,
                    naam: sjabloon.naam,
                    vaksectie: sjabloon.vaksectie.id,
                    eigenaar: sjabloon.eigenaar.id,
                    gedeeldMetVaksectie: sjabloon.gedeeldMetVaksectie,
                    vestigingId: sjabloon.vestigingId
                },
                actie,
                medewerkerUuid: sjabloon.eigenaar.uuid,
                studiewijzerId
            },
            optimisticResponse,
            update: (cache, response) => {
                let view = cache.readQuery({
                    query: SjabloonOverzichtViewDocument,
                    variables: {
                        medewerkerUuid: sjabloon.eigenaar.uuid
                    }
                })!.sjabloonOverzichtView;

                const heeftVaksectieUuid = into({ vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === sjabloon.vaksectie.uuid });
                const zelfdeVaksectie = !oudeVaksectieUuid || oudeVaksectieUuid === sjabloon.vaksectie.uuid;

                if (sjabloon.id && zelfdeVaksectie) {
                    const nietInCategorie =
                        flatMap(get(matching(heeftVaksectieUuid), 'sjablonen', matching({ id: sjabloon.id }))(view)).length > 0;

                    if (nietInCategorie) {
                        view = set(
                            matching(heeftVaksectieUuid),
                            'sjablonen',
                            matching({ id: sjabloon.id })
                        )({ ...response.data?.saveSjabloon.sjabloon })(view);

                        view = mod(matching(heeftVaksectieUuid), 'sjablonen')(sorteerSjablonenOpNaam)(view);
                    } else {
                        view = set(
                            matching(heeftVaksectieUuid),
                            'categorieen',
                            matching(bevatSjabloon(sjabloon.id)),
                            'sjablonen',
                            matching({ id: sjabloon.id })
                        )({ ...response.data?.saveSjabloon.sjabloon })(view);

                        view = mod(
                            matching(heeftVaksectieUuid),
                            'categorieen',
                            matching(bevatSjabloon(sjabloon.id)),
                            'sjablonen'
                        )(sorteerSjablonenOpNaam)(view);
                    }
                } else {
                    view = mod(matching(heeftVaksectieUuid), 'sjablonen')(addSjabloonEnSorteer(response.data!.saveSjabloon.sjabloon))(view);
                }

                if (oudeVaksectieUuid && oudeVaksectieUuid !== sjabloon.vaksectie.uuid) {
                    const matchtOudeVaksectie = matching({ vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === oudeVaksectieUuid });

                    const removeFromOverzicht = mod(matchtOudeVaksectie, 'sjablonen')(removeItem(sjabloon.id));
                    const removeFromCategorieen = mod(
                        matchtOudeVaksectie,
                        'categorieen',
                        matching(bevatSjabloon(sjabloon.id)),
                        'sjablonen'
                    )(removeItem(sjabloon.id));

                    view = updateAll<SjabloonOverzichtViewQuery['sjabloonOverzichtView']>(removeFromOverzicht, removeFromCategorieen)(view);

                    // Categorie 'overig' direct weghalen uit de view zodra het laatste sjabloon eruit is
                    if (oudeVaksectieUuid === '#overig') {
                        const overigEnLeeg = into({
                            sjablonen: (sjablonen: Sjabloon[]) => sjablonen.length === 0,
                            vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === '#overig'
                        });
                        view = shadesFilter(not(overigEnLeeg))(view);
                    }
                }

                cache.writeQuery({
                    query: SjabloonOverzichtViewDocument,
                    variables: {
                        medewerkerUuid: sjabloon.eigenaar.uuid
                    },
                    data: { sjabloonOverzichtView: view }
                });
            }
        });
    }

    public saveSjabloonVanuitDetail(sjabloon: SjabloonFieldsFragment, oudeVaksectieUuid: Optional<string>) {
        return this.dataClient.mutate({
            mutation: SaveSjabloonVanuitDetailDocument,
            variables: {
                sjabloon: {
                    id: sjabloon.id,
                    naam: sjabloon.naam,
                    vaksectie: sjabloon.vaksectie.id,
                    eigenaar: sjabloon.eigenaar.id,
                    gedeeldMetVaksectie: sjabloon.gedeeldMetVaksectie,
                    vestigingId: sjabloon.vestigingId
                },
                actie: EditAction.UPDATE,
                medewerkerUuid: sjabloon.eigenaar.uuid,
                studiewijzerId: null,
                oudeVaksectieUuid
            },
            optimisticResponse: {
                __typename: 'Mutation',
                saveSjabloon: {
                    __typename: 'SjabloonPayload',
                    sjabloon: {
                        ...sjabloon
                    }
                }
            },
            refetchQueries: [namedOperations.Query.sjabloonOverzichtView],
            update: (cache, response) => {
                const viewData = cache.readQuery({
                    query: SjabloonViewDocument,
                    variables: {
                        sjabloon: sjabloon.id
                    }
                })!;

                const newView = {
                    ...viewData,
                    sjabloon: { ...response.data?.saveSjabloon.sjabloon }
                };

                cache.writeQuery({
                    query: SjabloonViewDocument,
                    variables: {
                        sjabloon: sjabloon.id
                    },
                    data: newView
                });
            }
        });
    }

    public deleteSjabloon(sjabloon: Sjabloon, verwijderGesynchroniseerdeItems: boolean) {
        this.dataClient
            .mutate({
                mutation: DeleteSjabloonDocument,
                variables: {
                    sjabloon: {
                        id: sjabloon.id,
                        verwijderGesynchroniseerdeItems
                    }
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    deleteSjabloon: {
                        __typename: 'DeleteSjabloonPayload',
                        succes: true
                    }
                },
                update: (cache) => {
                    let sjabloonOverzichtViewRes = cache.readQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid: sjabloon.eigenaar.uuid
                        }
                    })!.sjabloonOverzichtView;

                    const heeftVaksectieUuid = into({
                        vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === sjabloon.vaksectie.uuid || vaksectie.uuid === '#overig'
                    });
                    sjabloonOverzichtViewRes = mod(matching(heeftVaksectieUuid), 'sjablonen')(removeItem(sjabloon.id))(
                        sjabloonOverzichtViewRes
                    );

                    sjabloonOverzichtViewRes = mod(
                        matching(heeftVaksectieUuid),
                        'categorieen',
                        matching(bevatSjabloon(sjabloon.id)),
                        'sjablonen'
                    )(removeItem(sjabloon.id))(sjabloonOverzichtViewRes);

                    // Categorie 'overig' direct weghalen uit de view zodra het laatste sjabloon eruit is
                    const overigEnLeeg = into({
                        sjablonen: (sjablonen: Sjabloon[]) => sjablonen.length === 0,
                        vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === '#overig'
                    });
                    sjabloonOverzichtViewRes = shadesFilter(not(overigEnLeeg))(sjabloonOverzichtViewRes);

                    cache.writeQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid: sjabloon.eigenaar.uuid
                        },
                        data: { sjabloonOverzichtView: sjabloonOverzichtViewRes }
                    });
                }
            })
            .subscribe();
    }

    public saveWeekToekenning(toekenningen: WeekToekenning[], studiewijzerId: string) {
        const isNewItem = toekenningen[0].id === undefined;
        const toSaveToekenningenInputs = toekenningen.map((toekenning) => convertToWeekToekenningInput(toekenning, studiewijzerId));

        this.dataClient
            .mutate({
                mutation: SaveWeekToekenning2Document,
                variables: {
                    toekenningInput: toSaveToekenningenInputs
                },
                update: (cache, response) => {
                    let view = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: studiewijzerId
                        }
                    })!.sjabloonView;

                    const nieuweToekenningen = updateAll<WeekToekenning[]>(
                        set(all(), 'studiewijzeritem', 'isNieuw')(isNewItem as any),
                        set(all(), 'isStartInleverperiode')(false as any)
                    )(response.data!.saveWeekToekenning.toekenningen as WeekToekenning[]);

                    nieuweToekenningen.forEach((newToekenning) => {
                        if (isNewItem) {
                            view = mod('weken', matching({ weeknummer: newToekenning.startWeek }), 'toekenningen')(addItem(newToekenning))(
                                view
                            );

                            if (newToekenning.studiewijzeritem.conceptInleveropdracht) {
                                const setIsStartInleverperiode = set(
                                    'weken',
                                    matching({ weeknummer: newToekenning.startWeek }),
                                    'toekenningen',
                                    matching({ id: newToekenning.id }),
                                    'isStartInleverperiode'
                                )(true as any);

                                const addEindToWeek = mod(
                                    'weken',
                                    matching({ weeknummer: newToekenning.eindWeek }),
                                    'toekenningen'
                                )(addItem({ ...newToekenning, isStartInleverperiode: false }));

                                view = updateAll<SjabloonViewQuery['sjabloonView']>(setIsStartInleverperiode, addEindToWeek)(view);
                            }
                        } else {
                            if (newToekenning.studiewijzeritem.conceptInleveropdracht) {
                                const removeToekenningFromWeken = mod(
                                    'weken',
                                    matching(bevatToekenning(newToekenning.id)),
                                    'toekenningen'
                                )(removeItem(newToekenning.id));

                                const addStartToWeek = mod(
                                    'weken',
                                    matching({ weeknummer: newToekenning.startWeek }),
                                    'toekenningen'
                                )(addItem({ ...newToekenning, isStartInleverperiode: true }));

                                const addEindToWeek = mod(
                                    'weken',
                                    matching({ weeknummer: newToekenning.eindWeek }),
                                    'toekenningen'
                                )(addItem({ ...newToekenning, isStartInleverperiode: false }));

                                view = updateAll<SjabloonViewQuery['sjabloonView']>(
                                    removeToekenningFromWeken,
                                    addStartToWeek,
                                    addEindToWeek
                                )(view);
                            } else {
                                view = set(
                                    'weken',
                                    matching({ weeknummer: newToekenning.startWeek }),
                                    'toekenningen',
                                    matching({ id: newToekenning.id })
                                )(newToekenning as SjabloonViewQuery['sjabloonView']['weken'][number]['toekenningen'][number])(view);
                            }
                        }
                    });

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        data: { sjabloonView: view },
                        variables: {
                            sjabloon: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public verwijderToekenning(toekenning: WeekToekenning, abstractStudiewijzerId: string) {
        this.dataClient
            .mutate({
                mutation: VerwijderToekenningDocument,
                variables: { toekenningId: toekenning.id },
                update: (cache) => {
                    let viewData = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: abstractStudiewijzerId
                        }
                    })!;

                    const verwijderStart = mod(
                        'sjabloonView',
                        'weken',
                        matching({ weeknummer: toekenning.startWeek }),
                        'toekenningen'
                    )(removeItem(toekenning.id));

                    const verwijderEind = mod(
                        'sjabloonView',
                        'weken',
                        matching({ weeknummer: toekenning.eindWeek }),
                        'toekenningen'
                    )(removeItem(toekenning.id));

                    viewData = updateAll<SjabloonViewQuery>(verwijderStart, verwijderEind)(viewData);

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        data: viewData,
                        variables: {
                            sjabloon: abstractStudiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public kopieerToekenningenNaarSjabloon$(sjabloonId: string, weeknummer: number, toekenningIds: string[]) {
        return this.dataClient.mutate({
            mutation: KopieerToekenningenNaarSjabloonDocument,
            variables: { sjabloonId, weeknummer, toekenningIds },
            update: (cache, response) => {
                let viewData = cache.readQuery({
                    query: SjabloonViewDocument,
                    variables: {
                        sjabloon: sjabloonId
                    }
                })!;

                const nieuweToekenningen = updateAll<(WeekToekenning | DagToekenning)[]>(
                    set(all(), 'studiewijzeritem', 'isNieuw')(true as any),
                    set(all(), 'studiewijzeritem', 'projectgroepen')([] as any),
                    set(all(), 'isStartInleverperiode')(false as any)
                )(response.data?.kopieerToekenningenNaarSjabloon.toekenningen as (WeekToekenning | DagToekenning)[]);

                const updates = nieuweToekenningen.map((eindToekenning) => {
                    const updateFuncties = [];
                    const addEind = mod('sjabloonView', 'weken', matching({ weeknummer }), 'toekenningen')(addItem(eindToekenning));
                    if (eindToekenning.studiewijzeritem.conceptInleveropdracht) {
                        const addStart = mod(
                            'sjabloonView',
                            'weken',
                            matching({ weeknummer }),
                            'toekenningen'
                        )(addItem({ ...eindToekenning, isStartInleverperiode: true }));
                        updateFuncties.push(addStart);

                        if ((<WeekToekenning>eindToekenning).startWeek === (<WeekToekenning>eindToekenning).eindWeek) {
                            updateFuncties.push(addEind);
                        } else {
                            const addEindToEindweek = mod(
                                'sjabloonView',
                                'weken',
                                matching({ weeknummer: (<WeekToekenning>eindToekenning).eindWeek }),
                                'toekenningen'
                            )(addItem(eindToekenning));
                            updateFuncties.push(addEindToEindweek);
                        }
                    } else {
                        updateFuncties.push(addEind);
                    }
                    return updateFuncties;
                });

                viewData = updateAll<SjabloonViewQuery>(...flatMap(updates))(viewData);

                cache.writeQuery({
                    query: SjabloonViewDocument,
                    data: viewData,
                    variables: {
                        sjabloon: sjabloonId
                    }
                });
            }
        });
    }

    public kopieerSjabloon(oudeSjabloonId: string, oudeSjabloonUuid: string) {
        this.dataClient
            .mutate({
                mutation: KopieerSjabloonDocument,
                variables: {
                    sjabloonId: oudeSjabloonId,
                    sjabloonUuid: oudeSjabloonUuid
                },
                update: (cache, response) => {
                    const newSjabloon = set('isNieuw')(true)(response.data!.kopieerSjabloon as any);
                    let view = cache.readQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid: this.medewerkerDataService.medewerkerUuid
                        }
                    })!.sjabloonOverzichtView;

                    const heeftVaksectieUuid = matching({
                        vaksectie: (vaksectie: Vaksectie) => vaksectie.uuid === newSjabloon.vaksectie.uuid
                    });

                    const vaksectieView = view.find((v) => v.vaksectie.uuid === newSjabloon.vaksectie.uuid)!;
                    const toevoegenAanAlgemeneSjablonen = vaksectieView.sjablonen.some(
                        (sjabloon: Sjabloon) => sjabloon.id === oudeSjabloonId
                    );
                    if (toevoegenAanAlgemeneSjablonen) {
                        view = mod(heeftVaksectieUuid, 'sjablonen')(addSjabloonEnSorteer(newSjabloon))(view);
                    } else {
                        view = mod(
                            heeftVaksectieUuid,
                            'categorieen',
                            matching(bevatSjabloon(oudeSjabloonId)),
                            'sjablonen'
                        )(addSjabloonEnSorteer(newSjabloon))(view);
                    }

                    cache.writeQuery({
                        query: SjabloonOverzichtViewDocument,
                        variables: {
                            medewerkerUuid: newSjabloon.eigenaar.uuid
                        },
                        data: { sjabloonOverzichtView: view }
                    });
                }
            })
            .subscribe();
    }

    public dupliceerToekenning(toekenningId: string, sjabloonId: string) {
        this.dataClient
            .mutate({
                mutation: DupliceerToekenningInSjabloonDocument,
                variables: { toekenningId },
                update: (cache, response) => {
                    let viewData = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        }
                    })!;

                    const toekenning = set('studiewijzeritem', 'isNieuw')(true)(response.data!.dupliceerToekenningInSjabloon as any);
                    const startWeek = (<WeekToekenning>toekenning).startWeek;

                    const week = viewData.sjabloonView.weken.find((sjabloonWeek) => sjabloonWeek.weeknummer === startWeek)!;
                    if (toekenning.studiewijzeritem.conceptInleveropdracht) {
                        toekenning.isStartInleverperiode = true;

                        const eindToekenning = {
                            ...toekenning,
                            isStartInleverperiode: false
                        };
                        const eindWeek = (<WeekToekenning>toekenning).eindWeek;
                        const viewEindWeek = viewData.sjabloonView.weken.find((sjabloonWeek) => sjabloonWeek.weeknummer === eindWeek)!;

                        viewData = mod(
                            'sjabloonView',
                            'weken',
                            matching({ weeknummer: eindWeek }),
                            'toekenningen'
                        )(addItem(eindToekenning))(viewData);

                        toekenning.studiewijzeritem.conceptInleveropdracht.startSortering = getHoogsteToekenningSortering(
                            week.toekenningen as WeekToekenning[]
                        );
                        toekenning.studiewijzeritem.conceptInleveropdracht.eindSortering = getHoogsteToekenningSortering(
                            viewEindWeek.toekenningen as WeekToekenning[]
                        );
                    }

                    viewData = mod('sjabloonView', 'weken', matching({ weeknummer: startWeek }), 'toekenningen')(addItem(toekenning))(
                        viewData
                    );

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        },
                        data: viewData
                    });
                }
            })
            .subscribe();
    }

    public addLabelToSjabloonWeek(sjabloonId: string, weeknummer: number, label: string) {
        return this.dataClient
            .mutate({
                mutation: AddLabelToSjabloonWeekDocument,
                optimisticResponse: {
                    __typename: 'Mutation',
                    addLabelToSjabloonWeek: true
                },
                variables: {
                    sjabloonId,
                    weeknummer,
                    label
                },
                update: (cache) => {
                    let sjabloonViewRes: SjabloonViewQuery['sjabloonView'] = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        }
                    })!.sjabloonView;

                    sjabloonViewRes = set('weken', matching({ weeknummer }), 'label')(label)(sjabloonViewRes as any);

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        },
                        data: { sjabloonView: sjabloonViewRes }
                    });
                }
            })
            .subscribe();
    }

    public removeLabelFromSjabloonWeek(sjabloonId: string, weeknummer: number) {
        return this.dataClient
            .mutate({
                mutation: RemoveLabelFromSjabloonWeekDocument,
                optimisticResponse: {
                    __typename: 'Mutation',
                    removeLabelFromSjabloonWeek: true
                },
                variables: {
                    sjabloonId,
                    weeknummer
                },
                update: (cache) => {
                    let sjabloonViewRes: SjabloonViewQuery['sjabloonView'] = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        }
                    })!.sjabloonView;

                    sjabloonViewRes = set('weken', matching({ weeknummer }), 'label')(null)(sjabloonViewRes as any);

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        },
                        data: { sjabloonView: sjabloonViewRes }
                    });
                }
            })
            .subscribe();
    }

    public removeIsNieuw(sjabloonId: string) {
        const id = `Sjabloon:${sjabloonId}`;

        const sjabloonData = this._cache.readFragment({
            id,
            fragment: SjabloonIsNieuwFragmentDoc
        })!;

        this._cache.writeFragment({
            fragment: SjabloonIsNieuwFragmentDoc,
            id,
            data: {
                ...sjabloonData,
                isNieuw: false
            }
        });
    }

    public exporteerToekenningen(toekenningIds: string[], abstractStudiewijzerIds: string[]) {
        return this.dataClient.mutate({
            mutation: ExporteerToekenningenUitSjabloonDocument,
            variables: {
                toekenningIds,
                abstractStudiewijzerIds
            }
        });
    }

    public synchroniseerMetSjabloon(sjabloonId: string, startWeek: number, studiewijzers: Studiewijzer[]) {
        return this.dataClient.mutate({
            mutation: SynchroniseerMetSjabloonDocument,
            variables: {
                sjabloonId,
                startWeek,
                studiewijzerIds: studiewijzers.map((studiewijzer) => studiewijzer.id)
            },
            refetchQueries: [
                {
                    query: SjabloonViewDocument,
                    variables: { sjabloon: sjabloonId }
                }
            ],
            awaitRefetchQueries: true
        });
    }

    public ontkoppelVanSjabloon(sjabloonId: string, studiewijzerId: string, verwijderItems: boolean, refetchView: string[]) {
        return this.dataClient.mutate({
            mutation: OntkoppelVanSjabloonDocument,
            variables: {
                sjabloonId,
                studiewijzerId,
                verwijderItems
            },
            refetchQueries: refetchView,
            awaitRefetchQueries: true,
            update: (cache) => {
                cache.evict({ fieldName: 'sjabloonOverzichtView' });
                cache.gc();
            }
        });
    }

    public verschuifSjabloonContent(sjabloonId: string, nieuweStartweek: number) {
        return this.dataClient.mutate({
            mutation: VerschuifSjabloonContentDocument,
            variables: {
                sjabloonId,
                nieuweStartweek
            },
            refetchQueries: [namedOperations.Query.sjabloonView]
        });
    }

    public verschuifPlanning(sjabloonId: string, vanafWeeknummer: number, aantalWeken: number, direction: PlanningVerschuifDirection) {
        return this.dataClient.mutate({
            mutation: VerschuifSjabloonPlanningDocument,
            variables: {
                sjabloonId,
                vanafWeeknummer,
                aantalWeken,
                direction
            },
            refetchQueries: [namedOperations.Query.sjabloonView]
        });
    }
}
