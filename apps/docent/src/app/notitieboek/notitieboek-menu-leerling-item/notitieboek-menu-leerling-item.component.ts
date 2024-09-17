import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Maybe, NotitieboekMenuLeerlingItemFieldsFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconReactieToevoegen, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';

type LeerlingGroepNaam = 'Stamgroep' | 'Lesgroepen';

@Component({
    selector: 'dt-notitieboek-menu-leerling-item',
    standalone: true,
    imports: [RouterModule, AvatarComponent, TooltipDirective, VolledigeNaamPipe, IconDirective],
    templateUrl: './notitieboek-menu-leerling-item.component.html',
    styleUrls: ['./notitieboek-menu-leerling-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconReactieToevoegen)]
})
export class NotitieboekMenuLeerlingItemComponent {
    @Input() leerlingItem: NotitieboekMenuLeerlingItemFieldsFragment;
    @Input() showGroepen: Maybe<LeerlingGroepNaam> = null;
}
