import { KeyValuePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-leerlingregistraties-signaleringen-totaal-popup',
    templateUrl: './leerlingregistraties-signaleringen-totaal-popup.component.html',
    styleUrls: ['./leerlingregistraties-signaleringen-totaal-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, KeyValuePipe]
})
export class LeerlingregistratiesSignaleringenTotaalPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    title: string;
    periodeNummer: number;
    isHuidigePeriode: boolean;
    signaleringen: Record<string, number>;
    onDetailClick: () => void;

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            ...popupSettings.appearance,
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup
        };
        return popupSettings;
    }
}
