import { Injectable, inject } from '@angular/core';
import { gql } from '@apollo/client/core';
import {
    BevrorenStatus,
    CijferPeriodesVanLesgroepDocument,
    CijferhistorieDocument,
    CijferhistorieQuery,
    Deeltoetskolom,
    GetMentorDashboardVakResultatenDocument,
    GetMentorDashboardVakResultatenQuery,
    Herkansing,
    ImporteerbareResultatenVanLeerlingDocument,
    IngelogdeMedewerkerDocument,
    KolomZichtbaarheid,
    LeerlingVoortgangsdossiersDocument,
    MatrixResultaatkolomFieldsFragmentDoc,
    Maybe,
    Resultaat,
    ResultaatInputParam,
    ResultaatKolomInput,
    ResultaatLabelLijstenVanVestigingDocument,
    ResultaatkolomType,
    SaveLesgroepOmschrijvingDocument,
    SaveResultaatOpmerkingenDocument,
    SaveResultatenDocument,
    SaveToetsKolomDocument,
    SetKolomZichtbaarheidDocument,
    ToetsSoortenVanVestigingDocument,
    Toetskolom,
    VoortgangsdossierKolomZichtbaarheidDocument,
    VoortgangsdossierMatrixVanLesgroepDocument,
    VoortgangsdossierMatrixVanLesgroepQuery,
    VoortgangsdossiersDocument,
    namedOperations
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { deleteToetsKolom } from '../../generated/_operations';
import { convertToLocalDate } from '../rooster-shared/utils/date.utils';
import { Optional, isPresent } from '../rooster-shared/utils/utils';
import { docentQuery } from '../shared/utils/apollo.utils';
import { getResultaatKey } from './pipes/resultaat-key.pipe';
import { isKolomOfType, parseCellId } from './resultaten.utils';

@Injectable({
    providedIn: 'root'
})
export class ResultaatDataService {
    private apollo = inject(Apollo);

    public getCijferPeriodesVanLesgroep(lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: CijferPeriodesVanLesgroepDocument,
                variables: {
                    lesgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.cijferPeriodesVanLesgroep));
    }

    public getVoortgangsdossiers(lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: VoortgangsdossiersDocument,
                variables: {
                    lesgroepId
                }
            })
            .valueChanges.pipe(map((result) => result.data.voortgangsdossiers));
    }

    public getVoortgangsdossierMatrixVanLesgroep(lesgroepId: string, voortgangsdossierId: Optional<string>) {
        return this.apollo
            .watchQuery({
                query: VoortgangsdossierMatrixVanLesgroepDocument,
                variables: {
                    lesgroepId,
                    voortgangsdossierId
                }
            })
            .valueChanges.pipe(
                tap((result) => {
                    if (voortgangsdossierId) {
                        return;
                    }
                    // Initieel wordt de matrix opgevraagd zonder voortgangsdossierId, dit is voor cache acties zoals kolommen opvragen nodig.
                    // Om deze reden schrijven we de query nogmaals weg met het id van het voortgangsdossier.
                    this.apollo.client.cache.writeQuery({
                        query: VoortgangsdossierMatrixVanLesgroepDocument,
                        variables: {
                            lesgroepId,
                            voortgangsdossierId: result.data.voortgangsdossierMatrixVanLesgroep.voortgangsdossier.id
                        },
                        data: result.data
                    });
                }),
                map((result) => result.data.voortgangsdossierMatrixVanLesgroep),
                catchError(() =>
                    of({
                        leerlingen: <any>[],
                        periodes: <any>[]
                    } as VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep'])
                )
            );
    }

    public getLeerlingVoortgangsdossiers(lesgroepId: string, leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingVoortgangsdossiersDocument,
                variables: {
                    lesgroepId,
                    leerlingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.leerlingVoortgangsdossiers));
    }

    public getResultaatLabelLijstenVanVestiging(vestigingId: string) {
        return this.apollo
            .watchQuery({
                query: ResultaatLabelLijstenVanVestigingDocument,
                variables: {
                    vestigingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.resultaatLabelLijstenVanVestiging));
    }

    public getToetsSoortenVanVestiging(vestigingId: string) {
        return this.apollo
            .watchQuery({
                query: ToetsSoortenVanVestigingDocument,
                variables: {
                    vestigingId
                }
            })
            .valueChanges.pipe(map((result) => result.data.toetsSoortenVanVestiging));
    }

    public getVoortgangsdossierKolomZichtbaarheid(lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(
                switchMap(
                    (medewerkerRes) =>
                        this.apollo.watchQuery({
                            query: VoortgangsdossierKolomZichtbaarheidDocument,
                            variables: {
                                medewerkerUuid: medewerkerRes.data.ingelogdeMedewerker.uuid,
                                lesgroepId
                            }
                        }).valueChanges
                ),
                filter((result) => !!result.data),
                map((result) => result.data.voortgangsdossierKolomZichtbaarheid)
            );
    }

    public saveToetsKolom(toetskolom: Toetskolom, lesgroepId: string, voortgangsdossierId: string, kolomType: ResultaatkolomType) {
        const samengesteldeToetskolomId = isKolomOfType<Deeltoetskolom>(toetskolom, ResultaatkolomType.DEELTOETS)
            ? toetskolom.samengesteldeToetskolom.id
            : null;
        return this.apollo.mutate({
            mutation: SaveToetsKolomDocument,
            refetchQueries: [namedOperations.Query.voortgangsdossierMatrixVanLesgroep],
            awaitRefetchQueries: true,
            variables: {
                toetsKolom: {
                    id: toetskolom.id,
                    code: toetskolom.code,
                    herkansing: toetskolom.herkansing,
                    periode: toetskolom.periode,
                    resultaatLabelLijst: toetskolom.resultaatLabelLijst?.id,
                    toetsSoort: toetskolom.toetsSoort?.id,
                    weging: toetskolom.weging,
                    omschrijving: toetskolom.omschrijving,
                    domeincode: toetskolom.domeincode,
                    domeinomschrijving: toetskolom.domeinomschrijving,
                    toetsduur: toetskolom.toetsduur,
                    toetsvorm: toetskolom.toetsvorm,
                    afnamevorm: toetskolom.afnamevorm,
                    datumToets: toetskolom.datumToets ? convertToLocalDate(toetskolom.datumToets) : null,
                    samengesteldeToetskolom: samengesteldeToetskolomId,
                    bevrorenStatus: toetskolom.bevrorenStatus ?? BevrorenStatus.Ontdooid,
                    lesgroepId,
                    voortgangsdossierId
                } as ResultaatKolomInput,
                kolomType
            }
        });
    }

    public deleteToetsKolom(toetskolom: Toetskolom, lesgroepId: string) {
        return this.apollo
            .mutate({
                mutation: deleteToetsKolom,
                variables: {
                    toetsKolomId: toetskolom.id
                },
                optimisticResponse: { [namedOperations.Mutation.deleteToetsKolom]: true },
                update: (cache) => {
                    if (toetskolom.herkansing !== Herkansing.Geen) {
                        cache.evict({
                            id: cache.identify({ id: toetskolom.id, herkansingsNummer: 1, __typename: 'MatrixResultaatkolom', lesgroepId })
                        });

                        cache.evict({
                            id: cache.identify({ id: toetskolom.id, herkansingsNummer: 2, __typename: 'MatrixResultaatkolom', lesgroepId })
                        });
                    }
                    cache.evict({
                        id: cache.identify({ id: toetskolom.id, herkansingsNummer: null, __typename: 'MatrixResultaatkolom', lesgroepId })
                    });
                    cache.gc();
                }
            })
            .subscribe();
    }

    public setKolomZichtbaarheid(lesgroepId: string, kolommenZichtbaarheid: KolomZichtbaarheid[]) {
        const zichtbaarheidInput = kolommenZichtbaarheid.map(({ __typename, ...input }) => input);

        return this.apollo
            .watchQuery({
                query: IngelogdeMedewerkerDocument
            })
            .valueChanges.pipe(
                take(1),
                map((result) => result.data.ingelogdeMedewerker),
                switchMap((medewerker) =>
                    this.apollo.mutate({
                        mutation: SetKolomZichtbaarheidDocument,
                        variables: {
                            medewerkerUuid: medewerker.uuid,
                            lesgroepId,
                            zichtbaarheid: zichtbaarheidInput
                        },
                        update: (cache) => {
                            cache.writeQuery({
                                query: VoortgangsdossierKolomZichtbaarheidDocument,
                                data: { voortgangsdossierKolomZichtbaarheid: kolommenZichtbaarheid },
                                variables: {
                                    medewerkerUuid: medewerker.uuid,
                                    lesgroepId
                                }
                            });
                        }
                    })
                )
            )
            .subscribe();
    }

    public getResultaatkolom(
        lesgroepId: string,
        voortgangsdossierId: string,
        resultaatkolomId: string,
        herkansingsNummer?: Optional<number>
    ) {
        const voortgangsdossier = this.apollo.client.readQuery({
            query: VoortgangsdossierMatrixVanLesgroepDocument,
            variables: {
                lesgroepId,
                voortgangsdossierId
            }
        })?.voortgangsdossierMatrixVanLesgroep;

        return voortgangsdossier?.periodes
            .flatMap((periode) => [
                ...periode.resultaatkolommen,
                ...periode.advieskolommen,
                periode.periodeGemiddeldeKolom,
                periode.rapportGemiddeldeKolom,
                periode.rapportCijferkolom
            ])
            .filter(isPresent)
            .find((kolom) => kolom.id === resultaatkolomId && kolom.herkansingsNummer === (herkansingsNummer ?? null));
    }

    public getDeeltoetskolommen(lesgroepId: string, voortgangsdossierId: string, samengetsteldeToetskolomId: string) {
        const voortgangsdossier = this.apollo.client.readQuery<VoortgangsdossierMatrixVanLesgroepQuery>({
            query: VoortgangsdossierMatrixVanLesgroepDocument,
            variables: {
                lesgroepId,
                voortgangsdossierId
            }
        })?.voortgangsdossierMatrixVanLesgroep;

        return (
            voortgangsdossier?.periodes
                .flatMap((periode) => periode.resultaatkolommen)
                .filter((kolom) => {
                    const resultaatkolom = kolom.resultaatkolom;
                    if (isKolomOfType<Deeltoetskolom>(resultaatkolom, ResultaatkolomType.DEELTOETS)) {
                        return resultaatkolom.samengesteldeToetskolom?.id === samengetsteldeToetskolomId;
                    }
                    return false;
                }) ?? []
        );
    }

    public saveResultaten(voortgangsdossierId: string, lesgroepId: string, resultaatInputParams: ResultaatInputParam[]) {
        return this.apollo.mutate({
            mutation: SaveResultatenDocument,
            variables: {
                resultaatInputParams,
                voortgangsdossierId,
                lesgroepId
            },
            refetchQueries: [namedOperations.Query.voortgangsdossierMatrixVanLesgroep],
            update: (cache) => {
                resultaatInputParams.forEach((resultaatInputParams) => {
                    cache.evict({
                        fieldName: 'cijferhistorie',
                        args: {
                            cellId: getResultaatKey(
                                resultaatInputParams.resultaatKey.resultaatkolomId,
                                resultaatInputParams.resultaatKey.leerlingUUID,
                                resultaatInputParams.resultaatKey.herkansingsNummer
                            ),
                            lesgroepId,
                            voortgangsdossierId
                        }
                    });
                });
                cache.evict({ fieldName: namedOperations.Query.getMentorDashboardVoortgangsdossierVoorLeerling });
                cache.evict({ fieldName: namedOperations.Query.getMentorDashboardVakResultaten });
                cache.gc();
            }
        });
    }

    public getMentordashboardVakResultatenQuery(leerlingId: string, vakId: string, periode: number) {
        return this.apollo
            .watchQuery({
                query: GetMentorDashboardVakResultatenDocument,
                variables: { leerlingId, periode, vakId }
            })
            .valueChanges.pipe(docentQuery(mentordashboardVakResultatenDefault));
    }

    public saveResultaatOpmerkingen(
        voortgangsdossierId: string,
        lesgroepId: string,
        cellId: string,
        opmerkingen: Maybe<string>,
        toonOpmerkingInELO: boolean
    ) {
        const resultaatOpmerkingenFragment = gql`
            fragment resultaatOpmerkingen on Resultaat {
                cellId
                opmerkingen
                toonOpmerkingInELO
            }
        `;

        const resultaat = this.apollo.client.cache.readFragment<Resultaat>({
            id: this.apollo.client.cache.identify({ __typename: 'Resultaat', cellId, lesgroepId }),
            fragment: resultaatOpmerkingenFragment
        });

        const refetchQueries = resultaat ? undefined : [namedOperations.Query.voortgangsdossierMatrixVanLesgroep];
        return this.apollo
            .mutate({
                mutation: SaveResultaatOpmerkingenDocument,
                variables: {
                    voortgangsdossierId,
                    lesgroepId,
                    cellId,
                    opmerkingen,
                    toonOpmerkingInELO
                },
                refetchQueries,
                update: (cache) => {
                    // Dit kan vanaf apollo client 3.5 makkelijker met een cache.updateFragment
                    // die voegt een readFragment en writeFragment samen
                    if (resultaat) {
                        cache.writeFragment<Resultaat>({
                            data: {
                                ...resultaat,
                                opmerkingen,
                                toonOpmerkingInELO,
                                lesgroepId
                            },
                            fragment: resultaatOpmerkingenFragment
                        });
                    }
                }
            })
            .subscribe();
    }

    public getCachedResultaat(cellId: string) {
        const cellIdWaardes = parseCellId(cellId);
        const cache = this.apollo.client.cache;
        const kolom = cache.readFragment({
            id: cache.identify({
                __typename: 'MatrixResultaatkolom',
                id: cellIdWaardes.toetskolomId,
                herkansingsNummer: cellIdWaardes.herkansingsNummer
            }),
            fragment: MatrixResultaatkolomFieldsFragmentDoc
        });
        return kolom?.resultaten.find((resultaat) => resultaat.cellId === cellId);
    }

    public getCijferhistorie(
        voortgangsdossierId: string,
        lesgroepId: string,
        cellId: string
    ): Observable<CijferhistorieQuery['cijferhistorie']> {
        return this.apollo
            .watchQuery({
                query: CijferhistorieDocument,
                variables: {
                    voortgangsdossierId,
                    lesgroepId,
                    cellId
                }
            })
            .valueChanges.pipe(map((result) => result.data.cijferhistorie));
    }

    public saveLesgroepOmschrijving(
        voortgangsdossierId: string,
        lesgroepId: string,
        toetskolom: Toetskolom,
        lesgroepOmschrijving: Optional<string>
    ) {
        return this.apollo.mutate({
            mutation: SaveLesgroepOmschrijvingDocument,
            variables: {
                voortgangsdossierId,
                lesgroepId,
                toetsKolomId: toetskolom.id,
                lesgroepOmschrijving
            },
            optimisticResponse: {
                __typename: 'Mutation',
                saveLesgroepOmschrijving: true
            },
            update: (cache) => {
                if (toetskolom.herkansing !== Herkansing.Geen) {
                    cache.modify({
                        id: cache.identify({ id: toetskolom.id, herkansingsNummer: 1, __typename: 'MatrixResultaatkolom', lesgroepId }),
                        fields: {
                            lesgroepSpecifiekeOmschrijving: () => lesgroepOmschrijving ?? null
                        }
                    });

                    cache.modify({
                        id: cache.identify({ id: toetskolom.id, herkansingsNummer: 2, __typename: 'MatrixResultaatkolom', lesgroepId }),
                        fields: {
                            lesgroepSpecifiekeOmschrijving: () => lesgroepOmschrijving ?? null
                        }
                    });
                }
                cache.modify({
                    id: cache.identify({ id: toetskolom.id, herkansingsNummer: null, __typename: 'MatrixResultaatkolom', lesgroepId }),
                    fields: {
                        lesgroepSpecifiekeOmschrijving: () => lesgroepOmschrijving ?? null
                    }
                });
            }
        });
    }

    public getImporteerbareResultatenVanLeerling(leerlingUUID: string, lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: ImporteerbareResultatenVanLeerlingDocument,
                variables: {
                    leerlingUUID,
                    lesgroepId
                },
                fetchPolicy: 'no-cache'
            })
            .valueChanges.pipe(map((result) => result.data.importeerbareResultatenVanLeerling));
    }
}

export const mentordashboardVakResultatenDefault: GetMentorDashboardVakResultatenQuery['getMentorDashboardVakResultaten'] = {} as any;
