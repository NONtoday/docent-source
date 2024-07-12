import { Component, ViewChild } from '@angular/core';

import { IconMapVerplaatsen, IconSluiten, IconSynchroniseren, IconToevoegen, provideIcons } from 'harmony-icons';
import { ActionButton } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { ActionsComponent } from '../../rooster-shared/components/actions/actions.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-jaarbijlage-popup',
    templateUrl: './jaarbijlage-popup.component.html',
    styleUrls: ['./jaarbijlage-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, IconComponent, TooltipDirective, PopupButtonComponent, ActionsComponent],
    providers: [provideIcons(IconSynchroniseren, IconToevoegen, IconSluiten, IconMapVerplaatsen)]
})
export class JaarbijlagePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    synchroniseerbaar: boolean;
    titel: string;
    synchroniseertMet: Optional<string>;
    actions: ActionButton[];
    reversed: boolean;
    toonDifferentieren: boolean;
    toonVerwijderDifferentiaties: boolean;
    differentierenGtmTag: string;

    synchronisatieFunctie: () => void;
    differentiatieFunctie: () => void;
    verwijderDifferentiatiesFunctie: () => void;

    mayClose(): boolean {
        return true;
    }

    onSynchronisatie() {
        this.synchronisatieFunctie?.();
    }

    onDifferentiatie() {
        this.differentiatieFunctie?.();
    }

    onVerwijderDifferentiaties() {
        this.verwijderDifferentiatiesFunctie?.();
    }
}
