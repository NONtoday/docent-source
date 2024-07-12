import { Pipe, PipeTransform } from '@angular/core';
import { TotaalRegistratie } from '../leerlingregistraties-totalen/leerlingregistraties-totalen.component';
import { totaalRegistratiesCategorieNaam } from '../mentordashboard.utils';

@Pipe({
    name: 'totaalRegistratieCategorieNaam',
    standalone: true
})
export class TotaalRegistratieCategorieNaamPipe implements PipeTransform {
    transform(reg: TotaalRegistratie): string {
        return totaalRegistratiesCategorieNaam(reg);
    }
}
