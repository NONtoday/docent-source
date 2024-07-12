import { Component, ViewChild } from '@angular/core';
import { IconDirective, PillComponent } from 'harmony';
import { IconName } from 'harmony-icons';
import { AbsentieMeldingFieldsFragment } from '../../../../generated/_types';
import { HarmonyColor, secondary_1 } from '../../../rooster-shared/colors';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { VerwijderButtonComponent } from '../../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';

@Component({
    selector: 'dt-signalering-weergeven-popup',
    templateUrl: './signalering-weergeven-popup.component.html',
    styleUrls: ['./signalering-weergeven-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        VerwijderButtonComponent,
        OutlineButtonComponent,
        ButtonComponent,
        VolledigeNaamPipe,
        DtDatePipe,
        IconDirective,
        PillComponent
    ]
})
export class SignaleringWeergevenPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    absentieMelding: AbsentieMeldingFieldsFragment;
    titel: string;
    isAbsentieMeldingToegestaan: boolean;
    registratieId: string;
    icon: IconName;
    geoorloofd: boolean;
    isAfwezigMelding: boolean;
    iconColor: HarmonyColor = secondary_1;

    onBewerkenClicked: () => void;
    onVerwijderdClicked: () => void;

    mayClose(): boolean {
        return true;
    }

    sluitButtonClicked() {
        this.popup.onClose();
    }

    verwijderButtonClicked() {
        this.onVerwijderdClicked();
        this.popup.onClose('delete');
    }

    bewerkButtonClicked() {
        this.onBewerkenClicked();
        this.popup.onClose();
    }
}
