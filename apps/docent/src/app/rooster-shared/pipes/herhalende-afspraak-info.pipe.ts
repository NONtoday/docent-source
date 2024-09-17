import { Pipe, PipeTransform } from '@angular/core';
import { Afspraak, AfspraakHerhalingDag, AfspraakHerhalingType } from '@docent/codegen';
import { isEqual } from 'lodash-es';
import { formatDateNL } from '../utils/date.utils';

@Pipe({
    name: 'herhalendeAfspraakInfo',
    standalone: true
})
export class HerhalendeAfspraakInfoPipe implements PipeTransform {
    transform(afspraak: Afspraak): string {
        if (!afspraak.herhalendeAfspraak) {
            return '';
        }

        const vanaf = `Vanaf ${formatDateNL(afspraak.herhalendeAfspraak.beginDatum, 'dag_kort_dagnummer_maand_kort_lowercase')}`;
        const tot = afspraak.herhalendeAfspraak.eindDatum
            ? `tot ${formatDateNL(afspraak.herhalendeAfspraak.eindDatum, 'dag_kort_dagnummer_maand_kort_lowercase')}`
            : `tot ${afspraak.herhalendeAfspraak.maxHerhalingen} afspraken`;

        const frequentie = afspraak.herhalendeAfspraak.cyclus;
        const type = afspraak.herhalendeAfspraak.type;
        if (type === AfspraakHerhalingType.MAANDELIJKS) {
            const dag = afspraak.herhalendeAfspraak.afspraakHerhalingDagen[0].toLocaleLowerCase();
            const skip = afspraak.herhalendeAfspraak.skip;
            const maand = frequentie === 1 ? `maandelijks` : `elke ${frequentie} maanden`;
            const op = `op de ${skip}e ${dag} van de maand`;

            return `${vanaf} ${maand} ${op} ${tot}`;
        } else if (type === AfspraakHerhalingType.WEKELIJKS) {
            const week = frequentie === 1 ? `elke week` : `elke ${frequentie} weken`;
            const dagen =
                afspraak.herhalendeAfspraak.afspraakHerhalingDagen.length === 1
                    ? `de ${afspraak.herhalendeAfspraak.afspraakHerhalingDagen[0].toLocaleLowerCase()}`
                    : afspraak.herhalendeAfspraak.afspraakHerhalingDagen.map((dag) => dag.toLowerCase().substr(0, 2)).join(', ');
            const op = `op ${dagen}`;

            return `${vanaf} ${week} ${op} ${tot}`;
        } else if (type === AfspraakHerhalingType.DAGELIJKS) {
            const isDag = isEqual(afspraak.herhalendeAfspraak.afspraakHerhalingDagen, [AfspraakHerhalingDag.DAG]);
            const dagsoort = isDag ? 'dagen' : 'werkdagen';
            const dagsoortEnkelvoud = isDag ? 'dag' : 'werkdag';
            const dag = frequentie === 1 ? `elke ${dagsoortEnkelvoud}` : `elke ${frequentie} ${dagsoort}`;

            return `${vanaf} ${dag} ${tot}`;
        }

        return '';
    }
}
