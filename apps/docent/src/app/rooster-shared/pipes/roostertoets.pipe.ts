import { Pipe, PipeTransform } from '@angular/core';
import { BaseAfspraakFragment, Maybe, Vak } from '@docent/codegen';

import { formatBeginEindTijd } from '../utils/date.utils';

export type RoosterToetsTooltipType = 'titelOmschrijving' | 'tijdLocatie';

const roosterToetsHeaderRegel = (vak?: Maybe<Vak>) =>
    `<span class="text-content-small-semi">Roostertoets${vak ? ' · ' + vak.naam : ''}</span><br>`;
const roosterToetsTijdLocatieRegel = (afspraak: BaseAfspraakFragment) =>
    `${formatBeginEindTijd(afspraak.begin, afspraak.eind)}${afspraak.locatie ? ', ' + afspraak.locatie : ''}<br>`;

export const roosterToetsTooltip = (afspraak: BaseAfspraakFragment) =>
    `${roosterToetsHeaderRegel(afspraak.vak)}
    ${roosterToetsTijdLocatieRegel(afspraak)}
    ${afspraak.titel}<br>
    ${afspraak.omschrijving ?? ''}`;

@Pipe({
    name: 'roosterToets',
    standalone: true
})
export class RoosterToetsPipe implements PipeTransform {
    transform(afspraak: BaseAfspraakFragment) {
        return afspraak?.isRoosterToets ? roosterToetsTooltip(afspraak) : '';
    }
}
