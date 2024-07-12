import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CssVarPipe, IconDirective, TooltipDirective } from 'harmony';
import { IconChevronRechts, IconInformatie, IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, provideIcons } from 'harmony-icons';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardResultaatTrendColorPipe } from '../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTextPipe } from '../pipes/mentordashboard-resultaat-trend-text.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../pipes/mentordashboard-resultaat-trend-tooltip.pipe';

@Component({
    selector: 'dt-mentordashboard-resultaat-trend-info-tile',
    standalone: true,
    imports: [
        IconDirective,
        TooltipDirective,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendIconPipe,
        MentordashboardResultaatTrendTooltipPipe,
        MentordashboardResultaatTrendTextPipe,
        CssVarPipe
    ],
    providers: [provideIcons(IconChevronRechts, IconInformatie, IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven)],
    templateUrl: './mentordashboard-resultaat-trend-info-tile.component.html',
    styleUrls: ['./mentordashboard-resultaat-trend-info-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentordashboardResultaatTrendInfoTileComponent {
    @Input() aantalResultatenVoorTrendindicatie: number;
    @Input() trendindicatie: Optional<number>;
}
