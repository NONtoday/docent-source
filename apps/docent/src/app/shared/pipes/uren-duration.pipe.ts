import { Pipe, PipeTransform } from '@angular/core';
import { formatMinutenAlsUren } from '../../mentordashboard/mentordashboard.utils';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'urenDuration',
    standalone: true
})
export class UrenDurationPipe implements PipeTransform {
    transform(minuten: Optional<number>): string {
        return formatMinutenAlsUren(minuten) || '00:00';
    }
}
