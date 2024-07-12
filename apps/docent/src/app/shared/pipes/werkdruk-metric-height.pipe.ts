import { Pipe, PipeTransform } from '@angular/core';
import { QueriedWerkdrukStudiewijzerItem } from '../../core/models/werkdruk.model';

@Pipe({
    name: 'werkdrukMetricHeight',
    standalone: true
})
export class WerkdrukMetricHeightPipe implements PipeTransform {
    /**
     *  Minimale hoogte lesitem blok 40px (1=40px)
        Per heel getal groeit het blok met 8px (2=48px, 3=56px, 4=64px, 5=72px, 6=80px)
        Maximale hoogte lesitem blok 80px.
     */
    transform(items: QueriedWerkdrukStudiewijzerItem[]): number {
        if (items.length === 0) {
            return 0;
        }

        return Math.min(32 + items.length * 8, 80);
    }
}
