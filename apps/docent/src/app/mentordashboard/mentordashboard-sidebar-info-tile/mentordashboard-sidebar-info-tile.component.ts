import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { ColorToken, CssVarPipe, IconDirective, IconPillComponent, TooltipDirective } from 'harmony';
import { IconChevronOnder, IconInformatie, IconTrend, IconTrendBeneden, IconTrendBoven, provideIcons } from 'harmony-icons';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-mentordashboard-sidebar-info-tile',
    standalone: true,
    imports: [CommonModule, CssVarPipe, IconDirective, IconPillComponent, TooltipDirective],
    templateUrl: './mentordashboard-sidebar-info-tile.component.html',
    styleUrls: ['./mentordashboard-sidebar-info-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconTrend, IconTrendBeneden, IconTrendBoven, IconChevronOnder, IconInformatie)]
})
export class MentordashboardSidebarInfoTileComponent {
    @Input({ required: true }) titel: string;
    @Input({ required: true }) value: string;
    @Input() additionalText = '';
    @Input() trend: Optional<number>;
    @Input() trendTooltip: Optional<string>;
    @Input() valueColor: ColorToken = 'text-strong';
    @Input() valueSmallFont = false;
    @Input() @HostBinding('class.allow-hover') showChevron = false;
    @Input() infoTooltip: Optional<string>;
}
