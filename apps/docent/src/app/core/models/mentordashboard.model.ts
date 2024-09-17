import {
    GroepsoverzichtRegistratiesQuery,
    KeuzelijstWaardeMogelijkheid,
    KeuzelijstWaardeRegistraties,
    LeerlingAfwezigheidsKolom,
    MentordashboardOverzichtRegistratieCategorieFieldsFragment,
    PartialLeerlingFragment,
    Registratie,
    VakoverzichtRegistratiesQuery,
    VrijVeld
} from '@docent/codegen';
import { DropdownItem } from 'harmony';
import { RegistratieTotaalContent } from '../../mentordashboard/leerlingoverzicht/leerlingoverzicht.model';
import { SignaleringPopupFilter } from '../../mentordashboard/signalering-aantal-popup/signalering-aantal-popup.component';
import { Optional } from '../../rooster-shared/utils/utils';

export interface VakKolom {
    naam: string;
    huidigePeriode?: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number];
    isTotaal: boolean;
    signals?: number;
    highlightedPeriodeSignaleringen?: Record<string, number>;
}

export interface PeriodeTabel {
    header: {
        nummer: number;
        label: string;
        name: string;
        open: boolean;
        tooltip: string;
    };
    kolommen: string[];
    kolomTooltips: string[]; // kolomTooltips is voor de kolom header tooltips, omdat vrije velden daar omgedraaid zijn, maar in de tooltip correct moeten staan.
    rijen: { [key: string]: any }[]; // een any, want het kan een object of boolean of string oid zijn.
    /**
     * Elke rij is een object met de kolomnamen als property key en een object met data zoals de label en vak als value.
     * Het eerste object in de array is de totaal rij.
     *
     * rijen: [
     *  { Ongeoorloofd afwezig: { label: 10x }, Geoorloofd afwezig: { label: 4x }, ..., isTotaal: true },
     *  { Ongeoorloofd afwezig: { label: 10x, value: 10, vak: ..., periode: ..., ,  }, vrijVeld naam: { label: 4x , vrijVeld: ...,} isTotaal: false },
     * ]
     *
     **/
}

export interface TabelKolom {
    id: string;
    naam: string;
    tabelHeaderNaam: string;
}

export interface RegistratieCategorieFilter {
    id: string;
    display: string;
    selected: boolean;
}

export interface RegistratieTabel {
    signaleringPopupData: {
        iedereenFilters: SignaleringPopupFilter[];
        leerlingFilters: SignaleringPopupFilter[];
    };
    aantalSignaleringen: number;
    aantalActieveSignaleringen: number;
    tables: PeriodeTabel[];
    zichtbareKolommen: string[];
    columns: TabelKolom[];
    periodes: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'];
    vakken: VakKolom[];
}

export interface CellData {
    kolom: string;
    altDisplay?: string;
    signaleringKey?: string;
    aantal: number;
    vrijVeld?: Optional<VrijVeld>;
    keuzelijstWaardeMogelijkheid?: Optional<KeuzelijstWaardeMogelijkheid>;
}

export interface KeuzelijstRegistratiesPerWaarde {
    keuzelijstRegistraties: KeuzelijstWaardeRegistraties;
    registraties: Registratie[];
}

export type GroepsoverzichtRegistratie = GroepsoverzichtRegistratiesQuery['groepsoverzichtRegistraties']['registraties'][number];
export type GroepsoverzichtRegistratieTellingen = GroepsoverzichtRegistratie['leerlingRegistratieTellingen'][number];
export type GroepoverzichtRegistratieWithContent = GroepsoverzichtRegistratie & { categorieContent: RegistratieTotaalContent };
export const overzichtTijdspanOpties: DropdownItem<MentordashboardOverzichtTijdspanOptie>[] = [
    { data: 'Laatste 7 dagen', label: 'Laatste 7 dagen' },
    { data: 'Laatste 30 dagen', label: 'Laatste 30 dagen' },
    { data: 'Deze periode', label: 'Deze periode' },
    { data: 'Huidig schooljaar', label: 'Huidig schooljaar' }
] as const;
// de periode/tijdspan opties voor het gezamenlijke overzicht zijn hetzelfde als bij de stamgroep, behalve 'Deze periode'
export const overzichtTijdspanOptiesIndividueel = overzichtTijdspanOpties.filter((optie) => optie.data !== 'Deze periode');
export type MentordashboardOverzichtTijdspanOptie = 'Laatste 7 dagen' | 'Laatste 30 dagen' | 'Deze periode' | 'Huidig schooljaar';
export const defaultGroepsoverzichtCategories = [
    LeerlingAfwezigheidsKolom.GEOORLOOFD_AFWEZIG,
    LeerlingAfwezigheidsKolom.ONGEOORLOOFD_AFWEZIG,
    LeerlingAfwezigheidsKolom.TE_LAAT,
    LeerlingAfwezigheidsKolom.VERWIJDERD
];

export interface LeerlingCijferOverzicht {
    leerling: PartialLeerlingFragment;
    cijferbalken: Array<{ label: string | null; cijfers: number[] }>;
    totaalgemiddelde: Optional<number>;
    totaalgemiddeldeTooltip: Optional<string>;
    trendindicatie: Optional<number>;
    aantalResultatenVoorTrendindicatie: number;
}

export interface GroepsoverzichtResultaten {
    extraAandacht: LeerlingCijferOverzicht[];
    aandacht: LeerlingCijferOverzicht[];
    opNiveau: LeerlingCijferOverzicht[];
}

export type GroepsoverzichtResultatenKolomNaam = keyof GroepsoverzichtResultaten;

export interface MentordashboardOverzichtLeerlingRegistratieWithContent {
    leerling?: PartialLeerlingFragment;
    leerlingId: string;
    aantalRegistraties: number;
    categorie: MentordashboardOverzichtRegistratieCategorieFieldsFragment;
    categorieContent: RegistratieTotaalContent;
    tijdspan: MentordashboardOverzichtTijdspanOptie;
    trend: Optional<number>;
}
