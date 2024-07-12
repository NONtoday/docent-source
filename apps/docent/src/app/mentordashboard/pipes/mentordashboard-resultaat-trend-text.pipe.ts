import { Pipe, PipeTransform } from '@angular/core';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'mentordashboardResultaatTrendText',
    standalone: true
})
export class MentordashboardResultaatTrendTextPipe implements PipeTransform {
    transform(trendindicatie: Optional<number>): string {
        if (trendindicatie === null || trendindicatie === undefined) {
            return 'Geen trend';
        }
        if (trendindicatie > -0.2 && trendindicatie < 0.2) {
            return 'Stabiel';
        }
        if (trendindicatie <= -1) {
            return 'Sterk dalend';
        }
        return trendindicatie >= 0.2 ? 'Stijgend' : 'Dalend';
    }
}
