import { Pipe, PipeTransform } from '@angular/core';
import { LesRegistratieQuery } from '../../generated/_types';
import { Optional } from '../rooster-shared/utils/utils';

@Pipe({
    name: 'keuzeVrijVeldActive',
    standalone: true
})
export class KeuzeVrijVeldActivePipe implements PipeTransform {
    transform(
        vrijveld: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'][number],
        registratie: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number]
    ): Optional<string> {
        return registratie.overigeVrijVeldWaarden.find((vvw) => vvw.vrijveld.id === vrijveld.id)?.keuzelijstWaarde?.waarde;
    }
}
