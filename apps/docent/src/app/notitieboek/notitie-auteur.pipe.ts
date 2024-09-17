import { Pipe, PipeTransform } from '@angular/core';
import { NotitieFieldsFragment } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';

@Pipe({
    name: 'notitieAuteur',
    standalone: true
})
export class NotitieAuteurPipe implements PipeTransform {
    transform(notitie: Pick<NotitieFieldsFragment, 'auteur' | 'auteurInactief'>): string {
        return `${getVolledigeNaam(notitie.auteur)}${notitie.auteurInactief ? ' (inactief)' : ''}`;
    }
}
