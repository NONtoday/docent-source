import { isEqual } from 'date-fns';
import {
    AbsentieMeldingFieldsFragment,
    AfspraakQuery,
    IngevoerdDoorFragment,
    KeuzelijstWaardeMogelijkheid,
    LesRegistratieQuery,
    VrijVeld,
    VrijVeldWaarde
} from '../../../generated/_types';
import { ExterneRegistratieType } from '../../core/models/lesregistratie.model';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { HarmonyColorName } from '../colors';
import { ActionButton } from '../components/actions-popup/actions-popup.component';
import { Optional, equalsId } from './utils';

export const createVrijVeldKeuzePopupCustomButtons = (
    vrijveld: VrijVeld,
    huidigeWaarde: Optional<VrijVeldWaarde>,
    updateKeuzeFn: (vrijveld: VrijVeld, keuzeMogelijkheid: KeuzelijstWaardeMogelijkheid | null) => void
): ActionButton[] => {
    return [
        ...(vrijveld.keuzelijstWaardeMogelijkheden ?? []).map((keuze) => ({
            text: keuze.waarde,
            textcolor: (huidigeWaarde?.keuzelijstWaarde?.id === keuze.id ? 'typography_1' : 'primary_1') as HarmonyColorName,
            onClickFn: () => updateKeuzeFn(vrijveld, keuze)
        })),
        {
            text: 'Geen',
            textcolor: huidigeWaarde?.keuzelijstWaarde ? 'primary_1' : 'typography_1',
            onClickFn: () => updateKeuzeFn(vrijveld, null)
        }
    ];
};

export const createDefaultRegistratiePopupSettings = (isPhoneOrTablet: boolean): PopupSettings => {
    const popupSettings = new PopupSettings();
    popupSettings.showCloseButton = false;
    popupSettings.margin.top = 35;

    popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom, PopupDirection.Right, PopupDirection.Left];
    popupSettings.appearance = {
        mobile: Appearance.Rollup,
        tabletportrait: Appearance.Rollup,
        tablet: Appearance.Popout,
        desktop: Appearance.Popout
    };

    if (isPhoneOrTablet) {
        popupSettings.showCloseButton = true;
    } else {
        popupSettings.headerClass = 'info-header';
    }

    return popupSettings;
};

export type LeerlingRegistratieQueryType = LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number];

export function isIngevoerdDoorDocentVanAfspraak(afspraak: AfspraakQuery['afspraak'], ingevoerdDoor: Optional<IngevoerdDoorFragment>) {
    return !ingevoerdDoor || afspraak.medewerkers.some(equalsId(ingevoerdDoor.id));
}

export function isAanwezigGemeldDoorAndereDocent(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    return Boolean(
        !registratie.teLaat && registratie.waarneming && !isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.waarneming.ingevoerdDoor)
    );
}

export function isTeLaatGemeldDoorAndereDocent(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    return Boolean(registratie.teLaat && !isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.teLaat.ingevoerdDoor));
}

export function isTeLaatGemeldDoorAndereDocentZonderConstatering(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): boolean {
    return Boolean(isTeLaatGemeldDoorAndereDocent(afspraak, registratie) && !registratie.waarneming);
}

export function isTeLaatGemeldDoorAndereDocentMetEigenConstatering(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): boolean {
    return Boolean(
        isTeLaatGemeldDoorAndereDocent(afspraak, registratie) &&
            registratie.waarneming &&
            isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.waarneming.ingevoerdDoor)
    );
}

export function isTeLaatGemeldDoorAndereDocentZonderOfEigenConstatering(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): boolean {
    return (
        isTeLaatGemeldDoorAndereDocentZonderConstatering(afspraak, registratie) ||
        isTeLaatGemeldDoorAndereDocentMetEigenConstatering(afspraak, registratie)
    );
}

export function isTeLaatGemeldDoorAndereDocentMetConstatering(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): boolean {
    return Boolean(
        isTeLaatGemeldDoorAndereDocent(afspraak, registratie) &&
            registratie.waarneming &&
            !isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.waarneming.ingevoerdDoor)
    );
}

export function heeftLopendeZiekmelding(registratie: LeerlingRegistratieQueryType): boolean {
    return Boolean(registratie.absent && !registratie.absent.heeftEinde);
}

export function isVerwijderdGemeldDoorAndereDocent(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): boolean {
    return Boolean(registratie.verwijderd && !isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.verwijderd.ingevoerdDoor));
}

export function isAbsentGemeldDoorAndereDocent(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    return Boolean(registratie.absent && !isIngevoerdDoorDocentVanAfspraak(afspraak, registratie.absent.ingevoerdDoor));
}

export function magAbsentieMeldingBewerken(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    return (
        !isAbsentGemeldDoorAndereDocent(afspraak, registratie) &&
        !isTeLaatGemeldDoorAndereDocent(afspraak, registratie) &&
        !heeftLopendeZiekmelding(registratie)
    );
}

function isUnsaved(absent: AbsentieMeldingFieldsFragment): boolean {
    return !absent.id || absent.id.endsWith('-absent');
}

/**
 * Een bestaande absentiemelding met een reden die niet beschikbaar is vanuit Docent, of met een begin- of eindtijd die afwijkt van de afspraak,
 * is zeer waarschijnlijk vanuit Core ingevoerd.
 * Deze moet in Docent niet bewerkbaar zijn (zelfs als het een melding van een aan de afspraak gekoppelde medewerker betreft.)
 */
function isAbsentMeldingMetAfwijkendeTijdOfNietBeschikbareAbsentiereden(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType,
    absentMelding: AbsentieMeldingFieldsFragment
): boolean {
    if (isUnsaved(absentMelding)) {
        return false;
    }

    if (!registratie.absentieRedenenToegestaanVoorDocent.map((reden) => reden.id).includes(absentMelding.absentieReden!.id)) {
        return true;
    }

    return (
        !absentMelding.beginDatumTijd ||
        !absentMelding.eindDatumTijd ||
        !isEqual(absentMelding.beginDatumTijd, afspraak.begin) ||
        !isEqual(absentMelding.eindDatumTijd, afspraak.eind)
    );
}

function getAbsentieMetEinddatum(registratie: LeerlingRegistratieQueryType): LeerlingRegistratieQueryType['absent'] {
    return registratie.absent?.heeftEinde ? registratie.absent : undefined;
}

function isOnbewerkbareAbsentieMetEinddatum(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    const absentieMeldingMetEinddatum = getAbsentieMetEinddatum(registratie);
    if (!absentieMeldingMetEinddatum || isUnsaved(absentieMeldingMetEinddatum)) {
        return false;
    }

    return (
        !isIngevoerdDoorDocentVanAfspraak(afspraak, absentieMeldingMetEinddatum.ingevoerdDoor) ||
        isAbsentMeldingMetAfwijkendeTijdOfNietBeschikbareAbsentiereden(afspraak, registratie, absentieMeldingMetEinddatum)
    );
}

export function bepaalExternRegistratieType(
    afspraak: AfspraakQuery['afspraak'],
    registratie: LeerlingRegistratieQueryType
): ExterneRegistratieType | null {
    if (isOnbewerkbareAbsentieMetEinddatum(afspraak, registratie)) {
        return ExterneRegistratieType.ABSENT_MET_EINDDATUM;
    } else if (isTeLaatGemeldDoorAndereDocentMetConstatering(afspraak, registratie)) {
        return ExterneRegistratieType.TE_LAAT;
    } else if (isVerwijderdGemeldDoorAndereDocent(afspraak, registratie)) {
        return ExterneRegistratieType.VERWIJDERD;
    } else if (isAanwezigGemeldDoorAndereDocent(afspraak, registratie)) {
        return ExterneRegistratieType.AANWEZIG;
    }
    return null;
}

export function heeftExterneRegistratie(afspraak: AfspraakQuery['afspraak'], registratie: LeerlingRegistratieQueryType): boolean {
    return bepaalExternRegistratieType(afspraak, registratie) !== null;
}
