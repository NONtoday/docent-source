import { Pipe, PipeTransform } from '@angular/core';

import { Afspraak, AfspraakToekenning, Toekenning, WeekToekenning } from '../../../generated/_types';
import { isDagToekenning } from '../../shared/utils/toekenning.utils';
import { formatDateNL } from '../utils/date.utils';
import { DropDownOption } from '../utils/dropdown.util';
import { Optional } from '../utils/utils';

type StartOfEind = 'start' | 'eind';

@Pipe({
    name: 'toekenningDatum',
    standalone: true
})
export class ToekenningDatumPipe implements PipeTransform {
    transform(
        toekenning: Toekenning,
        afspraak?: Optional<Afspraak>,
        conceptOpdrachtWeken?: Optional<DropDownOption<number>[]>,
        startOfEind: StartOfEind = 'start'
    ) {
        const startWeek = (<WeekToekenning>toekenning).startWeek;
        if (startWeek) {
            const week = startOfEind === 'start' ? startWeek : (<WeekToekenning>toekenning).eindWeek;
            return conceptOpdrachtWeken?.find((optie) => optie.value === week)?.text ?? `Week ${week}`;
        } else if (isDagToekenning(toekenning)) {
            return formatDateNL(toekenning.datum, 'dag_kort_dagnummer_maand_kort');
        } else {
            if (afspraak) {
                return formatDateNL(afspraak.begin, 'dag_kort_dagnummer_maand_kort');
            } else {
                return formatDateNL((<AfspraakToekenning>toekenning).afgerondOpDatumTijd, 'dag_kort_dagnummer_maand_kort');
            }
        }
    }
}
