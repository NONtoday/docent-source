import { Injectable, inject } from '@angular/core';
import { ApolloCache } from '@apollo/client/core';
import {
    Bijlage,
    BijlageFieldsFragment,
    BijlageMap,
    BijlageMapFieldsFragment,
    BijlageType,
    Differentiatiegroep,
    ExporteerBijlagenDocument,
    JaarbijlageVoorAbstractSwDocument,
    JaarbijlageVoorAbstractSwQuery,
    JaarbijlagenDifferentiatieToekennenBulkDocument,
    KopieerBijlagenDocument,
    KopieerBijlagenMutation,
    Leerling,
    SaveJaarbijlageDocument,
    SaveJaarbijlageMapDocument,
    Sjabloon,
    SjabloonDocument,
    SjabloonQuery,
    SorteerJaarbijlageMappenDocument,
    SorteerJaarbijlagenDocument,
    StudiewijzerDocument,
    StudiewijzerJaarbijlagen,
    StudiewijzerQuery,
    SynchroniseerJaarbijlageMapMetSjabloonDocument,
    SynchroniseerJaarbijlageMetSjabloonDocument,
    UpdateJaarbijlagenZichtbaarheidBulkDocument,
    VerplaatsJaarbijlagenNaarMapBulkDocument,
    VerwijderBijlageDifferentiatiesDocument,
    VerwijderJaarbijlageDocument,
    VerwijderJaarbijlageMapDocument,
    VerwijderJaarbijlagenBulkDocument,
    VerwijderMapDifferentiatiesDocument
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import flatMap from 'lodash-es/flatMap';
import sortBy from 'lodash-es/sortBy';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { all, matching, mod, set, updateAll } from 'shades';
import { bijlageIsSelected, bijlageMapBijlagen, bijlageMapIsSelected } from '../../generated/_operations';
import {
    jaarbijlageToJaarbijlageInput,
    kopieerBijlagenOptimisticResponse,
    toKopieerJaarbijlageMapInput
} from '../core/converters/bijlage.converters';
import { Optional, addItem, addItems, equalsId, removeItem, removeItems, toId } from '../rooster-shared/utils/utils';
import { moveItemInArray } from '../shared/utils/array.utils';

interface SorteerItem {
    sortering: number;
}
const modBijlageMapBijlagen = (id: string) => mod('mappen', matching({ id }), 'bijlagen');
const herinitialiseerSorteringsnummersFn = (items: SorteerItem[]) =>
    items.map((item: SorteerItem, index: number) => ({ ...item, sortering: index }));

@Injectable({
    providedIn: 'root'
})
export class JaarbijlageDataService {
    private dataClient = inject(Apollo);
    private _cache: ApolloCache<any>;

    constructor() {
        this._cache = this.dataClient.client.cache;
    }

    private mapBijlageToInput(bijlage: Bijlage) {
        return {
            id: bijlage.id,
            uploadContextId: bijlage.uploadContextId,
            type: bijlage.type,
            titel: bijlage.titel,
            url: bijlage.url,
            contentType: bijlage.contentType,
            zichtbaarVoorLeerling: bijlage.zichtbaarVoorLeerling,
            sortering: bijlage.sortering ? bijlage.sortering : 0,
            methodeId: bijlage.methodeId,
            differentiatiegroepen: bijlage.differentiatiegroepen?.map(toId),
            differentiatieleerlingen: bijlage.differentiatieleerlingen?.map(toId)
        };
    }

    public deselectAllBijlagesFromBijlageMap(bijlageMapId: string) {
        const id = `BijlageMap:${bijlageMapId}`;
        const fragment = `bijlageMapBijlagen`;

        let data: BijlageMap = this._cache.readFragment({
            id,
            fragment: bijlageMapBijlagen,
            fragmentName: fragment
        })!;

        data = set('bijlagen', all(), 'isSelected')(false)(data as any);

        this._cache.writeFragment({
            fragment: bijlageMapBijlagen,
            fragmentName: fragment,
            id,
            data
        });
    }

    public deselectBijlagenAndMappenFromAbstractStudiewijzer(abstractSwId: string) {
        let jaarbijlagen = this._cache.readQuery({
            query: JaarbijlageVoorAbstractSwDocument,
            variables: {
                abstractSwId
            }
        })!.jaarbijlageVoorAbstractSw;

        jaarbijlagen = {
            ...jaarbijlagen,
            bijlagen: jaarbijlagen.bijlagen.map((bijlage: BijlageFieldsFragment) => ({ ...bijlage, isSelected: false })),
            mappen: jaarbijlagen.mappen.map((bijlageMap: BijlageMapFieldsFragment) => ({ ...bijlageMap, isSelected: false }))
        };

        this._cache.writeQuery({
            query: JaarbijlageVoorAbstractSwDocument,
            data: {
                jaarbijlageVoorAbstractSw: jaarbijlagen
            },
            variables: {
                abstractSwId
            }
        });
    }

    private getSjabloonFromStore<T>(cache: ApolloCache<T>, id: string): SjabloonQuery['sjabloon'] {
        return cache.readQuery({
            query: SjabloonDocument,
            variables: {
                id
            }
        })!.sjabloon;
    }

    private getStudiewijzerFromStore<T>(cache: ApolloCache<T>, id: string): StudiewijzerQuery['studiewijzer'] {
        return cache.readQuery({
            query: StudiewijzerDocument,
            variables: {
                id
            }
        })!.studiewijzer;
    }

    private updateAantalBijlagenInStore<T>(
        cache: ApolloCache<T>,
        jaarbijlagen: StudiewijzerJaarbijlagen,
        abstractSwId: string,
        isSjabloon: boolean
    ): void {
        const query = isSjabloon ? SjabloonDocument : StudiewijzerDocument;
        let abstractSw = isSjabloon ? this.getSjabloonFromStore(cache, abstractSwId) : this.getStudiewijzerFromStore(cache, abstractSwId);

        abstractSw = {
            ...abstractSw,
            aantalBijlagen: jaarbijlagen.bijlagen.length + flatMap(jaarbijlagen.mappen, (m) => m.bijlagen).length
        };
        const data: any = {};
        const property = isSjabloon ? 'sjabloon' : 'studiewijzer';
        data[property] = abstractSw;

        cache.writeQuery({
            query,
            data,
            variables: {
                id: abstractSwId
            }
        });
    }

    public toggleBijlageSelection(bijlageId: string) {
        const id = `Bijlage:${bijlageId}`;

        const bijlageData = this._cache.readFragment<Bijlage>({
            id,
            fragment: bijlageIsSelected
        })!;

        const updatedBijlage = { ...bijlageData, isSelected: !bijlageData.isSelected };

        this._cache.writeFragment({
            fragment: bijlageIsSelected,
            id,
            data: updatedBijlage
        });
    }

    public toggleBijlageMapSelection(mapId: string) {
        const id = `BijlageMap:${mapId}`;

        const mapData = this._cache.readFragment<BijlageMap>({
            id,
            fragment: bijlageMapIsSelected
        })!;

        const updatedBijlageMap = { ...mapData, isSelected: !mapData.isSelected };

        this._cache.writeFragment({
            fragment: bijlageMapIsSelected,
            id,
            data: updatedBijlageMap
        });
    }

    public getJaarbijlagen(abstractSwId: string): Observable<JaarbijlageVoorAbstractSwQuery['jaarbijlageVoorAbstractSw']> {
        return this.dataClient
            .watchQuery({
                query: JaarbijlageVoorAbstractSwDocument,
                variables: {
                    abstractSwId
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.jaarbijlageVoorAbstractSw)
            );
    }

    public bulkZichtbaarheidJaarbijlagen(
        bijlages: Bijlage[],
        jaarbijlageMapIds: string[],
        zichtbaarVoorLeerling: boolean,
        swId: string,
        bijlageMap: Optional<BijlageMap>
    ) {
        const jaarbijlagesInput = bijlages.map(jaarbijlageToJaarbijlageInput);
        const bijlageIds = bijlages.map((bijlage) => bijlage.id);

        this.dataClient
            .mutate({
                mutation: UpdateJaarbijlagenZichtbaarheidBulkDocument,
                variables: {
                    jaarbijlagen: jaarbijlagesInput,
                    jaarbijlageMapIds,
                    swId,
                    zichtbaarVoorLeerling
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    updateJaarbijlagenZichtbaarheidBulk: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    const updateBijlages = (bijlagen: Bijlage[]) =>
                        bijlagen.map((bijlage: Bijlage) => {
                            if (bijlageIds.includes(bijlage.id)) {
                                return {
                                    ...bijlage,
                                    zichtbaarVoorLeerling,
                                    isSelected: false
                                };
                            }
                            return bijlage;
                        });

                    const updateMappen = (mappen: BijlageMap[]) =>
                        mappen.map((map: BijlageMap) => {
                            if (jaarbijlageMapIds.includes(map.id)) {
                                return {
                                    ...map,
                                    zichtbaarVoorLeerling,
                                    isSelected: false
                                };
                            }
                            return map;
                        });

                    if (bijlageMap) {
                        jaarbijlagen = modBijlageMapBijlagen(bijlageMap.id)(updateBijlages)(jaarbijlagen);
                    } else {
                        jaarbijlagen = mod('bijlagen')(updateBijlages)(jaarbijlagen);
                        jaarbijlagen = mod('mappen')(updateMappen)(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });
                }
            })
            .subscribe();
    }

    public bulkDifferentierenJaarbijlagen(
        bijlages: Bijlage[],
        jaarbijlageMapIds: string[],
        swId: string,
        differentiatieleerlingenIds: string[],
        differentiatiegroepenIds: string[],
        differentiatieVervangen: boolean
    ) {
        const jaarbijlagesInput = bijlages.map(jaarbijlageToJaarbijlageInput);

        this.dataClient
            .mutate({
                mutation: JaarbijlagenDifferentiatieToekennenBulkDocument,
                variables: {
                    jaarbijlagen: jaarbijlagesInput,
                    jaarbijlageMapIds,
                    swId,
                    differentiatieleerlingenIds,
                    differentiatiegroepenIds,
                    differentiatieVervangen
                },
                update: (cache, { data }) => {
                    data?.jaarbijlagenDifferentiatieToekennenBulk.mappen.forEach((bijlagemap) => {
                        cache.modify({
                            id: cache.identify({ __typename: bijlagemap['__typename'], id: bijlagemap.id }),
                            fields: {
                                differentiatiegroepen: () => bijlagemap.differentiatiegroepen,
                                differentiatieleerlingen: () => bijlagemap.differentiatieleerlingen,
                                isSelected: () => false
                            }
                        });
                    });
                    data?.jaarbijlagenDifferentiatieToekennenBulk.bijlagen.forEach((bijlage) => {
                        cache.modify({
                            id: cache.identify({ __typename: bijlage['__typename'], id: bijlage.id }),
                            fields: {
                                differentiatiegroepen: () => bijlage.differentiatiegroepen,
                                differentiatieleerlingen: () => bijlage.differentiatieleerlingen,
                                isSelected: () => false
                            }
                        });
                    });
                }
            })
            .subscribe();
    }

    public bulkVerwijderJaarbijlagen(bijlages: Bijlage[], swId: string, isSjabloon: boolean, bijlageMap: Optional<BijlageMap>) {
        const jaarbijlagesInput = bijlages.map(jaarbijlageToJaarbijlageInput);
        const teVerwijderenIds = bijlages.map((bijlage) => bijlage.id);

        this.dataClient
            .mutate({
                mutation: VerwijderJaarbijlagenBulkDocument,
                variables: {
                    jaarbijlagen: jaarbijlagesInput,
                    swId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderJaarbijlagenBulk: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (bijlageMap) {
                        jaarbijlagen = modBijlageMapBijlagen(bijlageMap.id)(removeItems(teVerwijderenIds))(jaarbijlagen);
                    } else {
                        jaarbijlagen = mod('bijlagen')(removeItems(teVerwijderenIds))(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });

                    this.updateAantalBijlagenInStore(cache, jaarbijlagen, swId, isSjabloon);
                }
            })
            .subscribe();
    }

    public saveJaarbijlage(
        bijlage: Bijlage,
        swId: string,
        isSjabloon: boolean,
        bijlageMap: Optional<BijlageMap>,
        synchroniseerMetSjabloon?: Optional<Sjabloon>
    ) {
        const isNewItem = !bijlage.id;

        this.dataClient
            .mutate({
                mutation: SaveJaarbijlageDocument,
                variables: {
                    bijlage: this.mapBijlageToInput(bijlage),
                    swId,
                    mapId: bijlageMap ? bijlageMap.id : null,
                    synchroniseerMetSjabloonId: synchroniseerMetSjabloon ? synchroniseerMetSjabloon.id : null
                },
                update: (cache, response) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    const newOrUpdatedBijlage = { ...response.data!.saveJaarbijlage.bijlage, isSelected: false };
                    const modBijlagen: any = bijlageMap ? modBijlageMapBijlagen(bijlageMap.id) : mod('bijlagen');

                    if (isNewItem) {
                        jaarbijlagen = modBijlagen(addItem(newOrUpdatedBijlage))(jaarbijlagen);
                        jaarbijlagen = modBijlagen(herinitialiseerSorteringsnummersFn)(jaarbijlagen);
                    } else {
                        // vervang de huidige bijlage, met de bijlage uit de response
                        jaarbijlagen = modBijlagen(set(matching({ id: bijlage.id }))(newOrUpdatedBijlage))(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });

                    this.updateAantalBijlagenInStore(cache, jaarbijlagen, swId, isSjabloon);
                }
            })
            .subscribe();
    }

    public verwijderBijlage(bijlage: Bijlage, swId: string, isSjabloon: boolean, bijlageMap: Optional<BijlageMap>) {
        this.dataClient
            .mutate({
                mutation: VerwijderJaarbijlageDocument,
                variables: {
                    id: bijlage.id,
                    isBestand: bijlage.type === BijlageType.BESTAND,
                    swId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderJaarbijlage: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (bijlageMap) {
                        jaarbijlagen = modBijlageMapBijlagen(bijlageMap.id)(removeItem(bijlage.id))(jaarbijlagen);
                    } else {
                        jaarbijlagen = mod('bijlagen')(removeItem(bijlage.id))(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });

                    this.updateAantalBijlagenInStore(cache, jaarbijlagen, swId, isSjabloon);
                }
            })
            .subscribe();
    }

    public saveJaarbijlageMap(bijlageMap: BijlageMap, swId: string) {
        const bijlageMapInput = {
            id: bijlageMap.id,
            naam: bijlageMap.naam,
            zichtbaarVoorLeerling: bijlageMap.zichtbaarVoorLeerling,
            sortering: bijlageMap.sortering,
            differentiatiegroepen: bijlageMap.differentiatiegroepen.map(toId),
            differentiatieleerlingen: bijlageMap.differentiatieleerlingen.map(toId)
        };

        this.dataClient
            .mutate({
                mutation: SaveJaarbijlageMapDocument,
                variables: {
                    bijlageMap: bijlageMapInput,
                    swId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    saveJaarbijlageMap: {
                        ...bijlageMap,
                        __typename: 'BijlageMap',
                        id: bijlageMap.id ? bijlageMap.id : Number.MAX_SAFE_INTEGER.toString()
                    } as BijlageMapFieldsFragment
                },
                update: (cache, { data }) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (bijlageMap.id) {
                        jaarbijlagen = set('mappen', matching({ id: bijlageMap.id }), 'bijlagen')(bijlageMap.bijlagen)(jaarbijlagen);
                    } else {
                        jaarbijlagen = set('mappen')(
                            sortBy([...jaarbijlagen.mappen, { ...data?.saveJaarbijlageMap, bijlagen: [] }], ['sortering'])
                        )(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });
                }
            })
            .subscribe();
    }

    public verwijderJaarbijlageMap(mapId: string, verwijderBijlagen: boolean, swId: string, isSjabloon: boolean) {
        this.dataClient
            .mutate({
                mutation: VerwijderJaarbijlageMapDocument,
                variables: {
                    jaarbijlageMapId: mapId,
                    verwijderBijlagenMee: verwijderBijlagen
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderJaarbijlageMap: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (!verwijderBijlagen) {
                        const bijlageMap = jaarbijlagen.mappen.find(equalsId(mapId))!;
                        jaarbijlagen = set('bijlagen')([...jaarbijlagen.bijlagen, ...bijlageMap.bijlagen])(jaarbijlagen);
                        jaarbijlagen = mod('bijlagen')(herinitialiseerSorteringsnummersFn)(jaarbijlagen);
                    }
                    jaarbijlagen = mod('mappen')(removeItem(mapId))(jaarbijlagen);

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });

                    this.updateAantalBijlagenInStore(cache, jaarbijlagen, swId, isSjabloon);
                }
            })
            .subscribe();
    }

    public sorteerJaarbijlagen(bijlagen: Bijlage[], from: number, to: number, swId: string, mapId: Optional<string>) {
        const gesorteerdeBijlagen = moveItemInArray(from, to, bijlagen);
        const toJaarbijlageInput = (bijlage: Bijlage) => ({ id: bijlage.id, type: bijlage.type });
        const bijlagenInputs = gesorteerdeBijlagen.map(toJaarbijlageInput);

        this.dataClient
            .mutate({
                mutation: SorteerJaarbijlagenDocument,
                variables: {
                    jaarbijlagen: bijlagenInputs,
                    swId,
                    jaarbijlageMapId: mapId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    sorteerJaarbijlagen: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (mapId) {
                        jaarbijlagen = set('mappen', matching({ id: mapId }), 'bijlagen')(gesorteerdeBijlagen)(jaarbijlagen);
                    } else {
                        jaarbijlagen = set('bijlagen')(gesorteerdeBijlagen)(jaarbijlagen);
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });
                }
            })
            .subscribe();
    }

    public sorteerJaarbijlageMap(mappen: BijlageMap[], from: number, to: number, swId: string) {
        const gesorteerdeMappen = moveItemInArray(from, to, mappen).map((m, i) => ({ ...m, sortering: i }));
        const jaarbijlageMapIds = gesorteerdeMappen.map((sortedMap) => sortedMap.id);

        this.dataClient
            .mutate({
                mutation: SorteerJaarbijlageMappenDocument,
                variables: {
                    jaarbijlageMapIds,
                    swId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    sorteerJaarbijlageMappen: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    jaarbijlagen = {
                        ...jaarbijlagen,
                        mappen: gesorteerdeMappen as BijlageMapFieldsFragment[]
                    };

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });
                }
            })
            .subscribe();
    }

    public verplaatsBijlagenNaarMap(selectedBijlagen: Bijlage[], swId: string, mapId: Optional<string>, oudeMapId: Optional<string>) {
        const bijlagenInput = selectedBijlagen.map(jaarbijlageToJaarbijlageInput);

        this.dataClient
            .mutate({
                mutation: VerplaatsJaarbijlagenNaarMapBulkDocument,
                variables: {
                    jaarbijlagen: bijlagenInput,
                    swId,
                    jaarbijlageMapId: mapId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verplaatsJaarbijlagenNaarMapBulk: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: swId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    const selectedBijlagenIds = selectedBijlagen.map(toId);
                    if (oudeMapId) {
                        jaarbijlagen = mod('mappen', all(), 'bijlagen')(removeItems(selectedBijlagenIds))(jaarbijlagen);
                    } else {
                        jaarbijlagen = mod('bijlagen')(removeItems(selectedBijlagenIds))(jaarbijlagen);
                    }

                    if (mapId) {
                        jaarbijlagen = modBijlageMapBijlagen(mapId)(addItems(selectedBijlagen))(jaarbijlagen);
                        jaarbijlagen = modBijlageMapBijlagen(mapId)(herinitialiseerSorteringsnummersFn)(jaarbijlagen);
                    } else {
                        jaarbijlagen = mod('bijlagen')(addItems(selectedBijlagen))(jaarbijlagen);
                        jaarbijlagen = mod('bijlagen')(herinitialiseerSorteringsnummersFn)(jaarbijlagen);
                    }

                    jaarbijlagen = updateAll<JaarbijlageVoorAbstractSwQuery['jaarbijlageVoorAbstractSw']>(
                        set('mappen', all(), 'bijlagen', all(), 'isSelected')(false as any),
                        set('bijlagen', all(), 'isSelected')(false as any)
                    )(jaarbijlagen);

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: swId
                        }
                    });
                }
            })
            .subscribe();
    }

    public bijlagenToevoegenAanAbstractStudiewijzer(
        studiewijzerId: string,
        selectedBijlagen: Bijlage[],
        selectedBijlageMappen: BijlageMap[],
        jaarbijlageMapId: string,
        isSjabloon: boolean
    ) {
        const bijlagenInput = selectedBijlagen.map(jaarbijlageToJaarbijlageInput);
        const mappenInput = selectedBijlageMappen.map(toKopieerJaarbijlageMapInput);

        return this.dataClient.mutate({
            mutation: KopieerBijlagenDocument,
            variables: {
                identifier: studiewijzerId,
                voorSjabloon: isSjabloon,
                jaarbijlagen: bijlagenInput,
                jaarbijlageMappen: mappenInput,
                jaarbijlageMapId
            },
            optimisticResponse: {
                __typename: 'Mutation',
                kopieerBijlagen: kopieerBijlagenOptimisticResponse(
                    selectedBijlageMappen as BijlageMapFieldsFragment[],
                    selectedBijlagen as BijlageFieldsFragment[]
                )
            } as KopieerBijlagenMutation,
            update: (cache, { data }) => {
                let jaarbijlagen = cache.readQuery({
                    query: JaarbijlageVoorAbstractSwDocument,
                    variables: {
                        abstractSwId: studiewijzerId
                    }
                })!.jaarbijlageVoorAbstractSw;

                const nieuweMappen = data?.kopieerBijlagen.mappen;
                const nieuweBijlagen = data?.kopieerBijlagen.bijlagen;

                if (jaarbijlageMapId) {
                    jaarbijlagen = modBijlageMapBijlagen(jaarbijlageMapId)(addItems(nieuweBijlagen))(jaarbijlagen);
                    jaarbijlagen = modBijlageMapBijlagen(jaarbijlageMapId)(herinitialiseerSorteringsnummersFn)(jaarbijlagen);
                } else {
                    jaarbijlagen = updateAll<JaarbijlageVoorAbstractSwQuery['jaarbijlageVoorAbstractSw']>(
                        mod('mappen')(addItems(nieuweMappen)),
                        mod('bijlagen')(addItems(nieuweBijlagen))
                    )(jaarbijlagen);

                    jaarbijlagen = updateAll<JaarbijlageVoorAbstractSwQuery['jaarbijlageVoorAbstractSw']>(
                        mod('mappen')(herinitialiseerSorteringsnummersFn),
                        mod('bijlagen')(herinitialiseerSorteringsnummersFn)
                    )(jaarbijlagen);
                }

                cache.writeQuery({
                    query: JaarbijlageVoorAbstractSwDocument,
                    data: {
                        jaarbijlageVoorAbstractSw: jaarbijlagen
                    },
                    variables: {
                        abstractSwId: studiewijzerId
                    }
                });

                this.updateAantalBijlagenInStore(cache, jaarbijlagen, studiewijzerId, isSjabloon);
            }
        });
    }

    exporteerBijlagen(
        voorSjabloon: boolean,
        selectedBijlagen: Bijlage[],
        selectedBijlageMappen: BijlageMap[],
        selectedAbstractStudiewijzerIds: string[]
    ) {
        const jaarbijlagesInput = selectedBijlagen.map(jaarbijlageToJaarbijlageInput);
        const selectedMapIds = selectedBijlageMappen.map((selectedMap) => selectedMap.id);

        this.dataClient
            .mutate({
                mutation: ExporteerBijlagenDocument,
                variables: {
                    voorSjabloon,
                    jaarbijlagen: jaarbijlagesInput,
                    jaarbijlageMapIds: selectedMapIds,
                    abstractStudiewijzerIds: selectedAbstractStudiewijzerIds
                }
            })
            .subscribe();
    }

    public synchroniseerMetSjabloon(studiewijzerId: string, sjabloon: Sjabloon, bijlage: Bijlage, bijlageMapId?: string) {
        this.dataClient
            .mutate({
                mutation: SynchroniseerJaarbijlageMetSjabloonDocument,
                variables: {
                    jaarbijlageId: bijlage.id,
                    bijlageType: bijlage.type,
                    sjabloonId: sjabloon.id
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    synchroniseerJaarbijlageMetSjabloon: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: studiewijzerId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    if (bijlageMapId) {
                        jaarbijlagen = set(
                            'mappen',
                            matching({ id: bijlageMapId }),
                            'bijlagen',
                            matching({ id: bijlage.id }),
                            'synchroniseertMet'
                        )(sjabloon.naam)(jaarbijlagen as any);
                    } else {
                        jaarbijlagen = set('bijlagen', matching({ id: bijlage.id }), 'synchroniseertMet')(sjabloon.naam)(
                            jaarbijlagen as any
                        );
                    }

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    public synchroniseerMapMetSjabloon(studiewijzerId: string, sjabloon: Sjabloon, bijlageMap: BijlageMap) {
        this.dataClient
            .mutate({
                mutation: SynchroniseerJaarbijlageMapMetSjabloonDocument,
                variables: {
                    bijlageMapId: bijlageMap.id,
                    sjabloonId: sjabloon.id
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    synchroniseerJaarbijlageMapMetSjabloon: true
                },
                update: (cache) => {
                    let jaarbijlagen = cache.readQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        variables: {
                            abstractSwId: studiewijzerId
                        }
                    })!.jaarbijlageVoorAbstractSw;

                    jaarbijlagen = set('mappen', matching({ id: bijlageMap.id }), 'synchroniseertMet')(sjabloon.naam)(jaarbijlagen as any);

                    cache.writeQuery({
                        query: JaarbijlageVoorAbstractSwDocument,
                        data: {
                            jaarbijlageVoorAbstractSw: jaarbijlagen
                        },
                        variables: {
                            abstractSwId: studiewijzerId
                        }
                    });
                }
            })
            .subscribe();
    }

    verwijderBijlageDifferentiaties(bijlageId: string, isBestand: boolean) {
        this.dataClient
            .mutate({
                mutation: VerwijderBijlageDifferentiatiesDocument,
                variables: {
                    bijlageId,
                    isBestand
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderBijlageDifferentiaties: true
                },
                update: (cache) => {
                    cache.modify({
                        id: cache.identify({ __typename: 'Bijlage', id: bijlageId }),
                        fields: {
                            differentiatiegroepen: () => [] as Differentiatiegroep[],
                            differentiatieleerlingen: () => [] as Leerling[]
                        }
                    });
                }
            })
            .subscribe();
    }

    verwijderMapDifferentiaties(bijlageMapId: string) {
        this.dataClient
            .mutate({
                mutation: VerwijderMapDifferentiatiesDocument,
                variables: {
                    bijlageMapId
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    verwijderMapDifferentiaties: true
                },
                update: (cache) => {
                    cache.modify({
                        id: cache.identify({ __typename: 'BijlageMap', id: bijlageMapId }),
                        fields: {
                            differentiatiegroepen: () => [] as Differentiatiegroep[],
                            differentiatieleerlingen: () => [] as Leerling[]
                        }
                    });
                }
            })
            .subscribe();
    }
}
