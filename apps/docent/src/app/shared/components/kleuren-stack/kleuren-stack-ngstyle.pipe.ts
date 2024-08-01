import { Pipe, PipeTransform } from '@angular/core';
import { toCssVar } from 'harmony';
import { KLEUREN_STACK_HORIZONTAL_PADDING, KleurenStackElement } from './kleuren-stack.component';

const kleurenStackRight = (index: number) => index * 8 + KLEUREN_STACK_HORIZONTAL_PADDING / 2 + 1;

@Pipe({
    name: 'kleurenStackNgstyle',
    standalone: true
})
export class KleurenStackNgstylePipe implements PipeTransform {
    transform(kleurContent: KleurenStackElement, index: number): { [klass: string]: any } {
        return {
            'background-color': toCssVar(kleurContent.kleur),
            'right.px': kleurenStackRight(index),
            border: '1px solid ' + toCssVar(kleurContent.border)
        };
    }
}
