import {
    addDays,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    endOfDay,
    format,
    formatDistanceStrict,
    getDay,
    getISOWeek,
    getMonth,
    getYear,
    isSameDay,
    isSameYear,
    isWeekend as isWeekendDateFns,
    setDate,
    setDay,
    setHours,
    setISOWeek,
    setMinutes,
    setMonth,
    startOfDay,
    startOfISOWeek,
    startOfWeek,
    subYears
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { Toekenning, ToekenningFieldsFragment, WeekToekenning } from '../../../generated/_types';
import { Schooljaar } from '../../core/models/schooljaar.model';
import { DateFormat } from '../pipes/dt-date.pipe';
import { Optional, formatNL } from './utils';

export const ISO_8601_LOCAL_DATE_FORMAT = 'yyyy-MM-dd';
export const ISO_8601_LOCAL_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm";
export const timeInputRegEx = '^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$';

/**
 * Zet de opgegeven (UTC) Date om naar een datum-string in de lokale tijdzone van de gebruiker.
 *
 * @param utcDate een Date object (is altijd een UTC timestamp)
 * @return String met de lokale tijd, zonder timezone-offset
 */
export function convertToLocalDate(utcDate: Date) {
    return format(utcDate, ISO_8601_LOCAL_DATE_TIME_FORMAT);
}

export function getSchooljaar(peildatum: Date): Schooljaar {
    let start = startOfDay(new Date(getYear(peildatum), 7, 1));

    if (getMonth(peildatum) < 7) {
        start = subYears(start, 1);
    }

    return {
        start,
        eind: endOfDay(setDate(setMonth(addYears(start, 1), 6), 31))
    };
}

export const getSchooljaarStartEnEind = (startSchooljaar: number): Schooljaar => ({
    start: startOfDay(new Date(startSchooljaar, 7, 1)),
    eind: endOfDay(setDate(setMonth(addYears(startSchooljaar, 1), 6), 31))
});

export const getWerkdagenVanWeek = (peildatum: Date) => {
    const start = setDay(peildatum, 1, {
        weekStartsOn: 1
    });

    // zet tijd midden op de dag om te voorkomen dat 0 uur weer terugwrapped naar de vorige dag
    start.setHours(15, 0, 0, 0);
    const werkdagen = [start];
    for (let day = 1; day < 5; day++) {
        const volgendeWerkdag = addDays(start, day);
        werkdagen.push(volgendeWerkdag);
    }
    return werkdagen;
};

/***
 * @param dag De datum in yyyy-mm-dd formaat
 * De functie doet een replace op alle '-', om goed overweg te kunnen met safari
 */
export function parseYYYYMMDDToDate(dag: string): Date {
    return new Date(dag.replace(/-/g, '/'));
}

/**
 * Formatteert de opgegeven datum volgens de ISO-8601 standaard (zonder tijd) : yyyy-MM-DD
 */
export function formatAsISODate(date: Date) {
    return format(date, ISO_8601_LOCAL_DATE_FORMAT);
}

/**
 * Formatteert de opgegeven datum volgens de ISO-8601 standaard (met tijd) : yyyy-MM-DDTHH:mm
 */
export function formatAsISODateTime(date: Date) {
    return format(date, ISO_8601_LOCAL_DATE_TIME_FORMAT);
}

/**
 * geeft een nieuwe datum terug met de tijd van de oude datum
 * en de datum van de nieuweDatum. De oude datum wordt dus eigenlijk
 * voor/achteruit gezet naar de dag van de nieuwe datum.
 *
 * @param oudeDatum
 * @param nieuweDatum
 */
export const setToSameDay = (oudeDatum: Date, nieuweDatum: Date) => addDays(oudeDatum, differenceInCalendarDays(nieuweDatum, oudeDatum));
export const dagNamen = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
export const dagNamenKort = dagNamen.map((dag) => dag.substring(0, 2));
export const numberToDay = (number: number) => dagNamen[number - 1];

/**
 * Haal de uren van op van een HH:mm tijd formaat
 *
 * @param tijd
 */
export const getHours = (tijd: string) => tijd.trim().split(':')[0];
/**
 * Haal de minuten op van een HH:mm tijd formaat
 */
export const getMinutes = (tijd: string) => tijd.trim().split(':')[1];

export const getTime = (hours: string, minutes: string) => `${hours}:${minutes}`;

export const addVoorloopNul = (tijd: number) => (String(tijd).length === 1 ? `0${tijd}` : String(tijd));

/**
 * Maak een datum van een week, dag en tijd(HH:mm).
 */
export const toDate = (week: number, dag: number, tijd: string) => {
    const hours = getHours(tijd);
    const minutes = getMinutes(tijd);
    return setMinutes(setHours(addDays(startOfWeek(setISOWeek(new Date(), week)), dag), +hours), +minutes);
};

export const getStartconceptInleveropdracht = (toekenning: WeekToekenning): Date => {
    const opdracht = toekenning.studiewijzeritem.conceptInleveropdracht;
    return toDate(
        toekenning.startWeek,
        opdracht!.startDag,
        getTime(addVoorloopNul(opdracht!.startUur), addVoorloopNul(opdracht!.startMinuut))
    );
};

export const getEindconceptInleveropdracht = (toekenning: WeekToekenning): Date => {
    const opdracht = toekenning.studiewijzeritem.conceptInleveropdracht;
    return toDate(toekenning.eindWeek, opdracht!.eindDag, getTime(addVoorloopNul(opdracht!.eindUur), addVoorloopNul(opdracht!.eindMinuut)));
};

export const getVerschilTussenStartEnEindInleveropdracht = (toekenning: Toekenning | ToekenningFieldsFragment): string => {
    if (toekenning.studiewijzeritem.conceptInleveropdracht) {
        const start = getStartconceptInleveropdracht(<WeekToekenning>toekenning);
        const eind = getEindconceptInleveropdracht(<WeekToekenning>toekenning);
        return formatDistanceStrict(start, eind, { locale: nl });
    } else if (toekenning.studiewijzeritem.inleverperiode) {
        return formatDistanceStrict(toekenning.studiewijzeritem.inleverperiode.begin, toekenning.studiewijzeritem.inleverperiode.eind, {
            locale: nl
        });
    }
    return '';
};

export const getEersteVolledigeSchoolweek = (): number => {
    const beginVanSchooljaar = startOfISOWeek(getSchooljaar(new Date()).start);
    const eersteVolledigeWeek = getMonth(beginVanSchooljaar) === 7 ? beginVanSchooljaar : addWeeks(beginVanSchooljaar, 1);

    return getISOWeek(eersteVolledigeWeek);
};

export const vorigSchooljaar: number = getYear(getSchooljaar(new Date()).start) - 1;

export const dagenUrenMinutenTussenDatums = (startDatum: Date, eindDatum: Date): string => {
    let delta = Math.abs(startDatum.getTime() - eindDatum.getTime()) / 1000;

    // Dagen
    const dagen = Math.floor(delta / 86400);
    delta -= dagen * 86400;
    const dagenString = dagen > 0 ? `${dagen} ${dagen === 1 ? 'dag' : 'dagen'}` : null;

    // Uren
    const uren = Math.floor(delta / 3600) % 24;
    delta -= uren * 3600;
    const urenString = uren > 0 ? `${uren} uur` : null;

    // Minuten
    const minuten = Math.floor(delta / 60) % 60;
    delta -= minuten * 60;
    const minutenString = minuten > 0 ? `${minuten} ${minuten === 1 ? 'minuut' : 'minuten'}` : null;

    return [dagenString, urenString, minutenString].filter((value) => !!value).join(' ');
};

export const getVandaagOfMaandagInHetWeekend = (): Date => {
    const vandaag = new Date();
    return isWeekendDateFns(vandaag) ? startOfWeek(addWeeks(vandaag, 1), { weekStartsOn: 1 }) : vandaag;
};

export const formatDateNL = (date: Date, format: DateFormat) => {
    switch (format) {
        case 'tijd':
            return formatNL(date, 'HH:mm');
        case 'jaar':
            return formatNL(date, 'yyyy');
        case 'maand':
            return capitalize(formatNL(date, isSameYear(date, new Date()) ? 'MMMM' : 'MMMM, yyyy'));
        case 'week':
            return `Week ${formatNL(date, isSameYear(date, new Date()) ? 'w' : 'w, yyyy')}`;
        case 'dag_letter':
            return capitalize(formatNL(date, 'eeeee'));
        case 'dag_kort':
            return capitalize(formatNL(date, 'eeeeee'));
        case 'dag_nummer':
            return formatNL(date, 'd');
        case 'week_dag_tijd':
            return `Week ${formatNL(date, isSameYear(date, new Date()) ? 'w, EEEE, HH:mm' : 'w, yyyy, EEEE, HH:mm')}`;
        case 'dag_kort_dagnummer':
            return capitalize(formatNL(date, 'eeeeee d'));
        case 'dagnummer_maand_kort':
            return removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'd MMM' : 'd MMM, yyyy'));
        case 'dagnummer_maand_kort_zonder_jaar':
            return removePeriod(formatNL(date, 'd MMM'));
        case 'dag_kort_dagnummer_maand_kort': {
            if (isSameDay(date, new Date())) {
                return `Vandaag ${removePeriod(formatNL(date, 'd MMM'))}`;
            }
            return capitalize(removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'eeeeee d MMM' : 'eeeeee d MMM, yyyy')));
        }
        case 'dag_kort_dagnummer_maand_kort_lowercase': {
            if (isSameDay(date, new Date())) {
                return `vandaag ${removePeriod(formatNL(date, 'd MMM'))}`;
            }
            return removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'eeeeee d MMM' : 'eeeeee d MMM, yyyy'));
        }
        case 'dag_uitgeschreven_dagnummer_maand': {
            if (isSameDay(date, new Date())) {
                return `Vandaag ${formatNL(date, 'd MMMM')}`;
            }
            return capitalize(formatNL(date, isSameYear(date, new Date()) ? 'EEEE d MMMM' : 'EEEE d MMMM, yyyy'));
        }
        case 'dag_uitgeschreven_dagnummer_maand_kort': {
            if (isSameDay(date, new Date())) {
                return `Vandaag ${removePeriod(formatNL(date, 'd MMM'))}`;
            }
            return capitalize(removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'EEEE d MMM' : 'EEEE d MMM, yyyy')));
        }
        case 'dag_kort_dagnummer_maand_kort_tijd': {
            if (isSameDay(date, new Date())) {
                return `Vandaag ${removePeriod(formatNL(date, 'd MMM, HH:mm'))}`;
            }
            return capitalize(
                removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'eeeeee d MMM, HH:mm' : 'eeeeee d MMM, yyyy, HH:mm'))
            );
        }
        case 'dag_kort_dagnummer_maand_kort_tijd_lowercase': {
            if (isSameDay(date, new Date())) {
                return `vandaag ${removePeriod(formatNL(date, 'd MMM, HH:mm'))}`;
            }
            return removePeriod(formatNL(date, isSameYear(date, new Date()) ? 'eeeeee d MMM, HH:mm' : 'eeeeee d MMM, yyyy, HH:mm'));
        }
        case 'maand_jaar': {
            return capitalize(removePeriod(formatNL(date, 'MMMM yyyy')));
        }
        default:
            return 'Onbekend format';
    }
};

export const formatBeginEindTijd = (begin: Date, eind?: Optional<Date>) => {
    let tijdsindicatie = formatDateNL(begin, 'tijd');
    if (eind) {
        tijdsindicatie += ` - ${formatDateNL(eind, 'tijd')}`;
    }
    return tijdsindicatie;
};

export const isWeekend = (date: Date) => {
    const dayOfWeek = getDay(date);
    return dayOfWeek === 0 || dayOfWeek === 6;
};

export const capitalize = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1);
export const removePeriod = (string: string): string => string.replace('.', '');
