import { Pipe, PipeTransform } from '@angular/core';
import { Geslacht, Maybe, RelatieSoort } from '@docent/codegen';
import { capitalize } from 'lodash-es';

export const relatieGeslachtSoort = (relatieSoort: RelatieSoort, geslacht: Maybe<Geslacht>): string => {
    if (relatieSoort.mannelijkeNaam && geslacht === Geslacht.MAN) {
        return capitalize(relatieSoort.mannelijkeNaam);
    } else if (relatieSoort.vrouwelijkeNaam && geslacht === Geslacht.VROUW) {
        return capitalize(relatieSoort.vrouwelijkeNaam);
    }

    return capitalize(relatieSoort.naam);
};

@Pipe({
    name: 'relatieGeslachtSoortPipe',
    standalone: true
})
export class RelatieGeslachtSoortPipePipe implements PipeTransform {
    transform(relatieSoort: RelatieSoort, geslacht: Maybe<Geslacht>): string {
        return relatieGeslachtSoort(relatieSoort, geslacht);
    }
}
