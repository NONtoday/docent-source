import { Pipe, PipeTransform } from '@angular/core';
import { isEqual } from 'lodash-es';

@Pipe({
    name: 'contains',
    standalone: true
})
export class ContainsPipe implements PipeTransform {
    transform(list: any[], value: any): unknown {
        return list.some((element) => isEqual(element, value));
    }
}
