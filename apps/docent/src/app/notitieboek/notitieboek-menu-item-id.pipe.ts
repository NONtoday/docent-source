import { Pipe, PipeTransform } from '@angular/core';
import { NotitieboekMenuQuery } from '@docent/codegen';
import { P, match } from 'ts-pattern';

export const notitieboekMenuItemId = (item: NotitieboekMenuQuery['notitieboekMenu']['groepen'][number]): string =>
    match(item)
        .with({ leerling: P.select() }, (leerling) => leerling.id)
        .with({ lesgroep: P.select() }, (lesgroep) => lesgroep.id)
        .with({ stamgroep: P.select() }, (stamgroep) => stamgroep.id)
        .exhaustive();

@Pipe({
    name: 'notitieboekMenuItemId',
    standalone: true
})
export class NotitieboekMenuItemIdPipe implements PipeTransform {
    transform(item: NotitieboekMenuQuery['notitieboekMenu']['groepen'][number]): string {
        return notitieboekMenuItemId(item);
    }
}
