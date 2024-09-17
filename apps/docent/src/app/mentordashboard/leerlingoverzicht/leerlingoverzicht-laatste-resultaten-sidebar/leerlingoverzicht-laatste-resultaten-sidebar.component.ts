import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { Maybe, MentordashboardResultatenInstellingen, RecentResultaat } from '@docent/codegen';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { MentordashboardLaatsteResultatenListComponent } from '../../mentordashboard-laatste-resultaten-list/mentordashboard-laatste-resultaten-list.component';
import { Resultatensoort } from '../../mentordashboard.utils';

@Component({
    selector: 'dt-leerlingoverzicht-laatste-resultaten-sidebar',
    standalone: true,
    imports: [SidebarComponent, MentordashboardLaatsteResultatenListComponent],
    templateUrl: './leerlingoverzicht-laatste-resultaten-sidebar.component.html',
    styleUrl: './leerlingoverzicht-laatste-resultaten-sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtLaatsteResultatenSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input({ required: true }) laatsteResultaten: RecentResultaat[];
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) resultatenSoort: Resultatensoort;
    @Input({ required: true }) leerlingId: string;
    @Input({ required: true }) trendindicatie: Maybe<number>;
    @Input({ required: true }) aantalVoorTrendindicatie: number;

    public title = computed(() => (this.resultatenSoort === 'resultaten' ? 'Laatste resultaten' : 'Laatste SE resultaten'));
}
