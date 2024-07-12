import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconTrend, IconTrendBeneden, IconTrendBoven, provideIcons } from 'harmony-icons';
import { GroepsoverzichtRegistratieTellingen, MentordashboardOverzichtTijdspanOptie } from '../../../core/models/mentordashboard.model';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { MentordashboardRegistratieTrendTooltipPipe } from '../../pipes/mentordashboard-registratie-trend-tooltip.pipe';

@Component({
    selector: 'dt-groepsoverzicht-leerling',
    standalone: true,
    templateUrl: './groepsoverzicht-leerling.component.html',
    styleUrls: ['./groepsoverzicht-leerling.component.scss'],
    imports: [AvatarComponent, VolledigeNaamPipe, IconDirective, TooltipDirective, MentordashboardRegistratieTrendTooltipPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconTrend, IconTrendBeneden, IconTrendBoven)]
})
export class GroepsoverzichtLeerlingComponent {
    @Input({ required: true }) registratieLeerling: GroepsoverzichtRegistratieTellingen;
    @Input({ required: true }) tijdspan: MentordashboardOverzichtTijdspanOptie;

    @Input() set size(size: number) {
        this.avatarSize = size;
        this.avatarFontSize = size === AvatarSizePxMedium ? AvatarFontSizePxMedium : AvatarFontSizePxSmall;
    }

    avatarSize = AvatarSizePxSmall;
    avatarFontSize = AvatarFontSizePxSmall;
}

const AvatarSizePxMedium = 32;
const AvatarSizePxSmall = 24;
const AvatarFontSizePxMedium = 10;
const AvatarFontSizePxSmall = 9;
