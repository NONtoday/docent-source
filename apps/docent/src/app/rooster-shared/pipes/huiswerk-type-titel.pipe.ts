import { Pipe, PipeTransform } from '@angular/core';
import { HuiswerkType } from '../../../generated/_types';
import { getHuiswerkTypeTitel } from '../utils/utils';

@Pipe({
    name: 'huiswerkTypeTitel',
    standalone: true
})
export class HuiswerkTypeTitelPipe implements PipeTransform {
    transform(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean): string {
        return getHuiswerkTypeTitel(huiswerkType, heeftInleveropdracht);
    }
}
