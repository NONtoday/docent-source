import { BreakpointState } from '@angular/cdk/layout';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DifferentiatiegroepKleur } from '../../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../../core/services/device.service';
import { KleurKeuzeComponent } from '../../../rooster-shared/components/kleur-keuze/kleur-keuze.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-kleur-keuze-popup',
    templateUrl: './kleur-keuze-popup.component.html',
    styleUrls: ['./kleur-keuze-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, KleurKeuzeComponent, AsyncPipe, KeyValuePipe]
})
export class KleurKeuzePopupComponent implements OnInit, Popup {
    private deviceService = inject(DeviceService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    kleurKeuzes = DifferentiatiegroepKleur;
    keuzeGrootte$: Observable<number>;

    onKeuzeClick: (kleur: DifferentiatiegroepKleur) => void;

    ngOnInit() {
        this.keuzeGrootte$ = this.deviceService.onDeviceChange$.pipe(map(this.mapBreakpointStateNaarKleurGrootte));
    }

    public mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 8;
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }

    private mapBreakpointStateNaarKleurGrootte = (state: BreakpointState) => {
        if (state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery]) {
            return 48;
        } else if (state.breakpoints[tabletQuery]) {
            return 40;
        } else {
            return 24;
        }
    };
}
