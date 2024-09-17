import { ChangeDetectionStrategy, Component, Input, inject, output } from '@angular/core';
import { Lesgroep } from '@docent/codegen';
import { getYear } from 'date-fns';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { LesgroepSelectieComponent } from '../lesgroep-selectie/lesgroep-selectie.component';

@Component({
    selector: 'dt-lesgroep-selectie-sidebar',
    templateUrl: './lesgroep-selectie-sidebar.component.html',
    styleUrls: ['./lesgroep-selectie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, LesgroepSelectieComponent],
    providers: [provideIcons(IconToevoegen)]
})
export class LesgroepSelectieSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input() initieleSelectie: Lesgroep[] = [];
    @Input() schooljaar = getYear(getSchooljaar(new Date()).start);

    onLesgroepSelectie = output<Lesgroep[]>();
}
