import { Component, Input, ViewChild } from '@angular/core';
import { GeldendAdviesResultaat } from '../../../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-groepsoverzicht-sidebar-advieskolommen-popup',
    standalone: true,
    imports: [PopupComponent],
    templateUrl: './groepsoverzicht-sidebar-advieskolommen-popup.component.html',
    styleUrls: ['./groepsoverzicht-sidebar-advieskolommen-popup.component.scss']
})
export class GroepsoverzichtSidebarAdvieskolommenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input({ required: true }) kolommen: GeldendAdviesResultaat[];
    @Input({ required: true }) vaknaam: string;
    mayClose(): boolean {
        return true;
    }

    static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.width = 224;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }
}
