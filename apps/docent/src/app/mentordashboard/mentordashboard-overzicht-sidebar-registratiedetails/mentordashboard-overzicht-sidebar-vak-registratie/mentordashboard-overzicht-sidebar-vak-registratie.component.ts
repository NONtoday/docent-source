import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { IconDirective, IconPillComponent, NotificationColor, NotificationSolidComponent, TooltipDirective } from 'harmony';
import { IconToets, IconToetsGroot, IconTrendBeneden, IconTrendBoven, provideIcons } from 'harmony-icons';
import { HuiswerkType, PeriodeVakRegistratieDetails } from '../../../../generated/_types';
import { Optional } from '../../../rooster-shared/utils/utils';
import { UrenDurationPipe } from '../../../shared/pipes/uren-duration.pipe';

@Component({
    selector: 'dt-mentordashboard-overzicht-sidebar-vak-registratie',
    standalone: true,
    imports: [IconDirective, IconPillComponent, NotificationSolidComponent, TooltipDirective, UrenDurationPipe],
    templateUrl: './mentordashboard-overzicht-sidebar-vak-registratie.component.html',
    styleUrls: ['./mentordashboard-overzicht-sidebar-vak-registratie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconToetsGroot, IconToets, IconTrendBeneden, IconTrendBoven)]
})
export class MentordashboardOverzichtSidebarVakRegistratieComponent implements OnInit {
    @Input({ required: true }) vakRegistratie: PeriodeVakRegistratieDetails;
    @Input({ required: true }) isAfwezigheidsCategorie: boolean;
    @Input() notificationColor: Optional<NotificationColor>;
    @Input() totaalMinuten: Optional<number>;
    @Input() trendindicatie: Optional<number>;
    @Input() trendindicatieTooltip: Optional<string>;

    @HostBinding('class.with-trend') get withTrend(): boolean {
        return this.trendindicatie !== null && this.trendindicatie !== undefined;
    }

    aantalReguliereToetsen = 0;
    aantalGroteToetsen = 0;

    tooltipReguliereToetsen = '';
    tooltipGroteToetsen = '';

    ngOnInit(): void {
        const aantalKleineToetsen = this.vakRegistratie.registraties.filter((r) => r.toetsmoment === HuiswerkType.TOETS).length;
        const aantalRoosterToetsen = this.vakRegistratie.registraties.filter((r) => r.roosterToets).length;

        this.aantalGroteToetsen = this.vakRegistratie.registraties.filter((r) => r.toetsmoment === HuiswerkType.GROTE_TOETS).length;
        this.aantalReguliereToetsen = aantalKleineToetsen + aantalRoosterToetsen;

        this.tooltipGroteToetsen = `${this.aantalGroteToetsen}x grote toets`;
        this.tooltipReguliereToetsen = `
            ${aantalRoosterToetsen > 0 ? `${aantalRoosterToetsen}x roostertoets` : ''}
            ${aantalRoosterToetsen > 0 && aantalKleineToetsen > 0 ? '<br>' : ''}
            ${aantalKleineToetsen > 0 ? `${aantalKleineToetsen}x toets` : ''}
        `;
    }
}
