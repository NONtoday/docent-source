import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CssVarPipe, IconDirective, TooltipDirective } from 'harmony';
import { IconDeeltoets, IconHerkansing, IconReacties, IconWeging, provideIcons } from 'harmony-icons';
import {
    DbResultaatkolomtype,
    GeldendResultaat,
    GeldendVoortgangsdossierResultaat,
    MentordashboardResultatenInstellingen
} from '../../../../generated/_types';
import { Optional } from '../../../rooster-shared/utils/utils';
import { MentordashboardResultaatKleurPipe } from '../../pipes/mentordashboard-resultaat-kleur.pipe';

@Component({
    selector: 'dt-leerlingoverzicht-vak-toets-resultaat',
    standalone: true,
    imports: [TooltipDirective, IconDirective, MentordashboardResultaatKleurPipe, CssVarPipe],
    providers: [provideIcons(IconHerkansing, IconWeging, IconReacties, IconDeeltoets)],
    templateUrl: './leerlingoverzicht-vak-toets-resultaat.component.html',
    styleUrl: './leerlingoverzicht-vak-toets-resultaat.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtVakToetsResultaatComponent {
    @Input({ required: true }) resultaat: GeldendVoortgangsdossierResultaat | GeldendResultaat;
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) isAlternatieveNormering: boolean;
    @Input({ required: true }) toetscodeSamengesteldeToets: Optional<string>;
    @Input({ required: true }) omschrijvingSamengesteldeToets: Optional<string>;

    get tooltipOpmerking(): string {
        const opmerkingText = this.resultaat.opmerkingen ? this.resultaat.opmerkingen : this.resultaat.opmerkingenEerstePoging;
        return `<b>Opmerking</b><br>${String(opmerkingText)}`;
    }

    get tooltipDeeltoets(): string {
        return `Deeltoets van ${this.toetscodeSamengesteldeToets} • ${this.omschrijvingSamengesteldeToets}`;
    }

    get isHerkansing(): boolean {
        return Boolean(this.herkansingsnummer);
    }

    get herkansingsnummer(): Optional<number> {
        return this.isAlternatieveNormering
            ? (<GeldendVoortgangsdossierResultaat>this.resultaat).herkansingsnummerAlternatief
            : this.resultaat.herkansingsnummer;
    }

    get isDeeltoets(): boolean {
        return this.resultaat.type === DbResultaatkolomtype.DeeltoetsKolom;
    }

    get formattedResultaat(): Optional<string> {
        return this.isAlternatieveNormering
            ? (<GeldendVoortgangsdossierResultaat>this.resultaat).formattedResultaatAlternatief
            : this.resultaat.formattedResultaat;
    }
}
