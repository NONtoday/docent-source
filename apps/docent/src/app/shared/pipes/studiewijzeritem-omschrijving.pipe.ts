import { Pipe, PipeTransform } from '@angular/core';
import { ItemFieldsFragment, Studiewijzeritem } from '@docent/codegen';

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
