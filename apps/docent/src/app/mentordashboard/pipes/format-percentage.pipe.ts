import { Pipe, PipeTransform } from '@angular/core';
import { PeriodeRegistratieDetails } from '@docent/codegen';
import { formatPercentage } from '../mentordashboard.utils';

@Pipe({
    name: 'formatPercentageRegistraties',
    standalone: true
})
export class FormatPercentageRegistratiesPipe implements PipeTransform {
    transform(registraties: Pick<PeriodeRegistratieDetails, 'aantalLesRegistraties' | 'aantalLessen'>): number {
        return formatPercentage(registraties.aantalLesRegistraties, registraties.aantalLessen);
    }
}
