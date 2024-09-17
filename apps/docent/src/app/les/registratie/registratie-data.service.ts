import { Injectable, inject } from '@angular/core';
import { ApolloCache, WatchQueryFetchPolicy } from '@apollo/client/core';
import {
    AbsentieMelding,
    AbsentieMeldingFieldsFragment,
    AbsentieSoort,
    AfspraakDocument,
    AfspraakQuery,
    ExterneRegistraties,
    ExterneRegistratiesDocument,
    KeuzelijstWaardeMogelijkheid,
    Leerling,
    LeerlingRegistratie,
    LesRegistratieDocument,
    LesRegistratieFieldsFragment,
    LesRegistratieQuery,
    PeriodeDocument,
    SaveLesRegistratieDocument,
    SaveSignaleringenInstellingenDocument,
    SignaleringenDocument,
    SignaleringenInstellingenDocument,
    SignaleringenInstellingenQuery,
    SignaleringenQuery,
    VrijVeldWaarde,
    VrijVeldWaardeInput
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { curry, eq, sortBy } from 'lodash-es';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { matching, mod, set } from 'shades';
import {
    aanwezigheid,
    leerlingMetIsJarig,
    leerlingRegistratieFragment,
    lesRegistratieFields,
    lesRegistratieFragment,
    registratieVerwerkt
} from '../../../generated/_operations';
import { getSignaleringId } from '../../core/models/signalering.model';
import { convertToLocalDate } from '../../rooster-shared/utils/date.utils';
import {
    LeerlingRegistratieQueryType,
    isAanwezigGemeldDoorAndereDocent,
    isAbsentGemeldDoorAndereDocent,
    isTeLaatGemeldDoorAndereDocent,
    isVerwijderdGemeldDoorAndereDocent
} from '../../rooster-shared/utils/registratie.utils';
import { Optional, notEqualsId } from '../../rooster-shared/utils/utils';

const huiswerkVrijVeldNaam = 'Huiswerk niet in orde';
const materiaalVrijVeldNaam = 'Materiaal niet in orde';

const getVrijVeldSignaleringMetNaam = (veldNaam: string, signaleringen: SignaleringenQuery['signaleringen']) =>
    signaleringen?.vrijVeldSignaleringen?.find((vvs) => vrijVeldSignaleringHeeftNaam(veldNaam, vvs));
const getLeerlingSignaleringMetId = (
    leerlingId: string,
    signalering: Optional<
        | SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]
        | SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number]
    >
) => signalering?.leerlingSignaleringen?.find((sig) => leerlingSignaleringHeeftLeerlingId(leerlingId, sig));
const getKeuzelijstWaardeSignaleringMetLeerlingEnAfspraak = (
    leerlingId: string,
    afspraakId: string,
    signalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]
) =>
    signalering?.keuzelijstWaardeSignaleringen?.find((ksig) =>
        ksig.leerlingSignaleringen?.find(
            (lsig) => leerlingSignaleringHeeftLeerlingId(leerlingId, lsig) && leerlingSignaleringHeeftAfspraakId(afspraakId, lsig)
        )
    );
const getKeuzelijstWaardeSignaleringMetWaarde = (
    waardeId: string,
    signalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]
) => signalering?.keuzelijstWaardeSignaleringen?.find((ksig) => keuzelijstWaardeSignaleringHeeftKeuzelijstWaardeId(waardeId, ksig));
const getAfspraakInLeerlingSignalering = (
    afspraakId: string,
    signalering: Optional<SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]>
) => signalering?.afspraken.find((a) => a.id === afspraakId);

const vrijVeldSignaleringHeeftNaam = curry(
    (veldNaam: string, sig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]) => sig.vrijVeld.naam === veldNaam
);
const keuzelijstWaardeSignaleringHeeftKeuzelijstWaardeId = curry(
    (
        keuzelijstWaardeId: string,
        sig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number]
    ) => sig.keuzelijstWaarde.id === keuzelijstWaardeId
);
const leerlingSignaleringHeeftLeerlingId = curry(
    (leerlingId: string, sig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]) =>
        sig.leerling.id === leerlingId
);
const leerlingSignaleringHeeftAfspraakId = (
    afspraakId: string,
    sig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
) => sig.afspraken.find((a) => a.id === afspraakId);

const getVrijVeldDefIndex = curry(
    (
        vrijVeldDefs: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'],
        vrijVeldSig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]
    ) => vrijVeldDefs.findIndex((vrijVeldDef) => vrijVeldDef.id === vrijVeldSig?.vrijVeld.id)
);
const getKeuzelijstWaardeDefIndex = curry(
    (
        vrijVeldDefs: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'],
        vrijVeldSig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number],
        keuzelijstWaardeSig: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number]
    ) =>
        vrijVeldDefs
            .find((vrijVeldDef) => vrijVeldDef.id === vrijVeldSig.vrijVeld.id)!
            .keuzelijstWaardeMogelijkheden!.findIndex((klwm) => klwm.id === keuzelijstWaardeSig.keuzelijstWaarde.id)
);

const addAfspraakToSignalering = curry(
    (
        afspraak: AfspraakQuery['afspraak'],
        signalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number] => ({
        ...signalering,
        afspraken: sortBy([...signalering.afspraken, afspraak], ['begin']).reverse(),
        aantal: signalering.afspraken.length + 1
    })
);
const removeAfspraakFromSignalering = curry(
    (
        afspraak: AfspraakQuery['afspraak'],
        signalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number] => {
        return {
            ...signalering,
            afspraken: signalering.afspraken.filter(notEqualsId(afspraak.id)),
            aantal: signalering.afspraken.length - 1
        };
    }
);
const removeAfspraakFromKeuzelijstWaardeSignalering = curry(
    (
        leerlingId: string,
        afspraak: AfspraakQuery['afspraak'],
        signalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number]
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number] => {
        return {
            ...signalering,
            leerlingSignaleringen: signalering.leerlingSignaleringen
                .map((lsig) =>
                    lsig.leerling.id === leerlingId
                        ? {
                              ...lsig,
                              afspraken: lsig.afspraken.filter(notEqualsId(afspraak.id)),
                              aantal: lsig.afspraken.length - 1
                          }
                        : lsig
                )
                .filter((lsig) => lsig.aantal !== 0)
        };
    }
);
@Injectable({
    providedIn: 'root'
})
export class RegistratieDataService {
    private dataClient = inject(Apollo);
    private _cache: ApolloCache<any>;

    constructor() {
        this._cache = this.dataClient.client.cache;
    }

    public registreerAanwezig(leerlingRegId: string, afspraakId: string) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);
        const afspraak: AfspraakQuery['afspraak'] = this.getAfspraakFromCache(afspraakId);
        const teLaatGemeldDoorAndereDocent = isTeLaatGemeldDoorAndereDocent(afspraak, registratie);

        // wanneer de leerling te laat is gemeld door een andere docent, laten we de telaat melding staan
        const newRegistratie = {
            ...registratie,
            aanwezig: true,
            teLaat: teLaatGemeldDoorAndereDocent ? registratie.teLaat : null,
            absent: null,
            dirty: true
        };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);
    }

    public registreerAfwezig(leerlingRegId: string, afspraakId: string, absentMelding: Optional<AbsentieMeldingFieldsFragment>) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);
        const afspraak: AfspraakQuery['afspraak'] = this.getAfspraakFromCache(afspraakId);
        const teLaatGemeldDoorAndereDocent = isTeLaatGemeldDoorAndereDocent(afspraak, registratie);

        const newAbsentie = absentMelding
            ? ({
                  __typename: 'AbsentieMelding',
                  id: absentMelding.id,
                  opmerkingen: absentMelding.opmerkingen,
                  tijdstip: absentMelding.tijdstip,
                  ingevoerdDoor: absentMelding.ingevoerdDoor,
                  ingevoerdDoorVerzorger: null,
                  heeftEinde: absentMelding.heeftEinde,
                  absentieReden: absentMelding.absentieReden
              } as AbsentieMelding)
            : null;

        // wanneer de leerling te laat is gemeld door een andere docent, laten we de telaat melding staan
        const newRegistratie: any = {
            ...registratie,
            aanwezig: false,
            teLaat: teLaatGemeldDoorAndereDocent ? registratie.teLaat : null,
            absent: teLaatGemeldDoorAndereDocent ? null : newAbsentie,
            dirty: true,
            verwijderd: null
        };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);
    }

    public registreerTeLaat(leerlingRegId: string, teLaatMelding: AbsentieMelding) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie = {
            ...registratie,
            aanwezig: true,
            absent: null,
            teLaat: {
                __typename: 'AbsentieMelding',
                id: teLaatMelding.id,
                opmerkingen: teLaatMelding.opmerkingen,
                tijdstip: teLaatMelding.tijdstip,
                ingevoerdDoor: teLaatMelding.ingevoerdDoor,
                ingevoerdDoorVerzorger: null,
                heeftEinde: teLaatMelding.heeftEinde,
                absentieReden: teLaatMelding.absentieReden
            } as AbsentieMelding,
            dirty: true
        };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);
    }

    public registreerVerwijderd(leerlingRegId: string, verwijderdMelding: AbsentieMelding) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie = {
            ...registratie,
            aanwezig: true,
            absent: null,
            verwijderd: {
                __typename: 'AbsentieMelding',
                id: verwijderdMelding.id,
                opmerkingen: verwijderdMelding.opmerkingen,
                tijdstip: verwijderdMelding.tijdstip,
                ingevoerdDoor: verwijderdMelding.ingevoerdDoor,
                ingevoerdDoorVerzorger: null,
                heeftEinde: verwijderdMelding.heeftEinde,
                absentieReden: verwijderdMelding.absentieReden
            } as AbsentieMelding,
            dirty: true
        };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);

        return newRegistratie;
    }

    public registreerAfwezigTeLaatOfVerwijderd(
        leerlingRegId: string,
        afspraakId: string,
        absentieSoort: AbsentieSoort,
        absentMelding: AbsentieMelding | null
    ) {
        switch (absentieSoort) {
            case AbsentieSoort.Absent:
                this.registreerAfwezig(leerlingRegId, afspraakId, absentMelding);
                break;
            case AbsentieSoort.Telaat:
                this.registreerTeLaat(leerlingRegId, absentMelding!);
                break;
            case AbsentieSoort.Verwijderd:
                this.registreerVerwijderd(leerlingRegId, absentMelding!);
                break;
        }
    }

    public registreerHuiswerk(leerlingRegId: string, leerlingId: string, afspraakId: string, huiswerkNietInOrde: boolean) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie = { ...registratie, huiswerkNietInOrde, dirty: true };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);

        const huiswerkVrijVeld = this.getVrijVeldDefinitiesFromCache(afspraakId)!.find(
            (vvdefinitie) => vvdefinitie.naam === huiswerkVrijVeldNaam
        );
        const huiswerkVrijVeldWaarde = {
            __typename: 'VrijVeldWaarde',
            booleanWaarde: huiswerkNietInOrde,
            id: leerlingId + '-' + huiswerkVrijVeld!.id,
            keuzelijstWaarde: null,
            vrijveld: huiswerkVrijVeld
        } as VrijVeldWaarde;

        this.updateAankruisvakSignaleringen(afspraakId, leerlingId, huiswerkVrijVeldWaarde);
    }

    public registreerMateriaal(leerlingRegId: string, leerlingId: string, afspraakId: string, materiaalVergeten: boolean) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie = { ...registratie, materiaalVergeten, dirty: true };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);

        const materiaalVrijVeld = this.getVrijVeldDefinitiesFromCache(afspraakId)!.find(
            (vvdefinitie) => vvdefinitie.naam === materiaalVrijVeldNaam
        );
        const materiaalVrijVeldWaarde = {
            __typename: 'VrijVeldWaarde',
            booleanWaarde: materiaalVergeten,
            id: leerlingId + '-' + materiaalVrijVeld!.id,
            keuzelijstWaarde: null,
            vrijveld: materiaalVrijVeld
        } as VrijVeldWaarde;

        this.updateAankruisvakSignaleringen(afspraakId, leerlingId, materiaalVrijVeldWaarde);
    }

    public registreerOverigeAankruisvakVrijVeldWaarde(
        afspraakId: string,
        leerlingRegId: string,
        leerlingId: string,
        vrijveldId: string,
        booleanWaarde: boolean
    ) {
        const vrijveld = this.getVrijVeldDefinitiesFromCache(afspraakId)!.find((vvdefinitie) => vvdefinitie.id === vrijveldId)!;
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);
        const updatedVrijVeldWaardes: VrijVeldWaarde[] = [...registratie.overigeVrijVeldWaarden];
        const vrijveldIndex = updatedVrijVeldWaardes.findIndex((vvw) => vvw.vrijveld.id === vrijveld.id);

        if (vrijveldIndex >= 0) {
            const vvw = updatedVrijVeldWaardes[vrijveldIndex];
            updatedVrijVeldWaardes[vrijveldIndex] = { ...vvw, booleanWaarde: booleanWaarde };
        } else {
            updatedVrijVeldWaardes.push({
                __typename: 'VrijVeldWaarde' as const,
                id: leerlingId + '-' + vrijveld.id,
                booleanWaarde: booleanWaarde,
                vrijveld,
                keuzelijstWaarde: null
            });
        }

        this.registreerOverigeVrijVeldWaarden(afspraakId, leerlingRegId, leerlingId, updatedVrijVeldWaardes);
    }

    public registreerOverigeKeuzelijstVrijVeldWaarde(
        afspraakId: string,
        leerlingRegId: string,
        leerlingId: string,
        vrijveldId: string,
        keuze: KeuzelijstWaardeMogelijkheid | null
    ) {
        const vrijveld = this.getVrijVeldDefinitiesFromCache(afspraakId)!.find((vvdefinitie) => vvdefinitie.id === vrijveldId)!;
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);
        const updatedVrijVeldWaardes: VrijVeldWaarde[] = [...registratie.overigeVrijVeldWaarden];
        const vrijveldIndex = updatedVrijVeldWaardes.findIndex((vvw) => vvw.vrijveld.id === vrijveld.id);

        if (vrijveldIndex >= 0) {
            const vvw = updatedVrijVeldWaardes[vrijveldIndex];
            updatedVrijVeldWaardes[vrijveldIndex] = { ...vvw, keuzelijstWaarde: keuze };
        } else {
            updatedVrijVeldWaardes.push({
                __typename: 'VrijVeldWaarde' as const,
                id: leerlingId + '-' + vrijveld.id,
                booleanWaarde: null,
                vrijveld,
                keuzelijstWaarde: keuze
            });
        }

        this.registreerOverigeVrijVeldWaarden(afspraakId, leerlingRegId, leerlingId, updatedVrijVeldWaardes);
    }

    public registreerOverigeVrijVeldWaarden(
        afspraakId: string,
        leerlingRegId: string,
        leerlingId: string,
        overigeVrijVeldWaarden: VrijVeldWaarde[]
    ) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie = { ...registratie, overigeVrijVeldWaarden, dirty: true };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);

        let updatedVrijVeldWaarden = overigeVrijVeldWaarden.filter(
            (nieuweWaarde) => !registratie.overigeVrijVeldWaarden.find((oudeWaarde) => eq(oudeWaarde, nieuweWaarde))
        );
        const verwijderdeVrijVeldWaarden = registratie.overigeVrijVeldWaarden.filter(
            (oudeWaarde) => !overigeVrijVeldWaarden.find((nieuweWaarde) => nieuweWaarde.vrijveld.id === oudeWaarde.vrijveld.id)
        );
        updatedVrijVeldWaarden = updatedVrijVeldWaarden.concat(
            verwijderdeVrijVeldWaarden.map((verwijderdVeld) =>
                verwijderdVeld.keuzelijstWaarde !== null
                    ? { ...verwijderdVeld, keuzelijstWaarde: null }
                    : { ...verwijderdVeld, booleanWaarde: false }
            )
        );

        for (const vrijVeldWaarde of updatedVrijVeldWaarden) {
            if (vrijVeldWaarde.booleanWaarde !== null) {
                this.updateAankruisvakSignaleringen(afspraakId, leerlingId, vrijVeldWaarde);
            } else {
                this.updateKeuzelijstSignaleringen(afspraakId, leerlingId, vrijVeldWaarde);
            }
        }
    }

    private getVrijVeldDefinitiesFromCache(afspraakId: string) {
        const afspraakRes = this.getAfspraakFromCache(afspraakId);

        const afspraakInput = {
            id: afspraakRes.id,
            begin: convertToLocalDate(afspraakRes.begin) as any,
            eind: convertToLocalDate(afspraakRes.eind) as any
        };

        const lesReg = this._cache.readQuery({
            query: LesRegistratieDocument,
            variables: {
                afspraak: afspraakInput,
                defaultAanwezig: !afspraakRes.presentieRegistratieVerwerkt
            }
        });

        return lesReg?.lesRegistratie?.overigeVrijVeldDefinities;
    }

    private getSignaleringenFromCache(afspraakId: string): SignaleringenQuery {
        return this._cache.readQuery({
            query: SignaleringenDocument,
            variables: {
                afspraakId
            }
        })!;
    }

    private getAfspraakFromCache(afspraakId: string): AfspraakQuery['afspraak'] {
        return this._cache.readQuery({
            query: AfspraakDocument,
            variables: {
                id: afspraakId
            }
        })!.afspraak;
    }

    private getLeerlingFromCache(leerlingId: string): Leerling {
        return this._cache.readFragment<Leerling>({
            id: `Leerling:${leerlingId}`,
            fragment: leerlingMetIsJarig,
            fragmentName: 'leerlingMetIsJarig'
        })!;
    }

    private createNewLeerlingSignalering(
        signalering: SignaleringenQuery,
        afspraak: AfspraakQuery['afspraak'],
        leerling: Leerling,
        vrijVeldId: string
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number] {
        return {
            __typename: 'LeerlingSignalering',
            id: getSignaleringId(
                signalering.signaleringen.periode.begin!,
                signalering.signaleringen.periode.eind!,
                leerling.id,
                vrijVeldId
            ),
            leerling: { ...leerling },
            afspraken: [afspraak],
            aantal: 1
        };
    }

    private createNewKeuzelijstWaardeSignalering(
        keuzelijstWaarde: KeuzelijstWaardeMogelijkheid,
        leerlingSignalering: SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number] {
        return {
            __typename: 'KeuzelijstWaardeSignalering',
            keuzelijstWaarde: keuzelijstWaarde,
            leerlingSignaleringen: [leerlingSignalering]
        };
    }

    private createNewVrijVeldSignalering(
        vrijVeldWaarde: VrijVeldWaarde,
        signalering:
            | SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
            | SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number],
        isKeuzelijstWaardeSignalering: boolean
    ): SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number] {
        if (isKeuzelijstWaardeSignalering) {
            return {
                __typename: 'VrijVeldSignalering',
                vrijVeld: {
                    __typename: 'VrijVeld',
                    id: vrijVeldWaarde.vrijveld.id,
                    naam: vrijVeldWaarde.vrijveld.naam,
                    vastgezet: vrijVeldWaarde.vrijveld.vastgezet
                },
                leerlingSignaleringen: [],
                keuzelijstWaardeSignaleringen: [
                    signalering as SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['keuzelijstWaardeSignaleringen'][number]
                ]
            };
        } else {
            return {
                __typename: 'VrijVeldSignalering',
                vrijVeld: {
                    __typename: 'VrijVeld',
                    id: vrijVeldWaarde.vrijveld.id,
                    naam: vrijVeldWaarde.vrijveld.naam,
                    vastgezet: vrijVeldWaarde.vrijveld.vastgezet
                },
                leerlingSignaleringen: [
                    signalering as SignaleringenQuery['signaleringen']['vrijVeldSignaleringen'][number]['leerlingSignaleringen'][number]
                ],
                keuzelijstWaardeSignaleringen: []
            };
        }
    }

    private updateAankruisvakSignaleringen(afspraakId: string, leerlingId: string, vrijVeldWaarde: VrijVeldWaarde): void {
        let signaleringenData = this.getSignaleringenFromCache(afspraakId);
        if (!signaleringenData) {
            return;
        }

        const afspraakData = this.getAfspraakFromCache(afspraakId);

        const vrijVeldId = vrijVeldWaarde.vrijveld.id;
        const vrijVeldNaam = vrijVeldWaarde.vrijveld.naam;

        const vrijVeldSignalering = getVrijVeldSignaleringMetNaam(vrijVeldNaam, signaleringenData.signaleringen);
        const leerlingSignalering = getLeerlingSignaleringMetId(leerlingId, vrijVeldSignalering);
        const afspraakInLeerlingSignalering = getAfspraakInLeerlingSignalering(afspraakId, leerlingSignalering);

        if (leerlingSignalering) {
            if (vrijVeldWaarde.booleanWaarde && !afspraakInLeerlingSignalering) {
                signaleringenData = mod(
                    'signaleringen',
                    'vrijVeldSignaleringen',
                    matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                    'leerlingSignaleringen',
                    matching(leerlingSignaleringHeeftLeerlingId(leerlingId))
                )(addAfspraakToSignalering(afspraakData))(signaleringenData);
            } else if (!vrijVeldWaarde.booleanWaarde && afspraakInLeerlingSignalering) {
                signaleringenData = mod(
                    'signaleringen',
                    'vrijVeldSignaleringen',
                    matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                    'leerlingSignaleringen',
                    matching(leerlingSignaleringHeeftLeerlingId(leerlingId))
                )(removeAfspraakFromSignalering(afspraakData))(signaleringenData);
            }
        } else {
            if (vrijVeldWaarde.booleanWaarde) {
                const leerlingData = this.getLeerlingFromCache(leerlingId);
                const newLeerlingSignalering = this.createNewLeerlingSignalering(signaleringenData, afspraakData, leerlingData, vrijVeldId);

                if (vrijVeldSignalering) {
                    signaleringenData = set(
                        'signaleringen',
                        'vrijVeldSignaleringen',
                        matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                        'leerlingSignaleringen'
                    )(
                        sortBy(
                            [...vrijVeldSignalering.leerlingSignaleringen, newLeerlingSignalering],
                            ['afspraken.size', 'leerling.achternaam', 'leerling.voornaam']
                        )
                    )(signaleringenData);
                } else {
                    const newVrijVeldSignalering = this.createNewVrijVeldSignalering(vrijVeldWaarde, newLeerlingSignalering, false);
                    signaleringenData = set(
                        'signaleringen',
                        'vrijVeldSignaleringen'
                    )(
                        sortBy(
                            [newVrijVeldSignalering, ...signaleringenData.signaleringen.vrijVeldSignaleringen],
                            getVrijVeldDefIndex(this.getVrijVeldDefinitiesFromCache(afspraakId)!)
                        )
                    )(signaleringenData);
                }
            }
        }

        this._cache.writeQuery({
            query: SignaleringenDocument,
            data: signaleringenData,
            variables: {
                afspraakId
            }
        });
    }

    private updateKeuzelijstSignaleringen(afspraakId: string, leerlingId: string, vrijVeldWaarde: VrijVeldWaarde): void {
        let signaleringenData = this.getSignaleringenFromCache(afspraakId);
        if (!signaleringenData) {
            return;
        }

        const afspraakData = this.getAfspraakFromCache(afspraakId);

        const vrijVeldId = vrijVeldWaarde.vrijveld.id;
        const vrijVeldNaam = vrijVeldWaarde.vrijveld.naam;

        let vrijVeldSignalering = getVrijVeldSignaleringMetNaam(vrijVeldNaam, signaleringenData.signaleringen);
        const heeftBestaandeRegistratieVandaag = getKeuzelijstWaardeSignaleringMetLeerlingEnAfspraak(
            leerlingId,
            afspraakId,
            vrijVeldSignalering!
        );

        if (heeftBestaandeRegistratieVandaag) {
            signaleringenData = {
                ...signaleringenData,
                signaleringen: mod(
                    'vrijVeldSignaleringen',
                    matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                    'keuzelijstWaardeSignaleringen',
                    matching(keuzelijstWaardeSignaleringHeeftKeuzelijstWaardeId(heeftBestaandeRegistratieVandaag.keuzelijstWaarde.id))
                )(removeAfspraakFromKeuzelijstWaardeSignalering(leerlingId, afspraakData))(signaleringenData.signaleringen)
            };
            vrijVeldSignalering = getVrijVeldSignaleringMetNaam(vrijVeldNaam, signaleringenData.signaleringen);
        }

        if (vrijVeldWaarde.keuzelijstWaarde !== null) {
            const keuzelijstSignalering = getKeuzelijstWaardeSignaleringMetWaarde(
                vrijVeldWaarde.keuzelijstWaarde!.id,
                vrijVeldSignalering!
            );
            const leerlingSignalering = getLeerlingSignaleringMetId(leerlingId, keuzelijstSignalering);

            if (leerlingSignalering) {
                signaleringenData = {
                    ...signaleringenData,
                    signaleringen: mod(
                        'vrijVeldSignaleringen',
                        matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                        'keuzelijstWaardeSignaleringen',
                        matching(keuzelijstWaardeSignaleringHeeftKeuzelijstWaardeId(vrijVeldWaarde.keuzelijstWaarde!.id)),
                        'leerlingSignaleringen',
                        matching(leerlingSignaleringHeeftLeerlingId(leerlingId))
                    )(addAfspraakToSignalering(afspraakData))(signaleringenData.signaleringen)
                };
            } else {
                const leerlingData = this.getLeerlingFromCache(leerlingId);
                const newLeerlingSignalering = this.createNewLeerlingSignalering(signaleringenData, afspraakData, leerlingData, vrijVeldId);

                if (keuzelijstSignalering) {
                    signaleringenData = set(
                        'signaleringen',
                        'vrijVeldSignaleringen',
                        matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                        'keuzelijstWaardeSignaleringen',
                        matching(keuzelijstWaardeSignaleringHeeftKeuzelijstWaardeId(vrijVeldWaarde.keuzelijstWaarde!.id)),
                        'leerlingSignaleringen'
                    )(
                        sortBy(
                            [...keuzelijstSignalering.leerlingSignaleringen, newLeerlingSignalering],
                            ['afspraken.size', 'leerling.achternaam', 'leerling.voornaam']
                        )
                    )(signaleringenData);
                } else {
                    const newKeuzelijstWaardeSignalering = this.createNewKeuzelijstWaardeSignalering(
                        vrijVeldWaarde.keuzelijstWaarde!,
                        newLeerlingSignalering
                    );

                    if (vrijVeldSignalering) {
                        signaleringenData = set(
                            'signaleringen',
                            'vrijVeldSignaleringen',
                            matching(vrijVeldSignaleringHeeftNaam(vrijVeldNaam)),
                            'keuzelijstWaardeSignaleringen'
                        )(
                            sortBy(
                                [...vrijVeldSignalering.keuzelijstWaardeSignaleringen, newKeuzelijstWaardeSignalering],
                                getKeuzelijstWaardeDefIndex(this.getVrijVeldDefinitiesFromCache(afspraakId)!, vrijVeldSignalering)
                            )
                        )(signaleringenData);
                    } else {
                        const newVrijVeldSignalering = this.createNewVrijVeldSignalering(
                            vrijVeldWaarde,
                            newKeuzelijstWaardeSignalering,
                            true
                        );
                        signaleringenData = set(
                            'signaleringen',
                            'vrijVeldSignaleringen'
                        )(
                            sortBy(
                                [newVrijVeldSignalering, ...signaleringenData.signaleringen.vrijVeldSignaleringen],
                                getVrijVeldDefIndex(this.getVrijVeldDefinitiesFromCache(afspraakId)!)
                            )
                        )(signaleringenData);
                    }
                }
            }
        }

        this._cache.writeQuery({
            query: SignaleringenDocument,
            data: signaleringenData,
            variables: {
                afspraakId
            }
        });
    }

    public annuleerVerwijderdMelding(leerlingRegId: string) {
        const registratie: LeerlingRegistratie = this.getLeerlingRegistratieFromCache(leerlingRegId);

        const newRegistratie: any = { ...registratie, verwijderd: null, dirty: true };

        this.writeLeerlingRegistratieToCache(leerlingRegId, newRegistratie);

        return newRegistratie;
    }

    public getLesRegistratie(afspraak: AfspraakQuery['afspraak']) {
        const afspraakInput = {
            id: afspraak.id,
            begin: convertToLocalDate(afspraak.begin) as any,
            eind: convertToLocalDate(afspraak.eind) as any
        };

        return this.dataClient
            .watchQuery({
                query: LesRegistratieDocument,
                variables: {
                    afspraak: afspraakInput,
                    defaultAanwezig: !afspraak.presentieRegistratieVerwerkt
                }
            })
            .valueChanges.pipe(filter((result) => !!result.data));
    }

    public saveLesRegistratie(afspraak: AfspraakQuery['afspraak'], medewerkerId: string) {
        const afspraakId = afspraak.id;
        const hasBeenSavedBefore = afspraak.presentieRegistratieVerwerkt;
        const lesRegistratie = this.getLesRegistratieFromStore(afspraakId);

        if (!lesRegistratie) {
            return;
        }

        const lesRegistratieInput: any = this.convertLesRegistratieToLesRegistratieInput(lesRegistratie, hasBeenSavedBefore);

        return this.dataClient
            .mutate({
                mutation: SaveLesRegistratieDocument,
                variables: {
                    lesRegistratieInput
                },
                errorPolicy: 'all',
                optimisticResponse: {
                    saveLesRegistratie: {
                        afspraakId: afspraak.id,
                        presentieRegistratieVerwerkt: true,
                        registraties: [] // Leeg, want staat al goed in de cache
                    }
                },
                update: (cache, { data }) => {
                    const dirtyLeerlingRegistraties = lesRegistratie.leerlingRegistraties.filter(
                        (lr) => lr.dirty || (!lr.waarneming && !lr.teLaat && !lr.verwijderd)
                    );

                    dirtyLeerlingRegistraties.forEach((leerling: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => {
                        cache.writeFragment({
                            fragment: leerlingRegistratieFragment,
                            id: `LeerlingRegistratie:${leerling.id}`,
                            data: {
                                __typename: 'LeerlingRegistratie',
                                dirty: false
                            },
                            broadcast: false,
                            fragmentName: 'leerlingRegistratieFragment'
                        });
                    });

                    cache.writeFragment({
                        fragment: lesRegistratieFragment,
                        id: `LesRegistratie:${afspraakId}`,
                        data: {
                            __typename: 'LesRegistratie',
                            laatstGewijzigdDatum: new Date().toISOString()
                        },
                        fragmentName: 'lesRegistratieFragment'
                    });

                    if (data?.saveLesRegistratie && data?.saveLesRegistratie.registraties.length > 0) {
                        let registratie = this.getLesRegistratieFromStore(afspraak.id);

                        data?.saveLesRegistratie.registraties.forEach((leerlingReg) => {
                            registratie = mod(
                                'leerlingRegistraties',
                                matching({ id: leerlingReg.leerlingRegistratieId })
                            )((cachedReg: any) => {
                                // Update verwijderd in cache alleen als een andere medewerker dit ingevoerd heeft.
                                // In het geval van de ingelogde gebruiker staat het al goed in de cache.
                                // Een telaatmelding van een andere medewerker mag nooit worden overschreven, een eigen constatering daarbij wel.
                                const updateVerwijderdMelding =
                                    leerlingReg.verwijderdMelding && leerlingReg.verwijderdMelding?.ingevoerdDoor?.id !== medewerkerId;
                                return {
                                    ...cachedReg,
                                    aanwezig: updateVerwijderdMelding ? leerlingReg.aanwezig : cachedReg.aanwezig,
                                    waarneming: leerlingReg.waarneming,
                                    absent: leerlingReg.absentMelding,
                                    teLaat: cachedReg.teLaat,
                                    verwijderd: updateVerwijderdMelding ? leerlingReg.verwijderdMelding : cachedReg.verwijderd,
                                    huiswerkNietInOrde: leerlingReg.huiswerkNietInOrde,
                                    materiaalVergeten: leerlingReg.materiaalVergeten,
                                    overigeVrijVeldWaarden: leerlingReg.overigeVrijVeldWaarden
                                };
                            })(registratie);
                        });

                        this._cache.writeFragment({
                            fragment: lesRegistratieFields,
                            id: `LesRegistratie:${afspraak.id}`,
                            data: registratie,
                            fragmentName: 'lesRegistratieFields'
                        });

                        // PresentieRegistratieVerwerkt pas updaten na het core response.
                        // Doordat er een watchQuery op de afspraak is en de presentieRegistratieVerwerkt
                        // invloed heeft op de defaultAanwezig van LeerlingRegistratie, gaat de cache kapot
                        // als we dit al in de OptimisticResponse updaten.
                        cache.writeFragment({
                            fragment: registratieVerwerkt,
                            id: `Afspraak:${afspraakId}`,
                            data: {
                                __typename: 'Afspraak',
                                presentieRegistratieVerwerkt: true
                            },
                            fragmentName: 'registratieVerwerkt'
                        });
                    }
                }
            })
            .subscribe();
    }

    public removeLesRegistratieFromCache(afspraakId: string) {
        const leerlingRegistraties = Object.values(this._cache.extract()).filter(
            (o) => (<any>o)['__typename'] === 'LeerlingRegistratie' && (<any>o)['id']?.includes(afspraakId + '-')
        );
        for (const leerlingRegistratie of leerlingRegistraties) {
            this._cache.evict({ id: 'LeerlingRegistratie:' + ((<any>leerlingRegistratie)['id'] as string) });
        }
        this._cache.evict({ fieldName: 'lesRegistratie' });

        this._cache.evict({ id: 'Signaleringen:' + afspraakId });
        this._cache.evict({ fieldName: 'signaleringen' });

        this._cache.gc();
    }

    public addRegistratiesToSignaleringen(lesRegistratie: LesRegistratieQuery['lesRegistratie'], afspraakId: string) {
        for (const leerlingRegistratie of lesRegistratie.leerlingRegistraties) {
            if (leerlingRegistratie.dirty) {
                const leerlingId = leerlingRegistratie.leerling.id;

                const materiaalVrijVeld = lesRegistratie.overigeVrijVeldDefinities.find(
                    (vvdefinitie) => vvdefinitie.naam === materiaalVrijVeldNaam
                );
                const materiaalVrijVeldWaarde = {
                    __typename: 'VrijVeldWaarde',
                    booleanWaarde: leerlingRegistratie.materiaalVergeten,
                    id: leerlingId + '-' + materiaalVrijVeld!.id,
                    keuzelijstWaarde: null,
                    vrijveld: materiaalVrijVeld
                } as VrijVeldWaarde;
                this.updateAankruisvakSignaleringen(afspraakId, leerlingId, materiaalVrijVeldWaarde);

                const huiswerkVrijVeld = lesRegistratie.overigeVrijVeldDefinities.find(
                    (vvdefinitie) => vvdefinitie.naam === huiswerkVrijVeldNaam
                );
                const huiswerkVrijVeldWaarde = {
                    __typename: 'VrijVeldWaarde',
                    booleanWaarde: leerlingRegistratie.huiswerkNietInOrde,
                    id: leerlingId + '-' + huiswerkVrijVeld!.id,
                    keuzelijstWaarde: null,
                    vrijveld: huiswerkVrijVeld
                } as VrijVeldWaarde;
                this.updateAankruisvakSignaleringen(afspraakId, leerlingId, huiswerkVrijVeldWaarde);

                for (const vrijVeldWaarde of leerlingRegistratie.overigeVrijVeldWaarden) {
                    if (vrijVeldWaarde.booleanWaarde !== null) {
                        this.updateAankruisvakSignaleringen(afspraakId, leerlingId, vrijVeldWaarde);
                    } else {
                        this.updateKeuzelijstSignaleringen(afspraakId, leerlingId, vrijVeldWaarde);
                    }
                }
            }
        }
    }

    public getPeriode(afspraakId: string) {
        return this.dataClient
            .watchQuery({
                query: PeriodeDocument,
                variables: {
                    afspraakId
                }
            })
            .valueChanges.pipe(map((res) => (res.data ? res.data.periode : undefined)));
    }

    public getSignaleringen(afspraakId: string, fetchPolicy: WatchQueryFetchPolicy = 'cache-and-network') {
        return this.dataClient
            .watchQuery({
                query: SignaleringenDocument,
                variables: {
                    afspraakId
                },
                fetchPolicy,
                nextFetchPolicy: 'cache-first'
            })
            .valueChanges.pipe(map((res) => (res.data ? res.data.signaleringen : undefined)));
    }

    public getSignaleringenInstellingen(medewerkerUuid: string): Observable<SignaleringenInstellingenQuery['signaleringenInstellingen']> {
        return this.dataClient
            .watchQuery({
                query: SignaleringenInstellingenDocument,
                variables: {
                    medewerkerUuid
                }
            })
            .valueChanges.pipe(
                map(({ data }) => {
                    return data.signaleringenInstellingen;
                })
            );
    }

    public saveSignaleringenInstellingen(medewerkerUuid: string, aantal: number, verborgenVrijeVeldenIds: string[]) {
        this.dataClient
            .mutate({
                mutation: SaveSignaleringenInstellingenDocument,
                variables: {
                    medewerkerUuid,
                    aantal,
                    verborgenVrijeVeldenIds
                },
                update: (cache) => {
                    const signaleringenInstellingenQueryData = cache.readQuery({
                        query: SignaleringenInstellingenDocument,
                        variables: {
                            medewerkerUuid
                        }
                    })!.signaleringenInstellingen;

                    cache.writeQuery({
                        query: SignaleringenInstellingenDocument,
                        data: {
                            signaleringenInstellingen: {
                                ...signaleringenInstellingenQueryData,
                                aantal,
                                verborgenVrijeVeldenIds
                            }
                        },
                        variables: {
                            medewerkerUuid
                        }
                    });
                }
            })
            .subscribe();
    }

    public getExterneRegistraties(afspraakId: string) {
        return this.dataClient.watchQuery({
            query: ExterneRegistratiesDocument,
            variables: {
                afspraakId
            },
            pollInterval: 1000 * 60 * 5
        }).valueChanges;
    }

    public updateRegistratiesNaPolling(externeRegistraties: ExterneRegistraties, afspraak: AfspraakQuery['afspraak']) {
        let registratie = this.getLesRegistratieFromStore(afspraak.id);
        if (!registratie) {
            return;
        }

        externeRegistraties.aanwezigWaarnemingen.forEach((constatering) => {
            const leerlingRegId = registratie.leerlingRegistraties.find(
                (leerlingReg) => leerlingReg.leerling.id === constatering.leerling.id
            )?.id;

            registratie = set(
                'leerlingRegistraties',
                matching({ id: leerlingRegId }),
                'waarneming'
            )(constatering as LesRegistratieFieldsFragment['leerlingRegistraties'][number]['waarneming'])(registratie);
        });

        const absentMeldingen = externeRegistraties.absentiemeldingen.filter(
            (absentieMelding) => absentieMelding.absentieReden?.absentieSoort === AbsentieSoort.Absent
        );
        absentMeldingen.forEach((absentieMelding) => {
            const leerlingRegId = registratie.leerlingRegistraties.find(
                (leerlingReg) => leerlingReg.leerling.id === absentieMelding.leerling!.id
            )?.id;
            registratie = mod(
                'leerlingRegistraties',
                matching({ id: leerlingRegId })
            )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                ...cachedReg,
                aanwezig: false,
                absent: absentieMelding
            }))(registratie);
        });

        const teLaatMeldingen = externeRegistraties.absentiemeldingen.filter(
            (absentieMelding) => absentieMelding.absentieReden?.absentieSoort === AbsentieSoort.Telaat
        );
        teLaatMeldingen.forEach((absentieMelding) => {
            const leerlingRegId = registratie.leerlingRegistraties.find(
                (leerlingReg) => leerlingReg.leerling.id === absentieMelding.leerling!.id
            )?.id;
            registratie = mod(
                'leerlingRegistraties',
                matching({ id: leerlingRegId })
            )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                ...cachedReg,
                aanwezig: true,
                teLaat: absentieMelding
            }))(registratie);
        });

        const verwijderdMeldingen = externeRegistraties.absentiemeldingen.filter(
            (absentieMelding) => absentieMelding.absentieReden?.absentieSoort === AbsentieSoort.Verwijderd
        );
        verwijderdMeldingen.forEach((absentieMelding) => {
            const leerlingRegId = registratie.leerlingRegistraties.find(
                (leerlingReg) => leerlingReg.leerling.id === absentieMelding.leerling!.id
            )?.id;

            registratie = mod(
                'leerlingRegistraties',
                matching({ id: leerlingRegId })
            )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                ...cachedReg,
                aanwezig: true,
                verwijderd: absentieMelding
            }))(registratie);
        });

        registratie.leerlingRegistraties.forEach((leerlingReg) => {
            const leerlingRegQueryTyped = leerlingReg as LeerlingRegistratieQueryType;
            const heeftAanwezigRegistratieVanAndereMedewerker = isAanwezigGemeldDoorAndereDocent(afspraak, leerlingRegQueryTyped);
            const heeftTeLaatRegistratieVanAndereMedewerker = isTeLaatGemeldDoorAndereDocent(afspraak, leerlingRegQueryTyped);
            const heeftAbsentMeldingVanAndereMedewerker = isAbsentGemeldDoorAndereDocent(afspraak, leerlingRegQueryTyped);
            const heeftVerwijderdMeldingVanAndereMedewerker = isVerwijderdGemeldDoorAndereDocent(afspraak, leerlingRegQueryTyped);
            if (
                heeftAanwezigRegistratieVanAndereMedewerker &&
                !externeRegistraties.aanwezigWaarnemingen.some((waarneming) => waarneming.leerling.id === leerlingReg.leerling.id)
            ) {
                registratie = mod(
                    'leerlingRegistraties',
                    matching({ id: leerlingReg.id })
                )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                    ...cachedReg,
                    waarneming: null,
                    aanwezig: !afspraak.presentieRegistratieVerwerkt
                }))(registratie);
            }

            if (
                heeftTeLaatRegistratieVanAndereMedewerker &&
                this.heeftExterneRegistraties(externeRegistraties, AbsentieSoort.Telaat, leerlingReg.leerling.id)
            ) {
                registratie = mod(
                    'leerlingRegistraties',
                    matching({ id: leerlingReg.id })
                )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                    ...cachedReg,
                    teLaat: null,
                    aanwezig: !afspraak.presentieRegistratieVerwerkt
                }))(registratie);
            }

            if (
                heeftAbsentMeldingVanAndereMedewerker &&
                this.heeftExterneRegistraties(externeRegistraties, AbsentieSoort.Absent, leerlingReg.leerling.id)
            ) {
                registratie = mod(
                    'leerlingRegistraties',
                    matching({ id: leerlingReg.id })
                )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                    ...cachedReg,
                    absent: null
                }))(registratie);
            }

            if (
                heeftVerwijderdMeldingVanAndereMedewerker &&
                this.heeftExterneRegistraties(externeRegistraties, AbsentieSoort.Verwijderd, leerlingReg.leerling.id)
            ) {
                registratie = mod(
                    'leerlingRegistraties',
                    matching({ id: leerlingReg.id })
                )((cachedReg: LesRegistratieFieldsFragment['leerlingRegistraties'][number]) => ({
                    ...cachedReg,
                    verwijderd: null,
                    aanwezig: !afspraak.presentieRegistratieVerwerkt
                }))(registratie);
            }
        });

        this._cache.writeFragment({
            fragment: lesRegistratieFields,
            id: `LesRegistratie:${afspraak.id}`,
            data: registratie,
            fragmentName: 'lesRegistratieFields'
        });
    }

    private heeftExterneRegistraties(externeRegistraties: ExterneRegistraties, soort: AbsentieSoort, leerlingId: string): boolean {
        return !externeRegistraties.absentiemeldingen
            .filter((absentiemelding) => absentiemelding.absentieReden?.absentieSoort === soort)
            .some((absentiemelding) => absentiemelding.leerling!.id === leerlingId);
    }

    private getLesRegistratieFromStore(afspraakId: string): LesRegistratieFieldsFragment {
        return this.dataClient.client.readFragment({
            id: `LesRegistratie:${afspraakId}`,
            fragment: lesRegistratieFields,
            fragmentName: 'lesRegistratieFields'
        })!;
    }

    private getLeerlingRegistratieFromCache(leerlingRegId: string): LeerlingRegistratie {
        return this._cache.readFragment({
            id: `LeerlingRegistratie:${leerlingRegId}`,
            fragment: aanwezigheid,
            fragmentName: 'aanwezigheid'
        })!;
    }

    private writeLeerlingRegistratieToCache(leerlingRegId: string, newRegistratie: LeerlingRegistratie) {
        this._cache.writeFragment({
            fragment: aanwezigheid,
            id: `LeerlingRegistratie:${leerlingRegId}`,
            data: newRegistratie,
            fragmentName: 'aanwezigheid'
        });
    }

    private convertToVrijVeldWaardeInput(
        vrijVeldWaarden: LesRegistratieFieldsFragment['leerlingRegistraties'][number]['overigeVrijVeldWaarden']
    ) {
        return vrijVeldWaarden.map(
            (vrijVeldWaarde) =>
                ({
                    id: vrijVeldWaarde.id,
                    vrijveldId: vrijVeldWaarde.vrijveld.id,
                    booleanWaarde: vrijVeldWaarde.booleanWaarde,
                    keuzelijstWaardeMogelijkheidId: vrijVeldWaarde.keuzelijstWaarde?.id
                }) as VrijVeldWaardeInput
        );
    }

    private convertLesRegistratieToLesRegistratieInput(lesRegistratie: LesRegistratieFieldsFragment, hasBeenSavedBefore: boolean) {
        let leerlingRegistraties = lesRegistratie.leerlingRegistraties;
        if (hasBeenSavedBefore) {
            leerlingRegistraties = leerlingRegistraties.filter((reg) => reg.dirty || (!reg.waarneming && !reg.teLaat));
        }

        return {
            afspraakId: lesRegistratie.id,
            leerlingRegistraties: leerlingRegistraties.map((reg) => {
                let absent = null;
                let verwijderd = null;
                let teLaat = null;

                if (reg.absent) {
                    absent = {
                        absentieRedenId: reg.absent.absentieReden!.id,
                        opmerkingen: reg.absent.opmerkingen,
                        tijdstip: convertToLocalDate(reg.absent.tijdstip)
                    };
                }

                if (reg.verwijderd) {
                    verwijderd = {
                        absentieRedenId: reg.verwijderd.absentieReden!.id,
                        opmerkingen: reg.verwijderd.opmerkingen,
                        tijdstip: convertToLocalDate(reg.verwijderd.tijdstip)
                    };
                }
                if (reg.teLaat) {
                    teLaat = {
                        absentieRedenId: reg.teLaat.absentieReden!.id,
                        opmerkingen: reg.teLaat.opmerkingen,
                        tijdstip: convertToLocalDate(reg.teLaat.tijdstip)
                    };
                }
                return {
                    leerlingId: reg.leerling.id,
                    waarnemingId: reg.waarneming?.id || null,
                    aanwezig: reg.aanwezig,
                    absent,
                    teLaat,
                    verwijderd,
                    materiaalVergeten: !!reg.materiaalVergeten,
                    huiswerkNietInOrde: !!reg.huiswerkNietInOrde,
                    overigeVrijVeldWaarden: this.convertToVrijVeldWaardeInput(reg.overigeVrijVeldWaarden)
                };
            })
        };
    }
}
