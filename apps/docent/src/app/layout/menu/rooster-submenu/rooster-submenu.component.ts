import { ChangeDetectionStrategy, Component, HostBinding, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconChevronLinks, IconChevronRechts, IconSluiten, provideIcons } from 'harmony-icons';
import { Afspraak } from '../../../../generated/_types';
import { DeviceService } from '../../../core/services/device.service';
import { LesuurAfspraakComponent } from '../../../rooster-shared/components/rooster-afspraak/lesuur-afspraak/lesuur-afspraak.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';
import { BaseMenu } from '../base-menu';
import { MenuService } from '../menu.service';

@Component({
    selector: 'dt-rooster-submenu',
    templateUrl: './rooster-submenu.component.html',
    styleUrls: ['./rooster-submenu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, RouterModule, DtDatePipe, LesuurAfspraakComponent, IconDirective],
    providers: [provideIcons(IconChevronLinks, IconSluiten, IconChevronRechts)]
})
export class RoosterSubmenuComponent extends BaseMenu {
    @Input() afspraken: Afspraak[];
    @Input() vandaag: Date;

    @Input() @HostBinding('class.is-open') menuOpen: Optional<boolean>;

    constructor() {
        const deviceService = inject(DeviceService);
        const menuService = inject(MenuService);

        super(menuService, deviceService);
    }
}
