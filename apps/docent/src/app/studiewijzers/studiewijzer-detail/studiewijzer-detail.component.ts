import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    AfspraakToekenning,
    BasisSjabloonFieldsFragment,
    CijferPeriode,
    DagToekenning,
    HuiswerkType,
    Leerling,
    Lesgroep,
    Studiewijzer,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerFieldsFragment,
    StudiewijzerViewQuery,
    StudiewijzerWeek,
    Toekenning,
    WeekToekenning,
    namedOperations
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getISOWeek, getYear } from 'date-fns';
import { BrowseComponent, IconDirective, PillComponent, SpinnerComponent } from 'harmony';
import {
    IconBijlage,
    IconDifferentiatie,
    IconEloPreview,
    IconGroep,
    IconImporteren,
    IconKopierenNaar,
    IconMethode,
    IconOpties,
    IconPijlBoven,
    IconPijlLinks,
    IconPijlOnder,
    IconSjabloon,
    IconStudiewijzer,
    provideIcons
} from 'harmony-icons';
import { flatMap as _flatMap } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest, fromEvent } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    startWith,
    switchMap,
    take,
    takeUntil,
    tap,
    withLatestFrom
} from 'rxjs/operators';
import { UriService } from '../../auth/uri-service';
import { allowChildAnimations } from '../../core/core-animations';
import { SaveToekenningContainer } from '../../core/models';
import { Differentiatie } from '../../core/models/studiewijzers/shared.model';
import { StudiewijzerContent } from '../../core/models/studiewijzers/studiewijzer.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../core/services/device.service';
import { MaskService } from '../../core/services/mask.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { UploadDataService } from '../../core/services/upload-data.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { LesgroepDeeplinkPopupComponent } from '../../les/lesgroep-deeplink-popup/lesgroep-deeplink-popup.component';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { sidebarMaskId } from '../../rooster-shared/components/sidebar/sidebar.component';
import { WerkdrukSidebarComponent } from '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { MAX_INT_VALUE, differentiatiegroepenBevatLeerling, toId } from '../../rooster-shared/utils/utils';
import { inleveropdrachtVerwijderenGuardProperties } from '../../shared-studiewijzer-les/utils/inleveropdrachten-verwijderen.utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { syncedLesitemVerwijderPopupProperties } from '../../shared/components/confirmation-dialog/confirmation-dialog.properties';
import { DeactivatableComponentDirective } from '../../shared/components/deactivatable.component';
import { DifferentiatieToekennenSidebarComponent } from '../../shared/components/differentiatie-toekennen-sidebar/differentiatie-toekennen-sidebar.component';
import { DifferentiatieSidebarComponent } from '../../shared/components/differentiatie/differentiatie-sidebar/differentiatie-sidebar.component';
import {
    FloatingAction,
    FloatingActionBarComponent,
    backToTopButton,
    bewerkButton,
    sjabloonSynchroniserenButton,
    werkdrukButton
} from '../../shared/components/floating-action-bar/floating-action-bar.component';
import { LeerlingenPopupComponent } from '../../shared/components/leerlingen-popup/leerlingen-popup.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { genereerSyncGuardPopup } from '../../shared/utils/studiewijzer.utils';
import { copyToekenning, isAfspraakToekenning, isDagToekenning, isWeekToekenning } from '../../shared/utils/toekenning.utils';
import { BulkactiesDataService } from '../bulkacties-data.service';
import { BulkactiesComponent } from '../bulkacties/bulkacties.component';
import { SelectedLesitemsComponent } from '../bulkacties/selected-lesitems/selected-lesitems.component';
import { JaarbijlagenSidebarComponent } from '../jaarbijlagen-sidebar/jaarbijlagen-sidebar.component';
import { MethodeSidebarComponent } from '../methode-sidebar/methode-sidebar.component';
import { SelecteerSjabloonContentSidebarComponent } from '../selecteer-sjabloon-content-sidebar/selecteer-sjabloon-content-sidebar.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { SjabloonSynchronisatieSelectieSidebarComponent } from '../sjabloon-synchronisatie-selectie-sidebar/sjabloon-synchronisatie-selectie-sidebar.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { StudiewijzerSelectieSidebarComponent } from '../studiewijzer-selectie-sidebar/studiewijzer-selectie-sidebar.component';
import { SynchronisatiePopupComponent } from '../synchronisatie-popup/synchronisatie-popup.component';
import { PlanningVerschuifDirection } from '../verschuif-planning-popup/verschuif-planning-popup.component';
import { SjabloonImporterenSidebarComponent } from './sjabloon-importeren-sidebar/sjabloon-importeren-sidebar.component';
import { StudiewijzerWeekComponent } from './studiewijzer-week/studiewijzer-week.component';

type SidebarCloseStrategy = 'always' | 'never' | 'onSave';

@Component({
    selector: 'dt-studiewijzer-detail',
    templateUrl: './studiewijzer-detail.component.html',
    styleUrls: ['./studiewijzer-detail.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    providers: [
        BulkactiesDataService,
        UploadDataService,
        provideIcons(
            IconStudiewijzer,
            IconPijlLinks,
            IconPijlOnder,
            IconPijlBoven,
            IconGroep,
            IconOpties,
            IconImporteren,
            IconBijlage,
            IconKopierenNaar,
            IconMethode,
            IconSjabloon,
            IconEloPreview,
            IconDifferentiatie
        )
    ],
    standalone: true,
    imports: [
        HeaderComponent,
        RouterLink,
        SpinnerComponent,
        TooltipDirective,
        BackgroundIconComponent,
        IconComponent,
        CdkDropListGroup,
        StudiewijzerWeekComponent,
        MethodeSidebarComponent,
        BulkactiesComponent,
        JaarbijlagenSidebarComponent,
        SjabloonImporterenSidebarComponent,
        SjabloonSynchronisatieSelectieSidebarComponent,
        DifferentiatieSidebarComponent,
        DifferentiatieToekennenSidebarComponent,
        WerkdrukSidebarComponent,
        StudiewijzeritemSidebarComponent,
        SelecteerSjabloonContentSidebarComponent,
        StudiewijzerSelectieSidebarComponent,
        SelectedLesitemsComponent,
        MessageComponent,
        FloatingActionBarComponent,
        AsyncPipe,
        IconDirective,
        BrowseComponent,
        PillComponent
    ]
})
export class StudiewijzerDetailComponent extends DeactivatableComponentDirective implements OnInit, OnDestroy, AfterViewInit {
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private route = inject(ActivatedRoute);
    public deviceService = inject(DeviceService);
    private sidebarService = inject(SidebarService);
    private bulkactiesService = inject(BulkactiesDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    public uriService = inject(UriService);
    private sjabloonDataService = inject(SjabloonDataService);
    private renderer2 = inject(Renderer2);
    private medewerkerService = inject(MedewerkerDataService);
    private maskService = inject(MaskService);
    @ViewChildren(StudiewijzerWeekComponent) studiewijzerWeken: QueryList<StudiewijzerWeekComponent>;
    @ViewChild(JaarbijlagenSidebarComponent) jaarbijlagenSidebar: JaarbijlagenSidebarComponent;
    @ViewChild(StudiewijzeritemSidebarComponent) studiewijzeritemSidebar: StudiewijzeritemSidebarComponent;

    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;
    @ViewChild('moreOptionsMobile', { read: ViewContainerRef }) moreOptionsMobileRef: ViewContainerRef;
    @ViewChild('toolbar', { read: ElementRef, static: false }) toolbar: ElementRef;
    @ViewChild('importeren', { read: ViewContainerRef }) importerenRef: ViewContainerRef;
    @ViewChild('importerenTablet', { read: ViewContainerRef }) importerenTabletRef: ViewContainerRef;

    disableDragAndDrop$: Observable<boolean>;
    cijferperiodes$: Observable<CijferPeriode[]>;
    studiewijzerView$: Observable<StudiewijzerViewQuery['studiewijzerView']>;
    actievePeriode$: Observable<number>;
    inBulkmode$: Observable<boolean>;

    verschuifOmlaagWarningVanaf: number;
    verschuifOmhoogWarningVanaf: number;
    toonBulkacties: boolean;

    huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
    heeftVaksecties: boolean;

    showMessage: boolean;
    message: string;
    floatingActions: FloatingAction[];
    eersteWeek: number;
    laatsteWeek: number;
    heeftToegangTotDifferentiatie: boolean;
    differentatieBulkContext$ = new BehaviorSubject<boolean>(false);

    studiewijzeritemSidebar$: SidebarInputs<StudiewijzeritemSidebarComponent>;
    selecteerSjabloonContentSidebar$: SidebarInputs<SelecteerSjabloonContentSidebarComponent>;
    jaarbijlagenSidebar$: SidebarInputs<JaarbijlagenSidebarComponent>;
    studiewijzerSelectieSidebar$: SidebarInputs<StudiewijzerSelectieSidebarComponent>;
    sjabloonImporterenSidebar$: SidebarInputs<SjabloonImporterenSidebarComponent>;
    methodeSidebar$: SidebarInputs<MethodeSidebarComponent>;
    differentiatieSidebar$: SidebarInputs<DifferentiatieSidebarComponent>;
    differentiatieToekennenSidebar$: SidebarInputs<DifferentiatieToekennenSidebarComponent>;
    werkdrukSidebar$: SidebarInputs<WerkdrukSidebarComponent>;
    sjabloonSynchronisatieSelectieSidebar$: SidebarInputs<SjabloonSynchronisatieSelectieSidebarComponent>;

    private onDestroy$ = new Subject<void>();

    constructor() {
        super();

        this.jaarbijlagenSidebar$ = this.sidebarService.watchFor(JaarbijlagenSidebarComponent);
        this.studiewijzeritemSidebar$ = this.sidebarService.watchFor(StudiewijzeritemSidebarComponent);
        this.selecteerSjabloonContentSidebar$ = this.sidebarService.watchFor(SelecteerSjabloonContentSidebarComponent);
        this.studiewijzerSelectieSidebar$ = this.sidebarService.watchFor(StudiewijzerSelectieSidebarComponent);
        this.sjabloonImporterenSidebar$ = this.sidebarService.watchFor(SjabloonImporterenSidebarComponent);
        this.methodeSidebar$ = this.sidebarService.watchFor(MethodeSidebarComponent);
        this.differentiatieSidebar$ = this.sidebarService.watchFor(DifferentiatieSidebarComponent);
        this.differentiatieToekennenSidebar$ = this.sidebarService.watchFor(DifferentiatieToekennenSidebarComponent);
        this.werkdrukSidebar$ = this.sidebarService.watchFor(WerkdrukSidebarComponent);
        this.sjabloonSynchronisatieSelectieSidebar$ = this.sidebarService.watchFor(SjabloonSynchronisatieSelectieSidebarComponent);

        this.inBulkmode$ = this.bulkactiesService.inEditMode;
    }

    ngOnInit() {
        const aantalLegeWekenVanafStart = (view: StudiewijzerViewQuery['studiewijzerView']) => this.findAantalLegeWeken(view, false);
        const aantalLegeWekenVanafEind = (view: StudiewijzerViewQuery['studiewijzerView']) => this.findAantalLegeWeken(view, true);

        this.studiewijzerView$ = this.route.paramMap.pipe(
            switchMap((params) =>
                combineLatest([
                    this.studiewijzerDataService.getStudiewijzerView(params.get('id')!),
                    this.sjabloonDataService.getVaksecties()
                ])
            ),
            tap(([studiewijzerView, vaksecties]) => {
                if (studiewijzerView.weken.length > 0) {
                    this.eersteWeek = studiewijzerView.weken[0].weeknummer;
                    this.laatsteWeek = studiewijzerView.weken[studiewijzerView.weken.length - 1].weeknummer;
                }
                this.verschuifOmhoogWarningVanaf = aantalLegeWekenVanafStart(studiewijzerView);
                this.verschuifOmlaagWarningVanaf = aantalLegeWekenVanafEind(studiewijzerView);
                this.heeftVaksecties = vaksecties?.length > 0;
            }),
            map(([studiewijzerView]) => studiewijzerView),
            takeUntil(this.onDestroy$),
            shareReplayLastValue()
        );

        // floating actions bar opnieuw tekenen wanneer we switchen van resolutie
        combineLatest([this.studiewijzerView$, this.deviceService.onDeviceChange$])
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(([studiewijzerView]) => this.setFloatingActions(studiewijzerView.studiewijzer));

        this.cijferperiodes$ = this.route.paramMap.pipe(
            switchMap((params) => this.studiewijzerDataService.getCijferPeriodes(params.get('id')!)),
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

        const onScroll$ = fromEvent(window, 'scroll').pipe(debounceTime(150));

        const calculatePeriodeInView = () => {
            const windowInnerHeight = window.innerHeight;
            const topOffset = window.pageYOffset;
            const studiewijzerWeek = this.studiewijzerWeken
                ? this.studiewijzerWeken.find((element) => {
                      const nativeElement = element.elementRef.nativeElement;
                      const windowBottom = windowInnerHeight + topOffset;
                      const weekTop = nativeElement.offsetTop - this.scrollMargin;
                      const weekBottom = weekTop + Number(nativeElement.clientHeight);
                      return weekBottom > topOffset + 100 && weekTop < windowBottom;
                  })
                : null;

            return studiewijzerWeek && studiewijzerWeek.studiewijzerWeek.periode ? studiewijzerWeek.studiewijzerWeek.periode.nummer : 1;
        };

        this.actievePeriode$ = onScroll$.pipe(map(calculatePeriodeInView), startWith(1), distinctUntilChanged());

        const header = document.querySelector('dt-header');
        if (header) {
            const observer = new IntersectionObserver(this.stickyHandler);
            observer.observe(header);
        }

        this.studiewijzerView$
            .pipe(
                take(1),
                switchMap((view) => this.medewerkerService.differentiatieToegestaanVoorVestiging(view.studiewijzer.vestigingId))
            )
            .subscribe((toegang) => (this.heeftToegangTotDifferentiatie = toegang));
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    private findAantalLegeWeken = (view: StudiewijzerViewQuery['studiewijzerView'], startAtLastWeek: boolean) => {
        const weken = startAtLastWeek ? [...view.weken].reverse() : view.weken;
        const eersteWeekIndex = weken.findIndex((week) => {
            const dagtoekenningen = _flatMap(week.dagen, (dag) => dag?.toekenningen);
            const afspraken = _flatMap(week.dagen.map((dag) => dag?.afspraken));
            const afspraakToekenningen = _flatMap(afspraken, (afspraak) => afspraak?.toekenningen);
            return [...dagtoekenningen, ...afspraakToekenningen, ...(week?.toekenningen ?? [])].length > 0;
        });
        return eersteWeekIndex === -1 ? MAX_INT_VALUE : eersteWeekIndex + 1;
    };

    private setFloatingActions(studiewijzer: StudiewijzerViewQuery['studiewijzerView']['studiewijzer']) {
        const synced = studiewijzer.gesynchroniseerdeSjablonen?.length > 0;
        this.floatingActions = [
            backToTopButton(),
            werkdrukButton(() => this.openWerkdrukSidebar(studiewijzer as Studiewijzer)),
            sjabloonSynchroniserenButton(
                (buttonRef: ViewContainerRef) => this.onStudiewijzerSyncClick(buttonRef, synced, studiewijzer as Studiewijzer),
                synced,
                !this.heeftVaksecties
            )
        ];

        if (!this.deviceService.isDesktop()) {
            this.floatingActions.push(bewerkButton(() => this.setBulkacties(true)));
        }
    }

    scrollToStudiewijzerWeek(studiewijzerWeek: StudiewijzerWeekComponent, scrollBehavior: ScrollBehavior) {
        if (studiewijzerWeek) {
            window.scrollTo({
                top: studiewijzerWeek.elementRef.nativeElement.offsetTop - this.scrollMargin,
                left: 0,
                behavior: scrollBehavior
            });
        }
    }

    ngAfterViewInit() {
        const queryWeek = this.route.snapshot.queryParamMap.get('week')!;
        const huidigWeeknummer = getISOWeek(new Date());
        const week = parseInt(queryWeek, 10) || huidigWeeknummer;

        this.studiewijzerWeken.changes
            .pipe(
                withLatestFrom(this.studiewijzerView$),
                filter(([, view]) => view && view.studiewijzer.schooljaar === this.huidigSchooljaar),
                mergeMap(([weken]) => weken._results),
                filter(
                    (studiewijzerWeekComponent: StudiewijzerWeekComponent) => studiewijzerWeekComponent.studiewijzerWeek.weeknummer === week
                ),
                take(1)
            )
            .subscribe((studiewijzerWeekComponent: StudiewijzerWeekComponent) => {
                this.scrollToStudiewijzerWeek(studiewijzerWeekComponent, 'auto');
            });
    }

    verschuifPlanningOmhoog = (studiewijzerId: string, vanafWeek: number, aantalWeken: number) =>
        this.verschuifPlanning(studiewijzerId, vanafWeek, aantalWeken, 'omhoog');
    verschuifPlanningOmlaag = (studiewijzerId: string, vanafWeek: number, aantalWeken: number) =>
        this.verschuifPlanning(studiewijzerId, vanafWeek, aantalWeken, 'omlaag');

    private verschuifPlanning(studiewijzerId: string, vanafWeek: number, aantalWeken: number, direction: PlanningVerschuifDirection) {
        this.studiewijzerDataService.verschuifPlanning(studiewijzerId, vanafWeek, aantalWeken, direction).subscribe(() => {
            this.message = `Planning is ${aantalWeken} weken ${direction} verschoven vanaf week ${vanafWeek}`;
            this.showMessage = true;
            this.popupService.closePopUp();
        });
    }

    openJaarbijlagen(id: string) {
        this.sidebarService.openSidebar(JaarbijlagenSidebarComponent, { abstractSwId: id, isSjabloon: false });
    }

    onPeriodeClick(periode: number) {
        const studiewijzerWeek = this.studiewijzerWeken.find((week) =>
            Boolean(week.studiewijzerWeek.periode && week.studiewijzerWeek.periode.nummer === periode)
        )!;
        this.scrollToStudiewijzerWeek(studiewijzerWeek, 'smooth');
    }

    canDeactivate(): boolean {
        return this.jaarbijlagenSidebar ? !this.jaarbijlagenSidebar.jaarbijlagen?.isUploading() : true;
    }

    /**
     * Als de JaarbijlagenSidebar open is kan er niet binnen de applicatie
     * genavigeerd worden. Om deze reden hoeven we geen popup te tonen,
     * maar kunnen we dit laten afhandelen door het window:unload event.
     */
    isDeactivationAllowed(): boolean {
        return !!this.jaarbijlagenSidebar;
    }

    /**
     * Omdat er op sommige devices een sticky balk bovenin zit,
     * is er per device een andere margin.
     */
    private get scrollMargin() {
        return this.deviceService.isPhone() ? 106 : 70;
    }

    get studiewijzerBulkLength() {
        return this.bulkactiesService.length;
    }

    setBulkacties(editMode: boolean) {
        this.bulkactiesService.setEditMode(editMode);
        this.toonBulkacties = editMode;
    }

    bulkVerwijderen() {
        const heeftInleveropdrachtMetInleveringen = this.bulkactiesService.values.some(
            (toekenning) => toekenning.studiewijzeritem.inleverperiode?.inleveringenAantal ?? 0 > 0
        );
        if (heeftInleveropdrachtMetInleveringen) {
            this.showBevestigVerwijderPopup();
        } else {
            this.bulkactiesService.verwijderStudiewijzeritems(this.route.snapshot.paramMap.get('id')!);
            this.toonBulkacties = false;
        }
    }

    bulkZichtbaarheid(zichtbaarheid: boolean) {
        this.bulkactiesService.updateZichtbaarheidStudiewijzeritems(zichtbaarheid);
        this.toonBulkacties = false;
    }

    bulkKopieer() {
        const studiewijzerItems = this.bulkactiesService.values.map((selectie) => selectie.studiewijzeritem);
        const toekenningIds = this.bulkactiesService.values.map((selectie) => selectie.toekenningId);
        this.sidebarService.openSidebar(StudiewijzerSelectieSidebarComponent, { studiewijzerItems, toekenningIds });
    }

    importeerSjabloon(id: string) {
        if (this.heeftVaksecties) {
            this.sidebarService.openSidebar(SjabloonImporterenSidebarComponent, { id });
        }
    }

    exporteerToekenningen(event: Studiewijzer[], toekenningIds: string[]) {
        this.studiewijzerDataService
            .exporteerToekenningen(
                toekenningIds,
                event.map((studiewijzer) => studiewijzer.id)
            )
            .subscribe(() => {
                this.sidebarService.closeSidebar();
                this.message =
                    'Succesvol gekopieerd naar <b>' + event.map((studiewijzer) => studiewijzer.lesgroep.naam).join(', ') + '</b>';
                this.showMessage = true;
                this.setBulkacties(false);
            });
    }

    showImporterenGelukt() {
        this.message = 'Sjablonen geimporteerd!';
        this.showMessage = true;
    }

    onDupliceerToekenning(toekenning: Toekenning) {
        this.studiewijzerDataService.dupliceerToekenning(toekenning.id, this.route.snapshot.paramMap.get('id')!);
    }

    onVerwijderToekenning(toekenning: Toekenning) {
        const heeftInleveringen =
            toekenning.studiewijzeritem.inleverperiode && toekenning.studiewijzeritem.inleverperiode.inleveringenAantal > 0;
        if (heeftInleveringen) {
            this.openInleveropdrachtVerwijderGuard(toekenning);
        } else if (toekenning.synchroniseertMet && !toekenning.studiewijzeritem.inleverperiode) {
            this.openStudiewijzerVerwijderGuard(toekenning);
        } else {
            this.verwijderToekenning(toekenning);
        }
    }

    private verwijderToekenning(toekenning: Toekenning, verwijderUitSjabloon = false) {
        const studiewijzerId = this.route.snapshot.paramMap.get('id')!;

        if (isWeekToekenning(toekenning)) {
            this.studiewijzerDataService.verwijderWeekToekenning(toekenning, studiewijzerId, verwijderUitSjabloon);
        } else if (isDagToekenning(toekenning)) {
            this.studiewijzerDataService.verwijderDagToekenning(toekenning, studiewijzerId, verwijderUitSjabloon);
        } else if (isAfspraakToekenning(toekenning)) {
            this.studiewijzerDataService.verwijderAfspraakToekenning(toekenning, studiewijzerId, verwijderUitSjabloon);
        }
        this.sidebarService.closeSidebar();
    }

    openStudiewijzerVerwijderGuard(toekenning: Toekenning) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, syncedLesitemVerwijderPopupProperties);
        popup.onConfirmFn = () => {
            this.verwijderToekenning(toekenning);
            return true;
        };
        popup.onCancelFn = () => {
            this.verwijderToekenning(toekenning, true);
        };
    }

    openInleveropdrachtVerwijderGuard(toekenning: Toekenning) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, inleveropdrachtVerwijderenGuardProperties);
        popup.onConfirmFn = () => {
            this.verwijderToekenning(toekenning);
            return true;
        };
    }

    openSyncGuard(huiswerkType: HuiswerkType, toekenning: Toekenning, studiewijzerId: string) {
        const popup = genereerSyncGuardPopup(this.popupService, this.viewContainerRef);

        popup.onConfirmFn = () => {
            this.updateLesitemType(huiswerkType, toekenning, studiewijzerId, true);
            return true;
        };

        popup.onCancelClick = () => {
            this.studiewijzerDataService.ontkoppelToekenning(toekenning.id, [namedOperations.Query.studiewijzerView]).subscribe(() => {
                this.updateLesitemType(huiswerkType, toekenning, studiewijzerId, true);
                popup.popup.onClose();
            });
        };
    }

    showBevestigVerwijderPopup() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, inleveropdrachtVerwijderenGuardProperties);
        popup.message =
            'Bij verwijdering worden ook ingeleverde documenten permanent verwijderd. <br> Weet je zeker dat je de opdracht(en) wilt verwijderen?';
        popup.onConfirmFn = () => {
            this.bulkactiesService.verwijderStudiewijzeritems(this.route.snapshot.paramMap.get('id')!);
            this.toonBulkacties = false;
            return true;
        };
    }

    onImporterenClick(studiewijzerId: string) {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 165;
        settings.isFixed = true;
        settings.fixedPopupOffset = 12;
        settings.rerenderOnScroll = true;

        const reference = this.deviceService.isTablet() ? this.importerenTabletRef : this.importerenRef;
        const popup = this.popupService.popup(reference, settings, ActionsPopupComponent);
        popup.onActionClicked = () => this.popupService.closePopUp();
        this.medewerkerService.importUitMethodeToegestaan().subscribe((toegestaan) => {
            popup.customButtons = [];
            if (toegestaan) {
                popup.customButtons.push({
                    icon: 'methode',
                    color: 'primary',
                    text: 'Uit methode',
                    gtmTag: 'importeer-uit-methode',
                    onClickFn: () => this.sidebarService.openSidebar(MethodeSidebarComponent)
                } as ActionButton);
            }
            popup.customButtons.push({
                icon: 'sjabloon',
                color: 'primary',
                text: 'Sjabloon',
                gtmTag: 'sjablonen-importeren',
                onClickFn: () => {
                    if (this.heeftVaksecties) {
                        this.sidebarService.openSidebar(SjabloonImporterenSidebarComponent, { id: studiewijzerId });
                    }
                }
            } as ActionButton);
        });
    }

    onStudiewijzerSyncClick(buttonRef: ViewContainerRef, isSynced: boolean, studiewijzer: Studiewijzer) {
        if (isSynced) {
            const popup = this.popupService.popup(
                buttonRef,
                SynchronisatiePopupComponent.defaultPopupsettings,
                SynchronisatiePopupComponent
            );
            popup.toonStudiewijzers = false;
            popup.studiewijzer = studiewijzer;

            popup.toonStudiewijzers = false;
            popup.bewerkSynchonisatiesFn = () => this.sidebarService.openSidebar(SjabloonSynchronisatieSelectieSidebarComponent);
        } else {
            this.sidebarService.openSidebar(SjabloonSynchronisatieSelectieSidebarComponent);
        }
    }

    onMoreOptionsClick(studiewijzer: StudiewijzerFieldsFragment, isMobileRef: boolean, $event: Event) {
        $event.stopPropagation();

        const customButtons: ActionButton[] = [
            {
                icon: 'eloPreview',
                color: 'primary',
                text: 'Bekijk in ELO',
                gtmTag: 'bekijk-in-elo',
                onClickFn: () => {
                    this.openStudiewijzerPreview(studiewijzer.lesgroep.id);
                }
            }
        ];

        if (this.heeftToegangTotDifferentiatie) {
            customButtons.push(
                {
                    icon: 'eloPreview',
                    color: 'primary',
                    text: 'Bekijk ELO van leerling',
                    gtmTag: 'bekijk-elo-leerling',
                    onClickFn: () => this.onEloVanLeerlingBekijken(studiewijzer as Studiewijzer, isMobileRef)
                },
                {
                    icon: 'differentiatie',
                    color: 'primary',
                    text: 'Differentiatiegroepen',
                    gtmTag: 'open-sw-differentiatie',
                    onClickFn: () => {
                        this.sidebarService.openSidebar(DifferentiatieSidebarComponent, { lesgroep: studiewijzer.lesgroep });
                    }
                }
            );
        }

        if (isMobileRef) {
            customButtons.push({
                icon: 'sjabloon',
                color: 'primary',
                text: 'Sjabloon importeren',
                gtmTag: 'sjablonen-importeren',
                onClickFn: () => {
                    this.importeerSjabloon(studiewijzer.id);
                }
            });
        }

        /*
         * Fixed positie is nodig door de sticky header waar de more-options op is geplaatst.
         * De benodigde offset verschilt tussen tablet en desktop. Mobile heeft een rollup, waarbij dit n.v.t. is.
         * N.B. de offset is helaas ook afhankelijk van de inhoud van de popup. Dus wanneer hier meer knoppen komen,
         * moet deze ook worden aangepast.
         */
        const popupSettings = LesgroepDeeplinkPopupComponent.defaultPopupsettings;
        if (!isMobileRef) {
            popupSettings.isFixed = true;
            popupSettings.fixedPopupOffset = 8;
            popupSettings.rerenderOnScroll = true;
        }

        const moreOptionsViewContainerRef = isMobileRef ? this.moreOptionsMobileRef : this.moreOptionsRef;
        const popup = this.popupService.popup(moreOptionsViewContainerRef, popupSettings, LesgroepDeeplinkPopupComponent);
        popup.lesgroepen = [studiewijzer.lesgroep];
        popup.customButtons = customButtons;
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    onSynchroniseren(message: string) {
        this.message = message;
        this.showMessage = true;
    }

    openStudiewijzerPreview(lesgroepId: string, leerling?: Leerling) {
        this.uriService.navigateToSomtodayStudiewijzerPreviewPage(lesgroepId, leerling?.id);
    }

    magSynchroniserenMetSjabloon(toekenning: Toekenning, gesynchroniseerdeSjablonen: BasisSjabloonFieldsFragment[]): boolean {
        return !!toekenning.synchroniseertMet || (!toekenning.synchroniseertMet && gesynchroniseerdeSjablonen.length > 0);
    }

    updateLesitemType(huiswerkType: HuiswerkType, toekenning: Toekenning, studiewijzerId: string, syncConfirmed = false) {
        if (toekenning.synchroniseertMet && !syncConfirmed) {
            this.openSyncGuard(huiswerkType, toekenning, studiewijzerId);
            return;
        }
        const updatedToekenning: Toekenning = { ...toekenning, studiewijzeritem: { ...toekenning.studiewijzeritem, huiswerkType } };

        if (isAfspraakToekenning(toekenning)) {
            this.studiewijzerDataService
                .saveAfspraakToekenning$([<AfspraakToekenning>updatedToekenning], studiewijzerId, toekenning.lesgroep!.id)
                .subscribe();
        } else if (isDagToekenning(toekenning)) {
            this.studiewijzerDataService.saveDagToekenning$([<DagToekenning>updatedToekenning], studiewijzerId).subscribe();
        } else {
            this.studiewijzerDataService.saveWeekToekenning$([<WeekToekenning>updatedToekenning], studiewijzerId).subscribe();
        }
    }

    saveToekenning(toekenningenContainer: SaveToekenningContainer, lesgroep: Lesgroep, closeStrategy: SidebarCloseStrategy = 'onSave') {
        let toekenningen = toekenningenContainer.toekenningen;
        const toekenningToSave = toekenningenContainer.toekenningen[0];

        if (!toekenningToSave.lesgroep) {
            toekenningen = toekenningen.map((toekenning) => ({ ...toekenning, lesgroep }));
        }
        const studiewijzerId = this.route.snapshot.paramMap.get('id')!;
        const isNew = !toekenningToSave.id;
        const isGeenInleverperiode = !toekenningToSave.studiewijzeritem.inleverperiode;
        if (isAfspraakToekenning(toekenningToSave)) {
            this.studiewijzerDataService
                .saveAfspraakToekenning$(
                    <AfspraakToekenning[]>toekenningen,
                    studiewijzerId,
                    lesgroep.id,
                    toekenningenContainer.gesynchroniseerdSjabloon?.id
                )
                .subscribe(() => {
                    if (!toekenningenContainer.copyOnSave && closeStrategy === 'onSave' && isNew && isGeenInleverperiode) {
                        this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: true });
                        this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
                    }
                });
        } else if (isDagToekenning(toekenningen[0])) {
            this.studiewijzerDataService
                .saveDagToekenning$(<DagToekenning[]>toekenningen, studiewijzerId)
                .pipe(map((result) => result.data!.saveDagToekenning.toekenningen[0]))
                .subscribe((toekenning) => {
                    if (!toekenningenContainer.copyOnSave) {
                        if (toekenning.studiewijzeritem.inleverperiode) {
                            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                                toekenning: toekenning as DagToekenning,
                                openInEditMode: false
                            });
                        } else if (closeStrategy === 'onSave' && isNew) {
                            this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: true });
                            this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
                        }
                    }
                });
        } else {
            this.studiewijzerDataService
                .saveWeekToekenning$(<WeekToekenning[]>toekenningen, studiewijzerId, toekenningenContainer.gesynchroniseerdSjabloon?.id)
                .subscribe(() => {
                    this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: true });
                    if (!toekenningenContainer.copyOnSave && closeStrategy === 'onSave' && isNew && isGeenInleverperiode) {
                        this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
                    }
                });
        }

        if (toekenningenContainer.copyOnSave) {
            this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
            setTimeout(() => {
                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                    toekenning: copyToekenning(toekenningToSave),
                    openInEditMode: true,
                    openWithDirtyForm: true
                });
            });
        } else if (closeStrategy === 'always') {
            this.sidebarService.closeSidebar();
        }
    }

    kopieerToekenningen(toekenningIds: string[], content: StudiewijzerContent) {
        const id = this.route.snapshot.paramMap.get('id')!;

        const onKopieer = () => {
            this.sidebarService.closeSidebar(SelecteerSjabloonContentSidebarComponent);
            this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: true });
        };

        if ((<StudiewijzerWeek>content).weeknummer) {
            this.studiewijzerDataService
                .kopieerToekenningenNaarStudiewijzerWeek$(id, (<StudiewijzerWeek>content).weeknummer, toekenningIds)
                .subscribe(onKopieer);
        } else if ((<StudiewijzerDag>content).dag) {
            this.studiewijzerDataService
                .kopieerToekenningenNaarStudiewijzerDatum$(id, false, (<StudiewijzerDag>content).dag, toekenningIds)
                .subscribe(onKopieer);
        } else {
            this.studiewijzerDataService
                .kopieerToekenningenNaarStudiewijzerDatum$(id, true, (<StudiewijzerAfspraak>content).afspraak.begin, toekenningIds)
                .subscribe(onKopieer);
        }
    }

    openWerkdrukSidebar(studiewijzer: StudiewijzerFieldsFragment) {
        this.sidebarService.openSidebar(WerkdrukSidebarComponent, {
            lesgroepen: [studiewijzer.lesgroep],
            initielePeildatum: new Date(),
            eersteWeek: this.eersteWeek,
            laatsteWeek: this.laatsteWeek,
            initieleLeerlingenContext: []
        });
    }

    onBulkToekennen(lesgroep: Lesgroep, iedereen: boolean) {
        this.differentatieBulkContext$.next(true);
        if (iedereen) {
            const differentiatie: Differentiatie = {
                differentiatiegroepen: [],
                differentiatieleerlingen: []
            };
            this.onDifferentiatieToekennen({ differentiatie, vervangen: true });
            return;
        }

        const bevatGedifferentieerdeItems = this.bulkactiesService.values.some(
            (value) => value.differentiatie.differentiatiegroepen?.length > 0 || value.differentiatie.differentiatieleerlingen?.length > 0
        );
        this.sidebarService.openSidebar(DifferentiatieToekennenSidebarComponent, { lesgroep, bevatGedifferentieerdeItems });
    }

    onDifferentiatieToekennenClick(lesgroep: Lesgroep, toekenning: Toekenning) {
        this.maskService.removeMask(sidebarMaskId, true);
        this.sidebarService.closeSidebar();
        setTimeout(() => {
            this.sidebarService.openSidebar(DifferentiatieToekennenSidebarComponent, {
                lesgroep,
                toekenning,
                disableSidebarAnimation: true
            });
        });
    }

    onDifferentiatieToekennen(event: { differentiatie: Differentiatie; vervangen: boolean; toekenning?: Toekenning }) {
        if (this.differentatieBulkContext$.getValue()) {
            const toekenningIds = this.bulkactiesService.values.map((bulkValue) => bulkValue.toekenningId);
            const groepenIds = event.differentiatie.differentiatiegroepen.map(toId);
            const leerlingIds = event.differentiatie.differentiatieleerlingen.map(toId);

            this.bulkactiesService.differentiatieToekennenBulk$(toekenningIds, leerlingIds, groepenIds, event.vervangen).subscribe(() => {
                this.bulkactiesService.clean();
                this.bulkactiesService.setEditMode(false);
                this.toonBulkacties = false;
                this.message = 'Differentiatie toegevoegd';
                this.showMessage = true;
            });
            this.differentatieBulkContext$.next(false);
            this.sidebarService.closeSidebar();
        } else {
            const toekenning = event.toekenning!;
            const filteredLeerlingen = event.differentiatie.differentiatieleerlingen.filter(
                (leerling) => !differentiatiegroepenBevatLeerling(toekenning.differentiatiegroepen, leerling.id)
            );
            const updatedToekenning: Toekenning = {
                ...toekenning,
                differentiatiegroepen: [...toekenning.differentiatiegroepen, ...event.differentiatie.differentiatiegroepen],
                differentiatieleerlingen: [...toekenning.differentiatieleerlingen, ...filteredLeerlingen]
            };

            this.saveToekenning({ toekenningen: [updatedToekenning] }, toekenning.lesgroep!);
            this.maskService.removeMask(sidebarMaskId, true);
            setTimeout(() => {
                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                    toekenning: updatedToekenning,
                    openInEditMode: false
                });
            });
        }
    }

    private stickyHandler = (e: IntersectionObserverEntry[]) => {
        if (this.toolbar && !e[0].isIntersecting) {
            this.renderer2.setAttribute(this.toolbar.nativeElement, 'stuck', '');
        } else if (this.toolbar) {
            this.renderer2.removeAttribute(this.toolbar.nativeElement, 'stuck');
        }
    };

    private onEloVanLeerlingBekijken(studiewijzer: Studiewijzer, isMobileRef: boolean) {
        setTimeout(() => {
            const popupSettings = {
                ...LeerlingenPopupComponent.defaultPopupSettings,
                preferedDirection: [PopupDirection.Bottom]
            };

            if (!isMobileRef) {
                popupSettings.isFixed = true;
                popupSettings.fixedPopupOffset = 8;
                popupSettings.rerenderOnScroll = true;
            }
            const moreOptionsViewContainerRef = isMobileRef ? this.moreOptionsMobileRef : this.moreOptionsRef;
            const popup = this.popupService.popup(moreOptionsViewContainerRef, popupSettings, LeerlingenPopupComponent);
            popup.leerlingen$ = this.studiewijzerDataService.getLeerlingenMetAccount(studiewijzer);
            popup.showHeader = false;
            popup.onLeerlingSelected = (leerling: Leerling) => {
                this.popupService.closePopUp();
                this.openStudiewijzerPreview(studiewijzer.lesgroep.id, leerling);
            };
        });
    }
}
