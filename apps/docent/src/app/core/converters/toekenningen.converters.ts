import omit from 'lodash-es/omit';
import {
    AfspraakToekenning,
    AfspraakToekenningInput,
    BijlageFieldsFragment,
    ConceptInleveropdracht,
    DagToekenning,
    DagToekenningInput,
    Inleverperiode,
    InleverperiodeInput,
    SaveStudiewijzeritemInput,
    Studiewijzeritem,
    Toekenning,
    ToekenningSortering,
    WeekToekenning,
    WeekToekenningInput
} from '../../../generated/_types';
import { convertToLocalDate } from '../../rooster-shared/utils/date.utils';
import { MAX_INT_VALUE, Optional, toId } from '../../rooster-shared/utils/utils';
import { Interval } from '../models/studiewijzers/shared.model';
import { InleverperiodeWijziging } from '../models/studiewijzers/studiewijzer.model';

export const convertToInleverperiodeInput = (
    inleverperiode: Inleverperiode,
    nieuweInleverperiodeTijden?: Optional<Interval>
): InleverperiodeInput => {
    const inleverperiodeInput: InleverperiodeInput = {
        ...omit(inleverperiode, '__typename', 'inleveringenAantal', 'inleveringenVerwacht'),
        begin: convertToLocalDate(inleverperiode.begin) as any,
        eind: convertToLocalDate(inleverperiode.eind) as any
    } as InleverperiodeInput;

    if (nieuweInleverperiodeTijden) {
        inleverperiodeInput.begin = convertToLocalDate(nieuweInleverperiodeTijden.start) as any;
        inleverperiodeInput.eind = convertToLocalDate(nieuweInleverperiodeTijden.eind) as any;
    }

    return inleverperiodeInput;
};

/**
 * Geeft een ConceptInleveropdrachtInput terug, maar deze is identiek aan het normale object, dus hier hebben we geen aparte interface voor.
 */
export const convertToConceptInleveropdrachtInput = (concept: ConceptInleveropdracht): ConceptInleveropdracht => ({
    ...omit(concept, '__typename')
});

export const convertToStudiewijzerItemInput = (
    studiewijzeritem: Studiewijzeritem,
    nieuweInleverperiodeTijden?: Optional<Interval>
): SaveStudiewijzeritemInput =>
    ({
        ...omit(studiewijzeritem, '__typename', 'icon', 'isNieuw', 'projectgroepen'),
        bijlagen: studiewijzeritem.bijlagen.map((bijlage) =>
            omit(bijlage, '__typename', 'extensie', 'synchroniseertMet', 'differentiatiegroepen', 'differentiatieleerlingen')
        ),
        inleverperiode: studiewijzeritem.inleverperiode
            ? convertToInleverperiodeInput(studiewijzeritem.inleverperiode, nieuweInleverperiodeTijden)
            : undefined,
        conceptInleveropdracht: studiewijzeritem.conceptInleveropdracht
            ? convertToConceptInleveropdrachtInput(studiewijzeritem.conceptInleveropdracht)
            : undefined
    }) as SaveStudiewijzeritemInput;

export const convertToToekenningInput = (toekenning: Toekenning, studiewijzerId: string, nieuweInleverperiodeTijden?: Interval) => ({
    id: toekenning.id,
    studiewijzeritem: convertToStudiewijzerItemInput(toekenning.studiewijzeritem, nieuweInleverperiodeTijden),
    studiewijzerId,
    isStartInleverperiode: toekenning.isStartInleverperiode
});

export const convertToAfspraakToekenningInput = (
    afspraakToekenning: AfspraakToekenning,
    studiewijzerId?: Optional<string>,
    destinationDate?: Optional<Date>,
    nieuweInleverperiodeTijden?: Optional<Interval>,
    toekenningenSortering?: Optional<ToekenningSortering[]>
): AfspraakToekenningInput => ({
    id: afspraakToekenning.id,
    studiewijzeritem: convertToStudiewijzerItemInput(afspraakToekenning.studiewijzeritem, nieuweInleverperiodeTijden),
    afgerondOpDatumTijd: destinationDate
        ? (convertToLocalDate(destinationDate) as any)
        : (convertToLocalDate(afspraakToekenning.afgerondOpDatumTijd) as any),
    aangemaaktOpDatumTijd: afspraakToekenning.aangemaaktOpDatumTijd
        ? (convertToLocalDate(afspraakToekenning.aangemaaktOpDatumTijd) as any)
        : (convertToLocalDate(new Date()) as any),
    studiewijzerId,
    lesgroep: afspraakToekenning.lesgroep
        ? {
              id: afspraakToekenning.lesgroep.id,
              UUID: afspraakToekenning.lesgroep.UUID,
              naam: afspraakToekenning.lesgroep.naam
          }
        : (null as any),
    sortering: Math.min(afspraakToekenning.sortering, MAX_INT_VALUE),
    toekenningenSortering,
    synchroniseertMet: afspraakToekenning.synchroniseertMet,
    differentiatiegroepen: afspraakToekenning.lesgroep ? afspraakToekenning.differentiatiegroepen.map(toId) : [],
    differentiatieleerlingen: afspraakToekenning.lesgroep ? afspraakToekenning.differentiatieleerlingen.map(toId) : []
});

export const convertToDagToekenningInput = (
    dagtoekenning: DagToekenning,
    studiewijzerId?: string,
    destinationDate?: Optional<Date>,
    nieuweInleverperiodeTijden?: Optional<Interval>,
    toekenningenSortering?: Optional<ToekenningSortering[]>
): DagToekenningInput => ({
    id: dagtoekenning.id,
    studiewijzeritem: convertToStudiewijzerItemInput(dagtoekenning.studiewijzeritem, nieuweInleverperiodeTijden),
    datum: destinationDate ? (convertToLocalDate(destinationDate) as any) : (convertToLocalDate(dagtoekenning.datum) as any),
    studiewijzerId,
    lesgroep: dagtoekenning.lesgroep
        ? {
              id: dagtoekenning.lesgroep.id,
              UUID: dagtoekenning.lesgroep.UUID,
              naam: dagtoekenning.lesgroep.naam
          }
        : (null as any),
    sortering: Math.min(dagtoekenning.sortering, MAX_INT_VALUE),
    toekenningenSortering,
    synchroniseertMet: dagtoekenning.synchroniseertMet,
    differentiatiegroepen: dagtoekenning.lesgroep ? dagtoekenning.differentiatiegroepen.map(toId) : [],
    differentiatieleerlingen: dagtoekenning.lesgroep ? dagtoekenning.differentiatieleerlingen.map(toId) : []
});

export const convertToWeekToekenningInput = (
    weektoekenning: WeekToekenning,
    studiewijzerId?: Optional<string>,
    destinationWeek?: Optional<number>,
    toekenningenSortering?: Optional<ToekenningSortering[]>
): WeekToekenningInput => {
    const input = {
        id: weektoekenning.id,
        studiewijzeritem: convertToStudiewijzerItemInput(weektoekenning.studiewijzeritem),
        startWeek: destinationWeek ? destinationWeek : weektoekenning.startWeek,
        eindWeek: destinationWeek ? destinationWeek : weektoekenning.eindWeek,
        studiewijzerId,
        lesgroep: weektoekenning.lesgroep
            ? {
                  id: weektoekenning.lesgroep.id,
                  UUID: weektoekenning.lesgroep.UUID,
                  naam: weektoekenning.lesgroep.naam
              }
            : null,
        sortering: Math.min(weektoekenning.sortering, MAX_INT_VALUE),
        toekenningenSortering,
        synchroniseertMet: weektoekenning.synchroniseertMet,
        differentiatiegroepen: weektoekenning.lesgroep ? weektoekenning.differentiatiegroepen.map(toId) : [],
        differentiatieleerlingen: weektoekenning.lesgroep ? weektoekenning.differentiatieleerlingen.map(toId) : []
    };
    if (weektoekenning.studiewijzeritem.conceptInleveropdracht) {
        input.startWeek = weektoekenning.isStartInleverperiode && destinationWeek ? destinationWeek : weektoekenning.startWeek;
        input.eindWeek = !weektoekenning.isStartInleverperiode && destinationWeek ? destinationWeek : weektoekenning.eindWeek;
    }
    return input;
};

const createToekenningOptimisticResponse = (
    toekenning: any,
    sortering: Optional<number>,
    inleverperiodeWijziging?: Optional<InleverperiodeWijziging>
) => {
    const optimisticResponse = {
        ...toekenning,
        studiewijzeritem: {
            ...toekenning.studiewijzeritem,
            __typename: 'Studiewijzeritem',
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
        },
        lesgroep: null as any
    };

    const inleveropdracht =
        optimisticResponse.studiewijzeritem.inleverperiode || optimisticResponse.studiewijzeritem.conceptInleveropdracht;
    if (inleveropdracht) {
        optimisticResponse.sortering = -1;
        if (optimisticResponse.isStartInleverperiode) {
            inleveropdracht.startSortering = sortering;
        } else {
            inleveropdracht.eindSortering = sortering;
        }
    } else {
        optimisticResponse.sortering = sortering;
    }

    // typename op bijlages zetten
    optimisticResponse.studiewijzeritem.bijlagen = optimisticResponse.studiewijzeritem.bijlagen.map((bijlage: BijlageFieldsFragment) => ({
        __typename: 'Bijlage',
        ...bijlage
    }));

    // typename op inleverperiodes zetten
    if (toekenning.studiewijzeritem.inleverperiode) {
        optimisticResponse.studiewijzeritem.inleverperiode = {
            __typename: 'Inleverperiode',
            ...toekenning.studiewijzeritem.inleverperiode
        };

        if (inleverperiodeWijziging) {
            optimisticResponse.studiewijzeritem.inleverperiode.begin = inleverperiodeWijziging.nieuweDatums.start;
            optimisticResponse.studiewijzeritem.inleverperiode.eind = inleverperiodeWijziging.nieuweDatums.eind;
        }
    }
    return optimisticResponse;
};

export const createAfspraakToekenningOptimisticResponse = (
    toekenning: any,
    destinationDate: Optional<Date>,
    sortering: Optional<number>
) => {
    // we strippen alle niet afspraaktoekennig specifieke velden
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { datum, startWeek, eindWeek, lesgroep, ...baseToekenning } = toekenning;
    baseToekenning.aangemaaktOpDatumTijd = new Date();
    baseToekenning.afgerondOpDatumTijd = destinationDate;
    return createToekenningOptimisticResponse(baseToekenning, sortering);
};

export const createDagToekenningOptimisticResponse = (
    toekenning: any,
    destionationDate: Optional<Date>,
    sortering: Optional<number>,
    inleverperiodeWijziging?: Optional<InleverperiodeWijziging>
) => {
    // we strippen alle niet dagtoekenning specifieke velden
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { afgerondOpDatumTijd, aangemaaktOpDatumTijd, startWeek, eindWeek, lesgroep, ...baseToekenning } = toekenning;
    baseToekenning.datum = destionationDate;
    return createToekenningOptimisticResponse(baseToekenning, sortering, inleverperiodeWijziging);
};

export const createWeekToekenningOptimisticResponse = (toekenning: any, destinationWeek: Optional<number>, sortering: Optional<number>) => {
    // we strippen alle niet weektoekennig specifieke velden
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { afgerondOpDatumTijd, aangemaaktOpDatumTijd, datum, lesgroep, ...baseToekenning } = toekenning;
    baseToekenning.startWeek = destinationWeek ?? toekenning.startWeek;
    baseToekenning.eindWeek = destinationWeek ?? toekenning.eindWeek;
    return createToekenningOptimisticResponse(baseToekenning, sortering);
};
