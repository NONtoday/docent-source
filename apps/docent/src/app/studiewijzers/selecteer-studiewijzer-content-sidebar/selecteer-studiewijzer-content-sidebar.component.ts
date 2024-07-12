import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';

import { IconPijlLinks, IconStudiewijzer, provideIcons } from 'harmony-icons';
import { Studiewijzer } from '../../../generated/_types';
import { SidebarPage } from '../../core/models/studiewijzers/studiewijzer.model';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { StudiewijzerSelectieComponent } from '../studiewijzer-selectie/studiewijzer-selectie.component';
import { SelecteerContentPageComponent } from './selecteer-content-page/selecteer-content-page.component';

@Component({
    selector: 'dt-selecteer-studiewijzer-content-sidebar',
    templateUrl: './selecteer-studiewijzer-content-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, StudiewijzerSelectieComponent, SelecteerContentPageComponent],
    providers: [provideIcons(IconStudiewijzer, IconPijlLinks)]
})
export class SelecteerStudiewijzerContentSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() weeknummer: number;
    @Input() sjabloonId: string;

    public pages: SidebarPage[] = [
        {
            titel: 'Kies studiewijzer',
            icon: 'studiewijzer',
            iconClickable: false,
            pagenumber: 1
        },
        {
            titel: '',
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 2,
            onIconClick: () => (this.currentPage = this.pages[0])
        }
    ];
    public currentPage = this.pages[0];
    public selectedStudiewijzer: Studiewijzer;

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }

    onStudiewijzerSelect(studiewijzer: Studiewijzer) {
        this.selectedStudiewijzer = studiewijzer;
        this.pages[1].titel = studiewijzer.lesgroep.naam;
        this.currentPage = this.pages[1];
        this.changeDetector.markForCheck();
    }
}
