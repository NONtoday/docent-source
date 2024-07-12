import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'duration',
    standalone: true
})
export class DurationPipe implements PipeTransform {
    transform(value: any): any {
        const uren = Math.floor(value / 60);
        const minuten = value % 60;

        let result = '';

        if (uren) {
            result += String(uren) + ' uur';
        }
        if (minuten) {
            result += ' ' + String(minuten) + ' min';
        }

        return result.trim();
    }
}
