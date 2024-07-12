import { Injectable, inject } from '@angular/core';
import { ApolloCache, ApolloQueryResult, FetchResult, WatchQueryFetchPolicy } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { getYear } from 'date-fns';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { matching, mod, set } from 'shades';
import {
    AantalInleveropdrachtenVanSchooljaarVerlopenDocument,
    AantalInleveropdrachtenVanSchooljaarVerlopenQuery,
    AfspraakToekenning,
    BoodschapBijlage,
    DagToekenning,
    DeleteAfspraakToekenningDocument,
    DeleteDagToekenningDocument,
    DownloadLaatsteOpdrachtenVanStatussenDocument,
    DownloadOpdrachtenInBulkDocument,
    Inlevering,
    InleveringBericht,
    InleveringStatus,
    InleveringenConversatieDocument,
    InleveringenConversatieQuery,
    InleveringenDocument,
    InleveringenOverzichtDocument,
    InleveringenOverzichtQuery,
    InleveringenQuery,
    InleveropdrachtenVanSchooljaarAankomendDocument,
    InleveropdrachtenVanSchooljaarAankomendQuery,
    InleveropdrachtenVanSchooljaarVerlopenDocument,
    InleveropdrachtenVanSchooljaarVerlopenQuery,
    Medewerker,
    PlagiaatInfo,
    PlagiaatInfoDocument,
    PlagiaatType,
    PollPlagiaatVerwerkingStatusDocument,
    PollPlagiaatVerwerkingStatusQuery,
    SaveAfspraakToekenningDocument,
    SaveDagToekenningInleveropdrachtenDocument,
    SaveDagToekenningInleveropdrachtenMutation,
    SaveDagToekenningMutationVariables,
    SimilarityReportUrlDocument,
    SimilarityReportUrlQuery,
    StartPlagiaatcontroleDocument,
    Toekenning,
    UpdateInleveringenStatusDocument,
    VerstuurInleveringReactieDocument,
    VerstuurInleveringReactieMutationVariables,
    VerstuurInleveringReactiesDocument,
    VerstuurInleveringReactiesMutationVariables,
    VerwijderOngelezenInleveringenDocument,
    namedOperations
} from '../../../generated/_types';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { addItem, equalsId, isPresent, notEqualsId, sortLocale, toId } from '../../rooster-shared/utils/utils';
import { convertToAfspraakToekenningInput, convertToDagToekenningInput } from '../converters/toekenningen.converters';
import { InleveropdrachtBericht } from '../models/inleveropdrachten/inleveropdrachten.model';

@Injectable({
    providedIn: 'root'
})
export class InleveropdrachtenDataService {
    private dataClient = inject(Apollo);
    public cache: ApolloCache<any>;

    constructor() {
        this.cache = this.dataClient.client.cache;
    }

    removeInleveringenEnConversatieFromCache() {
        this.cache.evict({ fieldName: 'inleveringen' });
        this.cache.evict({ fieldName: 'inleveringenConversatie' });
    }

    public readInleveropdrachtenVanSchooljaarAankomendFromCache(
        schooljaar: number
    ): InleveropdrachtenVanSchooljaarAankomendQuery['inleveropdrachtenVanSchooljaarAankomend'] | undefined {
        const data = this.cache.readQuery({
            query: InleveropdrachtenVanSchooljaarAankomendDocument,
            variables: { schooljaar }
        })?.inleveropdrachtenVanSchooljaarAankomend;

        return data ? sortLocale(data, ['studiewijzeritem.inleverperiode.eind']) : undefined;
    }

    public readInleveropdrachtenVanSchooljaarVerlopenFromCache(
        schooljaar: number
    ): InleveropdrachtenVanSchooljaarVerlopenQuery['inleveropdrachtenVanSchooljaarVerlopen'] | undefined {
        const data = this.cache.readQuery({
            query: InleveropdrachtenVanSchooljaarVerlopenDocument,
            variables: { schooljaar }
        })?.inleveropdrachtenVanSchooljaarVerlopen;

        return data ? sortLocale(data, ['studiewijzeritem.inleverperiode.eind']) : undefined;
    }

    public getInleveropdrachtenVanSchooljaarAankomend(
        schooljaar: number
    ): Observable<InleveropdrachtenVanSchooljaarAankomendQuery['inleveropdrachtenVanSchooljaarAankomend']> {
        return this.dataClient
            .watchQuery({
                query: InleveropdrachtenVanSchooljaarAankomendDocument,
                variables: {
                    schooljaar
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((res) => !!res.data),
                map((res) => res.data.inleveropdrachtenVanSchooljaarAankomend)
            );
    }

    public getInleveropdrachtenVanSchooljaarVerlopen(
        schooljaar: number
    ): Observable<InleveropdrachtenVanSchooljaarVerlopenQuery['inleveropdrachtenVanSchooljaarVerlopen']> {
        return this.dataClient
            .watchQuery({
                query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                variables: {
                    schooljaar
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((res) => !!res.data),
                map((res) => res.data.inleveropdrachtenVanSchooljaarVerlopen)
            );
    }

    public getAantalInleveropdrachtenVanSchooljaarVerlopen(
        schooljaar: number
    ): Observable<AantalInleveropdrachtenVanSchooljaarVerlopenQuery['aantalInleveropdrachtenVanSchooljaarVerlopen']> {
        return this.dataClient
            .watchQuery({
                query: AantalInleveropdrachtenVanSchooljaarVerlopenDocument,
                variables: {
                    schooljaar
                },
                fetchPolicy: 'cache-and-network',
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((res) => !!res.data),
                map((res) => res.data.aantalInleveropdrachtenVanSchooljaarVerlopen)
            );
    }

    public saveDagToekenning$(
        toekenningen: DagToekenning[],
        refetchQueries: string[] = []
    ): Observable<FetchResult<SaveDagToekenningInleveropdrachtenMutation>> {
        const toSaveToekenningen: SaveDagToekenningMutationVariables['toekenningInput'] = toekenningen.map((toekenning: DagToekenning) =>
            convertToDagToekenningInput(toekenning)
        ) as SaveDagToekenningMutationVariables['toekenningInput'];

        return this.dataClient.mutate({
            mutation: SaveDagToekenningInleveropdrachtenDocument,
            variables: {
                toekenningInput: toSaveToekenningen
            },
            update: (cache, response) => {
                const isVerlopen = response.data!.saveDagToekenning.toekenningen[0].datum < new Date();
                const schooljaar = getYear(getSchooljaar(toekenningen[0].datum).start);
                const queryVerlopen = cache.readQuery({
                    query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                    variables: {
                        schooljaar
                    }
                });

                // Update cache niet als de query nog niet is uitgevoerd
                if (isVerlopen && !queryVerlopen) {
                    return;
                }

                const cacheOpdrachten =
                    isVerlopen && queryVerlopen
                        ? cache.readQuery({
                              query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                              variables: {
                                  schooljaar
                              }
                          })!.inleveropdrachtenVanSchooljaarVerlopen
                        : cache.readQuery({
                              query: InleveropdrachtenVanSchooljaarAankomendDocument,
                              variables: {
                                  schooljaar
                              }
                          })!.inleveropdrachtenVanSchooljaarAankomend;

                // Copy zodat het een nieuw object is voor de cache
                let opdrachten = [...cacheOpdrachten];

                const resultOpdrachten = response.data!.saveDagToekenning.toekenningen.map((toekenning) => ({
                    ...toekenning,
                    isStartInleverperiode: false
                }));
                resultOpdrachten.forEach((resultOpdracht) => {
                    const index = opdrachten.findIndex(equalsId(resultOpdracht.id));
                    if (index > -1) {
                        opdrachten[index] = resultOpdracht;
                    } else {
                        opdrachten = [...opdrachten, resultOpdracht];
                    }
                });

                if (isVerlopen && queryVerlopen) {
                    cache.writeQuery({
                        query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                        variables: {
                            schooljaar
                        },
                        data: { inleveropdrachtenVanSchooljaarVerlopen: opdrachten }
                    });
                } else {
                    cache.writeQuery({
                        query: InleveropdrachtenVanSchooljaarAankomendDocument,
                        variables: {
                            schooljaar
                        },
                        data: { inleveropdrachtenVanSchooljaarAankomend: opdrachten }
                    });
                }
            },
            refetchQueries: [namedOperations.Query.aantalInleveropdrachtenVanSchooljaarVerlopen, ...refetchQueries]
        });
    }

    public getInleveringenOverzicht(
        toekenningId: string,
        fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network'
    ): Observable<InleveringenOverzichtQuery['inleveringenOverzicht']> {
        return this.dataClient
            .watchQuery({
                query: InleveringenOverzichtDocument,
                variables: {
                    toekenningId
                },
                fetchPolicy,
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.inleveringenOverzicht)
            );
    }

    public updateAfspraakToekenning$(toekenning: AfspraakToekenning) {
        const aanTePassenToekenning = { ...toekenning };

        return this.dataClient.mutate({
            mutation: SaveAfspraakToekenningDocument,
            variables: {
                toekenningInput: convertToAfspraakToekenningInput(<AfspraakToekenning>aanTePassenToekenning)
            },
            update: (cache, response) => {
                const isVerlopen = response.data!.saveAfspraakToekenning.toekenningen[0].afgerondOpDatumTijd < new Date();
                const schooljaar = getYear(getSchooljaar(toekenning.afgerondOpDatumTijd).start);
                const queryVerlopen = cache.readQuery({
                    query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                    variables: {
                        schooljaar
                    }
                });

                /* Update cache niet als de query nog niet is uitgevoerd.
                Dit moet alleen voor de verlopen opdrachten aangezien de aankomende opdrachten worden
                opgehaald in de ngOnInit van het inleveropdrachten overzicht component */
                if (isVerlopen && !queryVerlopen) {
                    return;
                }

                const cacheOpdrachten =
                    isVerlopen && queryVerlopen
                        ? cache.readQuery({
                              query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                              variables: {
                                  schooljaar
                              }
                          })!.inleveropdrachtenVanSchooljaarVerlopen
                        : cache.readQuery({
                              query: InleveropdrachtenVanSchooljaarAankomendDocument,
                              variables: {
                                  schooljaar
                              }
                          })!.inleveropdrachtenVanSchooljaarAankomend;

                // Copy zodat het een nieuw object is voor de cache
                let opdrachten = [...cacheOpdrachten];

                const result = response.data!.saveAfspraakToekenning.toekenningen.map((toekenning) => ({
                    ...toekenning,
                    isStartInleverperiode: false
                }))[0];

                const index = opdrachten.findIndex(equalsId(result.id));
                if (index > -1) {
                    opdrachten[index] = result;
                } else {
                    opdrachten = [...opdrachten, result];
                }

                if (isVerlopen && queryVerlopen) {
                    cache.writeQuery({
                        query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                        variables: {
                            schooljaar
                        },
                        data: { inleveropdrachtenVanSchooljaarVerlopen: opdrachten }
                    });
                } else {
                    cache.writeQuery({
                        query: InleveropdrachtenVanSchooljaarAankomendDocument,
                        variables: {
                            schooljaar
                        },
                        data: { inleveropdrachtenVanSchooljaarAankomend: opdrachten }
                    });
                }
            },
            refetchQueries: [
                namedOperations.Query.inleveringenOverzicht,
                namedOperations.Query.aantalInleveropdrachtenVanSchooljaarVerlopen
            ]
        });
    }

    public getInleveringen(toekenningId: string, inleveraarId: string): Observable<InleveringenQuery['inleveringen']> {
        return this.dataClient
            .watchQuery({
                query: InleveringenDocument,
                variables: {
                    toekenningId,
                    inleveraarId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.inleveringen)
            );
    }

    updateInleveringenStatus = (toekenningId: string, inleveraarId: string, inleveringStatus: InleveringStatus) =>
        this.updateInleveringenStatus$(toekenningId, inleveraarId, inleveringStatus).subscribe();

    public updateInleveringenStatus$(toekenningId: string, inleveraarId: string, inleveringStatus: InleveringStatus) {
        return this.dataClient.mutate({
            mutation: UpdateInleveringenStatusDocument,
            variables: {
                toekenningId,
                inleveraarId,
                inleveringStatus
            },
            refetchQueries: [namedOperations.Query.inleveringenConversatie, namedOperations.Query.inleveringenOverzicht],
            update: (cache, { data }) => {
                const inleveringenRes = cache.readQuery({
                    query: InleveringenDocument,
                    variables: {
                        toekenningId,
                        inleveraarId
                    }
                })!.inleveringen;

                const updatedInleveringen = inleveringenRes.map(
                    (inlevering: Inlevering) => data?.updateInleveringenStatus.find(equalsId(inlevering.id)) ?? inlevering
                );

                cache.writeQuery({
                    query: InleveringenDocument,
                    variables: {
                        toekenningId,
                        inleveraarId
                    },
                    data: { inleveringen: updatedInleveringen }
                });
            }
        });
    }

    public downloadOpdrachtenVanStatussen$(toekenningId: string, statussen: InleveringStatus[]) {
        return this.dataClient.mutate({
            mutation: DownloadLaatsteOpdrachtenVanStatussenDocument,
            variables: {
                toekenningId,
                statussen
            },
            update: (cache) => {
                if (statussen.includes(InleveringStatus.TE_BEOORDELEN)) {
                    const overzicht = cache.readQuery({
                        query: InleveringenOverzichtDocument,
                        variables: {
                            toekenningId
                        }
                    })!.inleveringenOverzicht;

                    const newOverzicht: InleveringenOverzichtQuery['inleveringenOverzicht'] = {
                        ...overzicht,
                        teBeoordelen: [],
                        nieuw: [],
                        inBeoordeling: [...overzicht.inBeoordeling, ...overzicht.teBeoordelen]
                    };

                    cache.writeQuery({
                        query: InleveringenOverzichtDocument,
                        variables: {
                            toekenningId
                        },
                        data: { inleveringenOverzicht: newOverzicht }
                    });

                    overzicht.teBeoordelen.forEach((inleveraar) => {
                        // moet nog een try catch omheen, vanwege apollo's onbegrijpelijke api keuzes
                        // https://github.com/apollographql/apollo-feature-requests/issues/1
                        try {
                            const inleveringenRes =
                                cache.readQuery({
                                    query: InleveringenDocument,
                                    variables: {
                                        toekenningId,
                                        inleveraarId: inleveraar.id
                                    }
                                })?.inleveringen ?? [];

                            inleveringenRes
                                .filter((inlevering) => inlevering.status === InleveringStatus.TE_BEOORDELEN)
                                .forEach((inlevering) => {
                                    cache.modify({
                                        id: cache.identify({ __typename: 'Inlevering', id: inlevering.id }),
                                        fields: {
                                            status: () => InleveringStatus.IN_BEOORDELING
                                        }
                                    });
                                });
                        } catch (error) {
                            // do nothing
                        }
                    });
                }
            }
        });
    }

    public downloadInBulk$(toekenningId: string, inleveringen: Inlevering[], inleveraarId: string) {
        return this.dataClient.mutate({
            mutation: DownloadOpdrachtenInBulkDocument,
            variables: {
                toekenningId,
                inleveringenIds: inleveringen.map(toId)
            },
            update: (cache) => {
                inleveringen
                    .filter((inlevering) => inlevering.status === InleveringStatus.TE_BEOORDELEN)
                    .forEach((inlevering) => {
                        cache.modify({
                            id: cache.identify({ __typename: 'Inlevering', id: inlevering.id }),
                            fields: {
                                status: () => InleveringStatus.IN_BEOORDELING
                            }
                        });
                    });

                if (inleveringen.some((inlevering) => inlevering.status === InleveringStatus.TE_BEOORDELEN)) {
                    const overzicht = cache.readQuery({
                        query: InleveringenOverzichtDocument,
                        variables: {
                            toekenningId
                        }
                    })!.inleveringenOverzicht;

                    const newOverzicht: InleveringenOverzichtQuery['inleveringenOverzicht'] = {
                        ...overzicht,
                        inBeoordeling: [...overzicht.inBeoordeling, ...overzicht.teBeoordelen.filter((entry) => entry.id === inleveraarId)],
                        teBeoordelen: [...overzicht.teBeoordelen.filter((entry) => entry.id !== inleveraarId)],
                        nieuw: [...overzicht.nieuw.filter((entry) => entry.inleveraar.id !== inleveraarId)]
                    };

                    cache.writeQuery({
                        query: InleveringenOverzichtDocument,
                        variables: {
                            toekenningId
                        },
                        data: { inleveringenOverzicht: newOverzicht }
                    });
                }
            }
        });
    }

    public verwijderOngelezenInleveringen(toekenningId: string, inleveraarId: string) {
        this.dataClient
            .mutate({
                mutation: VerwijderOngelezenInleveringenDocument,
                variables: {
                    toekenningId,
                    inleveraarId
                }
            })
            .subscribe((result) => {
                // Handmatig refetchen als er ongelezen inleveringen verwijderd zijn.
                if (result.data && result.data.verwijderOngelezenInleveringen > 0) {
                    this.getInleveringenOverzicht(toekenningId, 'network-only').pipe(take(1)).subscribe();
                }
            });
    }

    public verwijderInleveropdracht(inleveropdracht: Toekenning) {
        let query;

        if ((<DagToekenning>inleveropdracht).datum) {
            query = DeleteDagToekenningDocument;
        } else if ((<AfspraakToekenning>inleveropdracht).afgerondOpDatumTijd) {
            query = DeleteAfspraakToekenningDocument;
        }

        const schooljaar = getYear(getSchooljaar(inleveropdracht.studiewijzeritem.inleverperiode!.eind).start);

        return this.dataClient
            .mutate({
                mutation: query as any,
                variables: {
                    toekenningId: inleveropdracht.id,
                    verwijderUitSjabloon: false
                },
                update: (cache) => {
                    if (inleveropdracht.studiewijzeritem.inleverperiode!.eind < new Date()) {
                        let toekenningsDataVerlopen = cache.readQuery({
                            query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                            variables: {
                                schooljaar
                            }
                        })!;

                        toekenningsDataVerlopen = {
                            ...toekenningsDataVerlopen,
                            inleveropdrachtenVanSchooljaarVerlopen: toekenningsDataVerlopen.inleveropdrachtenVanSchooljaarVerlopen.filter(
                                notEqualsId(inleveropdracht.id)
                            )
                        };

                        cache.writeQuery({
                            query: InleveropdrachtenVanSchooljaarVerlopenDocument,
                            data: toekenningsDataVerlopen,
                            variables: {
                                schooljaar
                            }
                        });

                        cache.evict({ fieldName: namedOperations.Query.aantalInleveropdrachtenVanSchooljaarVerlopen });
                    } else {
                        let toekenningDataAankomend = cache.readQuery({
                            query: InleveropdrachtenVanSchooljaarAankomendDocument,
                            variables: {
                                schooljaar
                            }
                        })!;

                        toekenningDataAankomend = {
                            ...toekenningDataAankomend,
                            inleveropdrachtenVanSchooljaarAankomend: toekenningDataAankomend.inleveropdrachtenVanSchooljaarAankomend.filter(
                                notEqualsId(inleveropdracht.id)
                            )
                        };

                        cache.writeQuery({
                            query: InleveropdrachtenVanSchooljaarAankomendDocument,
                            data: toekenningDataAankomend,
                            variables: {
                                schooljaar
                            }
                        });
                    }
                }
            })
            .subscribe();
    }

    public getConversatie(toekenningId: string, inleveraarId: string): Observable<InleveringenConversatieQuery['inleveringenConversatie']> {
        return this.dataClient
            .watchQuery({
                query: InleveringenConversatieDocument,
                variables: {
                    toekenningId,
                    inleveraarId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.inleveringenConversatie)
            );
    }

    public verstuurInleveringReactie(toekenningId: string, inleveraarId: string, bericht: InleveropdrachtBericht, medewerker: Medewerker) {
        const boodschapInput: VerstuurInleveringReactieMutationVariables['boodschapInput'] = {
            inhoud: bericht.inhoud,
            uploadContextIds: bericht.bijlagen.map((bijlage) => bijlage.uploadContextId).filter(isPresent)
        };

        return this.dataClient.mutate({
            mutation: VerstuurInleveringReactieDocument,
            variables: {
                toekenningId,
                inleveraarId,
                boodschapInput
            },
            optimisticResponse: { verstuurInleveringReactie: true },
            update: (cache) => {
                const boodschap = {
                    __typename: 'InleveringBericht',
                    id: new Date().toString(),
                    onderwerp: '',
                    inhoud: boodschapInput.inhoud,
                    verzender: medewerker,
                    verzendDatum: new Date(),
                    bijlagen: bericht.bijlagen.map((bijlage) => ({
                        ...bijlage,
                        id: new Date().toString(),
                        contentType: '',
                        extensie: ''
                    }))
                };

                let conversatie = cache.readQuery({
                    query: InleveringenConversatieDocument,
                    variables: {
                        toekenningId,
                        inleveraarId
                    }
                })!;

                conversatie = mod('inleveringenConversatie')(addItem(boodschap))(conversatie);

                cache.writeQuery({
                    query: InleveringenConversatieDocument,
                    data: conversatie,
                    variables: {
                        toekenningId,
                        inleveraarId
                    }
                });
            }
        });
    }

    public verstuurInleveringReacties(toekenningId: string, bulkBericht: InleveropdrachtBericht, medewerker: Medewerker) {
        const boodschapInput: VerstuurInleveringReactiesMutationVariables['boodschapInput'] = {
            ontvangerIds: bulkBericht.ontvangerIds,
            inhoud: bulkBericht.inhoud,
            uploadContextIds: bulkBericht.bijlagen.map((bijlage) => bijlage.uploadContextId).filter(isPresent)
        };
        return this.dataClient.mutate({
            mutation: VerstuurInleveringReactiesDocument,
            variables: {
                toekenningId,
                boodschapInput
            },
            optimisticResponse: { verstuurInleveringReacties: true },
            update: (cache) => {
                const boodschap: InleveringBericht = {
                    __typename: 'InleveringBericht',
                    id: new Date().toString(),
                    onderwerp: '',
                    inhoud: boodschapInput.inhoud,
                    verzender: medewerker,
                    verzendDatum: new Date(),
                    bijlagen: bulkBericht.bijlagen.map(
                        (bijlage) =>
                            ({
                                __typename: 'BoodschapBijlage',
                                ...bijlage,
                                id: new Date().toString(),
                                contentType: '',
                                extensie: ''
                            }) as BoodschapBijlage
                    )
                };

                bulkBericht.ontvangerIds!.forEach((ontvangerId) => {
                    try {
                        let conversatie = cache.readQuery({
                            query: InleveringenConversatieDocument,
                            variables: {
                                toekenningId,
                                inleveraarId: ontvangerId
                            }
                        })!.inleveringenConversatie;

                        conversatie = [boodschap, ...conversatie];

                        cache.writeQuery({
                            query: InleveringenConversatieDocument,
                            data: { inleveringenConversatie: conversatie },
                            variables: {
                                toekenningId,
                                inleveraarId: ontvangerId
                            }
                        });
                    } catch (e) {
                        // ignore error wanneer er nog geen cache entry meer is.
                        // try-catch kan met apollo-client 3.3 weg.
                    }
                });
            }
        });
    }

    public getSimilarityReportUrl(submissionId: string): Observable<ApolloQueryResult<SimilarityReportUrlQuery>> {
        return this.dataClient.query({
            query: SimilarityReportUrlDocument,
            fetchPolicy: 'no-cache',
            variables: { submissionId }
        });
    }

    public startPlagiaatcontrole(toekenningId: string, inleveraarId: string, inleveringId: string) {
        return this.dataClient
            .mutate({
                mutation: StartPlagiaatcontroleDocument,
                variables: { inleveringId },
                optimisticResponse: {
                    __typename: 'Mutation',
                    startPlagiaatcontrole: true
                },
                update: (cache) => {
                    let viewData = cache.readQuery({
                        query: InleveringenDocument,
                        variables: {
                            toekenningId,
                            inleveraarId
                        }
                    })!;

                    viewData = set(
                        'inleveringen',
                        matching({ id: inleveringId }),
                        'plagiaatInfo'
                    )({
                        inleveringId: inleveringId,
                        type: PlagiaatType.TURN_IT_IN,
                        ephorusDocumentGUID: null,
                        submissionId: null,
                        percentage: null,
                        inVerwerking: true,
                        error: null
                    } as PlagiaatInfo)(viewData as any);

                    cache.writeQuery({
                        query: InleveringenDocument,
                        variables: {
                            toekenningId,
                            inleveraarId
                        },
                        data: viewData
                    });
                }
            })
            .subscribe();
    }

    public pollPlagiaatVerwerkingStatus(
        inleveringIds: string[]
    ): Observable<PollPlagiaatVerwerkingStatusQuery['pollPlagiaatVerwerkingStatus']> {
        return this.dataClient
            .watchQuery({
                query: PollPlagiaatVerwerkingStatusDocument,
                pollInterval: 60000,
                fetchPolicy: 'network-only',
                variables: { inleveringIds }
            })
            .valueChanges.pipe(
                filter((result) => Boolean(result.data)),
                map((result) => result.data.pollPlagiaatVerwerkingStatus)
            );
    }

    public updatePlagiaatInfo(toekenningId: string, inleveraarId: string, inleveringIds: string[]) {
        return this.dataClient
            .mutate({
                mutation: PlagiaatInfoDocument,
                variables: { inleveringIds },
                update: (cache, { data }) => {
                    let viewData = cache.readQuery({
                        query: InleveringenDocument,
                        variables: {
                            toekenningId,
                            inleveraarId
                        }
                    })!;

                    data?.plagiaatInfo.forEach((info) => {
                        viewData = set('inleveringen', matching({ id: info.inleveringId }), 'plagiaatInfo')(info)(viewData as any);
                    });

                    cache.writeQuery({
                        query: InleveringenDocument,
                        variables: {
                            toekenningId,
                            inleveraarId
                        },
                        data: viewData
                    });
                }
            })
            .subscribe();
    }
}
