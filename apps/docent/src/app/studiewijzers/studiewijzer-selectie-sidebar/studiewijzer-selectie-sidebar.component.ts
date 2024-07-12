import { ChangeDetectionStrategy, Component, Input, inject, output } from '@angular/core';
import { ButtonComponent } from 'harmony';
import { IconName, IconStudiewijzer, provideIcons } from 'harmony-icons';
import { Studiewijzer, StudiewijzerFieldsFragment, Studiewijzeritem } from '../../../generated/_types';
import { SidebarService } from '../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { StudiewijzerMultiselectComponent } from '../studiewijzer-multiselect/studiewijzer-multiselect.component';

@Component({
    selector: 'dt-studiewijzer-selectie-sidebar',
    templateUrl: './studiewijzer-selectie-sidebar.component.html',
    styleUrls: ['./studiewijzer-selectie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, StudiewijzerMultiselectComponent, OutlineButtonComponent, ButtonComponent],
    providers: [provideIcons(IconStudiewijzer)]
})
export class StudiewijzerSelectieSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input() studiewijzer: StudiewijzerFieldsFragment;
    @Input() buttonText: string;
    @Input() sidebarTitle: string;
    @Input() sidebarIcon: IconName;
    @Input() toekenningIds: string[];
    @Input() studiewijzerItems: Studiewijzeritem[];

    onSubmit = output<Studiewijzer[]>();

    geselecteerdeStudiewijzers: Studiewijzer[] = [];
}
