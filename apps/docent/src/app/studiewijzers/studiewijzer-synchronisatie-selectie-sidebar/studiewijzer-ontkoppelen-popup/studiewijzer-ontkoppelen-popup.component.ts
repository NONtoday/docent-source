import { Component, ViewChild } from '@angular/core';
import { Studiewijzer } from '@docent/codegen';
import { IconCheck, IconSluiten, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { PopupButtonComponent } from '../../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-studiewijzer-ontkoppelen-popup',
    templateUrl: './studiewijzer-ontkoppelen-popup.component.html',
    styleUrls: ['./studiewijzer-ontkoppelen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, PopupButtonComponent],
    providers: [provideIcons(IconCheck, IconVerwijderen, IconSluiten)]
})
export class StudiewijzerOntkoppelenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public studiewijzer: Studiewijzer;
    public bewaarFn: () => void;
    public verwijderFn: () => void;

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Left, PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 200;
        return popupSettings;
    }
}
