import { Pipe, PipeTransform } from '@angular/core';
import { Lesgroep } from '@docent/codegen';

@Pipe({
    name: 'lesgroepNamen',
    standalone: true
})
export class LesgroepenPipe implements PipeTransform {
    transform(lesgroepen: Lesgroep[]) {
        return lesgroepen.map((lesgroep) => lesgroep.naam).join(', ');
    }
}
