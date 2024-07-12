import { memoize } from 'lodash-es';
import { Differentiatiegroep, Leerling } from '../../../generated/_types';
import { background_1, differentieKleurConverter } from '../../rooster-shared/colors';
import { getVolledigeNaam } from '../../rooster-shared/pipes/volledige-naam.pipe';

export const groepTooltip = memoize(
    (groep: Differentiatiegroep) =>
        `<div style="height: 12px; width: 12px; border-radius: 50%;
            background-color: ${differentieKleurConverter[groep.kleur].counter}; display: inline-block; margin-right: 8px"></div>
        <span>${groep.naam}</span> <br>
        <span>${groep.leerlingen?.map(getVolledigeNaam).join(', ')}</span`
);

export const leerlingenTooltip = memoize(
    (leerlingen: Leerling[]) =>
        `<div style="height: 12px; width: 12px; border-radius: 50%;
            background-color: ${background_1}; display: inline-block; margin-right: 8px"></div>
        <span>${leerlingen?.map(getVolledigeNaam).join(', ')}</span`
);
