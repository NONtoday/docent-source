import { LeerlingAfwezigheidsKolom, Vak, VakToetsTrend } from '@docent/codegen';
import { NotificationColor } from 'harmony';
import { Optional } from '../../rooster-shared/utils/utils';

export interface RegistratieTotaalContent {
    kleur: NotificationColor;
    naam: string;
    sorteringsNummer?: number;
    inverted?: boolean;
}

export const registratieContent = {
    ONGEOORLOOFD_AFWEZIG: { kleur: 'negative', naam: 'Ongeoorloofd afwezig', sorteringsNummer: 0, inverted: false },
    GEOORLOOFD_AFWEZIG: { kleur: 'primary', naam: 'Geoorloofd afwezig', sorteringsNummer: 1, inverted: false },
    TE_LAAT: { kleur: 'accent', naam: 'Te laat', sorteringsNummer: 2, inverted: false },
    VERWIJDERD: { kleur: 'warning', naam: 'Verwijderd', sorteringsNummer: 3, inverted: false },
    HUISWERK_NIET_IN_ORDE: { kleur: 'neutral', naam: 'Huiswerk niet in orde', sorteringsNummer: 4, inverted: false },
    MATERIAAL_NIET_IN_ORDE: { kleur: 'neutral', naam: 'Materiaal niet in orde', sorteringsNummer: 5, inverted: true },
    VRIJ_VELD: { kleur: 'alternative', naam: 'Vrij veld', sorteringsNummer: 6, inverted: false }
} as const satisfies Record<LeerlingAfwezigheidsKolom, RegistratieTotaalContent>;

export interface LeerlingoverzichtResultatenCijferBalk {
    cijfer: Optional<number>;
    color: 'positive' | 'negative' | 'warning' | 'neutral';
    vergelijking: Optional<number>;
    label?: Optional<string>;
}

export interface LeerlingoverzichtResultatenVakGrafiekHeader {
    gemiddelde: Optional<number>;
    titel: string;
    tooltip: string;
    isOnvoldoende: boolean;
}

export interface LeerlingoverzichtResultatenVakGrafiekData {
    vak: Vak;
    trend: Optional<VakToetsTrend>;
    cijferbalken: LeerlingoverzichtResultatenCijferBalk[];
    tooltip: string;
    anderNiveau?: Optional<string>;
    vrijstelling?: boolean;
    ontheffing?: boolean;
    isAlternatieveNormering?: boolean;
}

export const resulatenVergelijkingOpties = ['Stamgroep', 'Parallelklassen'] as const;
export type VergelijkingOptie = (typeof resulatenVergelijkingOpties)[number];
