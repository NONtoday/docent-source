import { Pipe, PipeTransform } from '@angular/core';
import { match } from 'ts-pattern';

@Pipe({
    name: 'heatmapTijdLabel',
    standalone: true
})
export class HeatmapTijdLabelPipe implements PipeTransform {
    transform(index: number): string {
        return match(index)
            .with(0, () => '07:00')
            .with(2, () => '12:00')
            .with(4, () => '17:00')
            .otherwise(() => '');
    }
}
