import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'aantalNotitiesCounter',
    standalone: true
})
export class AantalNotitiesCounterPipe implements PipeTransform {
    transform(count: number): string {
        return count > 0 ? `(${count})` : '';
    }
}
