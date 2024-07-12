import { Component, ViewChild } from '@angular/core';

import { IconLink, IconSjabloon, IconStudiewijzer, IconUploaden, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../../rooster-shared/utils/utils';
import { PopupButtonComponent } from '../../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-jaarbijlage-toevoegen-popup',
    templateUrl: './jaarbijlage-toevoegen-popup.component.html',
    styleUrls: ['./jaarbijlage-toevoegen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, PopupButtonComponent],
    providers: [provideIcons(IconUploaden, IconLink, IconStudiewijzer, IconSjabloon)]
})
export class JaarbijlageToevoegenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public inSjabloon: boolean;
    public onStudiewijzerClick: () => unknown;
    public onSjabloonClick: Optional<() => unknown>;
    public onUrlClick: () => unknown;
    public onApparaatClick: () => unknown;

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 200;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Left, PopupDirection.Left, PopupDirection.Top];

        return popupSettings;
    }
}
