import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { Router } from '@angular/router';

import { NgClass } from '@angular/common';
import { IconDirective, PillComponent, TagComponent } from 'harmony';
import { IconBewerken, IconBijlage, IconVerversen, IconVerwijderen, IconYesRadio, provideIcons } from 'harmony-icons';
import { RoosterItem, isAfspraak } from '../../../../core/models';
import { PopupService } from '../../../../core/popup/popup.service';
import { PopupDirection } from '../../../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { RoosterDataService } from '../../../../rooster/rooster-data.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { VerwijderPopupComponent } from '../../../../shared/components/verwijder-popup/verwijder-popup.component';
import { AfspraakTitelPipe } from '../../../pipes/afspraak-titel.pipe';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../../pipes/volledige-naam.pipe';
import { AfspraakSidebarComponent } from '../../afspraak-sidebar/afspraak-sidebar.component';
import { IconComponent } from '../../icon/icon.component';
import { RoosterItemBaseDirective } from '../rooster-item';

@Component({
    selector: 'dt-eigen-afspraak',
    templateUrl: './eigen-afspraak.component.html',
    styleUrls: ['./../rooster-item.scss', './eigen-afspraak.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TagComponent, IconComponent, NgClass, DtDatePipe, VolledigeNaamPipe, AfspraakTitelPipe, IconDirective, PillComponent],
    providers: [provideIcons(IconVerversen, IconBijlage, IconVerwijderen, IconYesRadio, IconBewerken)]
})
export class EigenAfspraakComponent extends RoosterItemBaseDirective implements OnChanges {
    public viewContainerRef = inject(ViewContainerRef);
    public popupService = inject(PopupService);
    private roosterDataService = inject(RoosterDataService);
    private medewerkerService = inject(MedewerkerDataService);
    private router = inject(Router);
    private changedetector = inject(ChangeDetectorRef);
    private sidebarService = inject(SidebarService);
    @ViewChild('deleteIcon', { read: ViewContainerRef, static: true }) deleteIcon: ViewContainerRef;
    @ViewChild('editIcon', { read: ViewContainerRef, static: true }) editIcon: ViewContainerRef;
    @ViewChild('titel', { read: ViewContainerRef, static: true }) titel: ViewContainerRef;
    @ViewChild('container') viewContainer: ViewChild;

    @HostBinding('class.huidige') huidigeAfspraak: boolean;
    @HostBinding('class.borderless') borderless = false;
    @HostBinding('class.popup-open') isPopupOpen = false;
    @Input() @HostBinding('class.laatste-afspraak') last: boolean;
    @Input() volgendeRoosterItem: RoosterItem;
    @Input() toonVrijUren: boolean;

    public ingelogdeMedewerkerIsAuteur: boolean;

    ngOnChanges(): void {
        this.ingelogdeMedewerkerIsAuteur =
            !!this.afspraak.auteurEigenAfspraak && this.medewerkerService.medewerkerId === this.afspraak.auteurEigenAfspraak.id;
        this.huidigeAfspraak = this.afspraak?.isNu ?? false;
        this.borderless = this.toonVrijUren && this.volgendeRoosterItem && !isAfspraak(this.volgendeRoosterItem);
    }

    @HostListener('click') onClick() {
        this.openSidebar();
    }

    openSidebar() {
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak: this.afspraak, bewerkenState: false });
    }

    onRegistratieClick = (event: Event) => {
        this.router.navigate(['/rooster/les/' + this.afspraak.id + '/registratie']);
        this.stopPropagation(event);
    };

    onEditClick = (event: Event) => {
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak: this.afspraak, bewerkenState: true });
        this.popupService.closePopUp();
        this.stopPropagation(event);
    };

    onDeleteClick(event: Event) {
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
                this.roosterDataService.deleteAfspraak(this.afspraak);
                return true;
            };
            popup.message = 'Let op: je verwijdert alleen deze afspraak. Andere herhalingen van deze afspraak blijven bestaan.';
        } else {
            this.isPopupOpen = true;
            const popupSettings = VerwijderPopupComponent.defaultPopupSettings;
            popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom];
            const popup = this.popupService.popup(this.deleteIcon, popupSettings, VerwijderPopupComponent);
            popup.onDeleteClick = () => {
                this.roosterDataService.deleteAfspraak(this.afspraak);
                this.isPopupOpen = false;
                this.changedetector.markForCheck();
            };
            popup.onCancelClick = () => {
                this.isPopupOpen = false;
                this.changedetector.markForCheck();
            };
        }

        this.stopPropagation(event);
    }

    stopPropagation(event: Event) {
        if (event) {
            event.stopPropagation();
        }
    }

    onPopUpClose = () => {
        this.isPopupOpen = false;
        this.changedetector.markForCheck();
    };

    get afspraakParticipantenLength(): number {
        const participantenLength = this.afspraak.participantenEigenAfspraak?.length;
        return this.ingelogdeMedewerkerIsAuteur ? participantenLength : participantenLength - 1;
    }
}
