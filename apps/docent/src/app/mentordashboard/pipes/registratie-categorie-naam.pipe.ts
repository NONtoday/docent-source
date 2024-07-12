import { Pipe, PipeTransform } from '@angular/core';
import { match } from 'ts-pattern';
import { MentordashboardOverzichtRegistratieCategorieFieldsFragment } from '../../../generated/_types';
import { registratieContent } from '../leerlingoverzicht/leerlingoverzicht.model';
@Pipe({
    name: 'registratieCategorieNaam',
    standalone: true
})
export class RegistratieCategorieNaamPipe implements PipeTransform {
    transform(reg: MentordashboardOverzichtRegistratieCategorieFieldsFragment): string {
        return match(reg)
            .with(
                { __typename: 'MentordashboardOverzichtRegistratieKolomCategorie' },
                (kolomCat) => registratieContent[kolomCat.kolom].naam
            )
            .with({ __typename: 'MentordashboardOverzichtRegistratieVrijVeldCategorie' }, (cat) =>
                [cat.vrijVeld.naam, cat.keuzelijstWaarde?.waarde].filter(Boolean).join(' • ')
            )
            .exhaustive();
    }
}
