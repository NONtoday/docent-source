import { Component, Input, ViewChild, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconCheck, provideIcons } from 'harmony-icons';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, HorizontalOffset } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-filter-popup',
    standalone: true,
    imports: [PopupComponent, IconDirective],
    templateUrl: './filter-popup.component.html',
    styleUrls: ['./filter-popup.component.scss'],
    providers: [provideIcons(IconCheck)]
})
export class FilterPopupComponent<Optie extends string = string> implements Popup {
    public popupService = inject(PopupService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @Input() filterOpties: readonly Optie[];
    @Input() selected: Optional<Optie>;
    @Input() deleteable = false;
    @Input() cyTag: string;
    @Input() dataGtm: string;
    @Input() onSelection: (optie: Optional<Optie>) => void;

    mayClose(): boolean {
        return true;
    }

    public static get filterPopupsettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;
        popupSettings.width = 172;
        popupSettings.horizontalOffset = HorizontalOffset.Right;
        popupSettings.horizontalEdgeOffset = 76;
        popupSettings.appearance = {
            mobile: Appearance.Popout,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }

    selecteerOptie(optie: Optie) {
        this.selected = optie;
        this.onOptionSelected();
    }

    verwijderFilter() {
        this.selected = null;
        this.onOptionSelected();
    }

    private onOptionSelected() {
        this.onSelection(this.selected);
        this.popupService.closePopUp();
    }
}
