import { Pipe, PipeTransform } from '@angular/core';
import { Optional } from '../../rooster-shared/utils/utils';
import { commaResult } from '../../shared/pipes/comma-result.pipe';

export function leerlingResultatenTrendTooltip(trend: Optional<number>, aantalResultaten: number, vak: string, examen?: boolean) {
    if (trend === undefined || trend === null) {
        return `Geen trendwaarde beschikbaar voor ${vak}`;
    }

    const meervoud = aantalResultaten > 1;
    const resultaatPrefix = examen ? 'SE-' : '';
    const ditSchooljaar = examen ? '' : ' dit schooljaar';

    if (trend === 0.0) {
        return meervoud
            ? `De laatste ${aantalResultaten} ${resultaatPrefix}resultaten voor ${vak} zijn gemiddeld gelijk gebleven`
            : `Het laatste ${resultaatPrefix}resultaat voor ${vak} is gelijk gebleven`;
    }

    return `Scoort ${
        meervoud ? `laatste ${aantalResultaten} ${resultaatPrefix}resultaten` : `laatste ${resultaatPrefix}resultaat`
    } <b>${commaResult(Math.abs(trend))} ${trend > 0 ? 'hoger' : 'lager'}</b> dan gemiddeld voor ${vak}${ditSchooljaar}`;
}

@Pipe({
    name: 'leerlingResultatenTrendTooltip',
    standalone: true
})
export class LeerlingResultatenTrendTooltipPipe implements PipeTransform {
    transform(trend: Optional<number>, aantalResultaten: number, vak: string, examen?: boolean): string {
        return leerlingResultatenTrendTooltip(trend, aantalResultaten, vak, examen);
    }
}
