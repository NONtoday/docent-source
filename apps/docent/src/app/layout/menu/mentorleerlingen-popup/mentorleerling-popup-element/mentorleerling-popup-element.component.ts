import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MentorleerlingenQuery } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../../../rooster-shared/components/avatar/avatar.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-mentorleerling-popup-element',
    templateUrl: './mentorleerling-popup-element.component.html',
    styleUrls: ['./mentorleerling-popup-element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, VolledigeNaamPipe, IconDirective],
    providers: [provideIcons(IconInformatie)]
})
export class MentorleerlingPopupElementComponent {
    @Input() leerling: MentorleerlingenQuery['mentorleerlingen']['individueleMentorleerlingen'][number]['leerling'];
    @Input() stamgroep: Optional<MentorleerlingenQuery['mentorleerlingen']['stamgroepMentorleerlingen'][number]['stamgroep']>;
    @Input() isActive: boolean;
}
