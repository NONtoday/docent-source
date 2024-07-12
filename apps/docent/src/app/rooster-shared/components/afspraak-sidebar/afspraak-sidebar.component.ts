import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { Router } from '@angular/router';
import { IconBewerken, IconKalenderDag, IconName, IconToevoegen, provideIcons } from 'harmony-icons';
import { Afspraak } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { RoosterDataService } from '../../../rooster/rooster-data.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BaseSidebar } from '../../directives/base-sidebar.directive';
import { Optional, WithRequiredProperty } from '../../utils/utils';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AfspraakFormulierComponent } from './afspraak-formulier/afspraak-formulier.component';
import { AfspraakTonenComponent } from './afspraak-tonen/afspraak-tonen.component';

export type NieuweAfspraak = WithRequiredProperty<Partial<Afspraak>, 'begin' | 'participantenEigenAfspraak' | 'bijlagen'>;

@Component({
    selector: 'dt-afspraak-sidebar',
    templateUrl: './afspraak-sidebar.component.html',
    styleUrls: ['./afspraak-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, AfspraakFormulierComponent, AfspraakTonenComponent],
    providers: [provideIcons(IconToevoegen, IconKalenderDag, IconBewerken)]
})
export class AfspraakSidebarComponent extends BaseSidebar implements OnChanges {
    public sidebarService = inject(SidebarService);
    private roosterDataService = inject(RoosterDataService);
    private router = inject(Router);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild(AfspraakFormulierComponent)
    afspraakFormulierComponent: AfspraakFormulierComponent;

    @Input() afspraak: Afspraak | NieuweAfspraak;
    @Input() bewerkenState: Optional<boolean>;
    @Input() openDetailBijNieuweAfspraak: Optional<boolean> = false;

    showMessage = output<string>();

    public icon: IconName = 'toevoegen';
    public title = 'Afspraak toevoegen';

    ngOnChanges() {
        this.icon = this.bewerkenState ? 'toevoegen' : 'kalenderDag';

        if (this.afspraak.id && this.bewerkenState) {
            this.title = 'Afspraak bewerken';
            this.icon = 'bewerken';
        } else if (this.bewerkenState) {
            this.title = 'Afspraak toevoegen';
        } else {
            this.title = 'Afspraak bekijken';
        }

        this.changeDetector.detectChanges();
    }

    onSaveAfspraak(formData: Afspraak) {
        this.afspraak = formData;

        const openDetailNaOpslaan = (result: Afspraak) => {
            this.showMessage.emit('De afspraak is opgeslagen');
            this.title = 'Afspraak bekijken';
            this.icon = 'kalenderDag';
            this.bewerkenState = false;
            this.afspraak = result;
            this.changeDetector.detectChanges();
        };

        if (this.afspraak.id) {
            this.roosterDataService.updateAfspraak(formData).subscribe(openDetailNaOpslaan);
        } else if (this.openDetailBijNieuweAfspraak) {
            this.roosterDataService.saveAfspraak(formData).subscribe(openDetailNaOpslaan);
        } else {
            this.roosterDataService.saveAfspraak(formData).subscribe(() => {
                this.showMessage.emit('De afspraak is aangemaakt');
                this.sidebarService.closeSidebar();
            });
        }
    }

    onCancel = () => this.sidebarService.closeSidebar();

    onDeleteHerhaling() {
        const afspraakZonderHerhaling: Afspraak = {
            ...this.afspraak,
            herhalendeAfspraak: null,
            aantalToekomstigeHerhalingen: null
        } as any as Afspraak;
        this.afspraak = afspraakZonderHerhaling;
        this.roosterDataService.updateAfspraak(afspraakZonderHerhaling).subscribe((result) => {
            this.title = 'Afspraak bekijken';
            this.icon = 'kalenderDag';
            this.bewerkenState = false;
            this.afspraak = result as Afspraak;
            this.changeDetector.detectChanges();
        });
    }

    onRegistreren() {
        this.router.navigate(['/rooster/les/' + this.afspraak.id! + '/registratie']);
        this.sidebarService.closeSidebar();
    }

    onDelete() {
        if (this.afspraak.herhalendeAfspraak) {
            const popup = this.popupService.popup(
                this.viewContainerRef,
                ConfirmationDialogComponent.defaultPopupSettings,
                ConfirmationDialogComponent
            );
            popup.title = 'Je wijzigt een herhaalafspraak';
            popup.actionLabel = 'Doorgaan';
            popup.cancelLabel = 'Annuleren';
            popup.showLoaderOnConfirm = false;
            popup.onConfirmFn = () => {
                this.roosterDataService.deleteAfspraak(this.afspraak as Afspraak);
                this.sidebarService.closeSidebar();
                return true;
            };
            popup.message = 'Let op: je verwijdert alleen deze afspraak. Andere herhalingen van deze afspraak blijven bestaan.';
        } else {
            this.roosterDataService.deleteAfspraak(this.afspraak as Afspraak);
            this.sidebarService.closeSidebar();
            this.changeDetector.markForCheck();
        }
    }

    onEdit() {
        this.bewerkenState = true;
        this.title = 'Afspraak bewerken';
        this.icon = 'bewerken';
        this.changeDetector.detectChanges();
    }

    closeSidebar() {
        if (this.afspraakFormulierComponent?.editAfspraakForm.dirty) {
            this.openEditAfspraakGuard();
        } else {
            this.sidebarService.closeSidebar();
        }
    }

    private openEditAfspraakGuard() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, wijzigingen zijn niet opgeslagen';
        popup.message = `Weet je zeker dat je wilt stoppen met bewerken van deze afspraak? Wijzigingen worden niet opgeslagen.`;
        popup.actionLabel = 'Stoppen met bewerken';
        popup.cancelLabel = 'Annuleren';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'accent_negative_1';

        popup.onConfirmFn = () => {
            this.sidebarService.closeSidebar();
            return true;
        };
    }
}
