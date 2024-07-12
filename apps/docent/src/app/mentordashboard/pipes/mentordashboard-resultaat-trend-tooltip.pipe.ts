import { Pipe, PipeTransform } from '@angular/core';
import { Maybe } from '../../../generated/_types';

@Pipe({
    name: 'mentordashboardResultaatTrendTooltip',
    standalone: true
})
export class MentordashboardResultaatTrendTooltipPipe implements PipeTransform {
    transform(trendindicatie: Maybe<number> | undefined, aantal: number): string {
        if (trendindicatie === null || trendindicatie === undefined) {
            return 'Trendindicatie mogelijk vanaf 2 resultaten';
        }
        const meervoud = aantal > 1;
        if (trendindicatie > -0.2 && trendindicatie < 0.2) {
            return `<b>Stabiele trend</b><br/>Scoort zoals normaal dit schooljaar gebaseerd op ${meervoud ? 'de' : 'het'} laatste ${meervoud ? `${aantal} resultaten.` : `resultaat.`}`;
        }

        if (trendindicatie <= -1) {
            return `<b>Sterk dalende trend</b><br/>Scoort veel lager dan gemiddeld dit schooljaar gebaseerd op ${meervoud ? 'de' : 'het'} laatste ${meervoud ? `${aantal} resultaten.` : `resultaat.`}`;
        }
        return trendindicatie >= 0.2
            ? `<b>Stijgende trend</b><br/>Scoort hoger dan gemiddeld dit schooljaar gebaseerd op ${meervoud ? 'de' : 'het'} laatste ${meervoud ? `${aantal} resultaten.` : `resultaat.`}`
            : `<b>Dalende trend</b><br/>Scoort lager dan gemiddeld dit schooljaar gebaseerd op ${meervoud ? 'de' : 'het'} laatste ${meervoud ? `${aantal} resultaten.` : `resultaat.`}`;
    }
}
