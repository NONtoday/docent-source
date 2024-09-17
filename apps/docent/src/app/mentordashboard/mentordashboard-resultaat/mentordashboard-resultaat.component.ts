import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { DbResultaatkolomtype, GeldendResultaatFieldsFragment, ResultaatBijzonderheid } from '@docent/codegen';
import { IconDirective } from 'harmony';
import {
    IconDeeltoets,
    IconPijlAfslaanRechts,
    IconReacties,
    IconSamengesteldeToets,
    IconWaarschuwing,
    IconWeging,
    provideIcons
} from 'harmony-icons';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-mentordashboard-resultaat',
    templateUrl: './mentordashboard-resultaat.component.html',
    styleUrls: ['./mentordashboard-resultaat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, IconDirective],
    providers: [provideIcons(IconPijlAfslaanRechts, IconSamengesteldeToets, IconDeeltoets, IconWaarschuwing, IconReacties, IconWeging)]
})
export class MentordashboardResultaatComponent {
    @Input() @HostBinding('class.herkansing') herkansingsNummer: Optional<number>;
    @Input() toetsKolom: Omit<GeldendResultaatFieldsFragment, '__typename'>;
    @Input() resultaat: Optional<string>;
    @Input() voldoende: Optional<boolean>;

    dbResultaatKolomType = DbResultaatkolomtype;
    resultaatBijzonderheid = ResultaatBijzonderheid;

    getFormattedResultaat(resultaat: Optional<string>) {
        return resultaat?.replace('!', '');
    }

    get opmerkingTooltip() {
        let opmerking = this.toetsKolom.opmerkingen;

        if (this.herkansingsNummer === 0) {
            opmerking = this.toetsKolom.opmerkingenEerstePoging;
        } else if (this.herkansingsNummer === 1) {
            opmerking = this.toetsKolom.opmerkingenHerkansing1;
        } else if (this.herkansingsNummer === 2) {
            opmerking = this.toetsKolom.opmerkingenHerkansing2;
        }

        return opmerking ? `<span style="font-weight: 600">Opmerking</span><br/>${opmerking}` : null;
    }
}
