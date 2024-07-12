import { Pipe, PipeTransform } from '@angular/core';
import { match } from 'ts-pattern';
import { MentordashboardOverzichtTijdspanOptie } from '../../core/models/mentordashboard.model';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'mentordashboardRegistratieTrendTooltip',
    standalone: true
})
export class MentordashboardRegistratieTrendTooltipPipe implements PipeTransform {
    transform(trend: Optional<number>, tijdspan: Optional<MentordashboardOverzichtTijdspanOptie>): string | null {
        if (!trend || !tijdspan) {
            return null;
        }

        const tooltipPrefix = `<b>${Math.abs(trend)} ${trend > 0 ? 'meer' : 'minder'}</b> <br> vergeleken met `;
        const tooltipSuffix = match(tijdspan)
            .with('Laatste 7 dagen', () => 'vorige 7 dagen')
            .with('Laatste 30 dagen', () => 'vorige 30 dagen')
            .with('Deze periode', () => 'vorige periode')
            .with('Huidig schooljaar', () => 'vorig schooljaar')
            .exhaustive();

        return `${tooltipPrefix}${tooltipSuffix}`;
    }
}
