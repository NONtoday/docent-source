import { Component, Input, ViewChild } from '@angular/core';
import { MentorDashboardVakPeriodeResultaten } from '@docent/codegen';
import { IconDirective, NotificationCounterComponent, PillComponent, TooltipDirective } from 'harmony';
import { Appearance } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { MentordashboardGemisteToetsenListComponent } from '../mentordashboard-gemiste-toetsen-list/mentordashboard-gemiste-toetsen-list.component';

@Component({
    selector: 'dt-mentordashboard-rapportcijfer-popup',
    standalone: true,
    imports: [
        PopupComponent,
        IconDirective,
        PillComponent,
        TooltipDirective,
        NotificationCounterComponent,
        DtDatePipe,
        MentordashboardGemisteToetsenListComponent
    ],
    templateUrl: './mentordashboard-rapportcijfer-popup.component.html',
    styleUrls: ['./mentordashboard-rapportcijfer-popup.component.scss']
})
export class MentordashboardRapportCijferPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input({ required: true }) resultaten: MentorDashboardVakPeriodeResultaten;

    mayClose(): boolean {
        return true;
    }

    public static get popupSettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;
        popupSettings.width = 320;
        popupSettings.scrollable = true;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }
}
