import { Pipe, PipeTransform } from '@angular/core';
import { KLEUREN_STACK_HORIZONTAL_PADDING } from './kleuren-stack.component';

@Pipe({
    name: 'kleurenStackOverigeRight',
    standalone: true
})
export class KleurenStackOverigeRightPipe implements PipeTransform {
    transform(maxGetoondeKleuren: number): number {
        return maxGetoondeKleuren * 8 ?? 0 + KLEUREN_STACK_HORIZONTAL_PADDING / 2;
    }
}
