import { Pipe, PipeTransform } from '@angular/core';
import { HuiswerkType } from '../../../generated/_types';
import { HarmonyColorName } from '../../rooster-shared/colors';

@Pipe({
    name: 'huiswerkTypeColor',
    standalone: true
})
export class HuiswerkTypeColorPipe implements PipeTransform {
    transform(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean): HarmonyColorName {
        if (heeftInleveropdracht) {
            return 'accent_alt_1';
        } else if (huiswerkType === HuiswerkType.HUISWERK) {
            return 'primary_1';
        } else if (huiswerkType === HuiswerkType.TOETS) {
            return 'accent_warning_1';
        } else if (huiswerkType === HuiswerkType.GROTE_TOETS) {
            return 'accent_negative_1';
        }

        return 'accent_positive_1';
    }
}
