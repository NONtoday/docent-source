import { Pipe, PipeTransform } from '@angular/core';
import { HuiswerkType } from '@docent/codegen';
import { BackgroundIconColor } from '../utils/color-token-utils';

@Pipe({
    name: 'huiswerkTypeColor',
    standalone: true
})
export class HuiswerkTypeColorPipe implements PipeTransform {
    transform(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean): BackgroundIconColor {
        if (heeftInleveropdracht) {
            return 'alternative';
        } else if (huiswerkType === HuiswerkType.HUISWERK) {
            return 'primary';
        } else if (huiswerkType === HuiswerkType.TOETS) {
            return 'warning';
        } else if (huiswerkType === HuiswerkType.GROTE_TOETS) {
            return 'negative';
        }

        return 'positive';
    }
}
