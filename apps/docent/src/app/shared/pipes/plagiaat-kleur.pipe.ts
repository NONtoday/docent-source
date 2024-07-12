import { Pipe, PipeTransform } from '@angular/core';
import { ColorToken } from 'harmony';
import { Optional } from '../../rooster-shared/utils/utils';

@Pipe({
    name: 'plagiaatKleur',
    standalone: true
})
export class PlagiaatKleurPipe implements PipeTransform {
    transform(plagiaat: number): Optional<ColorToken> {
        let colorToken: Optional<ColorToken> = null;

        if (plagiaat > 0 && plagiaat < 25) {
            colorToken = 'fg-neutral-moderate';
        } else if (plagiaat >= 25 && plagiaat < 50) {
            colorToken = 'fg-accent-normal';
        } else if (plagiaat >= 50 && plagiaat < 75) {
            colorToken = 'fg-warning-normal';
        } else if (plagiaat >= 75) {
            colorToken = 'fg-negative-normal';
        }

        return colorToken;
    }
}
