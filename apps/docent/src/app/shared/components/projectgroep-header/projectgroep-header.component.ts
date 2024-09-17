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
import { DifferentiatiegroepKleur, ProjectgroepFieldsFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBewerken, IconOpties, IconSlot, IconVerwijderen, provideIcons } from 'harmony-icons';
import { PopupService } from '../../../core/popup/popup.service';
import {
    ActionsPopupComponent,
    bewerkButton,
    verwijderButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { KleurKeuzeComponent } from '../../../rooster-shared/components/kleur-keuze/kleur-keuze.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { InlineEditComponent } from '../inline-edit/inline-edit.component';
import { VerwijderPopupComponent } from '../verwijder-popup/verwijder-popup.component';

@Component({
    selector: 'dt-projectgroep-header',
    templateUrl: './projectgroep-header.component.html',
    styleUrls: ['./projectgroep-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [KleurKeuzeComponent, IconComponent, TooltipDirective, InlineEditComponent, IconDirective],
    providers: [provideIcons(IconBewerken, IconSlot, IconVerwijderen, IconOpties)]
})
export class ProjectgroepHeaderComponent {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;
    @ViewChild('verwijderButton', { read: ViewContainerRef }) verwijderButton: ViewContainerRef;

    @HostBinding('class.popup-open') isPopupOpen = false;

    @Input() projectgroep: ProjectgroepFieldsFragment;
    @Input() inEditMode = false;
    @Input() lockedVerwijderButton = false;
    @Input() gtmTag = 'differentiatiegroep-aanpassen';

    saveProjectgroep = output<ProjectgroepFieldsFragment>();
    verwijderProjectgroep = output<ProjectgroepFieldsFragment>();

    kleur: DifferentiatiegroepKleur = DifferentiatiegroepKleur.BLAUW;

    onEdit() {
        this.inEditMode = true;
        this.changeDetector.detectChanges();
    }

    onSave(nieuweTitel: string) {
        this.saveProjectgroep.emit({
            ...this.projectgroep,
            naam: nieuweTitel
        });
        this.inEditMode = false;
    }

    cancelEdit() {
        this.inEditMode = false;
    }

    onDelete() {
        this.isPopupOpen = true;
        const popupSettings = VerwijderPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.verwijderButton, popupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => this.verwijderProjectgroep.emit(this.projectgroep);
        popup.onCancelClick = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
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
            verwijderButton(() => this.verwijderProjectgroep.emit(this.projectgroep))
        ];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}
