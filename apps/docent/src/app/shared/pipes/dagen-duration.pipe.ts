import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dagenDuration',
    standalone: true
})
export class DagenDurationPipe implements PipeTransform {
    transform(value: any, input: 'seconds' | 'minutes' = 'seconds'): any {
        const unit = input === 'minutes' ? 60 : 3600;
        const dagen = Math.floor(value / (unit * 24));

        if (dagen === 1) {
            return '1 dag';
        }

        return `${dagen} dagen`;
    }
}
