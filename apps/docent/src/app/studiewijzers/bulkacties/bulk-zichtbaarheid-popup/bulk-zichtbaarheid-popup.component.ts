import { Component, ViewChild } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconNietZichtbaarCheckbox, IconZichtbaarCheckbox, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-bulk-zichtbaarheid-popup',
    templateUrl: './bulk-zichtbaarheid-popup.component.html',
    styleUrls: ['./bulk-zichtbaarheid-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, IconDirective],
    providers: [provideIcons(IconZichtbaarCheckbox, IconNietZichtbaarCheckbox)]
})
export class BulkZichtbaarheidPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    setZichtbaarheid: (zichtbaarheid: boolean) => unknown;

    mayClose(): boolean {
        return true;
    }

    onZichtbaarheidClick(zichtbaarheid: boolean) {
        this.setZichtbaarheid(zichtbaarheid);
        this.popup.onClose();
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 275;
        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 12;
        popupSettings.preferedDirection = [PopupDirection.Top];
        return popupSettings;
    }
}
