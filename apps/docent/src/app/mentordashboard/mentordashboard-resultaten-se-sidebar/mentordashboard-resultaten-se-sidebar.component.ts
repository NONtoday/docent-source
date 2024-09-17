import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { GetMentorDashboardSeResultatenQuery, ResultaatBijzonderheid, Vak } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconWaarschuwing, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardResultaatComponent } from '../mentordashboard-resultaat/mentordashboard-resultaat.component';

@Component({
    selector: 'dt-mentordashboard-resultaten-se-sidebar',
    templateUrl: './mentordashboard-resultaten-se-sidebar.component.html',
    styleUrls: ['./mentordashboard-resultaten-se-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, MentordashboardResultaatComponent, TooltipDirective, SpinnerComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconWaarschuwing)]
})
export class MentordashboardResultatenSeSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    @Input() plaatsingId: string;
    @Input() vak: Vak;
    @Input() lichtingId: Optional<string>;

    resultaatBijzonderheid = ResultaatBijzonderheid;

    seResultaten$: Observable<GetMentorDashboardSeResultatenQuery['getMentorDashboardSEResultaten']>;

    ngOnInit(): void {
        this.seResultaten$ = this.mentordashboardDataService.getMentorDashboardSEResultaten(this.plaatsingId, this.vak.id, this.lichtingId);
    }

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }
}
