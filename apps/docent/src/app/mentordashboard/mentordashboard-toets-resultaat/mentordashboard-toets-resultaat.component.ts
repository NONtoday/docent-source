import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MentordashboardResultatenInstellingen, RecentResultaat } from '@docent/codegen';
import { CssVarPipe, IconDirective, TooltipDirective } from 'harmony';
import { IconHerkansing, IconReacties, IconWeging, provideIcons } from 'harmony-icons';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardResultaatKleurPipe } from '../pipes/mentordashboard-resultaat-kleur.pipe';

@Component({
    selector: 'dt-mentordashboard-toets-resultaat',
    standalone: true,
    imports: [IconDirective, TooltipDirective, MentordashboardResultaatKleurPipe, CssVarPipe, DtDatePipe],
    providers: [provideIcons(IconHerkansing, IconReacties, IconWeging)],
    templateUrl: './mentordashboard-toets-resultaat.component.html',
    styleUrls: ['./mentordashboard-toets-resultaat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentordashboardToetsResultaatComponent {
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) recentResultaat: RecentResultaat;
    /*  TODO: er zit een bug in GeldendResultaat waardoor de "opmerkingen" property niet altijd correct gevuld wordt.
                Dit wordt door team leerling meegenomen bij het oplossen van de rest van de bugs in GeldendResultaat.
                Zodra die aanpassingen zijn gedaan, kan dit hieronder ook aangepast worden. */
    get tooltipOpmerking(): string {
        const opmerkingText = this.recentResultaat.resultaat.opmerkingen
            ? this.recentResultaat.resultaat.opmerkingen
            : this.recentResultaat.resultaat.opmerkingenEerstePoging;
        return `<b>Opmerking</b><br>${String(opmerkingText)}`;
    }

    get isHerkansing(): boolean {
        return Boolean(this.herkansingsnummer);
    }

    get herkansingsnummer(): Optional<number> {
        return this.recentResultaat.isAlternatieveNormering
            ? this.recentResultaat.resultaat.herkansingsnummerAlternatief
            : this.recentResultaat.resultaat.herkansingsnummer;
    }
}
