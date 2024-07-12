import { Pipe, PipeTransform } from '@angular/core';
import { P, match } from 'ts-pattern';
import { NotitieboekMenuQuery } from '../../generated/_types';
import { getVolledigeNaam } from '../shared/utils/leerling.utils';

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
