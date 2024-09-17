import { Pipe, PipeTransform } from '@angular/core';
import { AfspraakParticipant } from '@docent/codegen';
import { getVolledigeNaam } from './volledige-naam.pipe';

@Pipe({
    name: 'afspraakParticipantNaam',
    standalone: true
})
export class AfspraakParticipantNaamPipe implements PipeTransform {
    transform(afspraakParticipant: AfspraakParticipant) {
        if (afspraakParticipant.stamgroep) {
            return afspraakParticipant.stamgroep.naam;
        } else if (afspraakParticipant.lesgroep) {
            return afspraakParticipant.lesgroep.naam;
        } else if (afspraakParticipant.medewerker) {
            return getVolledigeNaam(afspraakParticipant.medewerker);
        } else if (afspraakParticipant.leerling) {
            return getVolledigeNaam(afspraakParticipant.leerling);
        } else {
            return 'Onbekende afspraakdeelnemer';
        }
    }
}
