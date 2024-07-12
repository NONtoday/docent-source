import { Pipe, PipeTransform } from '@angular/core';
import { AfspraakQuery } from '../../../generated/_types';

@Pipe({
    name: 'afspraakTitel',
    standalone: true
})
export class AfspraakTitelPipe implements PipeTransform {
    transform(afspraak: AfspraakQuery['afspraak']): string {
        return afspraak.isRoosterAfspraak && afspraak.lesgroepen?.length > 0
            ? afspraak.lesgroepen.map((lesgroep) => lesgroep.naam).join(', ')
            : afspraak.titel;
    }
}
