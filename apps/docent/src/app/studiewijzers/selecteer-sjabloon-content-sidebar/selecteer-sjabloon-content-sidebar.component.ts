import { ChangeDetectionStrategy, Component, Input, inject, output } from '@angular/core';
import { Sjabloon } from '@docent/codegen';
import { IconName, IconPijlLinks, IconSjabloon, provideIcons } from 'harmony-icons';
import { StudiewijzerContent } from '../../core/models/studiewijzers/studiewijzer.model';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { SjabloonSelectieComponent } from '../sjabloon-selectie/sjabloon-selectie.component';
import { SelecteerSjabloonToekenningenComponent } from './selecteer-sjabloon-toekenningen/selecteer-sjabloon-toekenningen.component';

@Component({
    selector: 'dt-selecteer-sjabloon-content-sidebar',
    templateUrl: './selecteer-sjabloon-content-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, SjabloonSelectieComponent, SelecteerSjabloonToekenningenComponent],
    providers: [provideIcons(IconPijlLinks, IconSjabloon)]
})
export class SelecteerSjabloonContentSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input() studiewijzerContent: StudiewijzerContent;

    onToevoegen = output<string[]>();

    inSelectiePagina: boolean;
    gekozenSjabloon: Optional<Sjabloon>;

    onSjabloonSelect(sjabloon: Sjabloon) {
        this.gekozenSjabloon = sjabloon;
        this.inSelectiePagina = true;
    }

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }

    onIconClick() {
        if (this.inSelectiePagina) {
            this.inSelectiePagina = false;
            this.gekozenSjabloon = null;
        }
    }

    get title(): string {
        return this.inSelectiePagina ? this.gekozenSjabloon!.naam : 'Kies sjabloon';
    }

    get icon(): IconName {
        return this.inSelectiePagina ? 'pijlLinks' : 'sjabloon';
    }

    get iconClickable(): boolean {
        return false;
    }
}
