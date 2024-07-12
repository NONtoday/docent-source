import { Component, ViewChild, input } from '@angular/core';
import { Popup, PopupComponent } from '../../popup/popup.component';

@Component({
    selector: 'dt-pasfoto-popup',
    templateUrl: './pasfoto-popup.component.html',
    styleUrls: ['./pasfoto-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent]
})
export class PasfotoPopupComponent implements Popup {
    src = input.required<string>();
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    close() {
        this.popup.onClose('close');
    }

    public mayClose(): boolean {
        return true;
    }
}
