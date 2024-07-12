import { DeviceService } from '../../core/services/device.service';
import { MenuService } from './menu.service';

export abstract class BaseMenu {
    constructor(
        protected menuService: MenuService,
        protected deviceService: DeviceService
    ) {}

    public openMenu(menu: string, event?: Event) {
        this.menuService.openMenu(menu);
        if (event) {
            event.stopPropagation();
        }
    }

    public closeMenu(menu: string, event?: Event) {
        this.menuService.closeMenu(menu);
        if (event) {
            event.stopPropagation();
        }
    }

    public closeAllMenus(event?: Event) {
        this.menuService.closeAllMenus();
        if (event) {
            event.stopPropagation();
        }
    }

    public onMouseEnter(menu: string, event?: Event) {
        if (this.deviceService.isPhone()) {
            return;
        }
        this.openMenu(menu, event);
        if (event) {
            event.stopPropagation();
        }
    }

    public onMouseLeave(menu: string, event?: Event) {
        if (this.deviceService.isPhone()) {
            return;
        }
        this.closeMenu(menu, event);
    }
}
