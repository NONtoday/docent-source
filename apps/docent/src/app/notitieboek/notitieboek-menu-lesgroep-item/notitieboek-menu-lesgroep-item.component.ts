import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotitieboekMenuLesgroepItem } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconGroep, IconReactieToevoegen, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';

@Component({
    selector: 'dt-notitieboek-menu-lesgroep-item',
    standalone: true,
    imports: [RouterModule, BackgroundIconComponent, IconDirective],
    templateUrl: './notitieboek-menu-lesgroep-item.component.html',
    styleUrls: ['./../notitieboek-menu-groep-item.scss', './notitieboek-menu-lesgroep-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGroep, IconReactieToevoegen)]
})
export class NotitieboekMenuLesgroepItemComponent {
    @Input() lesgroepItem: NotitieboekMenuLesgroepItem;
}
