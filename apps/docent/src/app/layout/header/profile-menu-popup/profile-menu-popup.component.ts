import { Component, ViewChild, inject } from '@angular/core';

import { IconDirective } from 'harmony';
import { IconSynchroniseren, IconUitloggen, provideIcons } from 'harmony-icons';
import { AuthService } from '../../../auth/auth.service';
import { DeviceService } from '../../../core/services/device.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { GebruikersInstellingenComponent } from './gebruikers-instellingen/gebruikers-instellingen.component';

@Component({
    selector: 'dt-profile-menu',
    templateUrl: './profile-menu-popup.component.html',
    styleUrls: ['./profile-menu-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, ButtonComponent, GebruikersInstellingenComponent, LinkComponent, IconDirective],
    providers: [provideIcons(IconSynchroniseren, IconUitloggen)]
})
export class ProfileMenuPopupComponent implements Popup {
    private authService = inject(AuthService);
    private deviceService = inject(DeviceService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    isPhone: boolean = this.deviceService.isPhone();
    isUpdateBeschikbaar: boolean;

    mayClose(): boolean {
        return true;
    }

    logoff() {
        this.authService.logoff();
    }

    ververs() {
        window.location.reload();
    }
}
