import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotitieboekMenuStamgroepItem } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconGroep, IconReactieToevoegen, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';

@Component({
    selector: 'dt-notitieboek-menu-stamgroep-item',
    standalone: true,
    imports: [RouterModule, BackgroundIconComponent, IconDirective],
    templateUrl: './notitieboek-menu-stamgroep-item.component.html',
    styleUrls: ['./../notitieboek-menu-groep-item.scss', './notitieboek-menu-stamgroep-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGroep, IconReactieToevoegen)]
})
export class NotitieboekMenuStamgroepItemComponent {
    @Input() stamgroepItem: NotitieboekMenuStamgroepItem;
}
