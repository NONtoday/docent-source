import { Pipe, PipeTransform } from '@angular/core';
import { SjabloonViewQuery, SjabloonWeek } from '../../../generated/_types';
import { getEersteVolledigeSchoolweek } from '../../rooster-shared/utils/date.utils';

@Pipe({
    name: 'sjabloonGekoppeldWeeknummer',
    standalone: true
})
export class SjabloonGekoppeldWeeknummerPipe implements PipeTransform {
    transform(sjabloon: SjabloonWeek | SjabloonViewQuery['sjabloonView']['weken'][number], syncedSchooljaar: number): string {
        const isEersteWeek = sjabloon.weeknummer === 1;
        const eersteWeekLigtInTweedeJaardeel =
            sjabloon.gekoppeldWeeknummer && sjabloon.gekoppeldWeeknummer < getEersteVolledigeSchoolweek();
        const isEersteWeekNieuweJaar = sjabloon.gekoppeldWeeknummer === 1;

        if (isEersteWeek && !eersteWeekLigtInTweedeJaardeel) {
            return `Week ${sjabloon.gekoppeldWeeknummer}, ${syncedSchooljaar}`;
        } else if (isEersteWeekNieuweJaar || (isEersteWeek && eersteWeekLigtInTweedeJaardeel)) {
            return `Week ${sjabloon.gekoppeldWeeknummer}, ${syncedSchooljaar + 1}`;
        }

        return `Week ${sjabloon.gekoppeldWeeknummer}`;
    }
}
