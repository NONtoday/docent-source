import {
    BevrorenStatus,
    CijferPeriode,
    Herkansing,
    KolomActie,
    KolomZichtbaarheid,
    LeerlingMissendeToets,
    MatrixResultaatkolomFieldsFragment,
    Maybe,
    PartialLeerlingFragment,
    RapportCijferkolom,
    Resultaat,
    Resultaatkolom,
    ResultaatkolomType,
    ResultaatLabelLijst,
    SamengesteldeToetskolom,
    Toetskolom,
    ToetsSoort,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../generated/_types';
import { toetskolommenConfig } from '../core/models/resultaten/resultaten.model';
import { ActionColor } from '../rooster-shared/utils/color-token-utils';
import { getSchooljaar } from '../rooster-shared/utils/date.utils';
import { isStringNullOrEmpty, Optional } from '../rooster-shared/utils/utils';

export const defaultPeriodeKolomZichtbaarheid: KolomZichtbaarheid = {
    r: false,
    P: false,
    A: true
};
export const defaultVoortgangsDossierPeriodes: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'] = [
    {
        cijferPeriode: {
            id: '-1',
            nummer: 1,
            begin: getSchooljaar(new Date()).start,
            eind: getSchooljaar(new Date()).eind,
            isHuidig: true
        },
        resultaatkolommen: [],
        advieskolommen: [],
        periodeGemiddeldeKolom: {
            id: 'DefaultPeriodeGmiddeldekolomId',
            resultaatkolom: {
                __typename: 'PeriodeGemiddeldekolom',
                id: 'DefaultPeriodeGmiddeldekolomId',
                actief: true,
                code: 'P1',
                type: ResultaatkolomType.PERIODE_GEMIDDELDE,
                bevrorenStatus: BevrorenStatus.Ontdooid
            },
            resultaten: [],
            toegestaneKolomActies: []
        },
        rapportGemiddeldeKolom: {
            id: 'DefaultRapportGemiddeldeKolomId',
            resultaatkolom: {
                __typename: 'RapportGemiddeldekolom',
                id: 'DefaultRapportGemiddeldeKolomId',
                actief: true,
                code: 'r1',
                type: ResultaatkolomType.RAPPORT_GEMIDDELDE,
                volgnummer: 1,
                bevrorenStatus: BevrorenStatus.Ontdooid
            },
            resultaten: [],
            toegestaneKolomActies: []
        },
        rapportCijferkolom: {
            id: 'DefaultRapportCijferkolomId',
            resultaatkolom: {
                __typename: 'RapportCijferkolom',
                id: 'DefaultRapportCijferkolomId',
                actief: true,
                code: 'R1',
                type: ResultaatkolomType.RAPPORT_CIJFER,
                volgnummer: 1,
                bevrorenStatus: BevrorenStatus.Ontdooid,
                vastgezet: false
            },
            resultaten: [],
            toegestaneKolomActies: [KolomActie.ResultatenInvoeren, KolomActie.OpmerkingInvoeren]
        },
        leerlingMissendeToetsen: [],
        bevrorenStatus: BevrorenStatus.Ontdooid
    }
];

export const defaultVoortgangsdossierMatrix: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep'] = {
    id: '-1',
    voortgangsdossier: {
        id: '-1',
        lesgroepDeeltoetsenToestaan: false,
        lesgroepToetsenToegestaan: false,
        meervoudigeToetsnorm: false,
        onderwijssoortLeerjaar: '',
        toetsdossier: { id: '-2', naam: '', isDefaultDossier: true }
    },
    leerlingen: [],
    lesgroep: {} as VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['lesgroep'],
    periodes: defaultVoortgangsDossierPeriodes
};

export const cijferResultaatRegex: Readonly<RegExp> = new RegExp('^[0-9]{0,2}[.,]?[0-9]{0,1}$|^[*]?$|^vr$|^x$|^X$');
export const allowedCharacters: Readonly<string[]> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '.', '*', 'v', 'r'];
export const allowedRapportCijferCharacters: Readonly<string[]> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '.', 'x', 'X'];

export const resultatenOpslaanGuardProperties = {
    title: 'Let op, wijzigingen zijn nog niet opgeslagen.',
    message:
        'Niet alle wijzigen zijn automatisch opgeslagen. Kies ‘Opslaan en verlaten’ om deze wijzigen op te slaan en het voortgansdossier te verlaten.',
    cancelLabel: 'Annuleren',
    actionLabel: 'Opslaan en verlaten',
    outlineConfirmKnop: true,
    buttonColor: 'positive' as ActionColor
};

export interface BasisResultaat {
    resultaat: Optional<Resultaat>;
    missendeToets: boolean;
    missendeToetsen: LeerlingMissendeToets[];
}
export interface LeerlingResultaat extends BasisResultaat {
    leerling: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'][number];
}
export interface KolomResultaat extends BasisResultaat {
    matrixKolom: MatrixResultaatkolomFieldsFragment;
    magResultatenInvoeren: boolean;
    magOpmerkingToevoegen: boolean;
}

export interface ToetskolomHerberekeningRelevanteVelden {
    toetsSoort: Optional<ToetsSoort>;
    herkansing: Optional<Herkansing>;
    resultaatLabelLijst?: ResultaatLabelLijst;
    periode: Optional<CijferPeriode>;
    weging: number;
}

export function isKolomOfType<T extends Resultaatkolom>(kolom: Optional<Resultaatkolom>, ...types: ResultaatkolomType[]): kolom is T {
    return !!kolom && types?.some((type) => type === kolom.type);
}

export function isToetskolom(kolom: Optional<Resultaatkolom>): kolom is Toetskolom {
    return isKolomOfType<Toetskolom>(kolom, ResultaatkolomType.TOETS, ResultaatkolomType.SAMENGESTELDE_TOETS, ResultaatkolomType.DEELTOETS);
}

export function getBevrorenStatusTooltip(kolom: Resultaatkolom) {
    if (kolom.bevrorenStatus === BevrorenStatus.Ontdooid) {
        return null;
    }

    const bevrorenStatus = kolom.bevrorenStatus.toLowerCase();
    return `<div style="font-weight: 600">Kolom ${bevrorenStatus}</div>`;
}

/**
 * Tooltip voor de resultaatcell van samengestelde toets / rapportcijfer
 */
export function getGemiddeldekolomTooltip(
    kolom: Resultaatkolom,
    basisResultaat: BasisResultaat | undefined,
    alternatiefNiveau: boolean
): Maybe<string> {
    let tooltip = '';

    const kolomType = kolom.type;
    if (kolomType === ResultaatkolomType.SAMENGESTELDE_TOETS || kolomType === ResultaatkolomType.RAPPORT_CIJFER) {
        if (basisResultaat?.missendeToets) {
            const missendeToetsenString = basisResultaat.missendeToetsen
                ?.map((missendeToets) => {
                    let mapped = missendeToets.toetsafkorting;
                    if (missendeToets.periode !== kolom.periode) {
                        mapped += ` (P${missendeToets.periode})`;
                    }
                    return mapped;
                })
                .join(', ');
            tooltip += `<div style="font-weight: 600">Gemiddelde waarbij toetsen missen</div><div>${missendeToetsenString}</div>`;
        }

        if (isOverschrevenRapportCijfer(kolom, basisResultaat?.resultaat, alternatiefNiveau)) {
            tooltip += '<div style="font-weight: 600">Resultaat overschreven</div>';
        }
        if ((<RapportCijferkolom>kolom).vastgezet) {
            tooltip += '<div style="font-weight: 600">Rapportcijfer is vastgezet</div>';
        }
    }

    return isStringNullOrEmpty(tooltip) ? null : tooltip;
}

export function getBevrorenOfVastgezetStatusTooltip(kolom: Resultaatkolom): string {
    let tooltip = getBevrorenStatusTooltip(kolom) ?? '';
    if ((<RapportCijferkolom>kolom).vastgezet) {
        tooltip += '<div style="font-weight: 600">Rapportcijfer is vastgezet</div>';
    }
    return tooltip;
}

export function isOverschrevenRapportCijfer(kolom: Resultaatkolom, resultaat: Optional<Resultaat>, alternatiefNiveau: boolean): boolean {
    if (kolom.type !== ResultaatkolomType.RAPPORT_CIJFER || !resultaat) {
        return false;
    } else if ((<RapportCijferkolom>kolom).vastgezet) {
        return false;
    } else {
        return alternatiefNiveau ? resultaat.rapportCijferEnOverschrevenAfwijkendNiveau : resultaat.rapportCijferEnOverschreven;
    }
}

export function parseCellId(cellId: string) {
    const split = cellId.split(':');
    const parsedHerkansingsNummer = parseInt(split[2], 10);
    const herkansingsNummer = isNaN(parsedHerkansingsNummer) ? null : parsedHerkansingsNummer;
    return {
        toetskolomId: split[0],
        leerlingUUID: split[1],
        herkansingsNummer
    };
}

export function magOpmerkingToevoegen(kolom: Optional<MatrixResultaatkolomFieldsFragment>) {
    if (!kolom) {
        return false;
    }
    const kolomConfig = toetskolommenConfig[kolom?.resultaatkolom?.type];
    return !kolomConfig?.readOnlyCellen && kolom?.toegestaneKolomActies.includes(KolomActie.OpmerkingInvoeren);
}

export function getOpmerkingTooltip(resultaat: Optional<Resultaat>) {
    if (!resultaat?.opmerkingen) {
        return null;
    }

    return `<span style="font-weight: 600">Opmerking (${resultaat?.toonOpmerkingInELO ? '' : 'niet '}zichtbaar):</span><br/>
        ${resultaat?.opmerkingen}`;
}

export const getGecombineerdeTooltip = (kolom: Resultaatkolom, basisResultaat: BasisResultaat, alternatiefNiveau: boolean): string =>
    (getBevrorenStatusTooltip(kolom) || '')
        .concat(getGemiddeldekolomTooltip(kolom, basisResultaat, alternatiefNiveau) || '')
        .concat(getOpmerkingTooltip(basisResultaat.resultaat) || '');

function getBasisResultaat(
    leerling: PartialLeerlingFragment,
    matrixKolom: Optional<MatrixResultaatkolomFieldsFragment>,
    alleMissendeToetsen: LeerlingMissendeToets[]
): BasisResultaat {
    const leerlingResultaat = matrixKolom?.resultaten.find((resultaat) => resultaat.leerlingUUID === leerling.uuid);

    let missendeToets = false;
    let missendeToetsen = alleMissendeToetsen?.filter((missendeToets) => missendeToets.leerlingUuid === leerling.uuid);

    if (isKolomOfType<SamengesteldeToetskolom>(matrixKolom?.resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS)) {
        missendeToets = Boolean(
            matrixKolom?.resultaatkolom.leerlingMissendeToetsen.some((missendeToets) => missendeToets.leerlingUuid === leerling.uuid)
        );
        missendeToetsen = matrixKolom
            ? matrixKolom.resultaatkolom.leerlingMissendeToetsen.filter((missendeToets) => missendeToets.leerlingUuid === leerling.uuid)
            : [];
    } else {
        missendeToets = missendeToetsen?.length > 0;
    }

    return {
        resultaat: leerlingResultaat,
        missendeToets,
        missendeToetsen
    };
}

export function getLeerlingResultaat(
    leerling: PartialLeerlingFragment,
    matrixKolom: Optional<MatrixResultaatkolomFieldsFragment>,
    alleMissendeToetsen: LeerlingMissendeToets[]
): LeerlingResultaat {
    return {
        ...getBasisResultaat(leerling, matrixKolom, alleMissendeToetsen),
        leerling
    };
}

export function getKolomResultaat(
    leerling: PartialLeerlingFragment,
    matrixKolom: MatrixResultaatkolomFieldsFragment,
    alleMissendeToetsen: LeerlingMissendeToets[]
): KolomResultaat {
    return {
        ...getBasisResultaat(leerling, matrixKolom, alleMissendeToetsen),
        matrixKolom,
        magResultatenInvoeren: matrixKolom.toegestaneKolomActies.includes(KolomActie.ResultatenInvoeren),
        magOpmerkingToevoegen: matrixKolom.toegestaneKolomActies.includes(KolomActie.OpmerkingInvoeren)
    };
}
