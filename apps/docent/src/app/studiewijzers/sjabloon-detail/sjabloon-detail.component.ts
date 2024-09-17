import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    HuiswerkType,
    Sjabloon,
    SjabloonFieldsFragment,
    SjabloonViewQuery,
    Studiewijzer,
    Toekenning,
    WeekToekenning
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { IconDirective, SpinnerComponent } from 'harmony';
import {
    IconBewerken,
    IconBijlage,
    IconImporteren,
    IconKopierenNaar,
    IconMethode,
    IconOpties,
    IconPijlLinks,
    IconSjabloon,
    provideIcons
} from 'harmony-icons';
import { get } from 'lodash-es';
import { Observable, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { allowChildAnimations } from '../../core/core-animations';
import { SaveToekenningContainer } from '../../core/models';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../core/services/device.service';
import { MaskService } from '../../core/services/mask.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { UploadDataService } from '../../core/services/upload-data.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { sidebarMaskId } from '../../rooster-shared/components/sidebar/sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { DropDownOption, toConceptInleveropdrachtWeekOption } from '../../rooster-shared/utils/dropdown.util';
import { MAX_INT_VALUE, Optional } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
    bulkSyncedConceptInleveropdrachtVerwijderPopupProperties,
    syncedConceptInleveropdrachtVerwijderPopupProperties
} from '../../shared/components/confirmation-dialog/confirmation-dialog.properties';
import { DeactivatableComponentDirective } from '../../shared/components/deactivatable.component';
import {
    FloatingAction,
    FloatingActionBarComponent,
    backToTopButton,
    bewerkButton,
    studiewijzerSynchroniserenButton
} from '../../shared/components/floating-action-bar/floating-action-bar.component';
import { InlineEditComponent } from '../../shared/components/inline-edit/inline-edit.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { copyToekenning } from '../../shared/utils/toekenning.utils';
import { BulkactiesDataService } from '../bulkacties-data.service';
import { BulkactiesComponent } from '../bulkacties/bulkacties.component';
import { SelectedLesitemsComponent } from '../bulkacties/selected-lesitems/selected-lesitems.component';
import { JaarbijlagenSidebarComponent as JaarbijlagenSidebarComponent_1 } from '../jaarbijlagen-sidebar/jaarbijlagen-sidebar.component';
import { MethodeSidebarComponent } from '../methode-sidebar/methode-sidebar.component';
import { SelecteerStudiewijzerContentSidebarComponent } from '../selecteer-studiewijzer-content-sidebar/selecteer-studiewijzer-content-sidebar.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { SjabloonOntkoppelPopupComponent } from '../sjabloon-ontkoppel-popup/sjabloon-ontkoppel-popup.component';
import { SjabloonSelectieSidebarComponent } from '../sjabloon-selectie-sidebar/sjabloon-selectie-sidebar.component';
import { StudiewijzerSynchronisatieSelectieSidebarComponent } from '../studiewijzer-synchronisatie-selectie-sidebar/studiewijzer-synchronisatie-selectie-sidebar.component';
import { SynchronisatiePopupComponent } from '../synchronisatie-popup/synchronisatie-popup.component';
import { PlanningVerschuifDirection } from '../verschuif-planning-popup/verschuif-planning-popup.component';
import { JaarbijlagenSidebarComponent } from './../jaarbijlagen-sidebar/jaarbijlagen-sidebar.component';
import { SjabloonTitelBewerkenPopupComponent } from './sjabloon-titel-bewerken-popup/sjabloon-titel-bewerken-popup.component';
import { SjabloonViewToekenning, SjabloonWeekComponent } from './sjabloon-week/sjabloon-week.component';

@Component({
    selector: 'dt-sjabloon-detail',
    templateUrl: './sjabloon-detail.component.html',
    styleUrls: ['./sjabloon-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    providers: [
        BulkactiesDataService,
        provideIcons(IconSjabloon, IconPijlLinks, IconBewerken, IconMethode, IconBijlage, IconOpties, IconKopierenNaar, IconImporteren),
        UploadDataService
    ],
    standalone: true,
    imports: [
        HeaderComponent,
        RouterLink,
        InlineEditComponent,
        TooltipDirective,
        JaarbijlagenSidebarComponent_1,
        StudiewijzeritemSidebarComponent,
        CdkDropListGroup,
        SjabloonWeekComponent,
        MethodeSidebarComponent,
        SjabloonSelectieSidebarComponent,
        SelectedLesitemsComponent,
        SelecteerStudiewijzerContentSidebarComponent,
        FloatingActionBarComponent,
        StudiewijzerSynchronisatieSelectieSidebarComponent,
        SpinnerComponent,
        MessageComponent,
        BulkactiesComponent,
        AsyncPipe,
        IconDirective
    ]
})
export class SjabloonDetailComponent extends DeactivatableComponentDirective implements OnInit, OnDestroy {
    private sjabloonDataService = inject(SjabloonDataService);
    private route = inject(ActivatedRoute);
    private sidebarService = inject(SidebarService);
    private medewerkerService = inject(MedewerkerDataService);
    public deviceService = inject(DeviceService);
    private bulkactiesService = inject(BulkactiesDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private renderer2 = inject(Renderer2);
    private medewerkerDataService = inject(MedewerkerDataService);
    private maskService = inject(MaskService);
    @ViewChild(JaarbijlagenSidebarComponent) jaarbijlagenSidebar: JaarbijlagenSidebarComponent;
    @ViewChild(FloatingActionBarComponent) floatingActionBar: FloatingActionBarComponent;
    @ViewChild('moreOptionsMobile', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;
    @ViewChild('importeren', { read: ViewContainerRef }) importerenKnop: ViewContainerRef;
    @ViewChild('toolbar', { read: ElementRef, static: false }) toolbar: ElementRef;

    @HostBinding('class.is-eigenaar') isEigenaar: boolean;

    sjabloonView$: Observable<SjabloonViewQuery['sjabloonView']>;
    heeftToegangTotElo$: Observable<boolean>;
    gesynctSchooljaar$: Observable<Optional<number>>;
    verschuifOmlaagWarningVanaf$: Observable<number>;
    verschuifOmhoogWarningVanaf$: Observable<number>;
    conceptInleveropdrachtWeekOpties$: Observable<DropDownOption<number>[]>;

    selecteerStudiewijzerContentSidebar$: SidebarInputs<SelecteerStudiewijzerContentSidebarComponent>;
    methodeSidebar$: SidebarInputs<MethodeSidebarComponent>;
    studiewijzerSynchronisatieSelectieSidebar$: SidebarInputs<StudiewijzerSynchronisatieSelectieSidebarComponent>;
    studiewijzeritemSidebar$: SidebarInputs<StudiewijzeritemSidebarComponent>;
    jaarbijlagenSidebar$: SidebarInputs<JaarbijlagenSidebarComponent>;
    sjabloonSelectieSidebar$: SidebarInputs<SjabloonSelectieSidebarComponent>;

    floatingActions: FloatingAction[];

    toonBulkacties: boolean;

    disableDragAndDrop$: Observable<boolean>;
    uitMethodeToegestaan$: Observable<boolean>;

    editNaam = false;

    showMessage: boolean;
    message: string;

    private isSynced: boolean;

    onDestroy$ = new Subject<void>();

    ngOnInit() {
        this.sjabloonView$ = this.route.paramMap.pipe(
            switchMap((params) => this.sjabloonDataService.getSjabloonView(params.get('id')!)),
            tap((sjabloonView) => {
                this.isEigenaar = sjabloonView.sjabloon.eigenaar.id === this.medewerkerService.medewerkerId;
                this.checkVerlopenStudiewijzers(sjabloonView.sjabloon as Sjabloon);
            }),
            shareReplayLastValue()
        );

        // floating actions bar opnieuw tekenen wanneer we switchen van resolutie
        combineLatest([this.sjabloonView$, this.deviceService.onDeviceChange$])
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(([sjabloonView]) => {
                const syncedStudiewijzers = sjabloonView.sjabloon.gesynchroniseerdeStudiewijzers;
                const synced = syncedStudiewijzers?.length > 0;
                this.isSynced = synced;
                this.setFloatingActions(synced, syncedStudiewijzers as Studiewijzer[], sjabloonView.sjabloon.synchronisatieStartweek);
            });

        this.gesynctSchooljaar$ = this.sjabloonView$.pipe(
            map(({ sjabloon }) =>
                get(sjabloon, 'gesynchroniseerdeStudiewijzers', []).length > 0
                    ? sjabloon.gesynchroniseerdeStudiewijzers[0].schooljaar
                    : null
            )
        );

        this.conceptInleveropdrachtWeekOpties$ = this.sjabloonView$.pipe(
            map((view) => view.weken.map(toConceptInleveropdrachtWeekOption(view.sjabloon.gesynchroniseerdeStudiewijzers.length > 0))),
            shareReplayLastValue()
        );

        this.heeftToegangTotElo$ = this.sjabloonView$.pipe(
            switchMap((sjabloonView) => this.medewerkerService.heeftToegangTotElo(sjabloonView.sjabloon.vestigingId)),
            startWith(true),
            shareReplayLastValue()
        );

        this.verschuifOmhoogWarningVanaf$ = this.sjabloonView$.pipe(
            map((sjabloonView) => this.findAantalLegeWeken(sjabloonView.weken, false)),
            shareReplayLastValue()
        );

        this.verschuifOmlaagWarningVanaf$ = this.sjabloonView$.pipe(
            map((sjabloonView) => this.findAantalLegeWeken(sjabloonView.weken, true)),
            shareReplayLastValue()
        );

        const mobileOrTablet$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery] || state.breakpoints[tabletQuery]),
            distinctUntilChanged()
        );

        this.disableDragAndDrop$ = combineLatest([this.bulkactiesService.inEditMode, mobileOrTablet$]).pipe(
            map(([inBulkMode, mobileOrTablet]) => mobileOrTablet && !inBulkMode),
            distinctUntilChanged(),
            shareReplayLastValue()
        );

        const header = document.querySelector('dt-header');
        if (header) {
            const observer = new IntersectionObserver(this.stickyHandler);
            observer.observe(header);
        }

        this.uitMethodeToegestaan$ = this.medewerkerDataService.importUitMethodeToegestaan();

        this.studiewijzeritemSidebar$ = this.sidebarService.watchFor(StudiewijzeritemSidebarComponent);
        this.jaarbijlagenSidebar$ = this.sidebarService.watchFor(JaarbijlagenSidebarComponent);
        this.studiewijzerSynchronisatieSelectieSidebar$ = this.sidebarService.watchFor(StudiewijzerSynchronisatieSelectieSidebarComponent);
        this.selecteerStudiewijzerContentSidebar$ = this.sidebarService.watchFor(SelecteerStudiewijzerContentSidebarComponent);
        this.methodeSidebar$ = this.sidebarService.watchFor(MethodeSidebarComponent);
        this.sjabloonSelectieSidebar$ = this.sidebarService.watchFor(SjabloonSelectieSidebarComponent);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    setFloatingActions(isSynced: boolean, studiewijzers: Studiewijzer[], syncStartWeek: Optional<number>) {
        this.floatingActions = this.isEigenaar
            ? [
                  backToTopButton(),
                  studiewijzerSynchroniserenButton(() => this.onSjabloonSyncClick(isSynced, studiewijzers, syncStartWeek), isSynced)
              ]
            : [backToTopButton()];

        if (!this.deviceService.isDesktop() && this.isEigenaar) {
            this.floatingActions.push(bewerkButton(() => this.setBulkacties(true)));
        }
    }

    addLabelToWeek(id: string, week: SjabloonViewQuery['sjabloonView']['weken'][number], label: string) {
        this.sjabloonDataService.addLabelToSjabloonWeek(id, week.weeknummer, label);
    }

    removeLabelFromWeek(id: string, week: SjabloonViewQuery['sjabloonView']['weken'][number]) {
        this.sjabloonDataService.removeLabelFromSjabloonWeek(id, week.weeknummer);
    }

    onSjabloonSyncClick(isSynced: boolean, studiewijzers: Studiewijzer[], syncStartWeek: Optional<number>) {
        if (isSynced) {
            const popupSettings = SynchronisatiePopupComponent.defaultPopupsettings;
            popupSettings.isFixed = true;
            const popup = this.popupService.popup(this.floatingActionBar.buttons.toArray()[1], popupSettings, SynchronisatiePopupComponent);
            popup.studiewijzers = studiewijzers;
            popup.synchronisatieStartweek = syncStartWeek;
            popup.bewerkSynchonisatiesFn = () => this.sidebarService.openSidebar(StudiewijzerSynchronisatieSelectieSidebarComponent);
        } else {
            this.sidebarService.openSidebar(StudiewijzerSynchronisatieSelectieSidebarComponent);
        }
    }

    saveSjabloon(sjabloon: SjabloonFieldsFragment, newValue: string) {
        const sjabloonCopy = { ...sjabloon };
        sjabloonCopy.naam = newValue;
        this.sjabloonDataService.saveSjabloonVanuitDetail(sjabloonCopy, sjabloon.vaksectie.uuid).subscribe();
        this.editNaam = false;
    }

    openJaarbijlagen(sjabloonId: string) {
        this.sidebarService.openSidebar(JaarbijlagenSidebarComponent, { abstractSwId: sjabloonId, isSjabloon: true });
    }

    canDeactivate(): boolean {
        return this.jaarbijlagenSidebar ? !this.jaarbijlagenSidebar.jaarbijlagen?.isUploading() : true;
    }

    onMoreOptionsClick(sjabloon: SjabloonFieldsFragment) {
        const settings = ActionsPopupComponent.defaultPopupsettings;

        const popup = this.popupService.popup(this.moreOptionsIcon, settings, ActionsPopupComponent);
        popup.customButtons = [
            {
                icon: 'bewerken',
                color: 'primary',
                text: 'Titel wijzigen',
                gtmTag: 'sjabloon-titel-wijzigen',
                onClickFn: () => {
                    this.openBewerkTitelPopup(sjabloon);
                }
            } as ActionButton
        ];
        popup.title = sjabloon.naam;
    }

    openBewerkTitelPopup(sjabloon: SjabloonFieldsFragment) {
        const popup = this.popupService.popup(
            this.moreOptionsIcon,
            SjabloonTitelBewerkenPopupComponent.defaultPopupsettings,
            SjabloonTitelBewerkenPopupComponent
        );
        popup.sjabloonTitel = sjabloon.naam;
        popup.onSaveClick = (newTitel) => {
            this.saveSjabloon(sjabloon, newTitel);
            this.popupService.closePopUp();
        };
    }

    onBewerkTitelClick() {
        this.editNaam = this.isEigenaar && (this.deviceService.isTablet() || this.deviceService.isDesktop());
    }

    openMethodeSidebar() {
        this.sidebarService.openSidebar(MethodeSidebarComponent);
    }

    /**
     * Als de JaarbijlagenSidebar open is kan er niet binnen de applicatie
     * genavigeerd worden. Om deze reden hoeven we geen popup te tonen,
     * maar kunnen we dit laten afhandelen door het window:unload event.
     */
    isDeactivationAllowed(): boolean {
        return !!this.jaarbijlagenSidebar;
    }

    get studiewijzerBulkLength() {
        return this.bulkactiesService.length;
    }

    setBulkacties(editMode: boolean) {
        this.bulkactiesService.setEditMode(editMode);
        this.toonBulkacties = editMode;
    }

    bulkVerwijderen() {
        const zitInleveropdrachtTussen = this.bulkactiesService.values.some(
            (selectedItems) => selectedItems.studiewijzeritem.conceptInleveropdracht
        );

        if (this.isSynced && zitInleveropdrachtTussen) {
            this.openBulkVerwijderSyncedConceptInleveropdrachtGuard();
        } else {
            this.bulkactiesService.verwijderSjabloonitems(this.route.snapshot.paramMap.get('id')!);
            this.toonBulkacties = false;
        }
    }

    openBulkVerwijderSyncedConceptInleveropdrachtGuard() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, bulkSyncedConceptInleveropdrachtVerwijderPopupProperties);
        popup.onConfirmFn = () => {
            this.bulkactiesService.verwijderSjabloonitems(this.route.snapshot.paramMap.get('id')!);
            this.toonBulkacties = false;
            return true;
        };
    }

    bulkZichtbaarheid(zichtbaarheid: boolean) {
        this.bulkactiesService.updateZichtbaarheidSjabloonitems(zichtbaarheid);
        this.toonBulkacties = false;
    }

    bulkKopieer() {
        const studiewijzerItems = this.bulkactiesService.values.map((selectie) => selectie.studiewijzeritem);
        const toekenningIds = this.bulkactiesService.values.map((selectie) => selectie.toekenningId);
        this.sidebarService.openSidebar(SjabloonSelectieSidebarComponent, { studiewijzerItems, toekenningIds });
    }

    onVerwijderToekenning(toekenning: SjabloonViewToekenning | Toekenning, sjabloon: SjabloonFieldsFragment) {
        const isGesynced = sjabloon.gesynchroniseerdeStudiewijzers.length > 0;
        const isInleveropdracht = toekenning.studiewijzeritem.conceptInleveropdracht;

        if (isGesynced && isInleveropdracht) {
            this.openConceptInleveropdrachtVerwijderGuard(<WeekToekenning>toekenning, sjabloon.id);
        } else {
            this.sjabloonDataService.verwijderToekenning(<WeekToekenning>toekenning, sjabloon.id);
        }
    }

    onDupliceerToekenning(toekenning: SjabloonViewToekenning) {
        this.sjabloonDataService.dupliceerToekenning(toekenning.id, this.route.snapshot.paramMap.get('id')!);
    }

    openConceptInleveropdrachtVerwijderGuard(toekenning: WeekToekenning, sjabloonId: string) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, syncedConceptInleveropdrachtVerwijderPopupProperties);
        popup.onConfirmFn = () => {
            this.sjabloonDataService.verwijderToekenning(toekenning, sjabloonId);
            return true;
        };
    }

    exporteerToekenningen(event: Sjabloon[], toekenningIds: string[]) {
        this.sjabloonDataService
            .exporteerToekenningen(
                toekenningIds,
                event.map((sjabloon) => sjabloon.id)
            )
            .subscribe(() => {
                this.sidebarService.closeSidebar();
                this.message = 'Succesvol gekopieerd naar <b>' + event.map((sjabloon) => sjabloon.naam).join(', ') + '</b>';
                this.showMessage = true;
                this.setBulkacties(false);
            });
    }

    onSynchroniseren(message: string) {
        this.message = message;
        this.showMessage = true;
    }

    checkVerlopenStudiewijzers(sjabloon: Sjabloon) {
        if (!this.popupService.isPopupOpen()) {
            const verlopenStudiewijzers: Studiewijzer[] = sjabloon.gesynchroniseerdeStudiewijzers?.filter(
                (studiewijzer) => studiewijzer.schooljaar < getYear(getSchooljaar(new Date()).start)
            );

            if (verlopenStudiewijzers?.length > 0) {
                const popup = this.popupService.popup(
                    this.viewContainerRef,
                    SjabloonOntkoppelPopupComponent.defaultPopupSettings,
                    SjabloonOntkoppelPopupComponent
                );
                popup.sjablonen = [sjabloon];
                popup.inDetail = true;
                popup.ontkoppelStudiewijzersVanSjablonen = () => this.ontkoppelStudiewijzersVanSjabloon(sjabloon.id);
            }
        }
    }

    ontkoppelStudiewijzersVanSjabloon(sjabloonId: string) {
        this.sjabloonDataService.ontkoppelStudiewijzersVanSjablonen([sjabloonId], true);
    }

    verschuifPlanningOmhoog = (sjabloonId: string, vanafWeek: number, aantalWeken: number) =>
        this.verschuifPlanning(sjabloonId, vanafWeek, aantalWeken, 'omhoog');
    verschuifPlanningOmlaag = (sjabloonId: string, vanafWeek: number, aantalWeken: number) =>
        this.verschuifPlanning(sjabloonId, vanafWeek, aantalWeken, 'omlaag');

    saveToekenning(toekenningenContainer: SaveToekenningContainer, sjabloonId: string, keepSideBarOpen = false) {
        this.sjabloonDataService.saveWeekToekenning(<WeekToekenning[]>toekenningenContainer.toekenningen, sjabloonId);

        const isNew = !toekenningenContainer.toekenningen[0].id;
        if (!keepSideBarOpen && isNew) {
            this.sidebarService.closeSidebar();
        }
        if (toekenningenContainer.copyOnSave) {
            this.maskService.removeMask(sidebarMaskId, true);
            this.sidebarService.closeSidebar();
            setTimeout(() => {
                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                    toekenning: copyToekenning(toekenningenContainer.toekenningen[0]),
                    openInEditMode: true
                });
            });
        }
    }

    updateLesitemType(huiswerkType: HuiswerkType, toekenning: SjabloonViewToekenning, sjabloonId: string) {
        const updatedToekenning: WeekToekenning = {
            ...toekenning,
            studiewijzeritem: { ...toekenning.studiewijzeritem, huiswerkType }
        } as WeekToekenning;

        this.sjabloonDataService.saveWeekToekenning([updatedToekenning], sjabloonId);
    }

    private verschuifPlanning(sjabloonId: string, vanafWeek: number, aantalWeken: number, direction: PlanningVerschuifDirection) {
        this.sjabloonDataService.verschuifPlanning(sjabloonId, vanafWeek, aantalWeken, direction).subscribe(() => {
            this.message = `Planning is ${aantalWeken} weken ${
                direction === 'omhoog' ? 'omhoog' : 'omlaag'
            } verschoven vanaf week ${vanafWeek}`;
            this.showMessage = true;
            this.popupService.closePopUp();
        });
    }

    private findAantalLegeWeken(weken: SjabloonViewQuery['sjabloonView']['weken'], startAtLastWeek: boolean): number {
        const sjabloonWekenCopy = [...weken];
        if (startAtLastWeek) {
            sjabloonWekenCopy.reverse();
        }
        const eersteWeekIndex = sjabloonWekenCopy.findIndex((week) => week.toekenningen?.length > 0);
        return eersteWeekIndex === -1 ? MAX_INT_VALUE : eersteWeekIndex + 1;
    }

    private stickyHandler = (e: IntersectionObserverEntry[]) => {
        if (this.toolbar && !e[0].isIntersecting) {
            this.renderer2.setAttribute(this.toolbar.nativeElement, 'stuck', '');
        } else if (this.toolbar) {
            this.renderer2.removeAttribute(this.toolbar.nativeElement, 'stuck');
        }
    };
}
