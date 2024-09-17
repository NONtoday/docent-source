import { AsyncPipe } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { LesgroepenQuery } from '@docent/codegen';
import { getYear } from 'date-fns';
import { SpinnerComponent } from 'harmony';
import { IconGroep, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { getSchooljaar } from '../../utils/date.utils';
import { BackgroundIconComponent } from '../background-icon/background-icon.component';
import { Popup, PopupComponent } from '../popup/popup.component';

@Component({
    selector: 'dt-lesgroepen-van-docent-popup',
    templateUrl: './lesgroepen-van-docent-popup.component.html',
    styleUrls: ['./lesgroepen-van-docent-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, BackgroundIconComponent, SpinnerComponent, AsyncPipe],
    providers: [provideIcons(IconGroep)]
})
export class LesgroepenVanDocentPopupComponent implements Popup {
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    lesgroepenVanDocent$: Observable<LesgroepenQuery['lesgroepen']>;

    onLesgroep: (lesgroep: LesgroepenQuery['lesgroepen'][number], lesgroepen: LesgroepenQuery['lesgroepen']) => void;

    constructor() {
        const huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
        this.lesgroepenVanDocent$ = this.medewerkerDataService.getLesgroepenVanSchooljaar(huidigSchooljaar);
    }

    public mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 320;
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
