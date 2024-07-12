import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { IconDirective } from 'harmony';
import {
    IconNietZichtbaarCheckbox,
    IconOpties,
    IconSjabloon,
    IconSynchroniseren,
    IconZichtbaarCheckbox,
    provideIcons
} from 'harmony-icons';
import join from 'lodash-es/join';
import { Sjabloon } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, HorizontalOffset, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService } from '../../../core/services/device.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import {
    ActionsPopupComponent,
    bewerkButton,
    dupliceerButton,
    verwijderButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { PersonenNamenPipe } from '../../../rooster-shared/pipes/personen-namen.pipe';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SjabloonDataService } from '../../sjabloon-data.service';
import { ZichtbaarheidPopupComponent } from '../../zichtbaarheid-popup/zichtbaarheid-popup.component';
import { EditSjabloonSidebarComponent } from '../edit-sjabloon-sidebar/edit-sjabloon-sidebar.component';

@Component({
    selector: 'dt-sjabloon-overzicht-item',
    templateUrl: './sjabloon-overzicht-item.component.html',
    styleUrls: ['./sjabloon-overzicht-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, NgClass, PersonenNamenPipe, VolledigeNaamPipe, IconDirective],
    providers: [provideIcons(IconOpties, IconSjabloon, IconZichtbaarCheckbox, IconNietZichtbaarCheckbox, IconSynchroniseren)]
})
export class SjabloonOverzichtItemComponent implements OnInit, OnChanges {
    private medewerkerService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private sjabloonDataService = inject(SjabloonDataService);
    private sidebarService = inject(SidebarService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    @ViewChild('moreOptionsIcon', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;
    @ViewChild('zichtbaarheid', { read: ViewContainerRef }) zichtbaarheidContainer: ViewContainerRef;
    @HostBinding('class.is-nieuw') isNieuw: boolean;

    @Input() sjabloon: Sjabloon;
    @Input() @HostBinding('class.not-draggable') notDraggable: boolean;
    @Input() toonZichtbaarheidEnDupliceren = true;

    isSjabloonCollega = false;
    tooltipMessage = '';

    ngOnInit() {
        this.isSjabloonCollega = this.medewerkerService.medewerkerId !== this.sjabloon.eigenaar.id;
        this.changeDetector.detectChanges();
    }

    ngOnChanges() {
        if (this.sjabloon.isNieuw) {
            this.isNieuw = true;

            setTimeout(() => {
                this.isNieuw = false;
                this.sjabloonDataService.removeIsNieuw(this.sjabloon.id);
                this.changeDetector.markForCheck();
            }, 1000);
        }
        this.tooltipMessage =
            'Gesynchroniseerd naar: ' +
            join(this.sjabloon.gesynchroniseerdeStudiewijzers.map((studiewijzer) => studiewijzer.lesgroep.naam).sort(), ', ');
    }

    get isGesynchroniseerd() {
        return this.sjabloon.gesynchroniseerdeStudiewijzers.length > 0;
    }
    openActiesPopup(event: Event) {
        if (this.popupService.isPopupOpenFor(this.moreOptionsIcon)) {
            this.popupService.closePopUp();
        } else {
            const popupSettings = ActionsPopupComponent.defaultPopupsettings;
            popupSettings.width = 165;

            let customButtons = [
                bewerkButton(this.openEditSidebar, 'sjabloon-bewerken'),
                verwijderButton(this.isGesynchroniseerd ? this.openVerwijderGuard : this.verwijderSjabloon, 'sjabloon-verwijderen')
            ];
            if (this.toonZichtbaarheidEnDupliceren) {
                customButtons.splice(1, 0, dupliceerButton(this.dupliceerSjabloon, 'sjabloon-dupliceren'));
            }

            if (this.isSjabloonCollega) {
                customButtons = [dupliceerButton(this.dupliceerSjabloon)];
            }

            const popup = this.popupService.popup(this.moreOptionsIcon, popupSettings, ActionsPopupComponent);
            popup.customButtons = customButtons;
            popup.title = this.deviceService.isPhoneOrTabletPortrait() ? this.sjabloon.naam : undefined;
        }
        event.stopPropagation();
    }

    openZichtbaarheidPopup(event: Event) {
        if (this.popupService.isPopupOpenFor(this.zichtbaarheidContainer)) {
            this.popupService.closePopUp();
        } else {
            const popupSettings = new PopupSettings();

            popupSettings.showHeader = false;
            popupSettings.showCloseButton = false;
            popupSettings.width = 260;
            popupSettings.appearance = {
                mobile: Appearance.Rollup,
                tabletportrait: Appearance.Popout,
                tablet: Appearance.Popout,
                desktop: Appearance.Popout
            };
            popupSettings.horizontalOffset = HorizontalOffset.Left;
            popupSettings.horizontalEdgeOffset = 16;
            popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Right, PopupDirection.Left, PopupDirection.Top];

            const popup = this.popupService.popup(this.zichtbaarheidContainer, popupSettings, ZichtbaarheidPopupComponent);
            popup.sjabloon = this.sjabloon;
        }
        event.stopPropagation();
    }

    openEditSidebar = () => {
        this.popupService.closePopUp();
        this.sidebarService.openSidebar(EditSjabloonSidebarComponent, { sjabloon: this.sjabloon });
    };

    verwijderSjabloon = (verwijderGesynchroniseerdeItems = false) => {
        this.popupService.closePopUp();
        this.sjabloonDataService.deleteSjabloon(this.sjabloon, verwijderGesynchroniseerdeItems);
    };

    dupliceerSjabloon = () => {
        this.popupService.closePopUp();
        this.sjabloonDataService.kopieerSjabloon(this.sjabloon.id, this.sjabloon.uuid);
    };

    openVerwijderGuard = () => {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);
        popup.title = 'Let op, sjabloon synchroniseert met studiewijzers';
        popup.message = 'Wil je lesitems en jaarbijlagen uit dit sjabloon ook verwijderen uit de gesynchroniseerde studiewijzer(s)?';
        popup.actionLabel = 'Verwijder uit studiewijzer(s)';
        popup.cancelLabel = 'Bewaar kopie in studiewijzer(s)';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'accent_negative_1';
        popup.onConfirmFn = () => {
            this.verwijderSjabloon(true);
            return true;
        };
        popup.onCancelFn = () => {
            this.verwijderSjabloon(false);
        };
    };
}
