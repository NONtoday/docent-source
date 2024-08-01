import { ColorToken } from 'harmony';
import { IconName } from 'harmony-icons';
import { curry, times } from 'lodash-es';
import { AfspraakHerhalingDag, AfspraakHerhalingEindeType, AfspraakHerhalingType, SjabloonViewQuery } from '../../../generated/_types';
import { dagNamen } from './date.utils';

export interface DropDownOption<T> {
    value: T;
    text: string;
    label?: string;
    labelstyle?: 'warning' | 'primary';
    icon?: IconName;
    iconColor?: ColorToken;
}

export const toConceptInleveropdrachtWeekOption = curry(
    (isSynced: boolean, sjabloonWeek: SjabloonViewQuery['sjabloonView']['weken'][number], index: number): DropDownOption<number> => ({
        value: index + 1,
        text: isSynced ? `Week ${sjabloonWeek.gekoppeldWeeknummer}` : `${index + 1}e week`,
        label: sjabloonWeek.vakanties[0]?.naam ?? sjabloonWeek.label,
        labelstyle: sjabloonWeek.vakanties[0]?.naam ? 'warning' : 'primary'
    })
);

export const dagenVanDeWeekOptions = times(5, (i) => ++i).map((i) => ({
    value: i,
    text: dagNamen[i - 1]
}));

export const herinneringOptions: DropDownOption<number>[] = [
    { text: 'Geen herinnering', value: 0 },
    { text: '1 dag voor de deadline', value: 86400 },
    { text: '2 dagen voor de deadline', value: 86400 * 2 },
    { text: '3 dagen voor de deadline', value: 86400 * 3 },
    { text: '4 dagen voor de deadline', value: 86400 * 4 },
    { text: '5 dagen voor de deadline', value: 86400 * 5 }
];

export const herhalingTypeOptions: DropDownOption<AfspraakHerhalingType>[] = [
    { text: 'Dagelijks', value: AfspraakHerhalingType.DAGELIJKS },
    { text: 'Wekelijks', value: AfspraakHerhalingType.WEKELIJKS },
    { text: 'Maandelijks', value: AfspraakHerhalingType.MAANDELIJKS }
];

export const maandXsteOptions: DropDownOption<number>[] = [
    { text: 'Eerste', value: 1 },
    { text: 'Tweede', value: 2 },
    { text: 'Derde', value: 3 },
    { text: 'Vierde', value: 4 }
];

export const herhalingDagOptions: DropDownOption<AfspraakHerhalingDag[]>[] = [
    { text: 'Maandag', value: [AfspraakHerhalingDag.MAANDAG] },
    { text: 'Dinsdag', value: [AfspraakHerhalingDag.DINSDAG] },
    { text: 'Woensdag', value: [AfspraakHerhalingDag.WOENSDAG] },
    { text: 'Donderdag', value: [AfspraakHerhalingDag.DONDERDAG] },
    { text: 'Vrijdag', value: [AfspraakHerhalingDag.VRIJDAG] },
    { text: 'Zaterdag', value: [AfspraakHerhalingDag.ZATERDAG] },
    { text: 'Zondag', value: [AfspraakHerhalingDag.ZONDAG] },
    { text: 'Dag', value: [AfspraakHerhalingDag.DAG] },
    { text: 'Werkdag', value: [AfspraakHerhalingDag.WERKDAG] }
];

export const afspraakHerhalingWerkdagen = [
    AfspraakHerhalingDag.MAANDAG,
    AfspraakHerhalingDag.DINSDAG,
    AfspraakHerhalingDag.WOENSDAG,
    AfspraakHerhalingDag.DONDERDAG,
    AfspraakHerhalingDag.VRIJDAG
];

export const afspraakHerhalingDagen = [...afspraakHerhalingWerkdagen, AfspraakHerhalingDag.ZATERDAG, AfspraakHerhalingDag.ZONDAG];

export const dagWerkdagOptions: DropDownOption<AfspraakHerhalingDag[]>[] = [
    { text: 'Dagen', value: [AfspraakHerhalingDag.DAG] },
    { text: 'Werkdagen', value: [AfspraakHerhalingDag.WERKDAG] }
];

export const afspraakHerhalingEindeOptions: DropDownOption<AfspraakHerhalingEindeType>[] = [
    { text: 'Einddatum', value: AfspraakHerhalingEindeType.OP },
    { text: 'Na aantal', value: AfspraakHerhalingEindeType.NA_AANTAL },
    { text: 'Eindejaar', value: AfspraakHerhalingEindeType.EINDESCHOOLJAAR }
];
