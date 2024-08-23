import { ColorToken } from 'harmony';
import { sortBy } from 'lodash-es';
import { Differentiatiegroep, DifferentiatiegroepKleur, Leerling } from '../../../generated/_types';
import { KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';
import { getVolledigeNaam } from '../../shared/utils/leerling.utils';
import { stringToHash } from './utils';

export const actionColors = ['primary', 'warning', 'accent', 'negative', 'positive', 'neutral', 'alternative', 'disabled'] as const;
export type ActionColor = (typeof actionColors)[number];

export const backgroundIconColors = ['primary', 'warning', 'accent', 'negative', 'positive', 'neutral', 'alternative'] as const;
export type BackgroundIconColor = (typeof backgroundIconColors)[number];

export const stringToColor = (string: string, choices = backgroundIconColors): BackgroundIconColor => {
    const hash = stringToHash(string);
    return choices[hash % choices.length];
};

interface KleurConverter {
    background: ColorToken;
    color: ColorToken;
    counter: ColorToken;
    border: ColorToken;
}
export const differentiatieKleurConverter: Record<DifferentiatiegroepKleur, KleurConverter> = {
    BLAUW: { background: 'bg-primary-weak', color: 'fg-on-primary-weak', counter: 'fg-primary-normal', border: 'border-neutral-inverted' },
    GEEL: { background: 'bg-accent-weak', color: 'fg-on-accent-weak', counter: 'fg-accent-normal', border: 'border-neutral-inverted' },
    GROEN: {
        background: 'bg-positive-weak',
        color: 'fg-on-positive-weak',
        counter: 'fg-positive-normal',
        border: 'border-neutral-inverted'
    },
    ORANJE: { background: 'bg-warning-weak', color: 'fg-on-warning-weak', counter: 'fg-warning-normal', border: 'border-neutral-inverted' },
    PAARS: {
        background: 'bg-alternative-weak',
        color: 'fg-on-alternative-weak',
        counter: 'fg-alternative-normal',
        border: 'border-neutral-inverted'
    },
    ROOD: {
        background: 'bg-negative-weak',
        color: 'fg-on-negative-weak',
        counter: 'fg-negative-normal',
        border: 'border-neutral-inverted'
    },
    GRIJS: { background: 'bg-neutral-weak', color: 'fg-on-neutral-weak', counter: 'fg-neutral-normal', border: 'border-neutral-inverted' }
};

export const mapDifferentiatieToKleurenStackElements = (
    groepen: Differentiatiegroep[] = [],
    leerlingen: Leerling[] = []
): KleurenStackElement[] => {
    const kleuren =
        sortBy(groepen, ['id']).map((groep) => ({
            kleur: differentiatieKleurConverter[groep.kleur].counter,
            border: differentiatieKleurConverter[groep.kleur].border,
            content: groep.naam
        })) ?? [];
    if (leerlingen.length > 0) {
        kleuren.push({
            kleur: 'bg-neutral-strong',
            border: 'border-neutral-inverted',
            content: leerlingen.map(getVolledigeNaam).join(', ')
        });
    }

    return kleuren;
};
