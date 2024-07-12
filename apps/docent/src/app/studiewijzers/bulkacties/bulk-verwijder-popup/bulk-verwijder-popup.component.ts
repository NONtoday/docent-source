import { Component, ViewChild } from '@angular/core';
import { IconSluiten, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Appearance, PopupSettings } from '../../../core/popup/popup.settings';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-bulk-verwijder-popup',
    templateUrl: './bulk-verwijder-popup.component.html',
    styleUrls: ['./bulk-verwijder-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent],
    providers: [provideIcons(IconVerwijderen, IconSluiten)]
})
export class BulkVerwijderPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    aantalItems: number;
    popupContext: string;
    verwijderItems: () => unknown;

    mayClose(): boolean {
        return true;
    }

    onCancel() {
        this.popup.onClose();
    }

    onVerwijderenClick() {
        this.popup.onClose();
        this.verwijderItems();
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 225;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
