import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconBewerken, IconNoRadio, IconOpties, IconPrinten, IconVerwijderen, IconYesRadio, provideIcons } from 'harmony-icons';
import { MaatregelToekenning } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { PopupService } from '../../core/popup/popup.service';
import { ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';

@Component({
    selector: 'dt-maatregeltoekenning',
    templateUrl: './maatregeltoekenning.component.html',
    styleUrls: ['./maatregeltoekenning.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective, TooltipDirective, HeeftRechtDirective, DtDatePipe],
    providers: [provideIcons(IconPrinten, IconOpties, IconBewerken, IconVerwijderen, IconNoRadio, IconYesRadio)]
})
export class MaatregeltoekenningComponent {
    private uriService = inject(UriService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;

    @Input() maatregeltoekenning: MaatregelToekenning;
    @Input() editMode = true;

    bewerken = output<MaatregelToekenning>();
    verwijderen = output<MaatregelToekenning>();
    afgehandeld = output<MaatregelToekenning>();

    isPopupOpen = false;

    printFormulier() {
        if (this.maatregeltoekenning.heeftFormulier) {
            window.open(
                this.uriService.getDeepLinkUrl(`/maatregeltoekenningprinten?maatregeltoekenning=${this.maatregeltoekenning.id}`),
                '_blank'
            );
        }
    }

    openOptionsPopup() {
        // DetectChanges is nodig vanwege de heeftRecht directive icm de viewcontainerRef van het more options icon
        this.changeDetector.detectChanges();

        const nagekomen = this.maatregeltoekenning.nagekomen;
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };
        settings.width = nagekomen ? 280 : 256;

        this.isPopupOpen = true;
        const popup = this.popupService.popup(this.moreOptionsIcon, settings, ActionsPopupComponent);
        popup.buttonsBeforeDivider = 2;
        popup.customButtons = [
            {
                icon: 'bewerken',
                color: 'primary',
                text: 'Bewerken',
                onClickFn: () => {
                    this.bewerken.emit(this.maatregeltoekenning);
                    this.popupService.closePopUp();
                },
                gtmTag: 'maatregeltoekenning-bewerken'
            },
            {
                icon: 'verwijderen',
                color: 'negative',
                text: 'Verwijderen',
                isVerwijderButton: true,
                onClickFn: () => {
                    this.verwijderen.emit(this.maatregeltoekenning);
                    this.popupService.closePopUp();
                },
                gtmTag: 'maatregeltoekenning-verwijder'
            },
            {
                icon: nagekomen ? 'noRadio' : 'yesRadio',
                color: nagekomen ? 'negative' : 'positive',
                text: nagekomen ? 'Markeer als actieve maatregel' : 'Markeer als afgehandeld',
                onClickFn: () => {
                    this.afgehandeld.emit(this.maatregeltoekenning);
                    this.popupService.closePopUp();
                },
                gtmTag: 'maatregeltoekenning-afhandelen'
            }
        ];
    }
}
