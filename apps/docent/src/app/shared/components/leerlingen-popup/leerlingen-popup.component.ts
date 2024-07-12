import { AsyncPipe } from '@angular/common';
import { Component, HostBinding, ViewChild } from '@angular/core';
import { SpinnerComponent } from 'harmony';
import { Observable } from 'rxjs';
import { PartialLeerlingFragment } from '../../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-leerlingen-popup',
    templateUrl: './leerlingen-popup.component.html',
    styleUrls: ['./leerlingen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, AvatarComponent, SpinnerComponent, AsyncPipe, VolledigeNaamPipe]
})
export class LeerlingenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @HostBinding('class.met-hover') public onLeerlingSelected: Optional<(leerling: PartialLeerlingFragment) => void>;

    public showHeader = true;
    public leerlingen$: Observable<PartialLeerlingFragment[]>;

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Right];
        popupSettings.width = 320;

        return popupSettings;
    }

    public onLeerlingClick(leerling: PartialLeerlingFragment) {
        this.onLeerlingSelected?.(leerling);
    }
}
