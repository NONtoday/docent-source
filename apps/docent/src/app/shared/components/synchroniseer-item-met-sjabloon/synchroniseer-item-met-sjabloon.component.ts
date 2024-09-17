import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { BasisSjabloonFieldsFragment, Sjabloon } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconOntkoppelen, IconSynchroniseren, provideIcons } from 'harmony-icons';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupDirection } from '../../../core/popup/popup.settings';
import { DeviceService } from '../../../core/services/device.service';
import {
    ActionButton,
    ActionsPopupComponent,
    annulerenButton,
    ontkoppelButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-synchroniseer-item-met-sjabloon',
    templateUrl: './synchroniseer-item-met-sjabloon.component.html',
    styleUrls: ['./synchroniseer-item-met-sjabloon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconComponent, SpinnerComponent, LinkComponent, IconDirective],
    providers: [provideIcons(IconSynchroniseren, IconOntkoppelen)]
})
export class SynchroniseerItemMetSjabloonComponent {
    private popupService = inject(PopupService);
    private deviceService = inject(DeviceService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('unlinkIcon', { read: ViewContainerRef }) unlinkIcon: ViewContainerRef;
    @ViewChild('synchroniserenLink', { read: ViewContainerRef }) synchroniserenLink: ViewContainerRef;

    @Input() synchroniseertMet: Optional<string>;
    @Input() gesynchroniseerdeSjablonen: BasisSjabloonFieldsFragment[];
    @Input() canUnlink: boolean;
    @Input() showSyncMetButton = true;

    onUnlink = output<void>();
    onSynchroniseren = output<Sjabloon>();

    ontkoppelenInProgress = false;

    openSjabloonSynchronisatiePopup() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 220;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        let customButtons: ActionButton[] = [];

        customButtons = this.gesynchroniseerdeSjablonen.map(
            (sjabloon) =>
                ({
                    text: sjabloon.naam,
                    color: 'primary',
                    onClickFn: () => this.onSynchroniseren.emit(sjabloon as Sjabloon),
                    gtmTag: 'synchroniseer-item-met-sjabloon'
                }) as ActionButton
        );

        const popup = this.popupService.popup(this.synchroniserenLink, settings, ActionsPopupComponent);
        popup.customButtons = customButtons;
        popup.onActionClicked = () => this.popupService.closePopUp();
        popup.title = this.deviceService.isPhone() ? 'Synchroniseren met' : null;
    }

    unlink() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 220;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.margin.right = 8;

        const popup = this.popupService.popup(this.unlinkIcon, settings, ActionsPopupComponent);
        popup.title = 'Weet je zeker dat je het lesitem wilt ontkoppelen?';
        popup.customButtons = [
            ontkoppelButton(() => {
                this.ontkoppelenInProgress = true;
                this.changeDetector.detectChanges();
                this.onUnlink.emit();
            }),
            annulerenButton()
        ];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}
