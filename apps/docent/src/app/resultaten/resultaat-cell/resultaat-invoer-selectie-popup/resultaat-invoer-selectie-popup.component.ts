import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ResultaatLabel } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconDownloaden, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../../rooster-shared/utils/utils';
import { ContainsPipe } from '../../../shared/pipes/contains.pipe';

export type SpecialeWaarde = 'leeg' | 'vr' | 'X' | '*';

@Component({
    selector: 'dt-resultaat-invoer-selectie-popup',
    templateUrl: './resultaat-invoer-selectie-popup.component.html',
    styleUrls: ['./resultaat-invoer-selectie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, AsyncPipe, ContainsPipe, IconDirective],
    providers: [provideIcons(IconDownloaden)]
})
export class ResultaatInvoerSelectiePopupComponent implements Popup, OnInit {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    labelSelected = (label: ResultaatLabel) => this.onLabelSelected?.(label);

    // Labels gebruiken als input, o.b.v. hiervan worden de normale en speciale waarde arrays gevuld.
    labels?: ResultaatLabel[];
    normaleLabels: ResultaatLabel[];
    specialeWaardeLabels: ResultaatLabel[];

    activeLabel: Optional<ResultaatLabel>;
    nonMatchingLabels$: Observable<ResultaatLabel[]>;
    onLabelSelected: (label: ResultaatLabel) => void;
    onSpecialeWaardeSelected: (waarde: SpecialeWaarde) => void;
    onImporteren: () => void;
    toonImporteerButton: boolean;
    isRapportCijferKolom: boolean;

    ngOnInit() {
        this.normaleLabels = [];
        this.specialeWaardeLabels = [];
        this.labels?.forEach((label) => {
            const array = label.specialeWaarde ? this.specialeWaardeLabels : this.normaleLabels;
            array.push(label);
        });
        this.specialeWaardeLabels = this.specialeWaardeLabels.sort((lhs, rhs) => lhs.afkorting.localeCompare(rhs.afkorting));
    }

    mayClose(): boolean {
        return true;
    }

    public static getDefaultPopupsettings(inclusiefImporteren: boolean) {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.width = inclusiefImporteren ? 240 : 188;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        popupSettings.appearance = {
            mobile: Appearance.Popout,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
