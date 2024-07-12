import { Pipe, PipeTransform } from '@angular/core';
import { QueriedWerkdrukStudiewijzerItem } from '../../core/models/werkdruk.model';

@Pipe({
    name: 'werkdrukitemDocentLesgroep',
    standalone: true
})
export class WerkdrukitemDocentLesgroepPipe implements PipeTransform {
    transform(item: QueriedWerkdrukStudiewijzerItem): string {
        return [item.docenten, item.lesgroepnaam].filter(Boolean).join(' • ');
    }
}
