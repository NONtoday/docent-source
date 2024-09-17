import { Differentiatiegroep, Leerling } from '@docent/codegen';
import { toCssVar } from 'harmony';
import { memoize } from 'lodash-es';
import { getVolledigeNaam } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { differentiatieKleurConverter } from '../../rooster-shared/utils/color-token-utils';

export const groepTooltip = memoize(
    (groep: Differentiatiegroep) =>
        `<div style="height: 12px; width: 12px; border-radius: 50%;
            background-color: ${toCssVar(differentiatieKleurConverter[groep.kleur].counter)}; display: inline-block; margin-right: 8px"></div>
        <span>${groep.naam}</span> <br>
        <span>${groep.leerlingen?.map(getVolledigeNaam).join(', ')}</span`
);

export const leerlingenTooltip = memoize(
    (leerlingen: Leerling[]) =>
        `<div style="height: 12px; width: 12px; border-radius: 50%;
            background-color: var(--bg-neutral-weak); display: inline-block; margin-right: 8px"></div>
        <span>${leerlingen?.map(getVolledigeNaam).join(', ')}</span`
);
