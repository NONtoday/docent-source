import { Injectable, inject } from '@angular/core';
import { ApolloCache } from '@apollo/client/core';
import {
    ExamenDossierAanwezigDocument,
    ExamenDossierAanwezigIndividueelDocument,
    GemistResultaat,
    GetMentorDashboardCeResultatenDocument,
    GetMentorDashboardCeResultatenQuery,
    GetMentorDashboardExamendossierVoorPlaatsingDocument,
    GetMentorDashboardResultatenContextDocument,
    GetMentorDashboardSeResultatenDocument,
    GetMentorDashboardSeResultatenQuery,
    GetMentorDashboardVakResultatenDocument,
    GetMentorDashboardVakResultatenQuery,
    GetMentorDashboardVoortgangsdossierVoorLeerlingDocument,
    GroepsCijferOverzichtDocument,
    GroepsCijferOverzichtIndividueelDocument,
    GroepsExamenCijferOverzichtDocument,
    GroepsExamenCijferOverzichtIndividueelDocument,
    GroepsoverzichtExamenVakRapportResultaatTrendsDocument,
    GroepsoverzichtInstellingen,
    GroepsoverzichtInstellingenDocument,
    GroepsoverzichtPeriodeOptiesDocument,
    GroepsoverzichtPeriodeOptiesIndividueelDocument,
    GroepsoverzichtPeriodeOptiesIndividueelQuery,
    GroepsoverzichtPeriodeOptiesQuery,
    GroepsoverzichtPeriodeRegistratiesAfwezigDocument,
    GroepsoverzichtPeriodeRegistratiesAfwezigQuery,
    GroepsoverzichtPeriodeRegistratiesVrijVeldDocument,
    GroepsoverzichtRegistratiesDocument,
    GroepsoverzichtRegistratiesIndividueelDocument,
    GroepsoverzichtRegistratiesIndividueelQuery,
    GroepsoverzichtRegistratiesQuery,
    GroepsoverzichtResultatenInstellingenInput,
    GroepsoverzichtResultatenSorteringen,
    GroepsoverzichtResultatenSorteringenInput,
    GroepsoverzichtResultatenSorteringsContext,
    GroepsoverzichtVakRapportResultaatTrendsDocument,
    GroepsoverzichtVakRapportResultaatTrendsIndividueelDocument,
    GroepsoverzichtVakRapportResultaatTrendsIndividueelQuery,
    GroepsoverzichtWeergaveInstellingInput,
    LeerlingExamendossierGemisteToetsenDocument,
    LeerlingExamendossierLaatsteResultatenDocument,
    LeerlingExamendossierLaatsteResultatenMetTrendDocument,
    LeerlingVoortgangsdossierGemisteToetsenDocument,
    LeerlingVoortgangsdossierLaatsteResultatenDocument,
    LeerlingVoortgangsdossierLaatsteResultatenMetTrendDocument,
    LeerlingkaartDocument,
    LeerlingkaartQuery,
    LeerlingoverzichtPeriodeOptiesDocument,
    LeerlingoverzichtPeriodeOptiesQuery,
    MentordashboardResultatenInstellingen,
    RecenteResultatenMetTrendWrapper,
    RegistratieDetailDocument,
    SetGroepsoverzichtResultatenInstellingenDocument,
    SetGroepsoverzichtResultatenSorteringDocument,
    SetGroepsoverzichtTijdspanSelectieDocument,
    SetGroepsoverzichtWeergaveInstellingenDocument,
    SetSignaleringenFiltersDocument,
    SignaleringenFiltersDocument,
    SignaleringenFiltersInput,
    SignaleringenFiltersQuery,
    SorteringOrder,
    TotaalRegistratieDetailsDocument,
    TotaaloverzichtRegistratiesDocument,
    VakoverzichtRegistratiesDocument,
    VakoverzichtRegistratiesQuery,
    namedOperations
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { remove, sortBy } from 'lodash-es';
import { Observable } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { match } from 'ts-pattern';
import { GroepsoverzichtResultaten, LeerlingCijferOverzicht } from '../core/models/mentordashboard.model';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { Optional } from '../rooster-shared/utils/utils';
import { docentQuery } from '../shared/utils/apollo.utils';
import { convertToLocalDate } from './../rooster-shared/utils/date.utils';
import { rapportCijferKolomToResultatenKolom, rapportExamenCijferKolomToResultatenKolom } from './mentordashboard.utils';

@Injectable({
    providedIn: 'root'
})
export class MentordashboardDataService {
    private apollo = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);
    private cache: ApolloCache<any>;

    constructor() {
        this.cache = this.apollo.client.cache;
    }

    getVakoverzichtRegistraties(leerlingId: string): Observable<VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']> {
        return this.apollo
            .watchQuery({
                query: VakoverzichtRegistratiesDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.vakoverzichtRegistraties));
    }

    getRegistratiesDetailFromCache(
        leerlingId: string,
        vakId: string,
        kolom: string,
        vanaf: Date,
        tot: Date,
        vrijveldId: string | undefined,
        keuzelijstWaardeMogelijkheidId: string | undefined
    ) {
        return this.apollo.client.cache.readQuery({
            query: RegistratieDetailDocument,
            variables: {
                leerlingId,
                vakId,
                kolom,
                vrijveldId,
                keuzelijstWaardeMogelijkheidId,
                vanaf: convertToLocalDate(vanaf) as any,
                tot: convertToLocalDate(tot) as any
            }
        });
    }

    getRegistratiesDetail(
        leerlingId: string,
        vakId: Optional<string>,
        kolom: string,
        vanaf: Date,
        tot: Date,
        vrijveldId: string | undefined,
        keuzelijstWaardeMogelijkheidId: string | undefined
    ) {
        return this.apollo
            .watchQuery({
                query: RegistratieDetailDocument,
                variables: {
                    leerlingId,
                    vakId,
                    kolom,
                    vrijveldId,
                    keuzelijstWaardeMogelijkheidId,
                    vanaf: convertToLocalDate(vanaf) as any,
                    tot: convertToLocalDate(tot) as any
                }
            })
            .valueChanges.pipe(map((res) => res.data.registratieDetail));
    }

    getTotaalRegistratieDetails(
        leerlingId: string,
        kolom: string,
        vrijveldId: string | undefined,
        keuzelijstWaardeMogelijkheidId: string | undefined
    ) {
        return this.apollo
            .watchQuery({
                query: TotaalRegistratieDetailsDocument,
                variables: {
                    leerlingId,
                    kolom: kolom.toLowerCase(),
                    vrijveldId,
                    keuzelijstWaardeMogelijkheidId
                }
            })
            .valueChanges.pipe(map((res) => res.data.totaalRegistratieDetails));
    }

    getSignaleringenFilters(): Observable<SignaleringenFiltersQuery['signaleringenFilters']> {
        return this.medewerkerDataService.getMedewerker().pipe(
            switchMap(
                (medewerker) =>
                    this.apollo.watchQuery({
                        query: SignaleringenFiltersDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid
                        }
                    }).valueChanges
            ),
            map((res) => res.data.signaleringenFilters)
        );
    }

    setSignaleringenFilters(
        medewerkerUUID: string,
        filters: SignaleringenFiltersInput
    ): Observable<SignaleringenFiltersQuery['signaleringenFilters']> {
        return this.apollo
            .mutate({
                mutation: SetSignaleringenFiltersDocument,
                variables: {
                    medewerkerUUID,
                    filters
                },
                refetchQueries: [namedOperations.Query.signaleringenFilters]
            })
            .pipe(map((res) => res.data!.setSignaleringenFilters));
    }

    groepsoverzichtInstellingen(stamgroepId: string | undefined) {
        // Als er geen stamgroepId is meegegeven, dan is het een gezamenlijk overzicht en worden daarvoor de instellingen opgehaald
        return this.medewerkerDataService.getMedewerker().pipe(
            switchMap(
                (medewerker) =>
                    this.apollo.watchQuery({
                        query: GroepsoverzichtInstellingenDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            stamgroepId: stamgroepId ?? null, // gebruik null, want dat wordt ook gebruikt bij het handmatig updaten van de cache
                            isGezamenlijk: stamgroepId ? false : true
                        }
                    }).valueChanges
            ),
            map((res) => res.data.groepsoverzichtInstellingen)
        );
    }

    setGroepsoverzichtTijdspanSelectie(selectie: string, stamgroepId: string) {
        // Als er geen stamgroepId is meegegeven, dan is het een gezamenlijk overzicht en worden daarvoor de instellingen opgeslagen
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetGroepsoverzichtTijdspanSelectieDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            stamgroepId: stamgroepId ? stamgroepId : null,
                            isGezamenlijk: stamgroepId ? false : true,
                            selectie
                        },
                        optimisticResponse: { setGroepsoverzichtTijdspanSelectie: selectie },
                        update: () => {
                            const instellingen = this.cache.readQuery({
                                query: GroepsoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    isGezamenlijk: stamgroepId ? false : true,
                                    stamgroepId: stamgroepId ? stamgroepId : null
                                }
                            })?.groepsoverzichtInstellingen;

                            if (instellingen) {
                                const updatedInstellingen: GroepsoverzichtInstellingen = {
                                    ...instellingen,
                                    registraties: {
                                        ...instellingen.registraties,
                                        tijdspan: selectie
                                    }
                                };

                                this.cache.writeQuery({
                                    query: GroepsoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        isGezamenlijk: stamgroepId ? false : true,
                                        stamgroepId: stamgroepId ? stamgroepId : null
                                    },
                                    data: {
                                        groepsoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }

    setGroepsoverzichtWeergaveInstellingen(stamgroepId: string, weergaves: GroepsoverzichtWeergaveInstellingInput[]) {
        // Als er geen stamgroepId is meegegeven, dan is het een gezamenlijk overzicht en worden daarvoor de instellingen opgeslagen
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetGroepsoverzichtWeergaveInstellingenDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            stamgroepId: stamgroepId ? stamgroepId : null,
                            isGezamenlijk: stamgroepId ? false : true,
                            weergaves
                        },
                        optimisticResponse: {
                            setGroepsoverzichtWeergaveInstellingen: true
                        },
                        update: () => {
                            const instellingen = this.cache.readQuery({
                                query: GroepsoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    isGezamenlijk: stamgroepId ? false : true,
                                    stamgroepId: stamgroepId ? stamgroepId : null
                                }
                            })?.groepsoverzichtInstellingen;

                            if (instellingen) {
                                const updatedInstellingen: GroepsoverzichtInstellingen = {
                                    ...instellingen,
                                    registraties: {
                                        ...instellingen.registraties,
                                        weergaves: weergaves
                                    }
                                };

                                this.cache.writeQuery({
                                    query: GroepsoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        isGezamenlijk: stamgroepId ? false : true,
                                        stamgroepId: stamgroepId ? stamgroepId : null
                                    },
                                    data: {
                                        groepsoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }

    setGroepsoverzichtResultatenInstellingen(stamgroepId: string, resultatenInstellingen: GroepsoverzichtResultatenInstellingenInput) {
        // Als er geen stamgroepId is meegegeven, dan is het een gezamenlijk overzicht en worden daarvoor de instellingen opgeslagen
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetGroepsoverzichtResultatenInstellingenDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            stamgroepId: stamgroepId ? stamgroepId : null,
                            isGezamenlijk: stamgroepId ? false : true,
                            resultatenInstellingen
                        },
                        optimisticResponse: {
                            setGroepsoverzichtResultatenInstellingen: true
                        },
                        update: () => {
                            const instellingen = this.cache.readQuery({
                                query: GroepsoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    isGezamenlijk: stamgroepId ? false : true,
                                    stamgroepId: stamgroepId ? stamgroepId : null
                                }
                            })?.groepsoverzichtInstellingen;

                            if (instellingen) {
                                const updatedInstellingen: GroepsoverzichtInstellingen = {
                                    ...instellingen,
                                    resultaten: {
                                        ...instellingen.resultaten,
                                        ...resultatenInstellingen
                                    }
                                };

                                this.cache.writeQuery({
                                    query: GroepsoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        isGezamenlijk: stamgroepId ? false : true,
                                        stamgroepId: stamgroepId ? stamgroepId : null
                                    },
                                    data: {
                                        groepsoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }

    setGroepsoverzichtResultatenSortering(stamgroepId: string, sorteringen: GroepsoverzichtResultatenSorteringenInput) {
        // Als er geen stamgroepId is meegegeven, dan is het een gezamenlijk overzicht en worden daarvoor de instellingen opgeslagen
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetGroepsoverzichtResultatenSorteringDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            stamgroepId: stamgroepId ? stamgroepId : null,
                            isGezamenlijk: stamgroepId ? false : true,
                            sortering: sorteringen
                        },
                        optimisticResponse: {
                            setGroepsoverzichtResultatenSortering: true
                        },
                        update: () => {
                            const instellingen = this.cache.readQuery({
                                query: GroepsoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    isGezamenlijk: stamgroepId ? false : true,
                                    stamgroepId: stamgroepId ? stamgroepId : null
                                }
                            })?.groepsoverzichtInstellingen;

                            const property = match(sorteringen.context)
                                .returnType<keyof Omit<GroepsoverzichtResultatenSorteringen, '__typename' | 'examenSidebarDefault'>>()
                                .with(GroepsoverzichtResultatenSorteringsContext.GROEPSOVERZICHT, () => 'groepsoverzicht' as const)
                                .with(GroepsoverzichtResultatenSorteringsContext.RESULTATEN_SIDEBAR, () => 'resultatenSidebar' as const)
                                .with(GroepsoverzichtResultatenSorteringsContext.EXAMEN_SIDEBAR, () => 'examenSidebar' as const)
                                .exhaustive();

                            if (instellingen) {
                                const updatedInstellingen = {
                                    ...instellingen,
                                    resultaten: {
                                        ...instellingen.resultaten,
                                        sorteringen: {
                                            ...instellingen.resultaten.sorteringen,
                                            [property]: { ...instellingen.resultaten.sorteringen[property], ...sorteringen }
                                        }
                                    }
                                };

                                this.cache.writeQuery({
                                    query: GroepsoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        isGezamenlijk: stamgroepId ? false : true,
                                        stamgroepId: stamgroepId ? stamgroepId : null
                                    },
                                    data: {
                                        groepsoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }

    getLeerlingkaart(leerlingId: string): Observable<LeerlingkaartQuery['leerlingkaart']> {
        return this.apollo
            .watchQuery({
                query: LeerlingkaartDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.leerlingkaart));
    }

    removeRegistratieTabelAndDetailsFromCache() {
        [
            namedOperations.Query.vakoverzichtRegistraties,
            namedOperations.Query.registratieDetail,
            namedOperations.Query.totaaloverzichtRegistraties,
            namedOperations.Query.totaalRegistratieDetails,
            namedOperations.Query.groepsoverzichtRegistraties,
            namedOperations.Query.groepsCijferOverzicht,
            namedOperations.Query.groepsExamenCijferOverzicht,
            namedOperations.Query.groepsoverzichtRegistratiesIndividueel,
            namedOperations.Query.groepsCijferOverzichtIndividueel,
            namedOperations.Query.groepsExamenCijferOverzichtIndividueel,
            namedOperations.Query.groepsoverzichtPeriodeRegistratiesAfwezig,
            namedOperations.Query.groepsoverzichtPeriodeRegistratiesVrijVeld,
            namedOperations.Query.groepsoverzichtVakRapportResultaatTrends,
            namedOperations.Query.groepsoverzichtVakRapportResultaatTrendsIndividueel,
            namedOperations.Query.groepsoverzichtExamenVakRapportResultaatTrends,
            namedOperations.Query.leerlingVoortgangsdossierGemisteToetsen,
            namedOperations.Query.leerlingExamendossierGemisteToetsen,
            namedOperations.Query.leerlingVoortgangsdossierLaatsteResultaten,
            namedOperations.Query.leerlingoverzichtRegistraties,
            namedOperations.Query.leerlingVoortgangsdossierLaatsteResultatenMetTrend
        ].forEach((fieldName) => this.cache.evict({ fieldName }));
    }

    getTotaaloverzichtRegistraties(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: TotaaloverzichtRegistratiesDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.totaaloverzichtRegistraties));
    }

    public getMentorDashboardExamenDossier(plaatsingId: string, lichtingId?: string | null) {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardExamendossierVoorPlaatsingDocument,
                variables: {
                    plaatsingId,
                    lichtingId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.getMentorDashboardExamendossierVoorPlaatsing)
            );
    }

    public getMentorDashboardLeerlingDossier(leerlingId: string, stamgroepId?: string | null) {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardVoortgangsdossierVoorLeerlingDocument,
                variables: {
                    leerlingId,
                    stamgroepId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data),
                map((data) => data.getMentorDashboardVoortgangsdossierVoorLeerling),
                tap((data) => {
                    if (stamgroepId) return;

                    // Initieel wordt deze query zonder stamgroep parameter uitgevoerd.
                    // In het geval van meerdere dossiers zou na heen en weer wisselen de eerste opnieuw
                    // opgevraagd worden. Om deze reden wordt de query zonder parameter ook in de cache
                    // weggeschreven met het stamgroepId wat terugkomt als resultaat.
                    // Broadcast false omdat de observable van deze query niet opnieuw af hoeft te gaan.
                    const cacheData = this.cache.readQuery({
                        query: GetMentorDashboardVoortgangsdossierVoorLeerlingDocument,
                        variables: { leerlingId, stamgroepId }
                    });
                    this.cache.writeQuery({
                        query: GetMentorDashboardVoortgangsdossierVoorLeerlingDocument,
                        variables: { leerlingId, stamgroepId: data.stamgroepId },
                        data: cacheData,
                        broadcast: false
                    });
                })
            );
    }

    public getMentorDashboardResultatenContext(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardResultatenContextDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map((result) => result.data.getMentorDashboardResultatenContext)
            );
    }

    getMentorDashboardVakResultaten(
        leerlingId: string,
        vakId: string,
        periode: number
    ): Observable<GetMentorDashboardVakResultatenQuery['getMentorDashboardVakResultaten']> {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardVakResultatenDocument,
                variables: {
                    leerlingId,
                    vakId,
                    periode
                }
            })
            .valueChanges.pipe(map(({ data }) => data.getMentorDashboardVakResultaten));
    }

    getMentorDashboardSEResultaten(
        plaatsingId: string,
        vakId: string,
        lichtingId?: Optional<string>
    ): Observable<GetMentorDashboardSeResultatenQuery['getMentorDashboardSEResultaten']> {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardSeResultatenDocument,
                variables: {
                    plaatsingId,
                    vakId,
                    lichtingId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map(({ data }) => data.getMentorDashboardSEResultaten)
            );
    }

    getMentorDashboardCEResultaten(
        plaatsingId: string,
        vakId: string,
        lichtingId?: Optional<string>
    ): Observable<GetMentorDashboardCeResultatenQuery['getMentorDashboardCEResultaten']> {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardCeResultatenDocument,
                variables: {
                    plaatsingId,
                    vakId,
                    lichtingId
                }
            })
            .valueChanges.pipe(
                filter((result) => !!result.data),
                map(({ data }) => data.getMentorDashboardCEResultaten)
            );
    }

    getGroepsoverzichtRegistraties(
        stamgroepId: string,
        periode: string
    ): Observable<GroepsoverzichtRegistratiesQuery['groepsoverzichtRegistraties']> {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtRegistratiesDocument,
                variables: {
                    stamgroepId,
                    periode
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtRegistraties));
    }

    getGroepsoverzichtRegistratiesIndividueel(
        periode: string
    ): Observable<GroepsoverzichtRegistratiesIndividueelQuery['groepsoverzichtRegistratiesIndividueel']> {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtRegistratiesIndividueelDocument,
                variables: {
                    periode
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtRegistratiesIndividueel));
    }

    getGroepsoverzichtRegistratieTijdvakOpties(
        stamgroepId: string
    ): Observable<GroepsoverzichtPeriodeOptiesQuery['groepsoverzichtPeriodeOpties']> {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtPeriodeOptiesDocument,
                variables: {
                    stamgroepId
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtPeriodeOpties));
    }

    getGroepsoverzichtRegistratieTijdvakOptiesIndividueel(): Observable<
        GroepsoverzichtPeriodeOptiesIndividueelQuery['groepsoverzichtPeriodeOptiesIndividueel']
    > {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtPeriodeOptiesIndividueelDocument
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtPeriodeOptiesIndividueel));
    }

    getGroepsoverzichtPeriodeRegistratiesAfwezig(
        leerlingId: string,
        kolom: string,
        vanaf: Date,
        tot: Date
    ): Observable<GroepsoverzichtPeriodeRegistratiesAfwezigQuery['groepsoverzichtPeriodeRegistratiesAfwezig']> {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtPeriodeRegistratiesAfwezigDocument,
                variables: {
                    leerlingId,
                    kolom,
                    vanaf: convertToLocalDate(vanaf) as any,
                    tot: convertToLocalDate(tot) as any
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtPeriodeRegistratiesAfwezig));
    }

    getGroepsoverzichtPeriodeRegistratiesVrijVeld(
        leerlingId: string,
        vrijVeldId: string,
        vanaf: Date,
        tot: Date,
        keuzelijstWaardeMogelijkheidId: Optional<string>
    ) {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtPeriodeRegistratiesVrijVeldDocument,
                variables: {
                    leerlingId,
                    vrijVeldId,
                    vanaf: convertToLocalDate(vanaf) as any,
                    tot: convertToLocalDate(tot) as any,
                    keuzelijstWaardeMogelijkheidId
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtPeriodeRegistratiesVrijVeld));
    }

    getGroepsoverzichtVakRapportResultaatTrends(leerlingId: string, stamgroepId: string) {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtVakRapportResultaatTrendsDocument,
                variables: {
                    leerlingId,
                    stamgroepId
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtVakRapportResultaatTrends));
    }

    getGroepsoverzichtVakRapportResultaatTrendsIndividueel(
        leerlingId: string
    ): Observable<GroepsoverzichtVakRapportResultaatTrendsIndividueelQuery['groepsoverzichtVakRapportResultaatTrendsIndividueel']> {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtVakRapportResultaatTrendsIndividueelDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtVakRapportResultaatTrendsIndividueel));
    }

    getGroepsoverzichtExamenVakRapportResultaatTrends(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: GroepsoverzichtExamenVakRapportResultaatTrendsDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.groepsoverzichtExamenVakRapportResultaatTrends));
    }

    getGroepsCijferoverzicht(
        stamgroepId: string,
        instellingen: MentordashboardResultatenInstellingen
    ): Observable<GroepsoverzichtResultaten> {
        return this.apollo
            .watchQuery({
                query: GroepsCijferOverzichtDocument,
                variables: {
                    stamgroepId
                }
            })
            .valueChanges.pipe(
                // verdeel de leerlingen in kolommen
                map((res) => {
                    const llRapportCijferoverzichten = [...res.data.groepsCijferOverzicht];
                    return {
                        extraAandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                overzicht.rapportCijfers.length === 0 ||
                                overzicht.rapportCijfers.filter((cijfer) => cijfer < instellingen.grenswaardeZwaarOnvoldoende).length >=
                                    instellingen.aantalVakkenZwaarOnvoldoende
                        ),
                        aandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                overzicht.rapportCijfers.filter((cijfer) => cijfer < instellingen.grenswaardeOnvoldoende).length >=
                                instellingen.aantalVakkenOnvoldoende
                        ),
                        opNiveau: llRapportCijferoverzichten
                    };
                }),
                // sorteer en map naar een generiek datamodel zodat componenten examen als normale resultaten kunnen tonen
                map((overzicht) => ({
                    extraAandacht: this.sortResultatenKolom(
                        overzicht.extraAandacht.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.extraAandacht
                    ),
                    aandacht: this.sortResultatenKolom(
                        overzicht.aandacht.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.aandacht
                    ),
                    opNiveau: this.sortResultatenKolom(
                        overzicht.opNiveau.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.opNiveau
                    )
                }))
            );
    }

    getGroepsCijferoverzichtIndividueel(instellingen: MentordashboardResultatenInstellingen): Observable<GroepsoverzichtResultaten> {
        return this.apollo
            .watchQuery({
                query: GroepsCijferOverzichtIndividueelDocument
            })
            .valueChanges.pipe(
                // verdeel de leerlingen in kolommen
                map((res) => {
                    const llRapportCijferoverzichten = [...res.data.groepsCijferOverzichtIndividueel];
                    return {
                        extraAandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                overzicht.rapportCijfers.length === 0 ||
                                overzicht.rapportCijfers.filter((cijfer) => cijfer < instellingen.grenswaardeZwaarOnvoldoende).length >=
                                    instellingen.aantalVakkenZwaarOnvoldoende
                        ),
                        aandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                overzicht.rapportCijfers.filter((cijfer) => cijfer < instellingen.grenswaardeOnvoldoende).length >=
                                instellingen.aantalVakkenOnvoldoende
                        ),
                        opNiveau: llRapportCijferoverzichten
                    };
                }),
                // sorteer en map naar een generiek datamodel zodat componenten examen als normale resultaten kunnen tonen
                map((overzicht) => ({
                    extraAandacht: this.sortResultatenKolom(
                        overzicht.extraAandacht.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.extraAandacht
                    ),
                    aandacht: this.sortResultatenKolom(
                        overzicht.aandacht.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.aandacht
                    ),
                    opNiveau: this.sortResultatenKolom(
                        overzicht.opNiveau.map(rapportCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.opNiveau
                    )
                }))
            );
    }

    getGroepsExamenCijferoverzicht(
        stamgroepId: string,
        instellingen: MentordashboardResultatenInstellingen
    ): Observable<GroepsoverzichtResultaten> {
        return this.apollo
            .watchQuery({
                query: GroepsExamenCijferOverzichtDocument,
                variables: {
                    stamgroepId
                }
            })
            .valueChanges.pipe(
                // verdeel de leerlingen in kolommen
                map((res) => {
                    const llRapportCijferoverzichten = [...res.data.groepsExamenCijferOverzicht];
                    return {
                        extraAandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                [...overzicht.ceCijfers, ...overzicht.seCijfers, ...overzicht.eindCijfers].filter(
                                    (cijfer) => cijfer < instellingen.grenswaardeZwaarOnvoldoende
                                ).length >= instellingen.aantalVakkenZwaarOnvoldoende
                        ),
                        aandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                [...overzicht.ceCijfers, ...overzicht.seCijfers, ...overzicht.eindCijfers].filter(
                                    (cijfer) => cijfer < instellingen.grenswaardeOnvoldoende
                                ).length >= instellingen.aantalVakkenOnvoldoende
                        ),
                        opNiveau: llRapportCijferoverzichten
                    };
                }),
                // sorteer en map naar een generiek datamodel zodat componenten examen als normale resultaten kunnen tonen
                map((overzicht) => ({
                    extraAandacht: this.sortResultatenKolom(
                        overzicht.extraAandacht.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.extraAandacht
                    ),
                    aandacht: this.sortResultatenKolom(
                        overzicht.aandacht.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.aandacht
                    ),
                    opNiveau: this.sortResultatenKolom(
                        overzicht.opNiveau.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.opNiveau
                    )
                }))
            );
    }

    getGroepsExamenCijferoverzichtIndividueel(instellingen: MentordashboardResultatenInstellingen): Observable<GroepsoverzichtResultaten> {
        return this.apollo
            .watchQuery({
                query: GroepsExamenCijferOverzichtIndividueelDocument
            })
            .valueChanges.pipe(
                // verdeel de leerlingen in kolommen
                map((res) => {
                    const llRapportCijferoverzichten = [...res.data.groepsExamenCijferOverzichtIndividueel];
                    return {
                        extraAandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                [...overzicht.ceCijfers, ...overzicht.seCijfers, ...overzicht.eindCijfers].filter(
                                    (cijfer) => cijfer < instellingen.grenswaardeZwaarOnvoldoende
                                ).length >= instellingen.aantalVakkenZwaarOnvoldoende
                        ),
                        aandacht: remove(
                            llRapportCijferoverzichten,
                            (overzicht) =>
                                [...overzicht.ceCijfers, ...overzicht.seCijfers, ...overzicht.eindCijfers].filter(
                                    (cijfer) => cijfer < instellingen.grenswaardeOnvoldoende
                                ).length >= instellingen.aantalVakkenOnvoldoende
                        ),
                        opNiveau: llRapportCijferoverzichten
                    };
                }),
                // sorteer en map naar een generiek datamodel zodat componenten examen als normale resultaten kunnen tonen
                map((overzicht) => ({
                    extraAandacht: this.sortResultatenKolom(
                        overzicht.extraAandacht.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.extraAandacht
                    ),
                    aandacht: this.sortResultatenKolom(
                        overzicht.aandacht.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.aandacht
                    ),
                    opNiveau: this.sortResultatenKolom(
                        overzicht.opNiveau.map(rapportExamenCijferKolomToResultatenKolom),
                        instellingen.sorteringen.groepsoverzicht.opNiveau
                    )
                }))
            );
    }

    examenDossierAanwezig(stamgroepId: Optional<string>) {
        return stamgroepId
            ? this.apollo
                  .watchQuery({
                      query: ExamenDossierAanwezigDocument,
                      variables: {
                          stamgroepId
                      }
                  })
                  .valueChanges.pipe(map((res) => res.data.examenDossierAanwezig))
            : this.apollo
                  .watchQuery({ query: ExamenDossierAanwezigIndividueelDocument })
                  .valueChanges.pipe(map((res) => res.data.examenDossierAanwezigIndividueel));
    }

    getLeerlingVoortgangsdossierGemisteToetsen(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingVoortgangsdossierGemisteToetsenDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(docentQuery(new Array<GemistResultaat>()));
    }

    getLeerlingExamendossierGemisteToetsen(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingExamendossierGemisteToetsenDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(docentQuery(new Array<GemistResultaat>()));
    }

    getLeerlingVoortgangsdossierLaatsteResultaten(leerlingId: string, aantal: Optional<number>) {
        return this.apollo
            .watchQuery({
                query: LeerlingVoortgangsdossierLaatsteResultatenDocument,
                variables: {
                    leerlingId,
                    aantal
                }
            })
            .valueChanges.pipe(map((res) => res.data.leerlingVoortgangsdossierLaatsteResultaten));
    }

    getLeerlingExamendossierLaatsteResultaten(leerlingId: string, aantal: Optional<number>) {
        return this.apollo
            .watchQuery({
                query: LeerlingExamendossierLaatsteResultatenDocument,
                variables: {
                    leerlingId,
                    aantal
                }
            })
            .valueChanges.pipe(map((res) => res.data.leerlingExamendossierLaatsteResultaten));
    }

    getLeerlingoverzichtRegistratieTijdvakOpties(
        leerlingId: string
    ): Observable<LeerlingoverzichtPeriodeOptiesQuery['leerlingoverzichtPeriodeOpties']> {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtPeriodeOptiesDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(map((res) => res.data.leerlingoverzichtPeriodeOpties));
    }

    getLeerlingVoortgangsdossierLaatsteResultatenMetTrend(leerlingId: string, aantal: Optional<number>) {
        return this.apollo
            .watchQuery({
                query: LeerlingVoortgangsdossierLaatsteResultatenMetTrendDocument,
                variables: {
                    leerlingId,
                    aantal
                }
            })
            .valueChanges.pipe(docentQuery(resultatenMetTrendDefault));
    }

    getLeerlingExamendossierLaatsteResultatenMetTrend(leerlingId: string, aantal: Optional<number>) {
        return this.apollo
            .watchQuery({
                query: LeerlingExamendossierLaatsteResultatenMetTrendDocument,
                variables: {
                    leerlingId,
                    aantal
                }
            })
            .valueChanges.pipe(docentQuery(resultatenMetTrendDefault));
    }

    private sortResultatenKolom<T extends Pick<LeerlingCijferOverzicht, 'totaalgemiddelde'>>(input: T[], richting: SorteringOrder): T[] {
        return sortBy(input, (item) => {
            if (!item.totaalgemiddelde) return 0;
            return richting === SorteringOrder.ASC ? item.totaalgemiddelde : -item.totaalgemiddelde;
        });
    }
}

export const resultatenMetTrendDefault: RecenteResultatenMetTrendWrapper = {
    recenteResultaten: [],
    trendindicatie: null,
    aantalResultatenVoorTrendindicatie: 0
};
