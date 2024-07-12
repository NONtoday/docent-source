import { Pipe, PipeTransform } from '@angular/core';
import { ItemFieldsFragment, Studiewijzeritem } from '../../../generated/_types';

@Pipe({
    name: 'studiewijzeritemOmschrijving',
    standalone: true
})
export class StudiewijzeritemOmschrijvingPipe implements PipeTransform {
    private regExp = new RegExp('^<p></p>$', 'gm');

    transform(value: Studiewijzeritem | ItemFieldsFragment): string | undefined {
        return value.omschrijving?.replace(this.regExp, '<p><br></p>');
    }
}
