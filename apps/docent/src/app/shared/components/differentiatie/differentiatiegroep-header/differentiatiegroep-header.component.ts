import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconBewerken, IconOpties, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Differentiatiegroep, DifferentiatiegroepKleur } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { DeviceService } from '../../../../core/services/device.service';
import { accent_negative_1 } from '../../../../rooster-shared/colors';
import {
    ActionsPopupComponent,
    bewerkButton,
    verwijderButton
} from '../../../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../../../rooster-shared/components/icon/icon.component';
import { KleurKeuzeComponent } from '../../../../rooster-shared/components/kleur-keuze/kleur-keuze.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { InlineEditComponent } from '../../inline-edit/inline-edit.component';
import { KleurKeuzePopupComponent } from '../../kleur-keuze-popup/kleur-keuze-popup.component';

@Component({
    selector: 'dt-differentiatiegroep-header',
    templateUrl: './differentiatiegroep-header.component.html',
    styleUrls: ['./differentiatiegroep-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [KleurKeuzeComponent, IconComponent, InlineEditComponent],
    providers: [provideIcons(IconBewerken, IconVerwijderen, IconOpties)]
})
export class DifferentiatiegroepHeaderComponent implements OnInit {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    @ViewChild('kleurkeuze', { read: ViewContainerRef }) kleurKeuzeRef: ViewContainerRef;
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;

    @Input() differentiatiegroep: Differentiatiegroep;
    @Input() inEditMode = false;

    onLeerlingenToevoegen = output<void>();
    saveDifferentiatiegroep = output<Differentiatiegroep>();
    deleteDifferentiatiegroep = output<Differentiatiegroep>();
    editCancelled = output<void>();

    kleur: DifferentiatiegroepKleur;

    public differentiatiegroepVerwijderenGuardProperties = {
        title: 'Differentiatiegroep verwijderen',
        message:
            'Lesitems met differentiaties voor alleen deze groep worden beschikbaar voor iedereen in deze studiewijzer. Wil je de differentiatiegroep definitief verwijderen?',
        actionLabel: 'Verwijderen',
        cancelLabel: 'Annuleren',
        warning: true,
        outlineConfirmKnop: true,
        buttonColor: accent_negative_1,
        icon: 'verwijderen',
        iconColor: 'accent_negative_1'
    };

    ngOnInit(): void {
        this.kleur = this.differentiatiegroep.kleur;
    }

    onEdit() {
        this.inEditMode = true;
        this.changeDetector.detectChanges();
    }

    onSave(nieuweTitel: string) {
        this.saveDifferentiatiegroep.emit({
            ...this.differentiatiegroep,
            naam: nieuweTitel,
            kleur: this.kleur
        });
        this.inEditMode = false;
    }

    kleurEdited(kleur: DifferentiatiegroepKleur) {
        this.kleur = kleur;
        this.changeDetector.detectChanges();
        this.popupService.closePopUp();
    }

    cancelEdit() {
        this.kleur = this.differentiatiegroep.kleur;
        this.inEditMode = false;
        this.editCancelled.emit();
        this.popupService.closePopUp();
    }

    openKleurenPopup() {
        const settings = KleurKeuzePopupComponent.defaultPopupSettings;
        settings.width = this.deviceService.isTabletPortraitOrTablet() ? 248 : 186;

        const popup = this.popupService.popup(this.kleurKeuzeRef, settings, KleurKeuzePopupComponent);
        popup.onKeuzeClick = (kleur: DifferentiatiegroepKleur) => this.kleurEdited(kleur);
    }

    onDelete() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, this.differentiatiegroepVerwijderenGuardProperties);
        popup.confirmGtmTag = 'differentiatiegroep-verwijderen';
        popup.onConfirmFn = () => {
            this.deleteDifferentiatiegroep.emit(this.differentiatiegroep);
            return true;
        };
    }

    onMoreOptions() {
        const popup: ActionsPopupComponent = this.popupService.popup(
            this.moreOptionsIcon,
            ActionsPopupComponent.defaultPopupsettings,
            ActionsPopupComponent
        );
        popup.customButtons = [
            bewerkButton(() => this.onEdit()),
            verwijderButton(() => this.onDelete(), 'differentiatiegroep-verwijderen')
        ];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}
