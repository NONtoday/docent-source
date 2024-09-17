import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { AfspraakParticipant, Leerling, Lesgroep, Medewerker, Stamgroep } from '@docent/codegen';
import { IconGroep, provideIcons } from 'harmony-icons';
import { AfspraakParticipantNaamPipe } from '../../pipes/afspraakparticipant-naam.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { BackgroundIconComponent } from '../background-icon/background-icon.component';

@Component({
    selector: 'dt-participant-zoekresultaat',
    templateUrl: './participant-zoekresultaat.component.html',
    styleUrls: ['./participant-zoekresultaat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, BackgroundIconComponent, AfspraakParticipantNaamPipe],
    providers: [provideIcons(IconGroep)]
})
export class ParticipantZoekresultaatComponent implements OnChanges {
    @Input() participant: AfspraakParticipant;

    participantData: Leerling | Medewerker | Lesgroep | Stamgroep;

    ngOnChanges() {
        if (this.participant.leerling) {
            this.participantData = this.participant.leerling;
        } else if (this.participant.medewerker) {
            this.participantData = this.participant.medewerker;
        } else if (this.participant.lesgroep) {
            this.participantData = this.participant.lesgroep;
        } else if (this.participant.stamgroep) {
            this.participantData = this.participant.stamgroep;
        } else {
            (<any>this.participantData)['voornaam'] = 'Onbekende afspraakdeelnemer';
        }
    }
}
