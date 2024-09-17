import { Pipe, PipeTransform } from '@angular/core';
import { HuiswerkType } from '@docent/codegen';
import { IconName } from 'harmony-icons';

@Pipe({
    name: 'huiswerkTypeIcon',
    standalone: true
})
export class HuiswerkTypeIconPipe implements PipeTransform {
    transform(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean): IconName {
        if (huiswerkType === HuiswerkType.TOETS) {
            return 'toets';
        }
        if (huiswerkType === HuiswerkType.GROTE_TOETS) {
            return 'toetsGroot';
        } else if (huiswerkType === HuiswerkType.LESSTOF) {
            return 'lesstof';
        } else if (heeftInleveropdracht) {
            return 'inleveropdracht';
        }
        return 'huiswerk';
    }
}
