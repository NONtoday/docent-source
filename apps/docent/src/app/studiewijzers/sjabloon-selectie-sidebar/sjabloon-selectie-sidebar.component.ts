import { ChangeDetectionStrategy, Component, Input, inject, output } from '@angular/core';
import { fadeOutOnLeaveAnimation } from 'angular-animations';
import { ButtonComponent } from 'harmony';
import { IconName } from 'harmony-icons';
import { Sjabloon, SjabloonFieldsFragment, Studiewijzeritem } from '../../../generated/_types';
import { SidebarService } from '../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { SjabloonSelectieComponent } from '../sjabloon-selectie/sjabloon-selectie.component';

@Component({
    selector: 'dt-sjabloon-selectie-sidebar',
    templateUrl: './sjabloon-selectie-sidebar.component.html',
    styleUrls: ['./sjabloon-selectie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [fadeOutOnLeaveAnimation({ duration: 100 })],
    standalone: true,
    imports: [SidebarComponent, SjabloonSelectieComponent, OutlineButtonComponent, ButtonComponent]
})
export class SjabloonSelectieSidebarComponent extends BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input() bronSjabloon: SjabloonFieldsFragment;
    @Input() buttonText: string;
    @Input() sidebarTitle: string;
    @Input() sidebarIcon: IconName;
    @Input() toekenningIds: string[];
    @Input() studiewijzerItems: Studiewijzeritem[];

    onSubmit = output<Sjabloon[]>();

    geselecteerdeSjablonen: Sjabloon[] = [];

    onSubmitClick() {
        this.onSubmit.emit(this.geselecteerdeSjablonen);
    }

    selecteerSjabloon(sjabloon: Sjabloon) {
        if (this.geselecteerdeSjablonen.some((sj) => sj.id === sjabloon.id)) {
            this.geselecteerdeSjablonen = this.geselecteerdeSjablonen.filter((sj) => sj.id !== sjabloon.id);
        } else {
            this.geselecteerdeSjablonen.push(sjabloon);
        }
    }
}
