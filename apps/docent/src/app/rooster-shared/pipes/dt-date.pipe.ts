import { Pipe, PipeTransform } from '@angular/core';
import { formatDateNL } from '../utils/date.utils';
import { Optional } from '../utils/utils';

export type DateFormat =
    /** voorbeeld: '19:00' */
    | 'tijd'

    /** voorbeeld: '2023' */
    | 'jaar'

    /** voorbeeld: 'Week 21' / 'Week 21, 2023' */
    | 'week'

    /** voorbeeld: '14' */
    | 'dag_nummer'

    /** voorbeeld: 'Februari' */
    | 'maand'

    /** voorbeeld: 'W' */
    | 'dag_letter'

    /** voorbeeld: 'Wo' */
    | 'dag_kort'

    /** voorbeeld: 'Week 21, maandag, 09:00' / 'Week 21, 2023, maandag, 09:00' */
    | 'week_dag_tijd'

    /** voorbeeld: 'Wo 19 */
    | 'dag_kort_dagnummer'

    /** voorbeeld: '19 aug' / '19 aug, 2023 */
    | 'dagnummer_maand_kort'

    /** voorbeeld: '19 aug' */
    | 'dagnummer_maand_kort_zonder_jaar'

    /** voorbeeld: 'Wo 19 aug' / 'Wo 19 aug, 2023' / 'Vandaag 19 aug' */
    | 'dag_kort_dagnummer_maand_kort'

    /** voorbeeld: 'wo 19 aug' / 'wo 19 aug, 2023' / 'vandaag 19 aug' */
    | 'dag_kort_dagnummer_maand_kort_lowercase'

    /** voorbeeld: 'Woensdag 19 augustus' / 'Woensdag 19 augustus, 2023' / 'Vandaag 19 augustus' */
    | 'dag_uitgeschreven_dagnummer_maand'

    /** voorbeeld: 'Woensdag 19 aug' / 'Woensdag 19 aug, 2023' / 'Vandaag 19 aug' */
    | 'dag_uitgeschreven_dagnummer_maand_kort'

    /** voorbeeld: 'Wo 19 aug, 19:00' / 'Wo 19 aug, 2023, 19:00' / 'Vandaag 19 aug, 19:00' */
    | 'dag_kort_dagnummer_maand_kort_tijd'

    /** voorbeeld: 'wo 19 aug, 19:00' / 'wo 19 aug, 2023, 19:00' / vandaag 19 aug, 19:00' */
    | 'dag_kort_dagnummer_maand_kort_tijd_lowercase';

@Pipe({ name: 'dtDate', standalone: true })
export class DtDatePipe implements PipeTransform {
    transform(date: Optional<Date>, _format: DateFormat) {
        return date ? formatDateNL(date, _format) : '';
    }
}
