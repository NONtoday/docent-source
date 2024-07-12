/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component, ViewChild } from '@angular/core';

import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { InlineEditComponent } from '../../../shared/components/inline-edit/inline-edit.component';

@Component({
    selector: 'dt-sjabloon-titel-bewerken-popup',
    templateUrl: './sjabloon-titel-bewerken-popup.component.html',
    styleUrls: ['./sjabloon-titel-bewerken-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, InlineEditComponent]
})
export class SjabloonTitelBewerkenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    sjabloonTitel: string;
    onSaveClick = (newTitel: string) => {};

    saveTitel(newTitel: string) {
        this.onSaveClick(newTitel);
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
