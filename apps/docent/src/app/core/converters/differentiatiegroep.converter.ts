import { curry } from 'lodash-es';
import { Differentiatiegroep, DifferentiatiegroepInput } from '../../../generated/_types';
import { toId } from '../../rooster-shared/utils/utils';

export const toDifferentiatiegroepInput = curry(
    (lesgroepId: string, groep: Differentiatiegroep): DifferentiatiegroepInput => ({
        id: groep.id,
        lesgroepId,
        naam: groep.naam,
        kleur: groep.kleur,
        leerlingen: groep.leerlingen?.map(toId) ?? []
    })
);
