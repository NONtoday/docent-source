import {
    AfspraakToekenning,
    ConceptInleveropdracht,
    DagToekenning,
    HuiswerkType,
    Inleverperiode,
    InleverperiodeSorteringType,
    Studiewijzeritem,
    Toekenning,
    ToekenningFieldsFragment,
    ToekenningSortering,
    WeekToekenning
} from '@docent/codegen';
import { setHours, setMinutes, startOfDay } from 'date-fns';
import { DragDropData } from '../../core/models/studiewijzers/studiewijzer.model';
import { HuiswerkTypeIconPipe } from '../../rooster-shared/pipes/huiswerk-type-icon.pipe';
import { MAX_INT_VALUE, Optional } from '../../rooster-shared/utils/utils';
import { moveItemInArray } from './array.utils';

export const PLACEHOLDER_SORTERING = -1;

export function getToekenningDatum(toekenning: Toekenning | ToekenningFieldsFragment): Date | undefined {
    let datum;
    if (isAfspraakToekenning(toekenning)) {
        datum = toekenning.afgerondOpDatumTijd;
    } else if (isDagToekenning(toekenning)) {
        datum = toekenning.datum;
    }
    return datum;
}

export function isToekenning(toekenning: any): toekenning is Toekenning {
    return 'studiewijzeritem' in toekenning;
}

export function isWeekToekenning(toekenning: Toekenning): toekenning is WeekToekenning {
    return 'startWeek' in toekenning;
}

export function isDagToekenning(toekenning: Toekenning | ToekenningFieldsFragment): toekenning is DagToekenning {
    return 'datum' in toekenning;
}

export function isAfspraakToekenning(toekenning: Toekenning | ToekenningFieldsFragment): toekenning is AfspraakToekenning {
    return 'afgerondOpDatumTijd' in toekenning;
}

export function updateSortering<T extends Toekenning>(toekenning: T, index: number) {
    const tCopy = {
        ...toekenning,
        studiewijzeritem: {
            ...toekenning.studiewijzeritem,
            inleverperiode: toekenning.studiewijzeritem.inleverperiode
                ? {
                      ...toekenning.studiewijzeritem.inleverperiode
                  }
                : null,
            conceptInleveropdracht: toekenning.studiewijzeritem.conceptInleveropdracht
                ? {
                      ...toekenning.studiewijzeritem.conceptInleveropdracht
                  }
                : null
        }
    } as Toekenning;

    const inleveropdracht = tCopy.studiewijzeritem.inleverperiode ?? tCopy.studiewijzeritem.conceptInleveropdracht;
    if (inleveropdracht) {
        tCopy.sortering = PLACEHOLDER_SORTERING;
        if (tCopy.isStartInleverperiode) {
            inleveropdracht.startSortering = index;
        } else {
            inleveropdracht.eindSortering = index;
        }
    } else {
        tCopy.sortering = index;
    }
    return tCopy;
}

// Functie voor optimistich setten van de sortering.
// Benodigd om de UI niet te laten knipperen na het updaten van de lijst voordat de cache is aangepast,
// aangezien de sortering van de toekenningen in de HTML wordt toegepast.
export function getOptimisticSortering<T extends Toekenning>(toekenningen: T[], previousIndex: number, currentIndex: number): Toekenning[] {
    const result = moveItemInArray(previousIndex, currentIndex, toekenningen);
    const sortedResult = result.map(updateSortering);
    return sortedResult;
}

export function mapToToekenningenSortering(toekenningen: Toekenning[]): ToekenningSortering[] {
    return toekenningen.map(mapToToekenningSortering);
}

// Functie voor het mappen naar het sorteringsformaat, waarbij de verplaatste toekenning en plek krijgt
// in de sortering van de dag/week/afspraak waar de deze naar toe gaat.
export function mapToToekenningenSorteringVerplaatsing(
    dragDropData: DragDropData,
    huidigeToekenningen: Toekenning[]
): ToekenningSortering[] {
    const result = mapToToekenningenSortering(huidigeToekenningen);

    result.splice(dragDropData.toekenningIndex ?? 0, 0, mapToToekenningSortering(dragDropData.toekenning));
    const inleveropdrachtWijziging = dragDropData.inleverperiodeWijziging
        ? dragDropData.inleverperiodeWijziging
        : dragDropData.conceptInleveropdrachtWijziging;

    if (inleveropdrachtWijziging) {
        if (dragDropData.toekenning.isStartInleverperiode && inleveropdrachtWijziging.deadlineVerplaatst) {
            const inleverVerplaatsing = mapToToekenningSortering(dragDropData.toekenning);
            inleverVerplaatsing.type = InleverperiodeSorteringType.EIND;
            result.splice((dragDropData.toekenningIndex ?? 0) + 1, 0, inleverVerplaatsing);
        } else if (!dragDropData.toekenning.isStartInleverperiode && inleveropdrachtWijziging.startVerplaatst) {
            const inleverVerplaatsing = mapToToekenningSortering(dragDropData.toekenning);
            inleverVerplaatsing.type = InleverperiodeSorteringType.START;
            result.splice((dragDropData.toekenningIndex ?? 0) + 1, 0, inleverVerplaatsing);
        }
    }

    return result;
}

function mapToToekenningSortering(toekenning: Toekenning): ToekenningSortering {
    const result: ToekenningSortering = {
        id: toekenning.id,
        type: null
    };

    if (toekenning.studiewijzeritem.inleverperiode || toekenning.studiewijzeritem.conceptInleveropdracht) {
        result.type = toekenning.isStartInleverperiode ? InleverperiodeSorteringType.START : InleverperiodeSorteringType.EIND;
    }

    return result;
}

export function getHoogsteToekenningSortering(toekenningen: Toekenning[]): number {
    const toekenningenSortering: number[] = toekenningen.map((t) => {
        if (t.studiewijzeritem.inleverperiode) {
            return t.isStartInleverperiode
                ? t.studiewijzeritem.inleverperiode.startSortering
                : t.studiewijzeritem.inleverperiode.eindSortering;
        }

        if (t.studiewijzeritem.conceptInleveropdracht) {
            return t.isStartInleverperiode
                ? t.studiewijzeritem.conceptInleveropdracht.startSortering!
                : t.studiewijzeritem.conceptInleveropdracht.eindSortering!;
        }

        return t.sortering;
    });

    return toekenningenSortering.length > 0 ? Math.max(...toekenningenSortering) + 1 : 0;
}

/**
 *
 *
 * Gaat door de lijst van toekenningen en voegt de isStartInleverperiode property (false) toe bij inleveropdrachten
 *
 *
 *
 * @param toekenning
 */
export const addIsStartInleverperiodeFalse = (toekenning: Toekenning) => ({
    ...toekenning,
    isStartInleverperiode: false
});

export const addIsNieuw = (toekenning: Toekenning) => ({
    ...toekenning,
    studiewijzeritem: {
        ...toekenning.studiewijzeritem,
        isNieuw: true
    }
});

/**
 *
 *
 * Gaat door de lijst van toekenningen en maakt voor elk inleveropdracht een bijhorende start toekenning aan
 *
 *
 *
 * @param toekenningen
 */
export const createBijhorendeStartInleveropdrachtToekenningen = (toekenningen: (Toekenning | ToekenningFieldsFragment)[]) =>
    toekenningen
        .filter((toekenning) => toekenning.studiewijzeritem.inleverperiode)
        .map((toekenning) => ({
            ...toekenning,
            isStartInleverperiode: true
        })) as DagToekenning[];

export const createWeekToekenning = (weeknummer: number, hoogsteSortering: number, type: HuiswerkType): WeekToekenning =>
    ({
        id: undefined,
        lesgroep: undefined,
        startWeek: weeknummer,
        eindWeek: weeknummer,
        studiewijzeritem: createStudiewijzeritem(type),
        sortering: hoogsteSortering,
        differentiatiegroepen: [],
        differentiatieleerlingen: []
    }) as any as WeekToekenning;

export const createDagToekenning = (date: Date, hoogsteSortering: number, type: HuiswerkType): DagToekenning =>
    ({
        id: undefined,
        lesgroep: undefined,
        datum: date,
        studiewijzeritem: createStudiewijzeritem(type),
        sortering: hoogsteSortering,
        differentiatiegroepen: [],
        differentiatieleerlingen: []
    }) as any as DagToekenning;

export const createAfspraakToekenning = (date: Date, hoogsteSortering: number, type: HuiswerkType): AfspraakToekenning =>
    ({
        id: undefined,
        lesgroep: undefined,
        afgerondOpDatumTijd: date,
        aangemaaktOpDatumTijd: undefined,
        studiewijzeritem: createStudiewijzeritem(type),
        sortering: hoogsteSortering,
        differentiatiegroepen: [],
        differentiatieleerlingen: []
    }) as any as AfspraakToekenning;

export const createStudiewijzeritem = (type: HuiswerkType): Studiewijzeritem =>
    ({
        id: undefined,
        huiswerkType: type,
        onderwerp: undefined,
        omschrijving: undefined,
        leerdoelen: undefined,
        zichtbaarVoorLeerling: true,
        notitie: undefined,
        notitieZichtbaarVoorLeerling: false,
        bijlagen: [],
        icon: type ? new HuiswerkTypeIconPipe().transform(type) : undefined,
        projectgroepen: []
    }) as any as Studiewijzeritem;

export const createInleveropdrachtToekenning = (date: Date, hoogsteSortering: number): Toekenning => {
    const datum = startOfDay(date);
    const startInleverperiode = setMinutes(setHours(datum, 9), 0);
    const eindInleverperiode = setMinutes(setHours(datum, 23), 0);

    return {
        ...createDagToekenning(date, PLACEHOLDER_SORTERING, HuiswerkType.HUISWERK),
        studiewijzeritem: {
            ...createStudiewijzeritem(HuiswerkType.HUISWERK),
            inleverperiode: {
                id: undefined,
                begin: startInleverperiode,
                eind: eindInleverperiode,
                omschrijving: null,
                plagiaatDetectie: false,
                stuurBerichtBijInlevering: false,
                inleveringenAantal: 0,
                inleveringenVerwacht: 0,
                herinnering: 0,
                startSortering: Math.min(Math.max(hoogsteSortering, 0), MAX_INT_VALUE),
                eindSortering: Math.min(Math.max(hoogsteSortering + 1, 1), MAX_INT_VALUE)
            } as any as Inleverperiode,
            projectgroepen: []
        }
    };
};

export const createConceptInleveropdrachtToekenning = (weeknummer: number, hoogsteSortering: number): Toekenning => ({
    ...createWeekToekenning(weeknummer, PLACEHOLDER_SORTERING, HuiswerkType.HUISWERK),
    studiewijzeritem: {
        ...createStudiewijzeritem(HuiswerkType.HUISWERK),
        conceptInleveropdracht: {
            id: undefined,
            startDag: 1,
            startUur: 9,
            startMinuut: 0,
            eindDag: 5,
            eindUur: 23,
            eindMinuut: 0,
            plagiaatDetectie: false,
            stuurBerichtBijInlevering: false,
            herinnering: 0,
            startSortering: Math.min(hoogsteSortering, MAX_INT_VALUE),
            eindSortering: Math.min(hoogsteSortering + 1, MAX_INT_VALUE)
        } as any as ConceptInleveropdracht
    }
});

export const mapLeerdoelenNaarBulletList = (leerdoelen: Optional<Optional<string>[]>, leerdoelenHeader?: Optional<string>) => {
    const filteredLeerdoelen = leerdoelen?.filter(Boolean) ?? [];
    if (filteredLeerdoelen.length === 0) {
        return '';
    }

    let omschrijving = `<p>`;
    if (leerdoelenHeader && leerdoelenHeader.trim().length > 0) {
        omschrijving += `<b>${leerdoelenHeader}:</b>`;
    }
    omschrijving += `<ul>`;
    filteredLeerdoelen
        .filter(Boolean)
        .map((leerdoel) => `<li>${leerdoel}</li>`)
        .forEach((leerdoel) => (omschrijving += leerdoel));
    omschrijving += '</ul></p>';
    return omschrijving;
};

export const copyToekenning = (toekenning: Toekenning): Toekenning =>
    ({
        ...toekenning,
        id: undefined,
        synchroniseertMet: undefined,
        studiewijzeritem: {
            ...toekenning.studiewijzeritem,
            id: undefined,
            onderwerp: `(Kopie) ${toekenning.studiewijzeritem.onderwerp}`,
            inleverperiode: toekenning.studiewijzeritem.inleverperiode
                ? {
                      ...toekenning.studiewijzeritem.inleverperiode,
                      id: undefined
                  }
                : undefined
        },
        differentiatiegroepen: [],
        differentiatieleerlingen: []
    }) as any as Toekenning;
