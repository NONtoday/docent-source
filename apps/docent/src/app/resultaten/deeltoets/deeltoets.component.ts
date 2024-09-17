import { ChangeDetectorRef, Component, HostBinding, Input, OnChanges, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { Deeltoetskolom, KolomActie, MatrixResultaatkolomFieldsFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBewerken, IconDeeltoets, IconOpties, IconVerwijderen, provideIcons } from 'harmony-icons';
import { PopupService } from '../../core/popup/popup.service';
import { ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';

@Component({
    selector: 'dt-deeltoets',
    templateUrl: './deeltoets.component.html',
    styleUrls: ['./deeltoets.component.scss'],
    standalone: true,
    imports: [IconComponent, IconDirective],
    providers: [provideIcons(IconDeeltoets, IconOpties, IconBewerken, IconVerwijderen)]
})
export class DeeltoetsComponent implements OnChanges {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;

    @HostBinding('class.popup-open') isPopupOpen = false;

    @Input() deeltoets: MatrixResultaatkolomFieldsFragment;

    bewerkDeeltoets = output<void>();
    bewerkLesgroepOmschrijving = output<void>();
    deleteDeeltoets = output<Deeltoetskolom>();

    magBewerken: boolean;
    magVerwijderen: boolean;
    magLesgroepOmschrijvingWijzigen: boolean;

    ngOnChanges() {
        this.magBewerken = this.deeltoets.toegestaneKolomActies.includes(KolomActie.StructuurWijzigen);
        this.magLesgroepOmschrijvingWijzigen = this.deeltoets.toegestaneKolomActies.includes(KolomActie.LesgroepOmschrijvingWijzigen);
        this.magVerwijderen =
            this.magBewerken &&
            !this.deeltoets.resultaten.some(
                (resultaat) =>
                    resultaat.formattedResultaat ||
                    resultaat.formattedResultaatAfwijkendNiveau ||
                    resultaat.resultaatLabel ||
                    resultaat.resultaatLabelAfwijkendNiveau
            );
    }

    onDeeltoetsMoreOptions(event: Event) {
        event.stopPropagation();
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 224;
        settings.offsets = { ...settings.offsets, bottom: { left: -10, top: -20 } };
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        this.isPopupOpen = true;
        const popup = this.popupService.popup(this.moreOptionsIcon, settings, ActionsPopupComponent);
        popup.customButtons = [];
        if (this.magBewerken) {
            popup.customButtons.push({
                icon: 'bewerken',
                color: 'primary',
                text: 'Deeltoets bewerken',
                isVerwijderButton: false,
                onClickFn: () => this.bewerkDeeltoets.emit()
            });
        } else if (this.magLesgroepOmschrijvingWijzigen) {
            popup.customButtons.push({
                icon: 'bewerken',
                color: 'primary',
                text: 'Deeltoets bewerken',
                isVerwijderButton: false,
                onClickFn: () => this.bewerkLesgroepOmschrijving.emit()
            });
        }

        if (this.magVerwijderen) {
            popup.customButtons.push({
                icon: 'verwijderen',
                color: 'negative',
                text: 'Deeltoets verwijderen',
                isVerwijderButton: true,
                onClickFn: () => this.deleteDeeltoets.emit(this.deeltoets as any)
            });
        }

        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}
