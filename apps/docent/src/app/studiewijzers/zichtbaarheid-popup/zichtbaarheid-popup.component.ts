import { Component, ViewChild, inject } from '@angular/core';
import { Sjabloon } from '@docent/codegen';

import { IconDirective } from 'harmony';
import { IconNietZichtbaarCheckbox, IconZichtbaarCheckbox, provideIcons } from 'harmony-icons';
import { EditAction } from '../../core/models/shared.model';
import { LinkComponent } from '../../rooster-shared/components/link/link.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { SjabloonDataService } from '../sjabloon-data.service';

@Component({
    selector: 'dt-zichtbaarheid-popup',
    templateUrl: './zichtbaarheid-popup.component.html',
    styleUrls: ['./zichtbaarheid-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, IconDirective, LinkComponent],
    providers: [provideIcons(IconZichtbaarCheckbox, IconNietZichtbaarCheckbox)]
})
export class ZichtbaarheidPopupComponent implements Popup {
    private sjabloonService = inject(SjabloonDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    // Properties meegegeven aan de popup
    sjabloon: Sjabloon;

    mayClose(): boolean {
        return true;
    }

    setGedeeld(gedeeld: boolean) {
        if (gedeeld !== this.sjabloon.gedeeldMetVaksectie) {
            const sjabloonCopy = { ...this.sjabloon };
            sjabloonCopy.gedeeldMetVaksectie = gedeeld;
            this.sjabloonService.saveSjabloonVanuitOverzicht(sjabloonCopy, EditAction.UPDATE).subscribe(() => {
                this.popup.onClose();
            });
        } else {
            this.popup.onClose();
        }
    }
}
