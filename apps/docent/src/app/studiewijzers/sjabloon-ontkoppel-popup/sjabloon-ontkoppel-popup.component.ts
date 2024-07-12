import { Component, ViewChild } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInformatie, IconOntkoppelen, provideIcons } from 'harmony-icons';
import { Sjabloon } from '../../../generated/_types';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { StudiewijzerLesgroepNaamPipe } from '../../shared/pipes/studiewijzer-lesgroep-naam.pipe';

@Component({
    selector: 'dt-sjabloon-ontkoppel-popup',
    templateUrl: './sjabloon-ontkoppel-popup.component.html',
    styleUrls: ['./sjabloon-ontkoppel-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, StudiewijzerLesgroepNaamPipe, IconDirective],
    providers: [provideIcons(IconInformatie, IconOntkoppelen)]
})
export class SjabloonOntkoppelPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    sjablonen: Sjabloon[];
    inDetail?: boolean;

    ontkoppelStudiewijzersVanSjablonen: () => unknown;

    mayClose(): boolean {
        return true;
    }

    onOntkoppelen() {
        this.ontkoppelStudiewijzersVanSjablonen();
        this.popup.onClose();
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 500;
        popupSettings.clickOutSideToClose = false;
        popupSettings.scrollable = true;
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        return popupSettings;
    }
}
