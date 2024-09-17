import { ApplicationRef, Injectable, inject } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { Apollo, QueryRef } from 'apollo-angular';
import { isNil } from 'lodash-es';
import { Observable, firstValueFrom, of } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AantalOngelezenBerichtenDocument,
    BerichtenVanMedewerkerDocument,
    BerichtenVanMedewerkerQuery,
    IngelogdeMedewerkerDocument,
    IngelogdeMedewerkerQuery,
    LesgroepenDocument,
    LesgroepenQuery,
    LesgroepenVanDeDocentDocument,
    LesgroepenVanDeDocentQuery,
    MarkeerAllesGelezenDocument,
    MarkeerGelezenDocument,
    Medewerker,
    MedewerkerLesgroepenMetDossierDocument,
    MedewerkerLesgroepenMetDossierQuery,
    MentorleerlingenDocument,
    MentorleerlingenLijstIdsDocument,
    MentorleerlingenLijstIdsQuery,
    MentorleerlingenQuery,
    OngelezenNotitiesAanwezigDocument,
    SaveSorteringDocument,
    SetLaatstGelezenUpdateDocument,
    SetSignaleringAantalDocument,
    Settings,
    SorteringOrder,
    SorteringVanMedewerkerDocument,
    SorteringVanMedewerkerQuery,
    SorteringVeld,
    VakcodesVanDocentDocument,
    VakcodesVanDocentQuery
} from '@docent/codegen';
import { first, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { all, set } from 'shades';
import { VERSION } from 'version-generator';
import { MedewerkerRechten, Operation } from '../../rooster-shared/directives/heeft-recht.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { SorteringNaam } from '../models/shared.model';

const BERICHTEN_LIMIT = 29; // Aantal berichten per request - 1
export const AANTAL_BERICHTEN_PER_REQUEST = 30;

@Injectable({
    providedIn: 'root'
})
export class MedewerkerDataService {
    private apollo = inject(Apollo);
    private _medewerkerId: string;
    private _medewerkerUuid: string;
    private appRef = inject(ApplicationRef);

    public aantalOngelezenBerichten$ = this.appRef.isStable.pipe(
        first((isStable) => isStable === true),
        switchMap(
            () =>
                this.apollo.watchQuery({
                    query: AantalOngelezenBerichtenDocument,
                    fetchPolicy: 'network-only',
                    pollInterval: 1000 * 60 * 15
                }).valueChanges
        ),
        map((result) => result.data.aantalOngelezenBerichten),
        takeUntilDestroyed(),
        // belangrijk dat deze observable geshared blijft, ook als er geen subscribers meer zijn.
        // Anders heb je bij het switchen van pagina dat deze observable stopt, omdat er dan geen suscribers meer zijn.
        // Op de nieuwe pagina kan deze observable dan niet opnieuw worden gestart, vanwege de isStable (app wordt niet meer stable vanwege notitie polling).
        shareReplay({ bufferSize: 1, refCount: false })
    );

    public get medewerkerId(): string {
        return this._medewerkerId;
    }

    public get medewerkerUuid(): string {
        return this._medewerkerUuid;
    }

    public set medewerkerUuid(uuid: string) {
        if (this._medewerkerUuid !== uuid) {
            this._medewerkerUuid = uuid;
            Bugsnag.setUser(uuid);
        }
    }

    public getMedewerkerPromise(): Promise<Medewerker> {
        return firstValueFrom(this.getMedewerker());
    }

    public getMedewerker(): Observable<IngelogdeMedewerkerQuery['ingelogdeMedewerker']> {
        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(
                map((result) => result.data.ingelogdeMedewerker),
                tap((medewerker) => {
                    this.setDataLayerGTM(medewerker);
                    this.medewerkerUuid = medewerker.uuid;
                    this._medewerkerId = medewerker.id;
                })
            );
    }

    private setDataLayerGTM(medewerker: Medewerker) {
        if (this._medewerkerUuid !== medewerker.uuid) {
            (<any>window)['dataLayer'] = (<any>window)['dataLayer'] || [];
            (<any>window)['dataLayer'].push({
                userId: medewerker.uuid,
                appVersion: VERSION,
                hoofdvestigingUuid: medewerker.hoofdvestiging ? medewerker.hoofdvestiging.uuid : null,
                hoofdvestigingNaam: medewerker.hoofdvestiging ? medewerker.hoofdvestiging.naam : null,
                organisatieUuid: medewerker.organisatie ? medewerker.organisatie.UUID : null,
                organisatieNaam: medewerker.organisatie ? medewerker.organisatie.naam : null,
                googleAnalyticsRolNaam: medewerker.googleAnalyticsRolNaam
            });
        }
    }

    public getLaatstGelezenUpdate(): Observable<IngelogdeMedewerkerQuery['ingelogdeMedewerker']['laatstGelezenUpdate']> {
        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(
                tap((result) => {
                    this.medewerkerUuid = result.data.ingelogdeMedewerker.uuid;
                    this._medewerkerId = result.data.ingelogdeMedewerker.id;
                }),
                map((result) => result.data.ingelogdeMedewerker.laatstGelezenUpdate)
            );
    }

    public async setLaatstGelezenUpdate(laatsteId: number) {
        const medewerker = await this.getMedewerkerPromise();

        this.apollo
            .mutate({
                mutation: SetLaatstGelezenUpdateDocument,
                variables: {
                    medewerkerUuid: medewerker.uuid,
                    laatsteId
                },
                update: (cache) => {
                    const medewerkerQueryData = cache.readQuery({
                        query: IngelogdeMedewerkerDocument
                    })!.ingelogdeMedewerker;

                    cache.writeQuery({
                        query: IngelogdeMedewerkerDocument,
                        data: {
                            ingelogdeMedewerker: {
                                ...medewerkerQueryData,
                                laatstGelezenUpdate: laatsteId
                            }
                        }
                    });
                }
            })
            .subscribe();
    }

    public getDagBegintijd(): Observable<IngelogdeMedewerkerQuery['ingelogdeMedewerker']['settings']['dagBegintijd']> {
        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(map((result) => result.data.ingelogdeMedewerker.settings.dagBegintijd));
    }

    public getSignaleringAantal(): Observable<IngelogdeMedewerkerQuery['ingelogdeMedewerker']['settings']['signaleringAantal']> {
        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(map((result) => result.data.ingelogdeMedewerker.settings.signaleringAantal));
    }

    public getLesgroepenVanDocent(): Observable<LesgroepenVanDeDocentQuery['lesgroepenVanDeDocent']> {
        return this.apollo
            .watchQuery({
                query: LesgroepenVanDeDocentDocument
            })
            .valueChanges.pipe(map((result) => result.data.lesgroepenVanDeDocent));
    }

    public getLesgroepenMetDossier(): Observable<MedewerkerLesgroepenMetDossierQuery['medewerkerLesgroepenMetDossier']> {
        return this.apollo
            .watchQuery({
                query: MedewerkerLesgroepenMetDossierDocument
            })
            .valueChanges.pipe(map((result) => result.data.medewerkerLesgroepenMetDossier));
    }

    public getLesgroepenVanSchooljaar(schooljaar: number): Observable<LesgroepenQuery['lesgroepen']> {
        return this.getMedewerker().pipe(
            switchMap(
                (medewerker) =>
                    this.apollo.watchQuery({
                        query: LesgroepenDocument,
                        variables: {
                            schooljaar,
                            medewerkerId: medewerker.id
                        }
                    }).valueChanges
            ),
            map((result) => result.data.lesgroepen)
        );
    }

    public async setSignaleringAantal(signaleringAantal: number) {
        const medewerker = await this.getMedewerkerPromise();

        this.apollo
            .mutate({
                mutation: SetSignaleringAantalDocument,
                variables: {
                    medewerkerUuid: medewerker.uuid,
                    signaleringAantal
                },
                update: (cache) => {
                    let medewerkerQueryData = cache.readQuery({
                        query: IngelogdeMedewerkerDocument
                    })!.ingelogdeMedewerker;

                    medewerkerQueryData = set('settings', 'signaleringAantal')(signaleringAantal)(medewerkerQueryData as any);

                    cache.writeQuery({
                        query: IngelogdeMedewerkerDocument,
                        data: { ingelogdeMedewerker: medewerkerQueryData }
                    });
                }
            })
            .subscribe();
    }

    public heeftToegangTotElo(vestigingId: string): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                const vestigingRechten = medewerker.settings.vestigingRechten.find((rechten) => rechten.vestigingId === vestigingId);

                return !isNil(vestigingRechten) && vestigingRechten.heeftToegangTotElo;
            })
        );
    }

    public heeftToegangTotEloEnSw(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                const heeftToegangTotElo = medewerker.settings.vestigingRechten.some((rechten) => rechten.heeftToegangTotElo);

                return !heeftToegangTotElo
                    ? false
                    : medewerker.settings.vestigingRechten.some((rechten) => rechten.heeftToegangTotStudiewijzer);
            })
        );
    }

    public heeftToegangTotDifferentiatie(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                const differentiatieToegestaan = medewerker.settings.vestigingRechten.some(
                    (rechten) => rechten.heeftToegangTotDifferentiatie
                );

                return differentiatieToegestaan;
            })
        );
    }

    public differentiatieToegestaanVoorVestiging(vestigingId: string): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                const vestigingRechten = medewerker.settings.vestigingRechten.find((rechten) => rechten.vestigingId === vestigingId);
                return Boolean(vestigingRechten?.heeftToegangTotDifferentiatie);
            })
        );
    }

    public heeftNotitieboekToegang(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => medewerker.settings.vestigingRechten.some((vestingRechten) => vestingRechten.heeftToegangTotNotitieboek))
        );
    }

    public heeftNotitieboekToegangVoorVestiging(vestigingId: string): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) =>
                medewerker.settings.vestigingRechten.some(
                    (vestingRechten) => vestingRechten.vestigingId === vestigingId && vestingRechten.heeftToegangTotNotitieboek
                )
            )
        );
    }

    public heeftMentordashboardToegang(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => Boolean(medewerker.settings.heeftMentordashboardToegang))
        );
    }

    public resultaatOpmerkingTonenInELOToegestaan(vestigingId: Optional<string>): Observable<boolean> {
        if (!vestigingId) {
            return of(false);
        }
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                return Boolean(
                    medewerker.settings.vestigingRechten.find((rechten) => rechten.vestigingId === vestigingId)
                        ?.resultaatOpmerkingTonenInELOToegestaan
                );
            })
        );
    }

    public heeftLeerlingPlaatsingenRegistratiesInzienRecht(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => Boolean(medewerker.settings.heeftLeerlingPlaatsingenRegistratiesInzienRecht))
        );
    }

    public importUitMethodeToegestaan(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                const importToegestaan = medewerker.settings.vestigingRechten.some((rechten) => rechten.importUitMethodeToegestaan);

                const heeftToegangTotElo = medewerker.settings.vestigingRechten.some((rechten) => rechten.heeftToegangTotElo);

                return importToegestaan && heeftToegangTotElo;
            })
        );
    }

    public getVakcodesVanDocent(): Observable<VakcodesVanDocentQuery['vakcodesVanDocent']> {
        return this.apollo
            .query({
                query: VakcodesVanDocentDocument
            })
            .pipe(map((result) => result.data.vakcodesVanDocent));
    }

    public isPlagiaatControleerbaar() {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => Boolean(medewerker.settings?.plagiaatControleerbaar))
        );
    }

    public getBerichtenVanMedewerker() {
        return this.getBerichtenVanMedewerkerRef(BERICHTEN_LIMIT).valueChanges;
    }

    public fetchMoreBerichtenVanMedewerker(aantalGetoondeBerichten: number, berichtenLimit: number = BERICHTEN_LIMIT) {
        this.getBerichtenVanMedewerkerRef(berichtenLimit).fetchMore({
            variables: {
                offset: aantalGetoondeBerichten,
                limit: aantalGetoondeBerichten + berichtenLimit
            }
        });
    }

    private getBerichtenVanMedewerkerRef(berichtenLimit?: number): QueryRef<BerichtenVanMedewerkerQuery> {
        return this.apollo.watchQuery({
            query: BerichtenVanMedewerkerDocument,
            variables: {
                offset: 0,
                limit: berichtenLimit
            }
        });
    }

    public markeerAlleBerichtenGelezen() {
        return this.apollo.mutate({
            mutation: MarkeerAllesGelezenDocument,
            optimisticResponse: { markeerAllesGelezen: true },
            update: (cache) => {
                let berichtenData = cache
                    .readQuery({
                        query: BerichtenVanMedewerkerDocument
                    })!
                    .berichtenVanMedewerker.filter(Boolean);

                berichtenData = set(all(), 'gelezen')(true)(berichtenData);

                cache.writeQuery({
                    query: BerichtenVanMedewerkerDocument,
                    data: { berichtenVanMedewerker: berichtenData }
                });

                cache.writeQuery({
                    query: AantalOngelezenBerichtenDocument,
                    data: { aantalOngelezenBerichten: 0 }
                });
            }
        });
    }

    public markeerBerichtGelezen(boodschapId: string) {
        this.apollo
            .mutate({
                mutation: MarkeerGelezenDocument,
                variables: {
                    boodschapId
                },
                optimisticResponse: { markeerGelezen: true },
                update: (cache) => {
                    cache.modify({
                        id: cache.identify({ __typename: 'InboxBericht', id: boodschapId }),
                        fields: {
                            gelezen() {
                                return true;
                            }
                        }
                    });

                    const nieuwAantal =
                        cache.readQuery({
                            query: AantalOngelezenBerichtenDocument
                        })!.aantalOngelezenBerichten - 1;

                    cache.writeQuery({
                        query: AantalOngelezenBerichtenDocument,
                        data: { aantalOngelezenBerichten: nieuwAantal >= 0 ? nieuwAantal : 0 }
                    });
                }
            })
            .subscribe();
    }

    public heeftBerichtenInzienRecht() {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => Boolean(medewerker.settings.heeftBerichtenInzienRecht))
        );
    }

    public heeftBerichtenWijzigenRecht() {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => Boolean(medewerker.settings.heeftBerichtenWijzigenRecht))
        );
    }

    public getSorteringVanMedewerker(sorteringNaam: SorteringNaam): Observable<SorteringVanMedewerkerQuery['sorteringVanMedewerker']> {
        return this.getMedewerker().pipe(
            switchMap(
                (medewerker) =>
                    this.apollo.watchQuery({
                        query: SorteringVanMedewerkerDocument,
                        variables: {
                            medewerkerUuid: medewerker.uuid,
                            sorteringNaam
                        }
                    }).valueChanges
            ),
            map(({ data }) => data.sorteringVanMedewerker)
        );
    }

    public saveSortering(naam: SorteringNaam, veld: SorteringVeld, order: SorteringOrder) {
        return this.apollo
            .mutate({
                mutation: SaveSorteringDocument,
                variables: {
                    sorteringInput: {
                        medewerkerUuid: this.medewerkerUuid,
                        naam,
                        veld,
                        order
                    }
                },
                optimisticResponse: {
                    saveSortering: true
                },
                update: (cache) => {
                    cache.writeQuery({
                        query: SorteringVanMedewerkerDocument,
                        data: {
                            sorteringVanMedewerker: {
                                naam,
                                order,
                                veld,
                                __typename: 'Sortering'
                            }
                        },
                        variables: {
                            medewerkerUuid: this.medewerkerUuid,
                            sorteringNaam: naam
                        }
                    });
                }
            })
            .subscribe();
    }

    public getMentorleerlingen(): Observable<MentorleerlingenQuery['mentorleerlingen']> {
        return this.apollo
            .watchQuery({
                query: MentorleerlingenDocument
            })
            .valueChanges.pipe(map(({ data }) => data.mentorleerlingen));
    }

    public getMentorleerlingenLijstIds(): Observable<MentorleerlingenLijstIdsQuery['mentorleerlingenLijstIds']> {
        return this.apollo
            .watchQuery({
                query: MentorleerlingenLijstIdsDocument
            })
            .valueChanges.pipe(map(({ data }) => data.mentorleerlingenLijstIds));
    }

    // deze staat in medewerker-data-service zodat niet hele notitieboek-data-service + alle document imports meekomen in de main bundle
    public ongelezenNotitiesAanwezigWatchQuery() {
        return this.apollo.watchQuery({
            query: OngelezenNotitiesAanwezigDocument,
            fetchPolicy: 'network-only'
        });
    }

    public getVestigingIdsMetNotitieboekRechten(): Observable<Set<string>> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) => {
                return new Set<string>(
                    medewerker.settings.vestigingRechten.filter((vr) => vr.heeftToegangTotNotitieboek).map((vr) => vr.vestigingId)
                );
            })
        );
    }

    public heeftToegangTotMentordashboardCompleet(): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) =>
                medewerker.settings.vestigingRechten.some((vestingRechten) => vestingRechten.heeftToegangMentordashboardCompleet)
            )
        );
    }

    public heeftRecht(rechten: NonNullable<MedewerkerRechten>[], operation: Operation = 'AND'): Observable<boolean> {
        return this.getMedewerker().pipe(
            take(1),
            map((medewerker) =>
                operation === 'AND'
                    ? rechten.every((recht) => (medewerker.settings as Settings)[recht])
                    : rechten.some((recht) => (medewerker.settings as Settings)[recht])
            )
        );
    }
}
