import { Pipe, PipeTransform } from '@angular/core';
import { Resultaat } from '../../../generated/_types';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'onvoldoende',
    standalone: true
})
export class OnvoldoendePipe implements PipeTransform {
    transform(
        resultaat: Optional<Pick<Resultaat, 'teltNietMee' | 'vrijstelling' | 'voldoende' | 'voldoendeAfwijkendNiveau'>>,
        alternatiefNiveau: boolean,
        isAangepast: boolean
    ): boolean {
        if (!resultaat || isAangepast || resultaat.teltNietMee || resultaat.vrijstelling) {
            return false;
        }
        return !(alternatiefNiveau ? resultaat.voldoendeAfwijkendNiveau : resultaat.voldoende);
    }
}
