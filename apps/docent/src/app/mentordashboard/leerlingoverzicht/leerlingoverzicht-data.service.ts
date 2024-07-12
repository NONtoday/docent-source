import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, switchMap } from 'rxjs/operators';
import { match } from 'ts-pattern';
import {
    GeldendResultaatFieldsFragment,
    LeerlingoverzichtExamenResultatenDocument,
    LeerlingoverzichtExamenResultatenQuery,
    LeerlingoverzichtInstellingen,
    LeerlingoverzichtInstellingenDocument,
    LeerlingoverzichtRegistratiesDocument,
    LeerlingoverzichtRegistratiesQuery,
    LeerlingoverzichtResultatenDocument,
    LeerlingoverzichtResultatenQuery,
    LeerlingoverzichtResultatenVergelijking,
    LeerlingoverzichtResultatenVergelijkingDocument,
    LeerlingoverzichtSeResultatenVergelijkingDocument,
    LeerlingoverzichtVakDetailPeriodeToetsresultatenDocument,
    LeerlingoverzichtVakDetailPeriodeToetsresultatenQuery,
    LeerlingoverzichtVakSamenvattingDocument,
    LeerlingoverzichtVakSamenvattingQuery,
    LeerlingoverzichtVakSeResultatenDocument,
    MentordashboardOverzichtPeriode,
    SetLeerlingoverzichtTijdspanSelectieDocument,
    SetLeerlingoverzichtWeergaveInstellingenDocument,
    VakgemiddeldeFieldsFragment
} from '../../../generated/_types';
import { MentordashboardOverzichtTijdspanOptie } from '../../core/models/mentordashboard.model';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { sortLocale } from '../../rooster-shared/utils/utils';
import { docentQuery, mapDocentQueryData } from '../../shared/utils/apollo.utils';
import { VergelijkingOptie } from './leerlingoverzicht.model';

@Injectable({
    providedIn: 'root'
})
export class LeerlingoverzichtDataService {
    private apollo = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);

    leerlingoverzichtInstellingen(leerlingId: string) {
        return this.medewerkerDataService.getMedewerker().pipe(
            switchMap(
                (medewerker) =>
                    this.apollo.watchQuery({
                        query: LeerlingoverzichtInstellingenDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            leerlingId
                        }
                    }).valueChanges
            ),
            map((res) => ({
                ...res.data.leerlingoverzichtInstellingen,
                tijdspan: res.data.leerlingoverzichtInstellingen.tijdspan as MentordashboardOverzichtTijdspanOptie
            }))
        );
    }

    leerlingoverzichtRegistraties(leerlingId: string, periode: MentordashboardOverzichtPeriode) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtRegistratiesDocument,
                variables: {
                    leerlingId,
                    periode
                }
            })
            .valueChanges.pipe(docentQuery(leerlingRegistratiesDefault));
    }

    leerlingoverzichtResultaten(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtResultatenDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(
                docentQuery(leerlingoverzichtResultatenDefault),
                mapDocentQueryData((data) => ({
                    ...data,
                    periodeRapportCijfers: [
                        ...data.periodeRapportCijfers.map((prc) => ({
                            ...prc,
                            vakRapportCijfers: sortLocale(prc.vakRapportCijfers, ['vak.afkorting'])
                        }))
                    ]
                }))
            );
    }

    leerlingoverzichtExamenResultaten(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtExamenResultatenDocument,
                variables: {
                    leerlingId
                }
            })
            .valueChanges.pipe(
                docentQuery(leerlingoverzichtExamenResultatenDefault),
                mapDocentQueryData((data) => ({
                    ...data,
                    examenVakSamenvattendeResultaten: sortLocale(data.examenVakSamenvattendeResultaten, ['vak.afkorting'])
                }))
            );
    }

    leerlingoverzichtVakSamenvatting(leerlingId: string, vakId: string, periode: number, isExamen: boolean) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtVakSamenvattingDocument,
                variables: {
                    leerlingId,
                    vakId,
                    periode,
                    isExamen
                }
            })
            .valueChanges.pipe(docentQuery(leerlingoverzichtVakSamenvattingDefault));
    }

    leerlingoverzichtVakDetailPeriodeToetsresultaten(leerlingId: string, vakId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtVakDetailPeriodeToetsresultatenDocument,
                variables: {
                    leerlingId,
                    vakId
                }
            })
            .valueChanges.pipe(
                docentQuery(leerlingoverzichtVakDetailPeriodeToetsresultatenDefault),
                // sorteer na geplandeDatumToets op resultaat.type, zodat samengestelde toetsen
                // altijd boven deeltoetsen komen te staan, ook als de geplande datum niet correct is ingevuld
                mapDocentQueryData((data) => {
                    const sortedData = data.map((vakDetailPeriodeToetsresultaten) => ({
                        ...vakDetailPeriodeToetsresultaten,
                        toetsresultaten: sortLocale(
                            vakDetailPeriodeToetsresultaten.toetsresultaten,
                            ['geplandeDatumToets', 'resultaat.type', 'laatstGewijzigdDatum'],
                            ['desc', 'desc', 'desc']
                        )
                    }));

                    return sortLocale(sortedData, ['cijferperiode'], ['desc']);
                })
            );
    }

    leerlingoverzichtVakSEResultaten(leerlingId: string, vakId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtVakSeResultatenDocument,
                variables: {
                    leerlingId,
                    vakId
                }
            })
            .valueChanges.pipe(docentQuery(new Array<GeldendResultaatFieldsFragment>()));
    }

    private resultatenVergelijking = (vergelijking: VergelijkingOptie) =>
        match(vergelijking)
            .with('Stamgroep', () => LeerlingoverzichtResultatenVergelijking.STAMGROEP)
            .with('Parallelklassen', () => LeerlingoverzichtResultatenVergelijking.PARALLEL)
            .exhaustive();

    leerlingoverzichtResultatenVergelijking(leerlingId: string, periode: number, vergelijkingOptie: VergelijkingOptie) {
        const vergelijking = this.resultatenVergelijking(vergelijkingOptie);
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtResultatenVergelijkingDocument,
                variables: {
                    leerlingId,
                    periode,
                    vergelijking
                }
            })
            .valueChanges.pipe(docentQuery(new Array<VakgemiddeldeFieldsFragment>()));
    }

    leerlingoverzichtSeResultatenVergelijking(leerlingId: string, vergelijkingOptie: VergelijkingOptie) {
        const vergelijking = this.resultatenVergelijking(vergelijkingOptie);
        return this.apollo
            .watchQuery({
                query: LeerlingoverzichtSeResultatenVergelijkingDocument,
                variables: {
                    leerlingId,
                    vergelijking
                }
            })
            .valueChanges.pipe(docentQuery(new Array<VakgemiddeldeFieldsFragment>()));
    }

    isVergelijkingDataInCache(leerlingId: string, periode: number, vergelijkingOptie: VergelijkingOptie) {
        const vergelijking = this.resultatenVergelijking(vergelijkingOptie);
        return this.apollo.client.cache.readQuery({
            query: LeerlingoverzichtResultatenVergelijkingDocument,
            variables: { leerlingId, periode, vergelijking }
        });
    }

    isSeVergelijkingDataInCache(leerlingId: string, vergelijkingOptie: VergelijkingOptie) {
        const vergelijking = this.resultatenVergelijking(vergelijkingOptie);
        return this.apollo.client.cache.readQuery({
            query: LeerlingoverzichtSeResultatenVergelijkingDocument,
            variables: { leerlingId, vergelijking }
        });
    }

    setLeerlingoverzichtTijdspanSelectie(selectie: string, leerlingId: string) {
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetLeerlingoverzichtTijdspanSelectieDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            leerlingId,
                            selectie
                        },
                        optimisticResponse: { setLeerlingoverzichtTijdspanSelectie: selectie },
                        update: (cache) => {
                            const instellingen = cache.readQuery({
                                query: LeerlingoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    leerlingId
                                }
                            })?.leerlingoverzichtInstellingen;

                            if (instellingen) {
                                const updatedInstellingen: LeerlingoverzichtInstellingen = {
                                    ...instellingen,
                                    tijdspan: selectie
                                };

                                cache.writeQuery({
                                    query: LeerlingoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        leerlingId
                                    },
                                    data: {
                                        leerlingoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }

    setLeerlingoverzichtWeergaveInstellingen(leerlingId: string, weergaves: string[]) {
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetLeerlingoverzichtWeergaveInstellingenDocument,
                        variables: {
                            medewerkerUUID: medewerker.uuid,
                            leerlingId,
                            weergaves
                        },
                        optimisticResponse: {
                            setLeerlingoverzichtWeergaveInstellingen: true
                        },
                        update: (cache) => {
                            const instellingen = cache.readQuery({
                                query: LeerlingoverzichtInstellingenDocument,
                                variables: {
                                    medewerkerUUID: medewerker.uuid,
                                    leerlingId
                                }
                            })?.leerlingoverzichtInstellingen;

                            if (instellingen) {
                                const updatedInstellingen: LeerlingoverzichtInstellingen = {
                                    ...instellingen,
                                    weergaves
                                };

                                cache.writeQuery({
                                    query: LeerlingoverzichtInstellingenDocument,
                                    variables: {
                                        medewerkerUUID: medewerker.uuid,
                                        leerlingId
                                    },
                                    data: {
                                        leerlingoverzichtInstellingen: updatedInstellingen
                                    }
                                });
                            }
                        }
                    })
                )
            )
            .subscribe();
    }
}

export const leerlingRegistratiesDefault: LeerlingoverzichtRegistratiesQuery['leerlingoverzichtRegistraties'] = {
    registraties: [],
    vanafDatum: new Date(),
    totDatum: new Date(),
    cijferperiode: null
};

export const leerlingoverzichtResultatenDefault: LeerlingoverzichtResultatenQuery['leerlingoverzichtResultaten'] = {
    __typename: 'PeriodeRapportCijferOverzicht' as const,
    actueelTotaalGemiddelde: 0,
    actueleCijferperiode: 1,
    periodeRapportCijfers: [],
    vakTrends: []
};

export const leerlingoverzichtVakDetailPeriodeToetsresultatenDefault: LeerlingoverzichtVakDetailPeriodeToetsresultatenQuery['leerlingoverzichtVakDetailPeriodeToetsresultaten'] =
    [];

export const leerlingoverzichtExamenResultatenDefault: LeerlingoverzichtExamenResultatenQuery['leerlingoverzichtExamenResultaten'] = {
    __typename: 'ExamenCijferOverzicht' as const,
    actueelTotaalGemiddelde: 0,
    heeftTrendindicatie: false,
    examenVakSamenvattendeResultaten: []
};

export const leerlingoverzichtVakDetailRegistratiesDefault: LeerlingoverzichtVakSamenvattingQuery['leerlingoverzichtVakSamenvatting']['registraties'] =
    {
        __typename: 'LeerlingoverzichtVakDetailRegistratieWrapper' as const,
        aantalLesmomenten: 0,
        vakDetailRegistraties: [],
        voorHeleSchooljaar: false
    };

export const leerlingoverzichtRapportvergaderingNotitiesResponseDefault: LeerlingoverzichtVakSamenvattingQuery['leerlingoverzichtVakSamenvatting']['notities'] =
    {
        docentNamen: '',
        notities: []
    };

export const leerlingoverzichtVakSamenvattingDefault: LeerlingoverzichtVakSamenvattingQuery['leerlingoverzichtVakSamenvatting'] = {
    __typename: 'LeerlingoverzichtVakSamenvattingResponse' as const,
    resultaten: {
        advieskolommen: [],
        toetskolommen: [],
        volgnummer: 0
    },
    registraties: leerlingoverzichtVakDetailRegistratiesDefault,
    notities: leerlingoverzichtRapportvergaderingNotitiesResponseDefault
};
