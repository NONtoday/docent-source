import { Pipe, PipeTransform } from '@angular/core';
import { NotitieboekMenuQuery } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { P, match } from 'ts-pattern';

@Pipe({
    name: 'notitieboekMenuItemNaam',
    standalone: true
})
export class NotitieboekMenuItemNaamPipe implements PipeTransform {
    transform(item: NotitieboekMenuQuery['notitieboekMenu']['groepen'][number]): string {
        return match(item)
            .with({ leerling: P.select() }, (leerling) => getVolledigeNaam(leerling))
            .with({ lesgroep: P.select() }, (lesgroep) => lesgroep.naam)
            .with({ stamgroep: P.select() }, (stamgroep) => stamgroep.naam)
            .exhaustive();
    }
}
