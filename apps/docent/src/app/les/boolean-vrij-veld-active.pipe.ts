import { Pipe, PipeTransform } from '@angular/core';
import { LesRegistratieQuery } from '../../generated/_types';

@Pipe({
    name: 'booleanVrijVeldActive',
    standalone: true
})
export class BooleanVrijVeldActivePipe implements PipeTransform {
    transform(
        vrijveld: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'][number],
        registratie: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number]
    ): boolean {
        return registratie.overigeVrijVeldWaarden.find((vvw) => vvw.vrijveld.id === vrijveld.id)?.booleanWaarde ?? false;
    }
}
