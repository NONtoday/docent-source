import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { DbResultaatkolomtype, GetMentorDashboardCeResultatenQuery, Vak } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconDeeltoets, IconExamenVariant, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardDataService } from '../mentordashboard-data.service';

@Component({
    selector: 'dt-mentordashboard-resultaten-ce-sidebar',
    templateUrl: './mentordashboard-resultaten-ce-sidebar.component.html',
    styleUrls: ['./mentordashboard-resultaten-ce-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, SpinnerComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconDeeltoets, IconExamenVariant)]
})
export class MentordashboardResultatenCeSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    @Input() plaatsingId: string;
    @Input() vak: Vak;
    @Input() lichtingId: Optional<string>;

    dbResultaatKolomType = DbResultaatkolomtype;

    ceResultaten$: Observable<GetMentorDashboardCeResultatenQuery['getMentorDashboardCEResultaten']>;

    ngOnInit(): void {
        this.ceResultaten$ = this.mentordashboardDataService.getMentorDashboardCEResultaten(this.plaatsingId, this.vak.id, this.lichtingId);
    }

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }
}
