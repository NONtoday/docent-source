import { Component, ViewChild } from '@angular/core';

import { RouterLink } from '@angular/router';
import { Studiewijzer } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBewerken, IconChevronRechts, IconGroep, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../rooster-shared/utils/utils';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-synchronisatie-popup',
    templateUrl: './synchronisatie-popup.component.html',
    styleUrls: ['./synchronisatie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, RouterLink, BackgroundIconComponent, PopupButtonComponent, IconDirective],
    providers: [provideIcons(IconGroep, IconChevronRechts, IconBewerken)]
})
export class SynchronisatiePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    toonStudiewijzers = true;
    studiewijzers: Studiewijzer[] = [];
    synchronisatieStartweek: Optional<number>;

    studiewijzer: Studiewijzer;

    bewerkSynchonisatiesFn: () => void;

    openSynchronisatieSidebar(event: Event) {
        event.preventDefault();
        this.bewerkSynchonisatiesFn();
        this.popup.onClose();
    }

    public mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Top];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 248;
        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 16;
        return popupSettings;
    }
}
