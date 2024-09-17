import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { Router } from '@angular/router';
import { Afrondingsoverzicht, Toekenning } from '@docent/codegen';
import { IconDirective, IconPillComponent, PillComponent, TooltipDirective } from 'harmony';
import {
    IconBewerken,
    IconChevronOnder,
    IconInleveropdracht,
    IconNietZichtbaar,
    IconOpties,
    IconTijd,
    IconVerwijderen,
    provideIcons
} from 'harmony-icons';
import { Observable, of } from 'rxjs';
import { PopupService } from '../../../../core/popup/popup.service';
import {
    ActionsPopupComponent,
    bewerkButton,
    verwijderButton,
    zichtbaarheidButton
} from '../../../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../../../rooster-shared/components/icon/icon.component';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { StudiewijzeritemTitelPipe } from '../../../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { mapDifferentiatieToKleurenStackElements } from '../../../../rooster-shared/utils/color-token-utils';
import { sortLocale } from '../../../../rooster-shared/utils/utils';
import { AfrondingsoverzichtPopupComponent } from '../../../../shared-studiewijzer-les/afrondingsoverzicht-popup/afrondingsoverzicht-popup.component';
import { KleurenStackComponent, KleurenStackElement } from '../../../../shared/components/kleuren-stack/kleuren-stack.component';
import { VerwijderPopupComponent } from '../../../../shared/components/verwijder-popup/verwijder-popup.component';
import { ZichtbaarheidstoggleComponent } from '../../../../shared/components/zichtbaarheidstoggle/zichtbaarheidstoggle.component';
import { StudiewijzerDataService } from '../../../../studiewijzers/studiewijzer-data.service';

@Component({
    selector: 'dt-inleveropdracht-overzicht-item',
    templateUrl: './inleveropdracht-overzicht-item.component.html',
    styleUrls: ['./inleveropdracht-overzicht-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TooltipDirective,
        KleurenStackComponent,
        IconComponent,
        ZichtbaarheidstoggleComponent,
        StudiewijzeritemTitelPipe,
        DtDatePipe,
        IconDirective,
        IconPillComponent,
        PillComponent
    ],
    providers: [provideIcons(IconTijd, IconInleveropdracht, IconChevronOnder, IconNietZichtbaar, IconBewerken, IconOpties, IconVerwijderen)]
})
export class InleveropdrachtOverzichtItemComponent implements OnInit {
    private popupService = inject(PopupService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private router = inject(Router);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;
    @ViewChild('verwijderButton', { read: ViewContainerRef }) verwijderButton: ViewContainerRef;
    @ViewChild('inleveringen', { read: ViewContainerRef }) inleveringenPill: ViewContainerRef;

    @HostBinding('class.popup-open') isPopupOpen = false;

    @Input() toekenning: Toekenning;
    @Input() toonLesgroep = false;

    onVerwijder = output<void>();
    onToggleZichtbaarheid = output<void>();
    onEdit = output<void>();

    kleuren: KleurenStackElement[];

    ngOnInit() {
        this.kleuren = mapDifferentiatieToKleurenStackElements(
            this.toekenning.differentiatiegroepen,
            this.toekenning.differentiatieleerlingen
        );
    }

    toggleZichtbaarheid(event: Event) {
        event?.stopPropagation();
        this.onToggleZichtbaarheid.emit();
    }

    openOptiesPopup(event: Event) {
        event.stopPropagation();

        const popup = this.popupService.popup(this.moreOptionsIcon, ActionsPopupComponent.defaultPopupsettings, ActionsPopupComponent);
        popup.customButtons = [
            {
                icon: 'inleveropdracht',
                color: 'primary',
                text: 'Naar inleveringen',
                isVerwijderButton: false,
                onClickFn: () => this.navigeerNaarInleveringen()
            },
            verwijderButton(() => this.onVerwijder.emit(), 'inleveropdracht-overzicht-verwijderen'),
            zichtbaarheidButton(this.toekenning.studiewijzeritem.zichtbaarVoorLeerling, '', () => this.onToggleZichtbaarheid.emit()),
            bewerkButton(() => this.onEdit.emit())
        ];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    openInleveringenPopup() {
        const popup = this.popupService.popup(
            this.inleveringenPill,
            AfrondingsoverzichtPopupComponent.defaultPopupSettings,
            AfrondingsoverzichtPopupComponent
        );
        const projectgroepen = this.toekenning.studiewijzeritem.projectgroepen;
        popup.datasource$ =
            projectgroepen.length > 0
                ? of<Afrondingsoverzicht>({
                      afgerond: sortLocale(
                          projectgroepen.filter((g) => g.heeftInlevering),
                          ['hoogstePlagiaat', 'naam'],
                          ['desc', 'asc']
                      ),
                      nietAfgerond: projectgroepen.filter((g) => !g.heeftInlevering)
                  })
                : (this.studiewijzerDataService.getInleveroverzicht(this.toekenning.id) as Observable<Afrondingsoverzicht>);
        popup.afgerondLabel = 'Ingeleverd';
        popup.onafgerondLabel = 'Niet ingeleverd';
        popup.typeLabel = projectgroepen.length > 0 ? 'projectgroepen' : 'leerlingen';
        popup.toekenningId = this.toekenning.id;
    }

    navigeerNaarInleveringen(event?: Event) {
        event?.stopPropagation();
        const url = this.router.parseUrl(`/inleveropdrachten/${this.toekenning.id}`);
        this.router.navigateByUrl(url);
    }

    showVerwijderPopup(event: Event) {
        event.stopPropagation();
        this.isPopupOpen = true;
        const popupSettings = VerwijderPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.verwijderButton, popupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => this.onVerwijder.emit();
        popup.onCancelClick = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };
    }
}
