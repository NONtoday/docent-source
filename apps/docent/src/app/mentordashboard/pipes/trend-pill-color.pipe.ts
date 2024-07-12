import { Pipe, PipeTransform } from '@angular/core';
import { PillTagColor } from 'harmony';

@Pipe({
    name: 'trendPillColor',
    standalone: true
})
export class TrendPillColorPipe implements PipeTransform {
    transform(trend: number): PillTagColor {
        if (!trend || trend === 0) {
            return 'neutral';
        }

        return trend > 0 ? 'positive' : 'negative';
    }
}
