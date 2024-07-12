import { Pipe, PipeTransform } from '@angular/core';
import { isArray, isEmpty } from 'lodash-es';
import { NotitieFieldsFragment } from '../../generated/_types';
import { Betrokkene } from '../notitieboek/betrokkene-selectie/betrokkene-selectie.component';

type NotitieDelen = 'Docenten' | 'Mentoren';

export const isNotitieDelenDisabled = (input: NotitieFieldsFragment | Betrokkene[], met: NotitieDelen): boolean => {
    if (isArray(input)) {
        if (met === 'Docenten') {
            return (
                input.filter((b) => b.__typename === 'Stamgroep').length > 0 &&
                input.filter((b) => b.__typename !== 'Stamgroep').length === 0
            );
        }
        return input.filter((b) => b.__typename === 'Lesgroep').length > 0 && input.filter((b) => b.__typename !== 'Lesgroep').length === 0;
    } else {
        if (met === 'Docenten')
            return input.stamgroepBetrokkenen.length > 0 && isEmpty(input.leerlingBetrokkenen) && isEmpty(input.lesgroepBetrokkenen);
        else {
            return input.lesgroepBetrokkenen.length > 0 && isEmpty(input.leerlingBetrokkenen) && isEmpty(input.stamgroepBetrokkenen);
        }
    }
};

@Pipe({
    name: 'notitieDelenDisabled',
    standalone: true
})
export class NotitieDelenDisabled implements PipeTransform {
    transform(input: NotitieFieldsFragment | Betrokkene[], met: NotitieDelen): boolean {
        if (!met) {
            throw new Error('NotitieDelenDisabled pipe: "met" parameter is verplicht');
        }
        return isNotitieDelenDisabled(input, met);
    }
}
