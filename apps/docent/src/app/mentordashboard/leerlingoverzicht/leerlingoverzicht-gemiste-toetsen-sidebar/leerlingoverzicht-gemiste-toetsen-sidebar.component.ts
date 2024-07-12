import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { GemistResultaat } from '../../../../generated/_types';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { MentordashboardGemisteToetsenListComponent } from '../../mentordashboard-gemiste-toetsen-list/mentordashboard-gemiste-toetsen-list.component';

@Component({
    selector: 'dt-leerlingoverzicht-gemiste-toetsen-sidebar',
    standalone: true,
    imports: [SidebarComponent, MentordashboardGemisteToetsenListComponent],
    templateUrl: './leerlingoverzicht-gemiste-toetsen-sidebar.component.html',
    styleUrl: './leerlingoverzicht-gemiste-toetsen-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtGemisteToetsenSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input({ required: true }) gemisteToetsen: GemistResultaat[];
    @Input({ required: true }) title: string;
}
