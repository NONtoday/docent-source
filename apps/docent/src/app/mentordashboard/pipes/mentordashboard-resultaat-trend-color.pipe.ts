import { Pipe, PipeTransform } from '@angular/core';
import { ColorToken } from 'harmony';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'mentordashboardResultaatTrendColor',
    standalone: true
})
export class MentordashboardResultaatTrendColorPipe implements PipeTransform {
    transform(trendindicatie: Optional<number>): ColorToken {
        if (!trendindicatie || (trendindicatie > -0.2 && trendindicatie < 0.2)) {
            return 'bg-neutral-strong';
        }
        if (trendindicatie <= -1) {
            return `action-negative-strong`;
        }
        return trendindicatie >= 0.2 ? 'fg-positive-normal' : 'bg-accent-strong';
    }
}
