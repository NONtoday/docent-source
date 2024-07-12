import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CssVarPipe, IconDirective, TooltipDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardResultaatTrendColorPipe } from '../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTextPipe } from '../pipes/mentordashboard-resultaat-trend-text.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../pipes/mentordashboard-resultaat-trend-tooltip.pipe';

@Component({
    selector: 'dt-mentordashboard-trend-met-info',
    standalone: true,
    imports: [
        IconDirective,
        MentordashboardResultaatTrendIconPipe,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendTooltipPipe,
        MentordashboardResultaatTrendTextPipe,
        CssVarPipe,
        TooltipDirective
    ],
    providers: [provideIcons(IconInformatie)],
    templateUrl: './mentordashboard-trend-met-info.component.html',
    styleUrl: './mentordashboard-trend-met-info.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentordashboardTrendMetInfoComponent {
    @Input({ required: true }) trendindicatie: Optional<number>;
    @Input({ required: true }) aantalVoorTrendindicatie: number;
}
