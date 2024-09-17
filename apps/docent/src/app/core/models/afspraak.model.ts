import { Afspraak } from '@docent/codegen';

export const isAfspraak = (item: RoosterItem): item is Afspraak => 'titel' in item;

export type RoosterItem = Afspraak | VrijUur;

export type AfspraakHerhalingType = 'Niet herhalen' | 'Dagelijks' | 'Wekelijks' | 'Maandelijks';

export interface VrijUur {
    aantalMinuten: number;
    begin: Date;
    eind: Date;
}
