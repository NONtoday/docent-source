import { Pipe, PipeTransform } from '@angular/core';
import { Optional, isEmpty } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'cijferPeriodeNaam',
    standalone: true
})
export class CijferPeriodeNaamPipe implements PipeTransform {
    transform(periode: { nummer: number; afkorting?: Optional<string> }): string {
        return `Periode ${periode.afkorting && !isEmpty(periode.afkorting) ? periode.afkorting?.trim() : periode.nummer}`;
    }
}
