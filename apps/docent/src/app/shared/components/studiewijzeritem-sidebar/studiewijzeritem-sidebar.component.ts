import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { IconDirective, IconPillComponent, TooltipDirective } from 'harmony';
import {
    IconBewerken,
    IconHuiswerk,
    IconInleveropdracht,
    IconKalenderDag,
    IconKlok,
    IconName,
    IconNietZichtbaar,
    IconPijlLinks,
    IconToets,
    IconToetsGroot,
    IconToevoegen,
    provideIcons
} from 'harmony-icons';
import { isEmpty, isEqual, reduce } from 'lodash-es';
import { Observable, Subject } from 'rxjs';
import { set } from 'shades';
import { HasKey } from 'shades/types/utils';
import {
    Afspraak,
    CachedStudiewijzeritemQuery,
    Lesgroep,
    Sjabloon,
    SjabloonFieldsFragment,
    StudiewijzerFieldsFragment,
    Studiewijzeritem,
    Toekenning,
    ToekomendeAfsprakenQuery,
    namedOperations
} from '../../../../generated/_types';
import { SaveToekenningContainer } from '../../../core/models';
import { SidebarPage } from '../../../core/models/studiewijzers/studiewijzer.model';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../../core/popup/popup.settings';
import { ComponentUploadService } from '../../../core/services/component-upload.service';
import { ProjectgroepenDataService } from '../../../core/services/projectgroepen-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LesuurComponent } from '../../../rooster-shared/components/lesuur/lesuur.component';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { VerwijderButtonComponent } from '../../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { HuiswerkTypeTitelPipe } from '../../../rooster-shared/pipes/huiswerk-type-titel.pipe';
import { RoosterToetsPipe } from '../../../rooster-shared/pipes/roostertoets.pipe';
import { ToekenningDatumPipe } from '../../../rooster-shared/pipes/toekenningDatum.pipe';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { DropDownOption } from '../../../rooster-shared/utils/dropdown.util';
import { Optional, copyObject, getHuiswerkTypeTitel, notEqualsId, studiewijzerIcon } from '../../../rooster-shared/utils/utils';
import { StudiewijzerDataService } from '../../../studiewijzers/studiewijzer-data.service';
import { genereerSyncGuardPopup } from '../../utils/studiewijzer.utils';
import { isAfspraakToekenning } from '../../utils/toekenning.utils';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ProjectgroepenComponent } from '../projectgroepen-toevoegen/projectgroepen.component';
import { StudiewijzeritemInhoudComponent } from '../studiewijzeritem-inhoud/studiewijzeritem-inhoud.component';
import { SynchroniseerItemMetSjabloonComponent } from '../synchroniseer-item-met-sjabloon/synchroniseer-item-met-sjabloon.component';
import { ConceptinleveropdrachtInhoudComponent } from './conceptinleveropdracht-inhoud/conceptinleveropdracht-inhoud.component';
import { InleveropdrachtInhoudComponent } from './inleveropdracht-inhoud/inleveropdracht-inhoud.component';
import { ToekenningFormulierComponent } from './toekenning-formulier/toekenning-formulier.component';

const studiewijzeritemSidebarPage: SidebarPage = {
    titel: '',
    icon: null,
    iconClickable: false,
    id: 'swi-bekijken'
};

@Component({
    selector: 'dt-studiewijzeritem-sidebar',
    templateUrl: './studiewijzeritem-sidebar.component.html',
    styleUrls: ['./studiewijzeritem-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentUploadService,
        HuiswerkTypeTitelPipe,
        provideIcons(
            IconNietZichtbaar,
            IconKlok,
            IconKalenderDag,
            IconBewerken,
            IconToevoegen,
            IconInleveropdracht,
            IconPijlLinks,
            IconHuiswerk,
            IconToets,
            IconToetsGroot
        )
    ],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    standalone: true,
    imports: [
        SidebarComponent,
        ConceptinleveropdrachtInhoudComponent,
        InleveropdrachtInhoudComponent,
        SynchroniseerItemMetSjabloonComponent,
        LesuurComponent,
        TooltipDirective,
        StudiewijzeritemInhoudComponent,
        VerwijderButtonComponent,
        OutlineButtonComponent,
        ProjectgroepenComponent,
        ToekenningFormulierComponent,
        MessageComponent,
        AsyncPipe,
        ToekenningDatumPipe,
        RoosterToetsPipe,
        DtDatePipe,
        IconDirective,
        IconPillComponent
    ]
})
export class StudiewijzeritemSidebarComponent extends BaseSidebar implements OnInit, OnChanges, OnDestroy {
    public sidebarService = inject(SidebarService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private changeDetector = inject(ChangeDetectorRef);
    private projectDataService = inject(ProjectgroepenDataService);
    @ViewChild(ToekenningFormulierComponent) toekenningformulierComponent: ToekenningFormulierComponent;
    @ViewChild(VerwijderButtonComponent) verwijderButtonComponent: VerwijderButtonComponent;
    @ViewChild(SidebarComponent, { read: ElementRef }) sidebarComponent: ElementRef;

    @Input() toekenning: Toekenning;
    @Input() afspraak: Afspraak;
    @Input() selectedLesgroepen: Lesgroep[];
    @Input() heeftToegangTotElo: boolean;
    @Input() heeftToegangTotDifferentiatie: boolean;
    @Input() openInEditMode: boolean;
    @Input() toonDatepicker = true;
    @Input() toonVerwijderButton = true;
    @Input() toonLesgroep = false;
    @Input() schooljaar = getYear(getSchooljaar(new Date()).start);
    @Input() toonUitMethode = true;
    @Input() heeftToegangTotSw = true;
    @Input() toonLesgroepenControls = false;

    @Input() isEditable: boolean;
    @Input() openWithDirtyForm = false;
    @Input() isSjabloon: boolean;
    @Input() sjabloon: Optional<SjabloonFieldsFragment>;
    @Input() studiewijzer: Optional<StudiewijzerFieldsFragment>;
    @Input() conceptInleveropdrachtWeekOpties: DropDownOption<number>[];
    @Input() toekomendeAfspraken: ToekomendeAfsprakenQuery['toekomendeAfspraken'];

    onVerwijder = output<Toekenning>();
    onSaveToekenning = output<SaveToekenningContainer>();
    onDifferentiatieToekenning = output<Toekenning>();

    // Synchronisatie header helpers
    @Input() magSynchroniserenMetSjabloon = false;

    public actie = 'bekijken';
    public studiewijzeritem$: Observable<CachedStudiewijzeritemQuery['studiewijzeritem']>;
    public isAfspraakTonen: boolean;

    private destroy$ = new Subject<void>();

    showSuccesMessage = false;
    succesMessage: string;

    ngOnInit() {
        this.sidebarService.changePage({
            ...studiewijzeritemSidebarPage,
            id: this.openInEditMode ? 'swi-bewerken' : 'swi-bekijken'
        });
        // omdat we nog een hybrid hebben van losse sidebars en pages
        // checken we hier of we niet van de lesgroep selectie sidebar
        //  komen om de titel en icon te zetten
        if (!this.selectedLesgroepen) {
            this.sidebar.title = this.generateTitle(this.openInEditMode);
            this.sidebar.icon = this.generateIcon();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['toekenning']?.currentValue !== changes['toekenning']?.previousValue) {
            this.studiewijzeritem$ = this.projectDataService
                .getCachedStudiewijzeritem(this.toekenning.studiewijzeritem.id)
                .pipe(shareReplayLastValue());
        }

        if (isAfspraakToekenning(this.toekenning) && this.afspraak) {
            this.isAfspraakTonen = true;
        }

        this.toekenningformulierComponent?.differentiatiegroepen$?.next(this.toekenning.differentiatiegroepen?.map(copyObject) ?? []);
        this.toekenningformulierComponent?.differentiatieleerlingen$?.next(this.toekenning.differentiatieleerlingen?.map(copyObject) ?? []);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    generateTitle(editMode: boolean) {
        const studiewijzeritem = this.toekenning.studiewijzeritem;
        const heeftInleverOpdracht = !!studiewijzeritem.inleverperiode || !!studiewijzeritem.conceptInleveropdracht;
        const bewerkenOfToevoegen = this.toekenning.studiewijzeritem.id ? 'bewerken' : 'toevoegen';
        this.actie = editMode ? bewerkenOfToevoegen : 'bekijken';
        const typeTekst = getHuiswerkTypeTitel(studiewijzeritem.huiswerkType, heeftInleverOpdracht);

        const typeOfLesitem = this.actie === 'bekijken' || heeftInleverOpdracht ? typeTekst : 'Lesitem';
        return `${typeOfLesitem} ${this.actie}`;
    }

    generateIcon(): IconName {
        const studiewijzerItem = this.toekenning.studiewijzeritem;
        const heeftInleverOpdracht = !!studiewijzerItem.inleverperiode || !!studiewijzerItem.conceptInleveropdracht;
        const bewerkenOfToevoegen = studiewijzerItem.id ? 'bewerken' : 'toevoegen';

        return this.inEditMode ? bewerkenOfToevoegen : heeftInleverOpdracht ? 'inleveropdracht' : (studiewijzerItem.icon as IconName);
    }

    openProjectgroepen() {
        // nog op beide manier zolang projectgroepen nog geen losse sidebar is
        this.sidebarService.changePage({
            id: 'projectgroepen',
            titel: 'Projectgroepen',
            icon: 'pijlLinks',
            iconClickable: true,
            isVerdieping: true
        });
        this.sidebar.title = this.sidebarService.currentPage!.titel;
        this.sidebar.icon = this.sidebarService.currentPage!.icon;
        this.sidebar.iconClickable = this.sidebarService.currentPage!.iconClickable;
        this.sidebar.onIconClick = () => this.closeProjectgroepen();
    }

    closeProjectgroepen() {
        this.sidebarService.previousPage();
    }

    get inEditMode() {
        return this.sidebarService.currentPage?.id === 'swi-bewerken' || this.sidebarService.currentPage?.id === 'methoden';
    }

    // wanneer er naast de sidebar of op het kruisje is geklikt
    closeSidebar() {
        if (this.inEditMode && this.toekenningformulierComponent?.heeftTekstueleOfDifferentiatieWijzigingen()) {
            this.openEditToekenningGuard();
        } else if (this.toekenningformulierComponent?.isUploading) {
            this.openUploadGuard();
        } else {
            this.sidebarService.closeSidebar();
        }
    }

    // wanneer op annuleren wordt geklikt
    onCancel(cancelCallback?: () => void) {
        if (this.toekenningformulierComponent?.heeftTekstueleOfDifferentiatieWijzigingen()) {
            this.openEditToekenningGuard(cancelCallback, this.sidebarService.currentPage!.isVerdieping ?? false);
        } else if (this.toekenningformulierComponent?.isUploading) {
            this.openUploadGuard();
        } else {
            this.sidebarService.currentPage!.isVerdieping
                ? this.sidebarService.previousPage()
                : this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
        }
    }

    private openEditToekenningGuard(onConfirm?: () => void, toPreviousPage = false) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        const isInleveropdracht = !!this.toekenning.studiewijzeritem.inleverperiode;
        const itemOfOpdracht = isInleveropdracht ? 'deze inleveropdracht' : 'dit lesitem';

        popup.title = 'Let op, wijzigingen zijn niet opgeslagen';
        popup.message = `Weet je zeker dat je wilt stoppen met bewerken van ${itemOfOpdracht}? Wijzigingen worden niet opgeslagen.`;
        popup.actionLabel = 'Stoppen met bewerken';
        popup.cancelLabel = 'Annuleren';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'negative';

        popup.onConfirmFn = () => {
            toPreviousPage ? this.sidebarService.previousPage() : this.sidebarService.closeSidebar();
            onConfirm?.();
            return true;
        };
    }

    toggleEditMode() {
        const swi = this.toekenning.studiewijzeritem;
        this.sidebarService.changePage(
            {
                ...this.sidebarService.currentPage,
                id: this.inEditMode ? 'swi-bekijken' : 'swi-bewerken',
                titel: this.generateTitle(!this.inEditMode),
                icon: swi.inleverperiode || swi.conceptInleveropdracht ? 'inleveropdracht' : (swi.icon as IconName)
            },
            true
        );
        this.sidebar.title = this.sidebarService.currentPage!.titel;
        this.sidebar.icon = this.sidebarService.currentPage!.icon;
        this.changeDetector.detectChanges();
    }

    ontkoppelToekenning() {
        this.studiewijzerDataService.ontkoppelToekenning(this.toekenning.id, [namedOperations.Query.studiewijzerView]).subscribe(() => {
            this.succesMessage = 'Item is ontkoppeld';
            this.showSuccesMessage = true;
            this.toekenning.synchroniseertMet = null;
            this.changeDetector.detectChanges();
        });
    }

    onSynchroniseren(sjabloon: Sjabloon) {
        this.studiewijzerDataService.koppelToekenning(sjabloon.id, this.toekenning.id).subscribe(() => {
            this.succesMessage = `Item is aan <b>${sjabloon.naam}</b> toegevoegd`;
            this.showSuccesMessage = true;
            this.toekenning = {
                ...this.toekenning,
                synchroniseertMet: sjabloon.naam
            };
            this.changeDetector.detectChanges();
        });
    }

    private openUploadGuard() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };
        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);

        popup.title = 'Let op, er zijn nog bestanden aan het uploaden';
        popup.message = 'Als je het overzicht sluit worden de uploads afgebroken. Weet je zeker dat je het overzicht wilt sluiten?';
        popup.actionLabel = 'Ja, sluit overzicht';
        popup.cancelLabel = 'Terug naar overzicht';

        popup.onConfirmFn = () => {
            // De uploads kunnen klaar zijn op het moment als deze subscription uitgevoerd wordt.
            if (this.toekenningformulierComponent.isUploading) {
                this.toekenningformulierComponent.omschrijvingEnBijlage.uploadLijst.cancelAllUploads();
            }
            this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
            return true;
        };
    }

    openSyncGuard(toekenningenContainer: SaveToekenningContainer) {
        const popup = genereerSyncGuardPopup(this.popupService, this.viewContainerRef);

        popup.onConfirmFn = () => {
            this.saveToekenning(toekenningenContainer, true);
            return true;
        };

        popup.onCancelClick = () => {
            this.studiewijzerDataService
                .ontkoppelToekenning(toekenningenContainer.toekenningen[0].id, [namedOperations.Query.studiewijzerView])
                .subscribe(() => {
                    toekenningenContainer.toekenningen[0].synchroniseertMet = null;
                    toekenningenContainer.gesynchroniseerdSjabloon = null;
                    this.saveToekenning(toekenningenContainer);
                    popup.popup.onClose();
                    this.changeDetector.markForCheck();
                });
        };
    }

    saveToekenning(toekenningenContainer: SaveToekenningContainer, syncConfirmed = false) {
        if (
            toekenningenContainer.toekenningen[0].id &&
            toekenningenContainer.toekenningen[0].synchroniseertMet &&
            !syncConfirmed &&
            !this.sjabloon &&
            !this.alleenZichtbaarheidGewijzigd(toekenningenContainer.toekenningen[0])
        ) {
            this.openSyncGuard(toekenningenContainer);
            return;
        }

        this.onSaveToekenning.emit(toekenningenContainer);

        if (toekenningenContainer.toekenningen[0].id && !toekenningenContainer.toekenningen[0].studiewijzeritem.inleverperiode) {
            this.toekenning = toekenningenContainer.toekenningen[0];
        }
        if (!toekenningenContainer.copyOnSave) {
            this.toggleEditMode();
        }

        this.toekenning = set('studiewijzeritem', 'icon')(studiewijzerIcon(this.toekenning.studiewijzeritem.huiswerkType) as string)(
            this.toekenning as HasKey<'studiewijzeritem', HasKey<'icon', string>>
        ) as Toekenning;
        this.sidebarService.changePage({ ...this.sidebarService.currentPage!, icon: this.generateIcon() });
        this.sidebar.icon = this.generateIcon();
    }

    onVerwijderenClick() {
        this.onVerwijder.emit(this.toekenning);
        this.closeSidebar();
    }

    alleenZichtbaarheidGewijzigd(toekenning: Toekenning): boolean {
        const updateInToekenning = reduce(
            toekenning,
            (result, value, key: keyof Toekenning) => (isEqual(value, this.toekenning[key]) ? result : result.concat(key)),
            <any>[]
        );

        if (updateInToekenning.length === 1 && updateInToekenning[0] !== 'studiewijzeritem') {
            return false;
        }

        const updateInStudiewijzeritem = reduce(
            toekenning.studiewijzeritem,
            (result, value, key: keyof Studiewijzeritem) =>
                isEqual(value, this.toekenning.studiewijzeritem[key]) ? result : result.concat(key),
            <any>[]
        );

        return updateInStudiewijzeritem.length === 1 && updateInStudiewijzeritem[0] === 'zichtbaarVoorLeerling';
    }

    scrollSidebarToBottom() {
        this.sidebarComponent.nativeElement.scrollTo({
            top: this.sidebarComponent.nativeElement.scrollHeight,
            behavior: 'smooth'
        });
    }

    verwijderAlleDiffLeerlingen() {
        this.toekenning = { ...this.toekenning, differentiatieleerlingen: [] };
        this.onSaveToekenning.emit({ toekenningen: [this.toekenning] });
    }

    verwijderDiffLeerling(leerlingId: string) {
        this.toekenning = {
            ...this.toekenning,
            differentiatieleerlingen: [...this.toekenning.differentiatieleerlingen].filter(notEqualsId(leerlingId))
        };
        this.onSaveToekenning.emit({ toekenningen: [this.toekenning] });
    }

    verwijderDiffGroep(groepId: string) {
        this.toekenning = {
            ...this.toekenning,
            differentiatiegroepen: [...this.toekenning.differentiatiegroepen].filter(notEqualsId(groepId))
        };
        this.onSaveToekenning.emit({ toekenningen: [this.toekenning] });
    }

    get lesgroepen(): Lesgroep[] {
        if (this.toekenning.lesgroep) {
            return [this.toekenning.lesgroep];
        } else if (!isEmpty(this.selectedLesgroepen)) {
            return this.selectedLesgroepen;
        } else if (this.studiewijzer?.lesgroep) {
            return [this.studiewijzer.lesgroep];
        } else if (this.afspraak?.lesgroepen) {
            return this.afspraak.lesgroepen;
        }
        return [];
    }

    get abstractStudiewijzer(): Optional<StudiewijzerFieldsFragment | SjabloonFieldsFragment> {
        return this.studiewijzer ?? this.sjabloon;
    }

    get toonDifferentiatie() {
        return (
            (!this.isSjabloon && this.heeftToegangTotDifferentiatie) ||
            (!this.heeftToegangTotDifferentiatie && // voor als er geen toegang meer is maar er wel differentiatie op het item zit
                (this.toekenning.differentiatiegroepen.length > 0 || this.toekenning.differentiatieleerlingen.length > 0))
        );
    }
}
