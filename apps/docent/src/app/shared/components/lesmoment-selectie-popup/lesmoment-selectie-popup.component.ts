import { Component, Input, ViewChild } from '@angular/core';
import { ToekomendeAfsprakenQuery } from '@docent/codegen';
import { TooltipDirective } from 'harmony';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { CollegaAvatarsComponent } from '../../../rooster-shared/components/collega-avatars/collega-avatars.component';
import { LesuurComponent } from '../../../rooster-shared/components/lesuur/lesuur.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../../rooster-shared/pipes/roostertoets.pipe';

@Component({
    selector: 'dt-lesmoment-selectie-popup',
    templateUrl: './lesmoment-selectie-popup.component.html',
    styleUrls: ['./lesmoment-selectie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, LesuurComponent, TooltipDirective, CollegaAvatarsComponent, RoosterToetsPipe, DtDatePipe]
})
export class LesmomentSelectiePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() showHeleDagOptie = false;
    @Input() dag: Date;
    @Input() afspraken: ToekomendeAfsprakenQuery['toekomendeAfspraken'];
    @Input() closeOnSelection = true;
    @Input() onAfspraakSelection: (selectedAfspraak: ToekomendeAfsprakenQuery['toekomendeAfspraken'][number]) => void;
    @Input() onHeleDagSelection: (selectedDag: Date) => void;

    select(afspraak: ToekomendeAfsprakenQuery['toekomendeAfspraken'][number]) {
        this.onAfspraakSelection(afspraak);
        if (this.closeOnSelection) {
            this.popup.onClose();
        }
    }

    selectHeleDag(dag: Date) {
        this.onHeleDagSelection(dag);
        if (this.closeOnSelection) {
            this.popup.onClose();
        }
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 264;
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
}
