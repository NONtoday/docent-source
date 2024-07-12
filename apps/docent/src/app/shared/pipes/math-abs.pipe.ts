import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'mathAbs',
    standalone: true
})
export class MathAbsPipe implements PipeTransform {
    transform(value: number): number {
        return Math.abs(value);
    }
}
