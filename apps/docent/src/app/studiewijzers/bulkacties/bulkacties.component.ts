import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    HostBinding,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconDirective, PillComponent } from 'harmony';
import {
    IconDifferentiatie,
    IconGroep,
    IconKopierenNaar,
    IconMapVerplaatsen,
    IconOpties,
    IconSluiten,
    IconToevoegen,
    IconVerwijderen,
    IconZichtbaarCheckbox,
    provideIcons
} from 'harmony-icons';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { BulkVerwijderPopupComponent } from './bulk-verwijder-popup/bulk-verwijder-popup.component';
import { BulkZichtbaarheidPopupComponent } from './bulk-zichtbaarheid-popup/bulk-zichtbaarheid-popup.component';

@Component({
    selector: 'dt-bulkacties',
    templateUrl: './bulkacties.component.html',
    styleUrls: ['./bulkacties.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [OutlineButtonComponent, TooltipDirective, NgClass, VerwijderButtonComponent, IconDirective, PillComponent],
    providers: [
        provideIcons(
            IconSluiten,
            IconToevoegen,
            IconMapVerplaatsen,
            IconVerwijderen,
            IconZichtbaarCheckbox,
            IconKopierenNaar,
            IconOpties,
            IconGroep,
            IconDifferentiatie
        )
    ]
})
export class BulkactiesComponent implements OnChanges {
    private popupService = inject(PopupService);
    @HostBinding('class.items-geselecteerd') selecterenState: boolean;

    @ViewChild('zichtbaarheid', { read: ViewContainerRef }) zichtbaarheidRef: ViewContainerRef;
    @ViewChild('verwijderButton', { read: ViewContainerRef }) verwijderButtonRef: ViewContainerRef;
    @ViewChild('differentierenButton', { read: ViewContainerRef }) differentierenButtonRef: ViewContainerRef;
    @ViewChild('moreOptionsButton', { read: ViewContainerRef }) moreOptionsButtonRef: ViewContainerRef;

    @Input() bulkactiesLength: number;
    @Input() showVerwijderButton = true;
    @Input() showZichtbaarheidButton = true;
    @Input() showVerplaatsButton = false;
    @Input() showKopieerButton = true;
    @Input() showDifferentierenButton = false;
    @Input() showMoreOptionsButton = false;
    @Input() type = 'lesitems';
    @Input() magVerslepen = true;
    @Input() @HostBinding('class.in-sidebar') inSidebar = false;
    @Input() @HostBinding('class.no-button-labels') hideButtonLabels = false;
    @Input() @HostBinding('class.small-column-gap') smallerColumnGap = false;
    @Input() context: string;

    closeBulkacties = output<void>();
    bulkVerwijderen = output<void>();
    bulkZichtbaarheid = output<boolean>();
    verplaatsClicked = output<void>();
    kopieerClicked = output<void>();
    onToekennen = output<boolean>();

    isVerwijderenClicked: boolean;

    ngOnChanges() {
        this.selecterenState = this.bulkactiesLength > 0;
    }

    openVerwijderPopup() {
        const settings = BulkVerwijderPopupComponent.defaultPopupSettings;
        settings.width = 210;

        const popup = this.popupService.popup(this.verwijderButtonRef, settings, BulkVerwijderPopupComponent);
        popup.aantalItems = this.bulkactiesLength;
        popup.verwijderItems = () => this.bulkVerwijderen.emit();
        popup.popupContext = this.context;
    }

    openZichtbaarheidPopup() {
        const popup = this.popupService.popup(
            this.zichtbaarheidRef,
            BulkZichtbaarheidPopupComponent.defaultPopupSettings,
            BulkZichtbaarheidPopupComponent
        );
        popup.setZichtbaarheid = (zichtbaarheid: boolean) => this.bulkZichtbaarheid.emit(zichtbaarheid);
    }

    openMoreOptionsPopup() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 190;
        popupSettings.preferedDirection = [PopupDirection.Top];
        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 12;
        popupSettings.applicationOffset = 0;

        const popup = this.popupService.popup(this.moreOptionsButtonRef, popupSettings, ActionsPopupComponent);
        const verplaatsenButton: ActionButton = {
            icon: 'mapVerplaatsen',
            iconcolor: 'primary_1',
            text: 'Verplaatsen naar',
            textcolor: 'primary_1',
            onClickFn: () => this.verplaatsClicked.emit()
        };
        const kopierenButton: ActionButton = {
            icon: 'kopierenNaar',
            iconcolor: 'primary_1',
            text: 'Kopiëren naar',
            textcolor: 'primary_1',
            gtmTag: 'bulk-kopieren',
            onClickFn: () => this.kopieerClicked.emit()
        };

        popup.onActionClicked = () => this.popupService.closePopUp();
        popup.customButtons = [verplaatsenButton, kopierenButton];
    }

    onDifferentierenClicked() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 190;
        popupSettings.preferedDirection = [PopupDirection.Top];
        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 12;
        popupSettings.applicationOffset = 0;

        const popup = this.popupService.popup(this.differentierenButtonRef, popupSettings, ActionsPopupComponent);
        const iedereen: ActionButton = {
            icon: 'groep',
            iconcolor: 'primary_1',
            text: 'Iedereen',
            textcolor: 'primary_1',
            gtmTag: 'bulk-differentieer-iedereen',
            onClickFn: () => this.onToekennen.emit(true)
        };
        const groepOfLeerling: ActionButton = {
            icon: 'differentiatie',
            iconcolor: 'primary_1',
            text: 'Groep of leerling',
            textcolor: 'primary_1',
            gtmTag: 'bulk-differentieer',
            onClickFn: () => this.onToekennen.emit(false)
        };

        popup.onActionClicked = () => this.popupService.closePopUp();
        popup.customButtons = [iedereen, groepOfLeerling];
    }
}
