import { UrlSegment } from '@angular/router';
import { format, isDate, isSameDay, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import { nl } from 'date-fns/locale';
import { IconName } from 'harmony-icons';
import { curry, get, isEqual, isFunction, isNull, isUndefined, negate } from 'lodash-es';
import { matching } from 'shades';
import { Afspraak, Differentiatiegroep, HuiswerkType, Lesgroep, SorteringOrder } from '../../../generated/_types';
import { SorteerOrder } from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { LoadingState } from '../../core/models/shared.model';

export const MAX_INT_VALUE = 2147483647;

export type Optional<T> = T | undefined | null;

export type TextAlign = 'left' | 'right' | 'center' | 'justify' | 'initial' | 'inherit';

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
    [Property in Key]-?: Type[Property];
};

export const flipSortering = (order: SorteringOrder): SorteringOrder =>
    order === SorteringOrder.ASC ? SorteringOrder.DESC : SorteringOrder.ASC;

const sortAfspraakByBegin = (a: Afspraak, b: Afspraak) => {
    if (a.begin < b.begin) {
        return -1;
    }
    if (a.begin > b.begin) {
        return 1;
    }
    if (a.eind < b.eind) {
        return -1;
    }
    if (a.eind > b.eind) {
        return 1;
    }
    return 0;
};

const formatNL = (date: Date, _format: string): string => {
    let dateToFormat = date;
    if (!isDate(dateToFormat)) {
        dateToFormat = parseISO(date as unknown as string);
    }

    return format(dateToFormat, _format, { locale: nl });
};

const hhmmToDate = (time: string, baseDate?: Date): Date => {
    baseDate = baseDate ? baseDate : new Date();
    const timeSplit = time.trim().split(':');
    return setSeconds(setMinutes(setHours(baseDate, parseInt(timeSplit[0], 10)), parseInt(timeSplit[1], 10)), 0);
};

export function roosterRouteMatcher(urlSegments: UrlSegment[]) {
    // Regex matches when the path of the url starts with `rooster`.
    // This expression also allows an optional expression group of three parts:
    // Part 1: stats with `/` followed by four digits.
    // Part 2/3: starts with `/` followerd by one or two digits.
    // Examples:
    //  /rooster
    //  /rooster/2018/1/1
    //  /rooster/2018/10/1
    //  /rooster/2018/1/10
    //  /rooster/2018/10/10
    const regex = /rooster(\/\d{4}\/\d{1,2}\/\d{1,2})?/;
    const path = urlSegments.join('/');
    const match = regex.exec(path);

    if (match) {
        if (urlSegments.length === 1 || match[1]) {
            const posParams: { [name: string]: UrlSegment } = {};

            if (match[1]) {
                posParams['jaar'] = urlSegments[1];
                posParams['maand'] = urlSegments[2];
                posParams['dag'] = urlSegments[3];
            }
            return {
                consumed: urlSegments,
                posParams
            };
        }
    }

    return null;
}

export function first(...strings: (string | undefined | null)[]): string {
    for (const value of strings.filter(isPresent)) {
        if (value.trim().length > 0) {
            return value;
        }
    }
    return '';
}

export const stringToHash = (string: string) => {
    let hash = 0;
    let charCode: number;
    if (string.length === 0) {
        return hash;
    }
    for (let i = 0; i < string.length; i++) {
        charCode = string.charCodeAt(i);
        hash = hash * 10 - hash + charCode;
        hash.toString(2); // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export function isEmpty(value: Optional<string>): boolean {
    return !value || value.trim().length === 0;
}

export function notEmpty(value: Optional<string>): value is string {
    return !isEmpty(value);
}

export function isStringNullOrEmpty(value: Optional<string>): boolean {
    return isUndefined(value) || isNull(value) || value.trim().length === 0;
}

/**
 * Stript iridium van het relatieve path van de url in het geval van een lokale url.
 * Bij het bepalen van de core url wordt '/iridium' voor de lokale omgeving al toegevoegd.
 * Returns de relatieve url zonder '/iridium' of een lege string.
 */
export function stripIridiumFromStartOfLocalRelativeUrl(relativeUrl?: Optional<string>) {
    if (!relativeUrl) {
        return '';
    }
    let result = relativeUrl;
    if (window.location.hostname.indexOf('localhost') >= 0 && relativeUrl?.startsWith('/iridium')) {
        result = relativeUrl.length > 8 ? relativeUrl.substring(8, relativeUrl.length) : '';
    }
    return result;
}

export function getViewWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
}

export function getPercentageViewWidth(percentage: number): Optional<number> {
    if (percentage < 0 || percentage > 100) {
        return undefined;
    }
    return (getViewWidth() / 100) * percentage;
}

export function getHuiswerkTypeTitel(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean) {
    let title = huiswerkType.toString();

    if (huiswerkType === HuiswerkType.GROTE_TOETS) {
        title = 'Grote toets';
    } else if (heeftInleveropdracht) {
        title = 'Inleveropdracht';
    }

    const lowercaseTitle = title.toLowerCase();
    return lowercaseTitle[0].toUpperCase() + lowercaseTitle.slice(1);
}

export const studiewijzerIcon = (type: HuiswerkType): IconName => {
    if (type === HuiswerkType.HUISWERK) {
        return 'huiswerk';
    } else if (type === HuiswerkType.TOETS) {
        return 'toets';
    } else if (type === HuiswerkType.GROTE_TOETS) {
        return 'toetsGroot';
    } else {
        return 'lesstof';
    }
};

export const sortLocale = <T>(toSort: T[], sorteringsVelden: string[], sortOrders: SorteerOrder[] = ['asc']): T[] =>
    sortLocaleNested(toSort, (value: T) => value, sorteringsVelden, sortOrders);
export const sortLocaleNested = <T, U>(
    toSort: T[],
    nestedProperty: (t: T) => U,
    sorteringsVelden: string[],
    sortOrders: SorteerOrder[] = ['asc']
): T[] => {
    const toSortSpreaded = toSort ? [...toSort] : [];
    return toSortSpreaded.sort((a, b) => {
        const nestedA = nestedProperty(a);
        const nestedB = nestedProperty(b);

        for (const [i, sortVeld] of sorteringsVelden.entries()) {
            let sortedValue = 0;

            const aValueToSort = get(nestedA, sortVeld);
            const bValueToSort = get(nestedB, sortVeld);

            if (typeof aValueToSort === 'string') {
                sortedValue = aValueToSort.toString().toLowerCase().localeCompare(bValueToSort.toString().toLowerCase());
            } else {
                if (aValueToSort > bValueToSort) sortedValue = 1;
                if (aValueToSort < bValueToSort) sortedValue = -1;
            }

            if (sortedValue !== 0) {
                const order = sortOrders[i] ? sortOrders[i] : 'asc';

                return order === 'desc' ? sortedValue * -1 : sortedValue;
            }
        }

        return 0;
    });
};

export function differentiatiegroepenBevatLeerling(differentiatiegroepen: Differentiatiegroep[], leerlingId: string) {
    return differentiatiegroepen.flatMap((groep) => groep.leerlingen).some(equalsId(leerlingId));
}

export function isPresent<T>(t: T | null | undefined): t is T {
    return t !== null && t !== undefined;
}

export const loadingState = (): LoadingState => ({ timeout: undefined, isLoading: false });

export const lesgroepIsOnderbouw = (lesgroep: Lesgroep) => lesgroep.heeftStamgroep && !lesgroep.examendossierOndersteund;
export const toId = (entity: { id: string }) => entity.id;
export const equalsId = curry((id: string, entity: Optional<{ id: Optional<string> }>) => id === entity?.id);
export const notEqualsId = (id: string) => negate(equalsId(id));
export const removeItem = curry((id: string, list: { id: string }[]) => list.filter((t) => t.id !== id));
export const removeItems = curry((ids: string[], list: { id: string }[]) => list.filter((t) => !ids.includes(t.id)));
export const addItem = curry(<T>(item: T, list: T[]) => [...list, item]);
export const addToFront = curry(<T>(item: Text, list: T[]) => [item, ...list]);
export const addItems = curry(<T>(items: T[], list: T[]) => [...list, ...items]);
export const isZelfdeDag = curry(isSameDay);
export const isGelijk = curry(isEqual);
export const matchtDag = (dag: Date) => matching({ dag: isZelfdeDag(dag) });
export const matchtAfspraak = (id: string) => matching({ afspraak: equalsId(id) });
export const copyObject = <T>(object: T) => ({ ...object });
export const callIfFunction = <T>(value: T | (() => T)) => (isFunction(value) ? value() : value);

export { formatNL, hhmmToDate, sortAfspraakByBegin };

export function safeParseJSON<T>(value: string | undefined | null) {
    if (!value) {
        return null;
    }

    let result: any;
    try {
        result = JSON.parse(value);
    } catch (e) {
        // Invalid JSON
    }
    return result as T;
}
