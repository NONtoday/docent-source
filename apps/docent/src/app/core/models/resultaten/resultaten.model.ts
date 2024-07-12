import {
    CijferPeriode,
    KolomZichtbaarheidInput,
    LeerlingMissendeToets,
    PartialLeerlingFragment,
    ResultaatkolomType,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../../../generated/_types';

export type KolomZichtbaarheidKey = keyof KolomZichtbaarheidInput;
export type Kolomtype = 'P' | 'r' | 'R' | 'A';
export interface ToetskolomSidebarData {
    leerlingen: PartialLeerlingFragment[];
    kolomId: string;
    kolomType: ResultaatkolomType;
    herkansingsNummer: number;
    periode: CijferPeriode;
    leerlingMissendeToetsen: LeerlingMissendeToets[];
}

export interface LeerlingResultatenSidebarData {
    leerling: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'][number];
}

export interface ToetskolomOpties {
    kolomIcon: string;
    kolomHeaderBackground: boolean;
    kolomCellenBackground: boolean;
    headerLetter: Kolomtype;
    headerLetterClass: string | string[];
    showKolomAfkorting: boolean;
    showAantallen: boolean;
    hideGemiddelde: boolean;
    hideToetsinformatieTab: boolean;
    hideResultatenTab: boolean;
    readOnlyCellen: boolean;
    centerHeaderLetter: boolean;
}

export const toetskolommenConfig: Record<ResultaatkolomType, Partial<ToetskolomOpties>> = {
    SAMENGESTELDE_TOETS: {
        kolomIcon: 'samengesteldeToets',
        kolomHeaderBackground: true,
        kolomCellenBackground: true,
        showAantallen: false,
        readOnlyCellen: true
    },
    DEELTOETS: {
        kolomIcon: 'deeltoets',
        showAantallen: true
    },
    ADVIES: {
        headerLetter: 'A',
        headerLetterClass: ['color-secondary-2', 'background-color-secondary-3'],
        showAantallen: true,
        hideGemiddelde: true,
        hideToetsinformatieTab: true
    },
    PERIODE_GEMIDDELDE: {
        kolomHeaderBackground: true,
        kolomCellenBackground: true,
        headerLetter: 'P',
        headerLetterClass: ['color-accent-alt-1', 'background-color-accent-alt-3'],
        showKolomAfkorting: false,
        showAantallen: false,
        hideToetsinformatieTab: true,
        readOnlyCellen: true,
        centerHeaderLetter: true
    },
    RAPPORT_GEMIDDELDE: {
        kolomHeaderBackground: true,
        kolomCellenBackground: true,
        headerLetter: 'r',
        headerLetterClass: ['color-accent-positive-1', 'background-color-accent-positive-3'],
        showKolomAfkorting: false,
        showAantallen: false,
        hideToetsinformatieTab: true,
        readOnlyCellen: true,
        centerHeaderLetter: true
    },
    RAPPORT_CIJFER: {
        kolomHeaderBackground: true,
        kolomCellenBackground: true,
        headerLetter: 'R',
        headerLetterClass: ['color-accent-positive-1', 'background-color-accent-positive-3'],
        showKolomAfkorting: false,
        showAantallen: false,
        hideToetsinformatieTab: true,
        centerHeaderLetter: true
    },
    TOETS: {},
    RAPPORT_TOETS: {
        kolomHeaderBackground: true,
        kolomCellenBackground: true
    }
};
