import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconVerwijderen, provideIcons } from 'harmony-icons';
import { Leerling } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { DeviceService } from '../../../core/services/device.service';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { AvatarNaamComponent } from '../avatar-naam/avatar-naam.component';
import { VerwijderPopupComponent } from '../verwijder-popup/verwijder-popup.component';

@Component({
    selector: 'dt-leerling-groep',
    templateUrl: './leerling-groep.component.html',
    styleUrls: ['./leerling-groep.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarNaamComponent, IconComponent, VolledigeNaamPipe],
    providers: [provideIcons(IconVerwijderen)]
})
export class LeerlingGroepComponent {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private deviceService = inject(DeviceService);
    @ViewChild('verwijderIcon', { read: ViewContainerRef }) verwijderIcon: ViewContainerRef;
    @HostBinding('class.popup-open') isPopupOpen = false;

    @Input() leerling: Partial<Leerling>;
    @Input() gtmTag = 'differentiatiegroep-leerling-verwijderen';

    onVerwijderLeerling = output<void>();

    showVerwijderPopup(event: Event) {
        if (this.deviceService.isDesktop()) {
            this.onVerwijderLeerling.emit();
            return;
        }

        event.stopPropagation();
        this.isPopupOpen = true;
        const popupSettings = VerwijderPopupComponent.defaultPopupSettings;
        popupSettings.margin = { ...popupSettings.margin, right: 16 };
        popupSettings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.verwijderIcon, popupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => this.onVerwijderLeerling.emit();
        popup.onCancelClick = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };
    }
}
