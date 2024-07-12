import { Pipe, PipeTransform } from '@angular/core';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'commaResult',
    standalone: true
})
export class CommaResultPipe implements PipeTransform {
    transform(value: Optional<number>): string {
        return commaResult(value);
    }
}

export function commaResult(value: Optional<number>): string {
    if (value === null || value === undefined) return '';
    let stringValue = value.toFixed(1);

    // voeg een ".0" toe voor hele getallen
    if (stringValue.indexOf('.') === -1) {
        stringValue += '.0';
    }

    return stringValue.replace('.', ',');
}
