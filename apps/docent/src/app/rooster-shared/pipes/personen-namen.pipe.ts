import { Pipe, PipeTransform } from '@angular/core';
import { Persoon } from '../../../generated/_types';
import { getVolledigeNaam } from './volledige-naam.pipe';

@Pipe({
    name: 'personenNamen',
    standalone: true
})
export class PersonenNamenPipe implements PipeTransform {
    transform(personen: Persoon[]) {
        return personen.map((persoon) => getVolledigeNaam(persoon)).join(', ');
    }
}
