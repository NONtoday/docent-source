import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map, of } from 'rxjs';
import { P, match } from 'ts-pattern';
import {
    AantalOngelezenLeerlingNotitiesDocument,
    AantalOngelezenStamgroepNotitiesDocument,
    ActueleNotitieItemsDocument,
    ActueleNotitiesDocument,
    BookmarkNotitieDocument,
    LeerlingAfspraakVakkenDocument,
    MarkeerAlleNotitiesGelezenDocument,
    MarkeerNotitieGelezenDocument,
    NotitieBetrokkeneToegang,
    NotitieBetrokkeneToegangDocument,
    NotitieContext,
    NotitieFieldsFragment,
    NotitieInput,
    NotitieLeerlingBetrokkeneFieldsFragmentDoc,
    NotitieVastprikkenDocument,
    NotitieZichtbaarheidInput,
    NotitieboekMenuDocument,
    NotitieboekMenuIndividueleMentorLeerlingenDocument,
    NotitieboekMenuLeerlingItemFieldsFragment,
    NotitieboekMenuLesgroepLeerlingenDocument,
    NotitieboekMenuSearchDocument,
    NotitieboekMenuStamgroepLeerlingenDocument,
    NotitiestreamDocument,
    OngelezenNotitiesAanwezigDocument,
    PartialLeerlingFragmentDoc,
    SaveNotitieDocument,
    UpdateZichtbaarheidNotitieDocument,
    VastgeprikteNotitiesDocument,
    VastgeprikteNotitiesPreviewDocument,
    VerwijderNotitieDocument,
    VestigingVakkenDocument,
    VestigingVakkenQuery,
    ZoekBetrokkenenDocument,
    ZoekBetrokkenenQuery,
    namedOperations
} from '../../../generated/_types';
import { notEqualsId } from '../../rooster-shared/utils/utils';
import { NotitieboekContext } from '../models/notitieboek.model';

@Injectable({
    providedIn: 'root'
})
export class NotitieboekDataService {
    private apollo = inject(Apollo);

    public notitiestream(context: NotitieContext, contextId: string, startSchooljaar?: number) {
        return this.apollo
            .watchQuery({
                query: NotitiestreamDocument,
                variables: {
                    notitieContext: context,
                    contextId,
                    startSchooljaar
                }
            })
            .valueChanges.pipe(map((result) => result.data.notitiestream));
    }

    public zoekBetrokkenen(
        zoekterm?: string,
        stamgroepId?: string,
        lesgroepId?: string
    ): Observable<ZoekBetrokkenenQuery['zoekBetrokkenen']> {
        return this.apollo
            .watchQuery({
                query: ZoekBetrokkenenDocument,
                variables: {
                    zoekterm,
                    stamgroepId,
                    lesgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.zoekBetrokkenen));
    }

    public getVestigingVakken(context: NotitieContext, contextId: string): Observable<VestigingVakkenQuery['vestigingVakken']> {
        return this.apollo
            .watchQuery({
                query: VestigingVakkenDocument,
                variables: {
                    notitieContext: context,
                    contextId
                }
            })
            .valueChanges.pipe(map((result) => result.data.vestigingVakken));
    }

    public saveNotitie(notitie: NotitieInput) {
        return this.apollo.mutate({
            mutation: SaveNotitieDocument,
            variables: {
                notitie
            },
            update: (cache) => {
                // Evict vastgeprikte notitie queries
                notitie.betrokkenen
                    .filter((betrokkene) => betrokkene.context === NotitieContext.LEERLING)
                    .forEach((betrokkene) => {
                        cache.evict({
                            fieldName: namedOperations.Query.vastgeprikteNotitiesPreview,
                            args: {
                                leerlingId: betrokkene.id
                            }
                        });
                        cache.evict({
                            fieldName: namedOperations.Query.vastgeprikteNotities,
                            args: {
                                leerlingId: betrokkene.id
                            }
                        });
                    });

                // Bestaande notitie wordt automatisch al via de cache geupdate.
                if (notitie.id) return;

                const query: any = Object.values(cache.extract()).filter((o: any) => o['__typename'] === 'Query')[0];
                if (!query) {
                    cache.evict({ fieldName: namedOperations.Query.notitiestream });
                    cache.gc();
                    return;
                }

                // Alle notitiestreams evicten behalve de huidige (refetchquery), we weten hier namelijk niet welke specifieke notitieboeken ververst moeten worden i.v.m. lesgroep/stamgroep deelnames.
                Object.keys(query)
                    .filter((key) => key.startsWith('notitiestream'))
                    .forEach((key) => cache.evict({ fieldName: key }));
                cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                cache.gc();
            }
        });
    }

    public bookmark(notitie: NotitieFieldsFragment, context: NotitieContext, contextId: string) {
        return this.apollo
            .mutate({
                mutation: BookmarkNotitieDocument,
                variables: {
                    notitieId: notitie.id,
                    notitieContext: context,
                    contextId: contextId,
                    bookmarked: !notitie.bookmarked
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    bookmarkNotitie: {
                        __typename: 'Notitie',
                        ...notitie,
                        bookmarked: !notitie.bookmarked
                    }
                }
            })
            .subscribe();
    }

    public vastprikken(notitie: NotitieFieldsFragment, context: NotitieContext, contextId: string) {
        return this.apollo
            .mutate({
                mutation: NotitieVastprikkenDocument,
                variables: {
                    notitieId: notitie.id,
                    notitieContext: context,
                    contextId: contextId,
                    vastgeprikt: !notitie.vastgeprikt
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    notitieVastprikken: {
                        __typename: 'Notitie',
                        ...notitie,
                        vastgeprikt: !notitie.vastgeprikt
                    }
                },
                update: (cache) => {
                    // Evict alle vastgeprikte notitie-queries
                    notitie.leerlingBetrokkenen
                        .map((betrokkene) => betrokkene?.leerling?.id)
                        .filter(Boolean)
                        .forEach((leerlingId) => {
                            cache.evict({
                                fieldName: namedOperations.Query.vastgeprikteNotitiesPreview,
                                args: {
                                    leerlingId
                                }
                            });
                            cache.evict({
                                fieldName: namedOperations.Query.vastgeprikteNotities,
                                args: {
                                    leerlingId
                                }
                            });
                        });

                    cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                }
            })
            .subscribe();
    }

    public markeerGelezen(notitie: NotitieFieldsFragment, context: NotitieboekContext) {
        if (notitie.gelezenOp) {
            return;
        }
        return this.apollo
            .mutate({
                mutation: MarkeerNotitieGelezenDocument,
                variables: {
                    notitieId: notitie.id,
                    notitieContext: context.context,
                    contextId: context.id
                },
                update: (cache) => {
                    // Update NotitieStream
                    const streamQuery = cache.readQuery({
                        query: NotitiestreamDocument,
                        variables: {
                            notitieContext: context.context,
                            contextId: context.id
                        }
                    });

                    if (streamQuery) {
                        const isLaatsteOngelezenNotitie =
                            streamQuery.notitiestream
                                .flatMap((week) => week.notities)
                                .filter((n) => !n.gelezenOp)
                                .filter(notEqualsId(notitie.id)).length === 0;

                        if (isLaatsteOngelezenNotitie) {
                            cache.evict({ fieldName: namedOperations.Query.ongelezenNotitiesAanwezig });

                            const __typename = match(context.context)
                                .with(NotitieContext.LEERLING, () => 'NotitieboekMenuLeerlingItem')
                                .with(NotitieContext.LESGROEP, () => 'NotitieboekMenuLesgroepItem')
                                .with(NotitieContext.STAMGROEP, () => 'NotitieboekMenuStamgroepItem')
                                .exhaustive();

                            cache.modify({
                                id: cache.identify({ __typename, id: context.id }),
                                fields: {
                                    ongelezenNotitieAanwezig: () => null
                                }
                            });
                        }
                    }

                    cache.evict({ fieldName: namedOperations.Query.aantalOngelezenStamgroepNotities });
                    cache.evict({ fieldName: namedOperations.Query.aantalOngelezenLeerlingNotities });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                }
            })
            .subscribe();
    }

    public verwijderNotitie(notitieId: string) {
        return this.apollo
            .mutate({
                mutation: VerwijderNotitieDocument,
                variables: {
                    notitieId
                },
                optimisticResponse: {
                    verwijderNotitie: true
                },
                update: (cache) => {
                    cache.evict({
                        id: cache.identify({ id: notitieId, __typename: 'Notitie' })
                    });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                    cache.gc();
                }
            })
            .subscribe();
    }

    public updateZichtbaarheid(notitie: NotitieFieldsFragment, notitieZichtbaarheid: NotitieZichtbaarheidInput) {
        return this.apollo
            .mutate({
                mutation: UpdateZichtbaarheidNotitieDocument,
                variables: {
                    notitieId: notitie.id,
                    notitieZichtbaarheid
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    updateZichtbaarheidNotitie: {
                        __typename: 'Notitie',
                        ...notitie,
                        gedeeldVoorDocenten: notitieZichtbaarheid.gedeeldVoorDocenten,
                        gedeeldVoorMentoren: notitieZichtbaarheid.gedeeldVoorMentoren,
                        reactiesToegestaan: notitieZichtbaarheid.reactiesToegestaan
                    }
                },
                update: (cache) => {
                    cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                }
            })
            .subscribe();
    }

    public getNotitieBetrokkeneToegang(
        notitie: NotitieFieldsFragment,
        notitieContext: NotitieContext,
        contextId: string
    ): Observable<NotitieBetrokkeneToegang[]> {
        const betrokkene = [...notitie.leerlingBetrokkenen, ...notitie.lesgroepBetrokkenen, ...notitie.stamgroepBetrokkenen];
        return betrokkene.length === 1
            ? of([{ betrokkeneId: betrokkene[0].id, notitieboekToegankelijk: true }])
            : this.apollo
                  .query({
                      query: NotitieBetrokkeneToegangDocument,
                      variables: {
                          notitieId: notitie.id,
                          notitieContext,
                          contextId
                      }
                  })
                  .pipe(map((result) => result.data.notitieBetrokkeneToegang));
    }

    public notitieboekMenu() {
        return this.apollo
            .watchQuery({
                query: NotitieboekMenuDocument
            })
            .valueChanges.pipe(map((result) => result.data.notitieboekMenu));
    }

    public notitieboekMenuSearch(zoekterm: string) {
        return this.apollo
            .watchQuery({
                query: NotitieboekMenuSearchDocument,
                variables: {
                    zoekterm
                }
            })
            .valueChanges.pipe(map((result) => result.data.notitieboekMenuSearch));
    }

    public notitieboekMenuIndividueleMentorLeerlingen() {
        return this.apollo
            .watchQuery({
                query: NotitieboekMenuIndividueleMentorLeerlingenDocument
            })
            .valueChanges.pipe(map((result) => result.data.notitieboekMenuIndividueleMentorLeerlingen));
    }

    public notitieboekMenuLesgroepLeerlingen(lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: NotitieboekMenuLesgroepLeerlingenDocument,
                variables: {
                    lesgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.notitieboekMenuLesgroepLeerlingen));
    }

    public notitieboekMenuStamgroepLeerlingen(stamgroepId: string) {
        return this.apollo
            .watchQuery({
                query: NotitieboekMenuStamgroepLeerlingenDocument,
                variables: {
                    stamgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.notitieboekMenuStamgroepLeerlingen));
    }

    public groepNamenVanLeerling(leerlingId: string, stamgroep: boolean) {
        return stamgroep ? this.stamgroepNaamVanLeerling(leerlingId) : this.lesgroepNamenVanLeerling(leerlingId);
    }

    private lesgroepNamenVanLeerling(leerlingId: string) {
        return this.apollo.client.cache.readFragment<Pick<NotitieboekMenuLeerlingItemFieldsFragment, 'leerlingGroepNamen'>>({
            fragment: gql`
                fragment leerlingGroepNamen on NotitieboekMenuLeerlingItem {
                    leerlingGroepNamen
                }
            `,
            id: this.apollo.client.cache.identify({ id: leerlingId, __typename: 'NotitieboekMenuLeerlingItem' })
        })?.leerlingGroepNamen;
    }

    public actueleNotitieItems(afspraakId: string) {
        return this.apollo
            .watchQuery({
                query: ActueleNotitieItemsDocument,
                variables: {
                    afspraakId
                }
            })
            .valueChanges.pipe(map((result) => result.data.actueleNotitieItems));
    }

    private stamgroepNaamVanLeerling(leerlingId: string) {
        return this.apollo.client.cache.readFragment<Pick<NotitieboekMenuLeerlingItemFieldsFragment, 'leerlingStamgroepNaam'>>({
            fragment: gql`
                fragment leerlingStamgroepNaam on NotitieboekMenuLeerlingItem {
                    leerlingStamgroepNaam
                }
            `,
            id: this.apollo.client.cache.identify({ id: leerlingId, __typename: 'NotitieboekMenuLeerlingItem' })
        })?.leerlingStamgroepNaam;
    }

    public notitieLeerlingBetrokkeneFromCache(leerlingId: string) {
        return this.apollo.client.cache.readFragment({
            fragment: {
                ...NotitieLeerlingBetrokkeneFieldsFragmentDoc,
                // nodig ivm nested fragments icm dedupeFragments optie -> https://github.com/dotansimha/graphql-code-generator/issues/6491
                definitions: [...NotitieLeerlingBetrokkeneFieldsFragmentDoc.definitions, ...PartialLeerlingFragmentDoc.definitions]
            },
            fragmentName: namedOperations.Fragment.notitieLeerlingBetrokkeneFields,
            id: this.apollo.client.cache.identify({ id: leerlingId, __typename: 'NotitieLeerlingBetrokkene' })
        });
    }

    public markeerAllesGelezen() {
        return this.apollo
            .mutate({
                mutation: MarkeerAlleNotitiesGelezenDocument,
                update: (cache) => {
                    const types = [
                        'Notitie',
                        'NotitieboekMenuLeerlingItem',
                        'NotitieboekMenuLesgroepItem',
                        'NotitieboekMenuStamgroepItem',
                        'NotitieboekMenuGroep'
                    ] as const;
                    const extractedCache: { __typename: (typeof types)[number]; id: string }[] = cache.extract();

                    const items = Object.values(extractedCache).filter((item) => types.includes(item.__typename));

                    items.forEach((item) =>
                        match(item)
                            .with({ __typename: 'Notitie' }, () =>
                                cache.modify({
                                    id: cache.identify(item),
                                    fields: {
                                        gelezenOp: () => new Date()
                                    }
                                })
                            )
                            .with(
                                {
                                    __typename: P.union(
                                        'NotitieboekMenuLeerlingItem',
                                        'NotitieboekMenuLesgroepItem',
                                        'NotitieboekMenuStamgroepItem'
                                    )
                                },
                                () =>
                                    cache.modify({
                                        id: cache.identify(item),
                                        fields: {
                                            ongelezenNotitieAanwezig: () => null
                                        }
                                    })
                            )
                            .with({ __typename: 'NotitieboekMenuGroep' }, () =>
                                cache.modify({
                                    id: cache.identify(item),
                                    fields: {
                                        ongelezenGroepsnotitieAanwezig: () => null
                                    }
                                })
                            )
                            .exhaustive()
                    );

                    const menuQuery = cache.readQuery({
                        query: NotitieboekMenuDocument
                    });
                    if (menuQuery) {
                        cache.writeQuery({
                            query: NotitieboekMenuDocument,
                            data: {
                                ...menuQuery,
                                notitieboekMenu: {
                                    ...menuQuery.notitieboekMenu,
                                    ongelezen: [],
                                    mentorLeerlingOngelezenNotitieAanwezig: null
                                }
                            }
                        });
                    }

                    // hoofdmenu item notificatie weghalen
                    cache.writeQuery({
                        query: OngelezenNotitiesAanwezigDocument,
                        data: { ongelezenNotitiesAanwezig: false }
                    });

                    // Verwijder alle cache-resultaten aantalOngelezenLeerlingNotities
                    cache.evict({
                        fieldName: namedOperations.Query.aantalOngelezenLeerlingNotities
                    });
                    // Verwijder alle cache-resultaten aantalOngelezenStamgroepNotities
                    cache.evict({
                        fieldName: namedOperations.Query.aantalOngelezenStamgroepNotities
                    });

                    cache.evict({ fieldName: namedOperations.Query.actueleNotitieItems });
                    cache.evict({ fieldName: namedOperations.Query.actueleNotities });
                }
            })
            .subscribe();
    }

    evictNotitieboekMenuQuery() {
        this.apollo.client.cache.evict({ fieldName: namedOperations.Query.notitieboekMenu });
        this.apollo.client.cache.evict({ fieldName: namedOperations.Query.notitieboekMenuSearch });
        // geen cache.gc, omdat de groepnaam nog uit een NotitieboekMenuLeerlingItem moet worden gehaald.
        // Deze items worden verwijderd door de gc, omdat er geen referentie meer naar is vanuit de queries hierboven.
    }

    public getAantalOngelezenLeerlingNotities(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: AantalOngelezenLeerlingNotitiesDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.aantalOngelezenLeerlingNotities));
    }

    public getAantalOngelezenStamgroepNotities(stamgroepId: string) {
        return this.apollo
            .watchQuery({
                query: AantalOngelezenStamgroepNotitiesDocument,
                variables: {
                    stamgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.aantalOngelezenStamgroepNotities));
    }

    public getVastgeprikteNotitiesPreview(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: VastgeprikteNotitiesPreviewDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.vastgeprikteNotitiesPreview));
    }

    public getVastgeprikteNotities(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: VastgeprikteNotitiesDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.vastgeprikteNotities));
    }

    public getActueleNotities(context: NotitieContext, contextId: string) {
        return this.apollo
            .watchQuery({
                query: ActueleNotitiesDocument,
                variables: {
                    context,
                    contextId
                }
            })
            .valueChanges.pipe(map((result) => result.data.actueleNotities));
    }

    public getLeerlingAfspraakVakken(leerlingId: string, afspraakId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingAfspraakVakkenDocument,
                variables: {
                    leerlingId,
                    afspraakId
                }
            })
            .valueChanges.pipe(map((res) => res.data.leerlingAfspraakVakken));
    }
}
