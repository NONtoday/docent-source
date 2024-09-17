import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Vak } from '@docent/codegen';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconPijlRechts, provideIcons } from 'harmony-icons';
import { Optional } from '../../../rooster-shared/utils/utils';
import { CommaResultPipe } from '../../../shared/pipes/comma-result.pipe';
import { MentordashboardResultaatTrendColorPipe } from '../../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../../pipes/mentordashboard-resultaat-trend-tooltip.pipe';
import { LeerlingoverzichtResultatenCijferBalk, LeerlingoverzichtResultatenVakGrafiekData } from '../leerlingoverzicht.model';
import { LeerlingoverzichtResultatenCijferbalkComponent } from './leerlingoverzicht-resultaten-cijferbalk/leerlingoverzicht-resultaten-cijferbalk.component';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten-vak-grafiek',
    standalone: true,
    imports: [
        IconDirective,
        CommaResultPipe,
        LeerlingoverzichtResultatenCijferbalkComponent,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendTooltipPipe,
        MentordashboardResultaatTrendIconPipe,
        TooltipDirective
    ],
    templateUrl: './leerlingoverzicht-resultaten-vak-grafiek.component.html',
    styleUrl: './leerlingoverzicht-resultaten-vak-grafiek.component.scss',
    providers: [provideIcons(IconPijlRechts)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenVakGrafiekComponent {
    @Input({ required: true }) vak: Vak;
    @Input({ required: true }) toonAlternatieveNormering: boolean;
    @Input({ required: true }) alternatieveNormering: boolean;
    @Input({ required: true }) cijferbalken: LeerlingoverzichtResultatenCijferBalk[];
    @Input({ required: true }) trend: LeerlingoverzichtResultatenVakGrafiekData['trend'];
    @Input({ required: true }) tooltip: string;
    @Input({ required: true }) anderNiveau: Optional<string>;
    @Input({ required: true }) vrijstelling: boolean;
    @Input({ required: true }) ontheffing: boolean;
}
