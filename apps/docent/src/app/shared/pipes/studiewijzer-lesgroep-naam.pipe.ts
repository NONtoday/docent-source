import { Pipe, PipeTransform } from '@angular/core';
import { Studiewijzer } from '../../../generated/_types';

@Pipe({
    name: 'studiewijzerLesgroepNaam',
    standalone: true
})
export class StudiewijzerLesgroepNaamPipe implements PipeTransform {
    transform(studiewijzers: Studiewijzer | Studiewijzer[]): unknown {
        return Array.isArray(studiewijzers) ? studiewijzers.map((sw) => sw.lesgroep.naam).join(', ') : studiewijzers.lesgroep.naam;
    }
}
