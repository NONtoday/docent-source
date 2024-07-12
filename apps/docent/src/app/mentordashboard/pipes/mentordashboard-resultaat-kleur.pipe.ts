import { Pipe, PipeTransform } from '@angular/core';
import { ColorToken } from 'harmony';
import { MentordashboardResultatenInstellingen } from '../../../generated/_types';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'mentordashboardResultaatKleur',
    standalone: true
})
export class MentordashboardResultaatKleurPipe implements PipeTransform {
    transform(formattedResultaat: Optional<string>, instellingen: MentordashboardResultatenInstellingen): ColorToken {
        if (!formattedResultaat) {
            return 'text-strong';
        }

        if (parseFloat(formattedResultaat.replace(',', '.')) < instellingen.grenswaardeZwaarOnvoldoende) {
            return 'fg-negative-normal';
        }

        if (parseFloat(formattedResultaat.replace(',', '.')) < instellingen.grenswaardeOnvoldoende) {
            return 'fg-warning-normal';
        }

        return 'text-strong';
    }
}
