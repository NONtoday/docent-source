import { Component, ViewChild } from '@angular/core';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { LinkComponent } from '../../rooster-shared/components/link/link.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';

export interface Telefoonnummer {
    naam: string;
    nummer: string;
}

@Component({
    selector: 'dt-telefoonnummers-popup',
    templateUrl: './telefoonnummers-popup.component.html',
    styleUrls: ['./telefoonnummers-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, LinkComponent]
})
export class TelefoonnummersPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    telefoonnummers: Telefoonnummer[] = [];

    onTelefoonnummerClick(telefoonnummer: Telefoonnummer) {
        window.open(`tel:${telefoonnummer.nummer}`, '_blank');
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 200;
        popupSettings.showCloseButton = false;
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
