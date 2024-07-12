import { Injectable, inject } from '@angular/core';
import { ApolloQueryResult } from '@apollo/client/core';
import { Apollo } from 'apollo-angular';
import { addWeeks, getISOWeek, getYear, isSameDay, isWeekend, subWeeks } from 'date-fns';
import { curry, omit } from 'lodash-es';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import {
    Afspraak,
    AfspraakParticipant,
    AfspraakParticipantInput,
    Bijlage,
    BijlageInput,
    CreateAfspraakDocument,
    CreateAfspraakInput,
    DeleteAfspraakDocument,
    GetVerjaardagenDocument,
    HerhalendeAfspraak,
    Leerling,
    LeerlingVerjaardagen,
    LesmomentenVanWeekDocument,
    Medewerker,
    RoosterDag,
    RoosterDagenDocument,
    RoosterDagenQuery,
    UpdateAfspraakDocument,
    UpdateAfspraakInput,
    ZoekParticipantenDocument,
    ZoekParticipantenQuery,
    namedOperations
} from '../../generated/_types';
import { RoosterItem, TWINTIG_MIN_MS, VRoosterDag, VrijUur } from '../core/models';
import { convertToLocalDate } from '../rooster-shared/utils/date.utils';
import { sortAfspraakByBegin, toId } from '../rooster-shared/utils/utils';
import { MedewerkerDataService } from './../core/services/medewerker-data.service';

export interface RoosterDagenQueryResponse {
    roosterDagen: RoosterDagenQuery['roosterDagen'];
    loading: boolean;
}

const toVRoosterDag = curry((dagBegintijd: string, dag: RoosterDag): VRoosterDag => {
    let roosterItems: RoosterItem[] = [];

    if (isWeekend(dag.datum)) {
        roosterItems = [...dag.afspraken].sort(sortAfspraakByBegin);
    } else {
        let huidigeTijd = new Date(dag.datum);
        if (dagBegintijd) {
            const split = dagBegintijd.split(':');
            huidigeTijd.setHours(parseInt(split[0], 10), parseInt(split[1], 10), 0, 0);
        } else {
            huidigeTijd.setHours(8, 0, 0, 0);
        }

        [...dag.afspraken].sort(sortAfspraakByBegin).forEach((afspraak) => {
            const diff = new Date(afspraak.begin).getTime() - huidigeTijd.getTime();
            if (diff >= TWINTIG_MIN_MS) {
                roosterItems.push({
                    begin: huidigeTijd,
                    eind: afspraak.begin,
                    aantalMinuten: diff / 60000
                } as VrijUur);
            }

            roosterItems.push(afspraak);

            const gqlEind = new Date(afspraak.eind);
            if (gqlEind.getTime() > huidigeTijd.getTime()) {
                huidigeTijd = gqlEind;
            }
        });
    }

    return {
        datum: dag.datum,
        roosterItems,
        isWeekend: isWeekend(dag.datum),
        isAdjacentWeek: isSameDay(dag.datum, subWeeks(dag.datum, 1)) || isSameDay(dag.datum, addWeeks(dag.datum, 1))
    };
});

const isRoosterAfspraak = (item: RoosterItem): item is Afspraak => 'isRoosterAfspraak' in item && item.isRoosterAfspraak;

@Injectable({
    providedIn: 'root'
})
export class RoosterDataService {
    private dataClient = inject(Apollo);
    private medewerkerDataService = inject(MedewerkerDataService);

    public getRoosterAfsprakenVanDag(datum: Date) {
        return this.getRoosterDag(datum).pipe(map((dag) => dag.roosterItems.filter(isRoosterAfspraak)));
    }

    public getRoosterDagen(jaar: number, week: number): Observable<VRoosterDag[]> {
        return this.medewerkerDataService.getMedewerker().pipe(
            switchMap((medewerker) =>
                this.roosterDagenQuery(medewerker.id, jaar, week).pipe(
                    filter((result) => !!result.data),
                    map((res) => res.data.roosterDagen.map(toVRoosterDag(medewerker.settings.dagBegintijd)))
                )
            )
        );
    }

    private getRoosterDag(datum: Date) {
        const jaar = getYear(datum);
        const week = getISOWeek(datum);

        return this.getRoosterDagen(jaar, week).pipe(map((roosterDagen) => roosterDagen.find((dag) => isSameDay(dag.datum, datum))!));
    }

    public zoekParticipanten(zoekterm: string, afspraakId?: string): Observable<ZoekParticipantenQuery['zoekParticipanten']> {
        return this.dataClient
            .watchQuery({
                query: ZoekParticipantenDocument,
                variables: {
                    zoekterm,
                    afspraakId
                }
            })
            .valueChanges.pipe(map((result) => result.data.zoekParticipanten));
    }

    public getLesmomentenVoorWeek(jaar: number, week: number, exacteLesgroepenMatch: boolean, lesgroepIds?: string[]) {
        return this.dataClient
            .watchQuery({
                query: LesmomentenVanWeekDocument,
                variables: {
                    jaar,
                    week,
                    exacteLesgroepenMatch,
                    lesgroepIds
                }
            })
            .valueChanges.pipe(map((result) => result.data.lesmomentenVanWeek));
    }

    public aantalVerjaardagenVandaag(): Observable<number> {
        return this.verjaardagen().pipe(
            map((leerlingVerjaardagen: LeerlingVerjaardagen) => leerlingVerjaardagen.jarigenDezeWeek),
            map((leerlingen: Leerling[]) => {
                return leerlingen.filter((leerling) => leerling.isJarig).length;
            })
        );
    }

    public verjaardagen(): Observable<LeerlingVerjaardagen> {
        return this.dataClient
            .watchQuery({
                query: GetVerjaardagenDocument
            })
            .valueChanges.pipe(map((result) => result.data.getVerjaardagen));
    }

    private mapAfspraakParticipantToInput(afspraakParticipant: AfspraakParticipant) {
        return {
            id: afspraakParticipant.id,
            stamgroep: afspraakParticipant.stamgroep?.id,
            lesgroep: afspraakParticipant.lesgroep?.id,
            medewerker: afspraakParticipant.medewerker?.id,
            leerling: afspraakParticipant.leerling?.id
        } as AfspraakParticipantInput;
    }

    private getDeelnemerId(afspraakParticipant: AfspraakParticipant) {
        return (
            afspraakParticipant.stamgroep?.id ??
            afspraakParticipant.lesgroep?.id ??
            afspraakParticipant.medewerker?.id ??
            afspraakParticipant.leerling?.id
        );
    }

    // De optimistic response voor Afspraak kan er niet mee overweg als er een participant zonder id voorkomt in het lijstje participanten.
    private mapParticipantOptimisticResponse = (afspraakParticipant: AfspraakParticipant) => ({
        ...afspraakParticipant,
        id: afspraakParticipant.id || this.getDeelnemerId(afspraakParticipant)!
    });

    public updateAfspraak(afspraak: Afspraak) {
        const beginLocalDateString = convertToLocalDate(afspraak.begin);
        const eindLocalDateString = convertToLocalDate(afspraak.eind);

        const updateAfspraakInput = {
            id: afspraak.id,
            titel: afspraak.titel,
            begin: beginLocalDateString as any,
            eind: eindLocalDateString as any,
            locatie: afspraak.locatie ?? '',
            omschrijving: afspraak.omschrijving,
            herhalendeAfspraak: afspraak.herhalendeAfspraak
                ? ({
                      ...afspraak.herhalendeAfspraak,
                      beginDatum: convertToLocalDate(afspraak.herhalendeAfspraak.beginDatum) as any,
                      eindDatum: afspraak.herhalendeAfspraak.eindDatum
                          ? (convertToLocalDate(afspraak.herhalendeAfspraak.eindDatum) as any)
                          : null
                  } as HerhalendeAfspraak)
                : null,
            bijlagen:
                afspraak.bijlagen?.map(
                    (bijlage) =>
                        ({
                            ...omit(bijlage, 'extensie', '__typename'),
                            differentiatiegroepen: bijlage.differentiatiegroepen?.map(toId) ?? [],
                            differentiatieleerlingen: bijlage.differentiatiegroepen?.map(toId) ?? []
                        }) as BijlageInput
                ) ?? [],
            presentieRegistratieVerplicht: afspraak.presentieRegistratieVerplicht,
            participantenEigenAfspraak: afspraak.participantenEigenAfspraak.map(this.mapAfspraakParticipantToInput)
        } as UpdateAfspraakInput;

        return this.dataClient
            .mutate({
                mutation: UpdateAfspraakDocument,
                variables: {
                    afspraak: updateAfspraakInput
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    updateAfspraak: {
                        __typename: 'updateAfspraakPayload',
                        afspraak: {
                            ...afspraak,
                            __typename: 'Afspraak',
                            isRoosterAfspraak: false,
                            isRoosterToets: afspraak.isRoosterToets,
                            isBlokuur: false,
                            isKwt: false,
                            heeftLesgroepen: false,
                            heeftZwevendeLesitems: false,
                            participantenEigenAfspraak: afspraak.participantenEigenAfspraak.map(this.mapParticipantOptimisticResponse),
                            vestigingId: '',
                            herhalendeAfspraak: afspraak.herhalendeAfspraak
                                ? {
                                      ...afspraak.herhalendeAfspraak,
                                      __typename: 'HerhalendeAfspraak',
                                      id: afspraak.herhalendeAfspraak.id ?? new Date().toISOString()
                                  }
                                : null,
                            aantalToekomstigeHerhalingen: 0,
                            vak: afspraak.vak,
                            bijlagen: afspraak.bijlagen.map(
                                (bijlage) =>
                                    ({
                                        ...bijlage,
                                        id: new Date().toString(),
                                        contentType: '',
                                        extensie: '',
                                        methodeId: null,
                                        __typename: 'Bijlage'
                                    }) as Bijlage
                            )
                        }
                    }
                },
                refetchQueries: [namedOperations.Query.roosterDagen],
                update: (cache) => {
                    // omdat we de aangemaakte/verwijderde herhalende afspraken direct willen
                    // tonen, gooien we alle roosterDagen uit de cache
                    cache.evict({ fieldName: 'roosterDagen' });
                    cache.gc();
                }
            })
            .pipe(map((result) => result.data?.updateAfspraak.afspraak));
    }

    public deleteAfspraak(afspraak: Afspraak) {
        return this.dataClient
            .mutate({
                mutation: DeleteAfspraakDocument,
                variables: {
                    afspraak: { id: afspraak.id }
                },
                optimisticResponse: {
                    __typename: 'Mutation',
                    deleteAfspraak: {
                        __typename: 'deleteAfspraakPayload',
                        succes: true
                    }
                },
                update: (cache) => {
                    cache.evict({
                        id: cache.identify({ ...afspraak, __typename: 'Afspraak' })
                    });
                    cache.gc();
                }
            })
            .subscribe();
    }

    public saveAfspraak(newAfspraak: Afspraak) {
        const beginLocalDateString = convertToLocalDate(newAfspraak.begin);
        const eindLocalDateString = convertToLocalDate(newAfspraak.eind);

        const createAfspraakInput = {
            titel: newAfspraak.titel,
            begin: beginLocalDateString as any,
            eind: eindLocalDateString as any,
            locatie: newAfspraak.locatie,
            omschrijving: newAfspraak.omschrijving,
            herhalendeAfspraak: newAfspraak.herhalendeAfspraak
                ? ({
                      ...newAfspraak.herhalendeAfspraak,
                      beginDatum: convertToLocalDate(newAfspraak.herhalendeAfspraak.beginDatum) as any,
                      eindDatum: newAfspraak.herhalendeAfspraak.eindDatum
                          ? (convertToLocalDate(newAfspraak.herhalendeAfspraak.eindDatum) as any)
                          : null
                  } as HerhalendeAfspraak)
                : null,
            bijlagen:
                newAfspraak.bijlagen?.map((bijlage: Omit<Bijlage, 'extensie'>) => ({
                    ...bijlage,
                    differentiatiegroepen: bijlage.differentiatiegroepen?.map(toId) ?? [],
                    differentiatieleerlingen: bijlage.differentiatiegroepen?.map(toId) ?? []
                })) ?? [],
            participantenEigenAfspraak: newAfspraak.participantenEigenAfspraak?.map(this.mapAfspraakParticipantToInput) ?? [],
            presentieRegistratieVerplicht: newAfspraak.presentieRegistratieVerplicht
        } as CreateAfspraakInput;

        return this.medewerkerDataService.getMedewerker().pipe(
            take(1),
            switchMap((medewerker: Medewerker) => {
                return this.dataClient.mutate({
                    mutation: CreateAfspraakDocument,
                    variables: {
                        afspraak: createAfspraakInput
                    },
                    optimisticResponse: {
                        __typename: 'Mutation',
                        createAfspraak: {
                            __typename: 'createAfspraakPayload',
                            afspraak: {
                                ...newAfspraak,
                                __typename: 'Afspraak',
                                id: new Date().toString(),
                                begin: new Date(beginLocalDateString),
                                eind: new Date(eindLocalDateString),
                                isRoosterAfspraak: false,
                                isRoosterToets: false,
                                isBlokuur: false,
                                isKwt: false,
                                heeftLesgroepen: false,
                                presentieRegistratieVerwerkt: false,
                                heeftZwevendeLesitems: false,
                                jaar: getYear(newAfspraak.begin),
                                week: getISOWeek(newAfspraak.week),
                                isNu: false,
                                lesgroepen: [],
                                herhalendeAfspraak: newAfspraak.herhalendeAfspraak
                                    ? { ...newAfspraak.herhalendeAfspraak, __typename: 'HerhalendeAfspraak', id: new Date().toISOString() }
                                    : null,
                                participantenEigenAfspraak:
                                    newAfspraak.participantenEigenAfspraak?.map(this.mapParticipantOptimisticResponse) ?? [],
                                auteurEigenAfspraak: newAfspraak.auteurEigenAfspraak ? newAfspraak.auteurEigenAfspraak : medewerker,
                                vestigingId: '',
                                aantalToekomstigeHerhalingen: 0,
                                vak: null,
                                bijlagen: createAfspraakInput.bijlagen.map((bijlage) => ({
                                    ...bijlage,
                                    id: new Date().toString(),
                                    contentType: '',
                                    extensie: '',
                                    methodeId: null
                                }))
                            }
                        }
                    },
                    refetchQueries: [namedOperations.Query.roosterDagen],
                    update: (cache) => {
                        // omdat we de aangemaakte/verwijderde herhalende afspraken direct willen
                        // tonen, gooien we alle roosterDagen uit de cache
                        cache.evict({ fieldName: 'roosterDagen' });
                        cache.gc();
                    }
                });
            }),
            map((result) => result.data?.createAfspraak.afspraak)
        );
    }

    private roosterDagenQuery(medewerkerId: string, jaar: number, week: number): Observable<ApolloQueryResult<RoosterDagenQuery>> {
        return this.dataClient.watchQuery({
            query: RoosterDagenDocument,
            variables: {
                medewerkerId,
                jaar,
                week
            }
        }).valueChanges;
    }
}
