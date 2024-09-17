import { Pipe, PipeTransform } from '@angular/core';
import { ItemFieldsFragment, Studiewijzeritem } from '@docent/codegen';
import { first } from '../../rooster-shared/utils/utils';
import { berekenOnderwerp } from '../../shared/utils/studiewijzer.utils';

@Pipe({
    name: 'studiewijzeritemTitel',
    standalone: true
})
export class StudiewijzeritemTitelPipe implements PipeTransform {
    transform(studiewijzeritem: Studiewijzeritem | ItemFieldsFragment): string {
        return first(studiewijzeritem.onderwerp, berekenOnderwerp(studiewijzeritem.omschrijving));
    }
}
