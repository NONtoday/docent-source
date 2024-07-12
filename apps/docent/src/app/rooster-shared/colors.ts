import { sortBy } from 'lodash-es';
import { Differentiatiegroep, DifferentiatiegroepKleur, Leerling } from '../../generated/_types';
import { KleurenStackElement } from '../shared/components/kleuren-stack/kleuren-stack.component';
import { getVolledigeNaam } from '../shared/utils/leerling.utils';
import { stringToHash } from './utils/utils';

const backgroundColors = ['#d0dae4', '#d7dfe6', '#e3e9ee', '#f0f3f5', '#f7f9fa', '#ffffff'] as const;
export type Background = (typeof backgroundColors)[number];
export type BackgroundName = 'background_1' | 'background_2' | 'background_3' | 'background_4' | 'background_5' | 'background_6';
export const background_1: Background = '#d0dae4';
export const background_2: Background = '#d7dfe6';
export const background_3: Background = '#e3e9ee';
export const background_4: Background = '#f0f3f5';
export const background_5: Background = '#f7f9fa';
export const background_6: Background = '#ffffff';
export const isBackgroundColor = (color: string): color is Background => backgroundColors.includes(color as Background);

const typographyColors = ['#000829', '#3b4d68', '#557195', '#aab8ca', '#ffffff'] as const;
export type Typography = (typeof typographyColors)[number];
export type TypographyName = 'typography_1' | 'typography_2' | 'typography_3' | 'typography_4' | 'typography_5';
export const typography_1: Typography = '#000829';
export const typography_2: Typography = '#3b4d68';
export const typography_3: Typography = '#557195';
export const typography_4: Typography = '#aab8ca';
export const typography_5: Typography = '#ffffff';
export const isTypographyColor = (color: string): color is Typography => typographyColors.includes(color as Typography);

const primaryColors = ['#296bd7', '#005eb8', '#004f9b', '#e5edfa'] as const;
export type Primary = (typeof primaryColors)[number];
export type PrimaryName = 'primary_1' | 'primary_2' | 'primary_3' | 'primary_4';
export const primary_1: Primary = '#296bd7';
export const primary_2: Primary = '#005eb8';
export const primary_3: Primary = '#004f9b';
export const primary_4: Primary = '#e5edfa';
export const isPrimaryColor = (color: string): color is Primary => primaryColors.includes(color as Primary);

const secondaryColors = ['#e6ab4a', '#c38831', '#fbf2e4'] as const;
export type Secondary = (typeof secondaryColors)[number];
export type SecondaryName = 'secondary_1' | 'secondary_2' | 'secondary_3';
export const secondary_1: Secondary = '#e6ab4a';
export const secondary_2: Secondary = '#c38831';
export const secondary_3: Secondary = '#fbf2e4';
export const isSecondaryColor = (color: string): color is Secondary => secondaryColors.includes(color as Secondary);

const postiveColors = ['#3f8541', '#1a6d1c', '#e8f0e8'] as const;
export type AccentPositive = (typeof postiveColors)[number];
export type AccentPositiveName = 'accent_positive_1' | 'accent_positive_2' | 'accent_positive_3';
export const accent_positive_1: AccentPositive = '#3f8541';
export const accent_positive_2: AccentPositive = '#1a6d1c';
export const accent_positive_3: AccentPositive = '#e8f0e8';
export const isPositiveColor = (color: string): color is AccentPositive => postiveColors.includes(color as AccentPositive);

const negativeColors = ['#d32f0d', '#b62507', '#f8e0db'] as const;
export type AccentNegative = (typeof negativeColors)[number];
export type AccentNegativeName = 'accent_negative_1' | 'accent_negative_2' | 'accent_negative_3';
export const accent_negative_1: AccentNegative = '#d32f0d';
export const accent_negative_2: AccentNegative = '#b62507';
export const accent_negative_3: AccentNegative = '#f8e0db';
export const isNegativeColor = (color: string): color is AccentNegative => negativeColors.includes(color as AccentNegative);

const warningColors = ['#da6710', '#b64603', '#f9e8db', '#fcf4ed'] as const;
export type AccentWarning = (typeof warningColors)[number];
export type AccentWarningName = 'accent_warning_1' | 'accent_warning_2' | 'accent_warning_3' | 'accent_warning_4';
export const accent_warning_1: AccentWarning = '#da6710';
export const accent_warning_2: AccentWarning = '#b64603';
export const accent_warning_3: AccentWarning = '#f9e8db';
export const accent_warning_4: AccentWarning = '#fcf4ed';
export const isWarningColor = (color: string): color is AccentWarning => warningColors.includes(color as AccentWarning);

const alternativeColors = ['#793ff5', '#5012d2', '#ebe2fe'] as const;
export type AccentAlt = (typeof alternativeColors)[number];
export type AccentAltName = 'accent_alt_1' | 'accent_alt_2' | 'accent_alt_3';
export const accent_alt_1: AccentAlt = '#793ff5';
export const accent_alt_2: AccentAlt = '#5012d2';
export const accent_alt_3: AccentAlt = '#ebe2fe';
export const isAlternativeColor = (color: string): color is AccentAlt => alternativeColors.includes(color as AccentAlt);

export type HarmonyColorName =
    | BackgroundName
    | TypographyName
    | PrimaryName
    | SecondaryName
    | AccentPositiveName
    | AccentNegativeName
    | AccentWarningName
    | AccentAltName;
export const harmonyColorMap = new Map<HarmonyColorName, HarmonyColor>()
    .set('background_1', background_1)
    .set('background_2', background_2)
    .set('background_3', background_3)
    .set('background_4', background_4)
    .set('background_5', background_5)
    .set('background_6', background_6)
    .set('typography_1', typography_1)
    .set('typography_2', typography_2)
    .set('typography_3', typography_3)
    .set('typography_4', typography_4)
    .set('primary_1', primary_1)
    .set('primary_2', primary_2)
    .set('primary_3', primary_3)
    .set('primary_4', primary_4)
    .set('secondary_1', secondary_1)
    .set('secondary_2', secondary_2)
    .set('secondary_3', secondary_3)
    .set('accent_positive_1', accent_positive_1)
    .set('accent_positive_2', accent_positive_2)
    .set('accent_positive_3', accent_positive_3)
    .set('accent_negative_1', accent_negative_1)
    .set('accent_negative_2', accent_positive_2)
    .set('accent_negative_3', accent_positive_3)
    .set('accent_warning_1', accent_warning_1)
    .set('accent_warning_2', accent_warning_2)
    .set('accent_warning_3', accent_warning_3)
    .set('accent_warning_4', accent_warning_4)
    .set('accent_alt_1', accent_alt_1)
    .set('accent_alt_2', accent_alt_2)
    .set('accent_alt_3', accent_alt_3);

export type Accent = AccentPositive | AccentNegative | AccentWarning | AccentAlt;
export type HarmonyColor = Background | Typography | Primary | Secondary | Accent;
export type HarmonyColorString =
    | 'primary'
    | 'typography'
    | 'secondary'
    | 'positive'
    | 'warning'
    | 'negative'
    | 'background'
    | 'alternative'
    | 'blank';

// de kleur van deze shadow is typography-2, maar inline css ondersteunt geen rgba met hexcodes
export const shadow_popout_desktop = `0px 4px 14px rgba(83, 100, 126, 0.2)`;

const harmonyBackgroundColorMap = new Map<HarmonyColor, HarmonyColor>()
    .set(primary_1, primary_4)
    .set(accent_positive_1, accent_positive_3)
    .set(accent_negative_1, accent_negative_3)
    .set(accent_warning_1, accent_warning_3)
    .set(secondary_1, secondary_3)
    .set(typography_3, background_4)
    .set(typography_4, background_4)
    .set(accent_alt_1, accent_alt_3);

/**
 * Met Harmony maken we geen gebruik meer van transparency in kleuren.
 * In plaats daarvan zijn er voorgedefinieerde achtergrondkleuren (meestal de nr. 3 van elke categorie).
 * Met deze functie kunnen deze worden opgezocht.
 *
 * @param foregroundColor de Harmony voorgrondkleur
 * @return de bijbehorende Harmony achtergrondkleur, of background_1 als er geen bekend is
 */
export const getHarmonyBackgroundColor = (foregroundColor: HarmonyColor) => harmonyBackgroundColorMap.get(foregroundColor) || background_1;

export const backgroundIconColors: HarmonyColorName[] = [
    'primary_1',
    'accent_positive_1',
    'accent_negative_1',
    'accent_warning_1',
    'secondary_1',
    'typography_3',
    'accent_alt_1'
];

export const stringToColor = (string: string, choices = backgroundIconColors): HarmonyColorName => {
    const hash = stringToHash(string);
    return choices[hash % choices.length];
};

/**
 * Geeft de hex waarde van de meest voorkomende string kleuren als 'negative', 'positive', 'typography'.
 * Wanneer de waarde niet gevonden kan worden, wordt de input gereturned.
 */
export const colorToHex = (color: string): HarmonyColor => {
    if (color === 'negative') {
        return accent_negative_1;
    } else if (color === 'positive') {
        return accent_positive_1;
    } else if (color === 'typography') {
        return typography_3;
    } else if (color === 'primary') {
        return primary_1;
    } else if (color === 'background') {
        return background_1;
    } else if (color === 'warning') {
        return accent_warning_1;
    } else if (color === 'blank') {
        return background_6;
    } else if (harmonyColorMap.has(color as HarmonyColorName)) {
        return harmonyColorMap.get(color as HarmonyColorName)!;
    }
    return color as HarmonyColor;
};

interface KleurConverter {
    background: HarmonyColor;
    color: HarmonyColor;
    counter: HarmonyColor;
    border: HarmonyColor;
}
export const differentieKleurConverter: Record<DifferentiatiegroepKleur, KleurConverter> = {
    BLAUW: { background: primary_4, color: primary_2, counter: primary_1, border: primary_2 },
    GEEL: { background: secondary_3, color: secondary_2, counter: secondary_1, border: secondary_2 },
    GROEN: { background: accent_positive_3, color: accent_positive_2, counter: accent_positive_1, border: accent_positive_2 },
    ORANJE: { background: accent_warning_3, color: accent_warning_2, counter: accent_warning_1, border: accent_warning_2 },
    PAARS: { background: accent_alt_3, color: accent_alt_2, counter: accent_alt_1, border: accent_alt_2 },
    ROOD: { background: accent_negative_3, color: accent_negative_2, counter: accent_negative_1, border: accent_negative_2 },
    GRIJS: { background: background_3, color: typography_3, counter: typography_3, border: typography_2 }
};

export const harmonyBorderColorMap = new Map<HarmonyColor, HarmonyColor>()
    .set(primary_1, primary_2)
    .set(accent_positive_1, accent_positive_2)
    .set(accent_negative_1, accent_negative_2)
    .set(accent_warning_1, accent_warning_2)
    .set(secondary_1, secondary_2)
    .set(typography_3, typography_3)
    .set(accent_alt_1, accent_alt_2)
    .set(background_1, background_2);

export const getHarmonyBorderColor = (foregroundColor: HarmonyColor) => harmonyBorderColorMap.get(foregroundColor) || background_1;

export const mapDifferentiatieToKleurenStackElements = (
    groepen: Differentiatiegroep[] = [],
    leerlingen: Leerling[] = []
): KleurenStackElement[] => {
    const kleuren =
        sortBy(groepen, ['id']).map((groep) => ({
            kleur: differentieKleurConverter[groep.kleur].counter,
            border: differentieKleurConverter[groep.kleur].border,
            content: groep.naam
        })) ?? [];
    if (leerlingen.length > 0) {
        kleuren.push({ kleur: primary_4, border: background_1, content: leerlingen.map(getVolledigeNaam).join(', ') });
    }

    return kleuren;
};

function replaceUnderscoresInColorName(colorName: HarmonyColorName) {
    return colorName?.replace(/_/g, '-');
}

export function toFillCssClass(colorName: HarmonyColorName) {
    return toCssClass('fill', colorName);
}

export function toColorCssClass(colorName: HarmonyColorName) {
    return toCssClass('color', colorName);
}

function toCssClass(prefix: string, colorName: HarmonyColorName) {
    return colorName ? `${prefix}-${replaceUnderscoresInColorName(colorName)}` : '';
}
