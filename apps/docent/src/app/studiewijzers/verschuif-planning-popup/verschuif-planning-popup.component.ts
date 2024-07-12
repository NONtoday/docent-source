import { Component, ViewChild } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInformatie, IconPijlBoven, IconPijlOnder, provideIcons } from 'harmony-icons';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';

export type PlanningVerschuifDirection = 'omhoog' | 'omlaag';

@Component({
    selector: 'dt-verschuif-planning-popup',
    templateUrl: './verschuif-planning-popup.component.html',
    styleUrls: ['./verschuif-planning-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, BackgroundIconComponent, TooltipDirective, OutlineButtonComponent, ButtonComponent, IconDirective],
    providers: [provideIcons(IconPijlOnder, IconPijlBoven, IconInformatie)]
})
export class VerschuifPlanningPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    // inputs
    direction: PlanningVerschuifDirection;
    opslaanFn: (aantalWeken: number) => void;
    showOmlaagWarningVanaf = 6;
    showOmhoogWarningVanaf = 6;
    showInfoIcon = true;

    // eigen props
    selected = 1;

    onAnnulerenClick() {
        this.popup.onClose();
    }

    onOpslaanClick() {
        this.opslaanFn(this.selected);
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 275;
        popupSettings.clickOutSideToClose = true;
        popupSettings.scrollable = true;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }

    mayClose(): boolean {
        return true;
    }
}
