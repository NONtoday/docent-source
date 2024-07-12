import { ChangeDetectionStrategy, Component, HostListener, Input, ViewContainerRef, inject } from '@angular/core';
import { LeerlingSignaleringenFragment } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { LeerlingComponent } from '../../../../shared/components/leerling/leerling.component';
import { SignaleringAfsprakenPopupComponent } from '../signalering-afspraken-popup/signalering-afspraken-popup.component';

@Component({
    selector: 'dt-signalering',
    templateUrl: './signalering.component.html',
    styleUrls: ['./signalering.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingComponent]
})
export class SignaleringComponent {
    private viewContainerRef = inject(ViewContainerRef);
    private popupService = inject(PopupService);
    @Input() typeSignalering: string;
    @Input() signalering: LeerlingSignaleringenFragment;

    @HostListener('click')
    public onClick() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.width = 240;
        popupSettings.preferedDirection = [PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Popout
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, SignaleringAfsprakenPopupComponent);
        popup.titel = this.typeSignalering;
        popup.signalering = this.signalering;
    }
}
