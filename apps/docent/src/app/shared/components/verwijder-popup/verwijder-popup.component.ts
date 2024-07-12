import { Component, ViewChild } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconSluiten, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-verwijder-popup',
    templateUrl: './verwijder-popup.component.html',
    styleUrls: ['./verwijder-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, IconDirective],
    providers: [provideIcons(IconVerwijderen, IconSluiten)]
})
export class VerwijderPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public onDeleteClick: () => unknown;
    public onCancelClick: () => unknown;
    public gtmTag: string;

    delete() {
        this.popup.onClose('delete');
        this.onDeleteClick();
    }

    cancel() {
        this.popup.onClose('cancel');
        this.onCancelClick?.();
    }

    public mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 144;
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
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
