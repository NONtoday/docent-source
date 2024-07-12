import { Pipe, PipeTransform } from '@angular/core';
import { PillTagColor } from 'harmony';

@Pipe({
    name: 'registratieTrendPillColor',
    standalone: true
})
export class RegistratieTrendPillColorPipe implements PipeTransform {
    transform(trend: number): PillTagColor {
        if (!trend || trend === 0) {
            return 'neutral';
        }

        return trend > 0 ? 'negative' : 'positive';
    }
}
