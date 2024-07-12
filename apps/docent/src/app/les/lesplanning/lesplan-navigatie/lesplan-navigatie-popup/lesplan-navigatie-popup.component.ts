import { Component, ViewChild } from '@angular/core';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { LesplanNavigatieComponent } from '../lesplan-navigatie.component';

@Component({
    selector: 'dt-lesplan-navigatie-popup',
    templateUrl: './lesplan-navigatie-popup.component.html',
    styleUrls: ['./lesplan-navigatie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, LesplanNavigatieComponent]
})
export class LesplanNavigatiePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    mayClose(): boolean {
        return true;
    }
}
