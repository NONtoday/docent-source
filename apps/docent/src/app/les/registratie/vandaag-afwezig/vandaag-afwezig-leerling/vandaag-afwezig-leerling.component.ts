import { ChangeDetectionStrategy, Component, HostListener, Input, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { IconInformatie, IconNoRadio, provideIcons } from 'harmony-icons';
import { AbsentieMeldingFieldsFragment, Leerling } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { accent_negative_1 } from '../../../../rooster-shared/colors';
import { IconComponent } from '../../../../rooster-shared/components/icon/icon.component';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { LeerlingComponent } from '../../../../shared/components/leerling/leerling.component';
import { SignaleringWeergevenPopupComponent } from '../../signalering-weergeven-popup/signalering-weergeven-popup.component';

@Component({
    selector: 'dt-vandaag-afwezig-leerling',
    templateUrl: './vandaag-afwezig-leerling.component.html',
    styleUrls: ['./vandaag-afwezig-leerling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingComponent, IconComponent],
    providers: [provideIcons(IconInformatie, IconNoRadio)]
})
export class VandaagAfwezigLeerlingComponent {
    private popupService = inject(PopupService);
    @ViewChild('infoIcon', { read: ViewContainerRef }) infoIcon: ViewContainerRef;

    @Input() leerling: Leerling;
    @Input() absentieMelding: Optional<AbsentieMeldingFieldsFragment>;

    @HostListener('click') onClick() {
        if (this.absentieMelding) {
            if (this.popupService.isPopupOpenFor(this.infoIcon)) {
                this.popupService.closePopUp();
            } else {
                this.openPopup();
            }
        }
    }

    openPopup() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.width = 300;
        popupSettings.margin.top = 310;
        popupSettings.margin.right = 50;

        popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom, PopupDirection.Right, PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Popout
        };

        const popup = this.popupService.popup(this.infoIcon, popupSettings, SignaleringWeergevenPopupComponent);

        popup.titel = 'Afwezig gemeld';
        popup.absentieMelding = this.absentieMelding!;
        popup.geoorloofd = popup.absentieMelding.absentieReden!.geoorloofd;
        popup.isAfwezigMelding = true;
        popup.icon = 'noRadio';
        popup.iconColor = accent_negative_1;
    }
}
