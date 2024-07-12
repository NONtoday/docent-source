import { Component, ViewChild } from '@angular/core';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { CijferhistorieComponent } from '../cijferhistorie/cijferhistorie.component';

@Component({
    selector: 'dt-cijferhistorie-popup',
    templateUrl: './cijferhistorie-popup.component.html',
    styleUrls: ['./cijferhistorie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, CijferhistorieComponent]
})
export class CijferhistoriePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    cellId: string;
    alternatiefNiveau = false;

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.width = 292;
        popupSettings.preferedDirection = [PopupDirection.Right, PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
