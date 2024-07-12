import { Pipe, PipeTransform } from '@angular/core';
import { HarmonyColorName, toFillCssClass } from '../../rooster-shared/colors';

@Pipe({
    name: 'harmonyColorToFillClass',
    standalone: true
})
export class HarmonyColorToFillClassPipe implements PipeTransform {
    transform(color: HarmonyColorName): string {
        return toFillCssClass(color);
    }
}
