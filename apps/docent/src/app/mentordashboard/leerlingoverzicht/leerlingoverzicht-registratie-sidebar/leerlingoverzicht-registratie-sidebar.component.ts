import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MentordashboardOverzichtLeerlingRegistratieWithContent } from '../../../core/models/mentordashboard.model';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { MentordashboardOverzichtSidebarRegistratiedetailsComponent } from '../../mentordashboard-overzicht-sidebar-registratiedetails/mentordashboard-overzicht-sidebar-registratiedetails.component';

@Component({
    selector: 'dt-leerlingoverzicht-registratie-sidebar',
    standalone: true,
    imports: [SidebarComponent, MentordashboardOverzichtSidebarRegistratiedetailsComponent],
    templateUrl: './leerlingoverzicht-registratie-sidebar.component.html',
    styleUrls: ['./leerlingoverzicht-registratie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtRegistratieSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input({ required: true }) leerlingRegistratie: MentordashboardOverzichtLeerlingRegistratieWithContent;
}
