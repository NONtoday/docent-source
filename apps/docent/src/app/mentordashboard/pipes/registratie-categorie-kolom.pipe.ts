import { Pipe, PipeTransform } from '@angular/core';
import {
    MentordashboardOverzichtRegistratieCategorieFieldsFragment,
    MentordashboardOverzichtRegistratieKolomCategorie
} from '../../../generated/_types';
@Pipe({
    name: 'registratieCategorieKolom',
    standalone: true
})
export class RegistratieCategorieKolomPipe implements PipeTransform {
    transform(
        categorie: MentordashboardOverzichtRegistratieCategorieFieldsFragment
    ): MentordashboardOverzichtRegistratieKolomCategorie['kolom'] | undefined {
        return (<MentordashboardOverzichtRegistratieKolomCategorie>categorie).kolom;
    }
}
