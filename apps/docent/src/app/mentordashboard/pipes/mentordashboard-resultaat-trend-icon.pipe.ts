import { Pipe, PipeTransform } from '@angular/core';
import { IconName } from 'harmony-icons';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'mentordashboardResultaatTrendIcon',
    standalone: true
})
export class MentordashboardResultaatTrendIconPipe implements PipeTransform {
    transform(trendindicatie: Optional<number>): IconName {
        if (!trendindicatie || (trendindicatie > -0.2 && trendindicatie < 0.2)) {
            return 'pijlRechts';
        }
        return trendindicatie >= 0.2 ? 'pijlRechtsBoven' : 'pijlRechtsBeneden';
    }
}
