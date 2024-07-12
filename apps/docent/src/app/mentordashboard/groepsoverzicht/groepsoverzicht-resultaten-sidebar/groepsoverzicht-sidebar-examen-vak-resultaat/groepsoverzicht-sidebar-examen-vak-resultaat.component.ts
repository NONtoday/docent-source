import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CssVarPipe, IconPillComponent, PillComponent, TooltipDirective } from 'harmony';
import { IconHogerNiveau, IconTrend, provideIcons } from 'harmony-icons';
import {
    MentorDashboardExamenVakSamenvattendeResultatenFieldsFragment,
    MentordashboardResultatenInstellingen
} from '../../../../../generated/_types';
import { createTrendwaardePill } from '../../../mentordashboard.utils';
import { MentordashboardResultaatKleurPipe } from '../../../pipes/mentordashboard-resultaat-kleur.pipe';
import { TrendwaardePill } from '../groepsoverzicht-sidebar-vak-resultaat/groepsoverzicht-sidebar-vak-resultaat.component';

@Component({
    selector: 'dt-groepsoverzicht-sidebar-examen-vak-resultaat',
    standalone: true,
    imports: [CommonModule, IconPillComponent, PillComponent, MentordashboardResultaatKleurPipe, CssVarPipe, TooltipDirective],
    templateUrl: './groepsoverzicht-sidebar-examen-vak-resultaat.component.html',
    styleUrls: ['./groepsoverzicht-sidebar-examen-vak-resultaat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconHogerNiveau, IconTrend)]
})
export class GroepsoverzichtSidebarExamenVakResultaatComponent implements OnChanges {
    @Input({ required: true }) public trend: MentorDashboardExamenVakSamenvattendeResultatenFieldsFragment;
    @Input({ required: true }) public instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) public view: 'trend' | 'examencijfers';

    public trendwaardePill: TrendwaardePill;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.trend) {
            this.trendwaardePill = createTrendwaardePill(
                this.trend.trendindicatieSE,
                this.trend.aantalResultatenVoorTrendindicatieSE,
                this.trend.vak.naam,
                true
            );
        }
    }
}
