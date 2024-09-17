import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Studiewijzer, StudiewijzerFieldsFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconGroep, IconOpties, provideIcons } from 'harmony-icons';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService } from '../../../core/services/device.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import {
    ActionsPopupComponent,
    bewerkButton,
    verwijderButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StudiewijzerDataService } from '../../studiewijzer-data.service';
import { EditStudiewijzerSidebarComponent } from '../edit-studiewijzer-sidebar/edit-studiewijzer-sidebar.component';

@Component({
    selector: 'dt-studiewijzer-overzicht-item',
    templateUrl: './studiewijzer-overzicht-item.component.html',
    styleUrls: ['./studiewijzer-overzicht-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BackgroundIconComponent, IconDirective],
    providers: [provideIcons(IconGroep, IconOpties)]
})
export class StudiewijzerOverzichtItemComponent {
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    @ViewChild('moreOptionsIcon', { read: ViewContainerRef, static: true }) moreOptionsIcon: ViewContainerRef;

    @Input() studiewijzer: StudiewijzerFieldsFragment;
    @Input() @HostBinding('class.draggable') draggable = true;

    toggleActionsPopup(event: Event) {
        if (this.popupService.isPopupOpenFor(this.moreOptionsIcon)) {
            this.popupService.closePopUp();
        } else {
            const popupSettings = ActionsPopupComponent.defaultPopupsettings;
            popupSettings.width = 165;

            const customButtons = [
                bewerkButton(() => this.sidebarService.openSidebar(EditStudiewijzerSidebarComponent, { studiewijzer: this.studiewijzer })),
                verwijderButton(() => this.deleteStudiewijzer(), 'studiewijzer-verwijderen')
            ];

            const popup = this.popupService.popup(this.moreOptionsIcon, popupSettings, ActionsPopupComponent);
            popup.customButtons = customButtons;
            popup.title = this.deviceService.isPhoneOrTabletPortrait() ? this.studiewijzer.lesgroep.naam : undefined;
            popup.onActionClicked = () => this.popupService.closePopUp();
        }
        event.stopPropagation();
    }

    deleteStudiewijzer() {
        this.popupService.closePopUp();
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);
        popup.title = 'Let op, je verwijdert de gehele studiewijzer';
        popup.message =
            "Je verwijdert de gehele studiewijzer (ook voor je collega's) inclusief eventuele inleveropdrachten en ingeleverde bestanden. Deze actie kan niet ongedaan gemaakt worden. Weet je zeker dat je de studiewijzer wilt verwijderen?";
        popup.actionLabel = 'Definitief verwijderen';
        popup.warning = true;
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'negative';
        popup.cancelLabel = 'Annuleren';
        popup.onConfirmFn = () => {
            this.studiewijzerDataService.deleteStudiewijzer(this.studiewijzer as Studiewijzer, this.medewerkerDataService.medewerkerUuid);
            return true;
        };
    }
}
