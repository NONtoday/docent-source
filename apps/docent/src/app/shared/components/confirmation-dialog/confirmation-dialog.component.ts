import { Component, OnInit, ViewChild } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconName, IconSluiten, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { Appearance, PopupSettings } from '../../../core/popup/popup.settings';
import { HarmonyColorName } from '../../../rooster-shared/colors';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, ButtonComponent, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconSluiten)]
})
export class ConfirmationDialogComponent implements OnInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public title = '';
    public message = '';
    public cancelLabel = '';
    public actionLabel = '';
    public icon: IconName;
    public warning = false;
    public outlineConfirmKnop: boolean;
    public buttonColor: HarmonyColorName;
    public iconColor: HarmonyColorName;
    public cancelButtonColor: HarmonyColorName = 'typography_3';
    public cancelIcon: IconName;
    public cancelIconColor: HarmonyColorName = 'typography_3';
    public showLoaderOnConfirm: boolean;
    public cancelGtmTag: string;
    public confirmGtmTag: string;
    public cancelWordWrap = false;

    public onConfirmFn: () => boolean;
    public onCancelFn: () => void;

    private _result = new Subject<boolean>();

    ngOnInit() {
        this.popup.renderPopup();
    }

    public mayClose(instigator: string): boolean {
        this._result.next(instigator === 'handled');
        return true;
    }

    public onActionClick() {
        const handled = this.onConfirmFn();
        if (!this.showLoaderOnConfirm) {
            this.popup.onClose(handled ? 'handled' : 'cancel');
        }
    }

    onCancelClick() {
        this.onCancelFn?.();
        this.popup.onClose('handled');
    }

    onExitClick() {
        this.popup.onClose('cross');
    }

    public getResult(): Subject<boolean> {
        return this._result;
    }

    static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.clickOutSideToClose = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        return popupSettings;
    }
}
