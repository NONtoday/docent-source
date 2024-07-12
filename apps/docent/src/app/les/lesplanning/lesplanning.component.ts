import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addWeeks, endOfDay, getISOWeek, isAfter, isSameDay, startOfDay } from 'date-fns';
import { IconLesplanning, IconToevoegen, IconWerkdruk, IconZwevendItem, provideIcons } from 'harmony-icons';
import get from 'lodash-es/get';
import some from 'lodash-es/some';
import { NG_PROGRESS_CONFIG, NgProgressComponent, NgProgressModule } from 'ngx-progressbar';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { all, into, matching, set, updateAll } from 'shades';
import {
    Afspraak,
    AfspraakQuery,
    AfspraakToekenning,
    DagToekenning,
    HuiswerkType,
    Lesplanning,
    Maybe,
    Studiewijzeritem,
    Toekenning,
    ToekomendeAfsprakenQuery,
    WeekToekenning,
    namedOperations
} from '../../../generated/_types';
import { allowChildAnimations } from '../../core/core-animations';
import { LesplanningType, SaveToekenningContainer, StudiewijzerItemEditAction } from '../../core/models/lesplanning.model';
import { mapToSelectedAfspraakId } from '../../core/operators/mapToSelectedAfspraakId.operator';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { WerkdrukSidebarComponent } from '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar, parseYYYYMMDDToDate } from '../../rooster-shared/utils/date.utils';
import { notEqualsId, toId } from '../../rooster-shared/utils/utils';
import { StudiewijzeritemToevoegenPopupComponent } from '../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { syncedLesitemVerwijderUitLesplanningPopupProperties } from '../../shared/components/confirmation-dialog/confirmation-dialog.properties';
import { DifferentiatieToekennenSidebarComponent } from '../../shared/components/differentiatie-toekennen-sidebar/differentiatie-toekennen-sidebar.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { copyToekenning, getHoogsteToekenningSortering } from '../../shared/utils/toekenning.utils';
import { StudiewijzerDataService } from '../../studiewijzers/studiewijzer-data.service';
import { LesDataService } from '../les-data.service';
import { LesService } from '../les.service';
import { LesitemComponent } from './lesitem/lesitem.component';
import { LesplanNavigatiePickerComponent } from './lesplan-navigatie/lesplan-navigatie-picker/lesplan-navigatie-picker.component';
import { LesplanNavigatieComponent } from './lesplan-navigatie/lesplan-navigatie.component';
import { LesplanningDataService } from './lesplanning-data.service';
import { ZwevendeLesitemsSidebarComponent } from './zwevende-lesitems-sidebar/zwevende-lesitems-sidebar.component';

@Component({
    selector: 'dt-lesplanning',
    templateUrl: './lesplanning.component.html',
    styleUrls: ['./lesplanning.component.scss'],
    animations: [allowChildAnimations],
    standalone: true,
    imports: [
        LesplanNavigatiePickerComponent,
        LesplanNavigatieComponent,
        OutlineButtonComponent,
        TooltipDirective,
        NgProgressModule,
        LesitemComponent,
        ZwevendeLesitemsSidebarComponent,
        StudiewijzeritemSidebarComponent,
        AsyncPipe
    ],
    providers: [
        provideIcons(IconWerkdruk, IconToevoegen, IconZwevendItem, IconLesplanning),
        {
            provide: NG_PROGRESS_CONFIG,
            useValue: {
                trickleSpeed: 200,
                min: 20,
                meteor: false
            }
        }
    ]
})
export class LesplanningComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    public lesDataService = inject(LesDataService);
    private lesplanningDataService = inject(LesplanningDataService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    public viewContainerRef = inject(ViewContainerRef);
    private popupService = inject(PopupService);
    private router = inject(Router);
    private medewerkerService = inject(MedewerkerDataService);
    private sidebarService = inject(SidebarService);
    private lesService = inject(LesService);
    @ViewChild('addIcon', { read: ViewContainerRef }) addIcon: ViewContainerRef;
    @ViewChildren('werkdrukButton', { read: ViewContainerRef }) werkdrukButtons: QueryList<ViewContainerRef>;
    @ViewChild(NgProgressComponent, { static: false }) progressBar: NgProgressComponent;
    @ViewChild('moreoptions', { read: ViewContainerRef }) moreOptions: ViewContainerRef;
    @ViewChildren(LesitemComponent) childDeactivatableComponents: QueryList<LesitemComponent>;

    public lesplanning: Maybe<Lesplanning>;
    public loading = false;
    public isWeek: boolean;
    public toEditSwi: StudiewijzerItemEditAction | undefined;
    public aantalZwevendeItems: number;
    public showGeenItemsLabel: boolean;
    public showZwevendeItemsSidebar$: Observable<boolean>;
    public moetButtonBarTonen: boolean;
    public moetZwevendeItemsKnopTonen: boolean;
    public isEditing: boolean;
    public heeftToegangTotElo = true;
    public heeftToegangTotSw = true;
    public heeftToegangTotDifferentiatie: boolean;
    public toekomendeAfspraken$: Observable<ToekomendeAfsprakenQuery['toekomendeAfspraken']>;

    studiewijzeritemSidebar$: SidebarInputs<StudiewijzeritemSidebarComponent>;
    afspraak$: Observable<AfspraakQuery['afspraak']>;
    swiType = HuiswerkType;

    private destroy$ = new Subject<void>();

    constructor() {
        this.studiewijzeritemSidebar$ = this.sidebarService.watchFor(StudiewijzeritemSidebarComponent);
    }

    ngOnInit() {
        const params$ = this.route.parent!.paramMap;
        const queryParams$ = this.route.queryParamMap;

        this.afspraak$ = combineLatest([params$, queryParams$]).pipe(
            tap(() => (this.lesplanning = null)),
            mapToSelectedAfspraakId(),
            switchMap((selectedAfspraakId) => this.lesDataService.getAfspraak(selectedAfspraakId)),
            shareReplayLastValue(),
            takeUntil(this.destroy$)
        );

        this.toekomendeAfspraken$ = this.afspraak$.pipe(
            switchMap((afspraak) => this.lesplanningDataService.getToekomendeAfspraken(afspraak.id))
        );

        const aantalZwevendeItems$ = this.afspraak$.pipe(
            switchMap((afspraak) => combineLatest([this.lesplanningDataService.getAantalZwevendeItems(afspraak.id), [afspraak]])),
            takeUntil(this.destroy$)
        );

        const lesplanning$ = this.afspraak$.pipe(
            tap(() => this.lesService.startLoading()),
            withLatestFrom(queryParams$),
            switchMap(([afspraak, queryParams]) => {
                const showWeekitems = queryParams.get('selectedWeek');
                const dag = queryParams.get('dag');
                const medewerker$ = this.medewerkerService.getMedewerker();

                let planning$: Observable<any>;

                const lesgroepenIds = afspraak.lesgroepen.map((lesgroep) => lesgroep.id);
                if (showWeekitems) {
                    const week = queryParams.get('selectedWeek') ? +queryParams.get('selectedWeek')! : afspraak.week;
                    const jaar = queryParams.get('jaar') ? +queryParams.get('jaar')! : afspraak.jaar;
                    planning$ = this.lesplanningDataService.getLesplanningVoorWeek(afspraak.id, lesgroepenIds, week, jaar);
                } else {
                    let type: LesplanningType = 'afspraak';
                    let begin = afspraak.begin;
                    let eind = afspraak.eind;

                    if (dag) {
                        type = 'dag';
                        // de replace '-' met '/' is zodat safari ook een geldige datum krijgt.
                        const dagDate = parseYYYYMMDDToDate(dag);
                        begin = startOfDay(dagDate);
                        eind = endOfDay(dagDate);
                    }
                    planning$ = this.lesplanningDataService.getLesplanning(afspraak.id, begin, eind, type, lesgroepenIds);
                }
                return combineLatest([planning$, medewerker$]);
            }),
            tap(() => this.lesService.stopLoading()),
            takeUntil(this.destroy$)
        );

        this.showZwevendeItemsSidebar$ = this.route.queryParams.pipe(map((params) => params['zwevendSidebar']));

        aantalZwevendeItems$.subscribe(([aantalZwevendeItems, afspraak]) => {
            this.aantalZwevendeItems = aantalZwevendeItems ?? 0;
            this.isWeek = !!this.route.snapshot.parent?.queryParamMap.get('selectedWeek');

            const vandaagOfToekomst = isSameDay(afspraak.begin, new Date()) || isAfter(afspraak.begin, startOfDay(new Date()));
            this.moetButtonBarTonen = !this.toEditSwi || (vandaagOfToekomst && this.aantalZwevendeItems > 0);
            this.moetZwevendeItemsKnopTonen = !this.isWeek && vandaagOfToekomst && this.aantalZwevendeItems > 0;
        });

        lesplanning$.subscribe(([{ data, loading }, medewerker]) => {
            this.heeftToegangTotElo = medewerker.settings.vestigingRechten[0].heeftToegangTotElo;
            this.heeftToegangTotSw = medewerker.settings.vestigingRechten[0].heeftToegangTotStudiewijzer;
            this.loading = loading;
            this.toEditSwi = undefined;
            this.isEditing = false;

            let lesplanning = get(data, 'lesplanning', data.lesplanningVoorWeek);
            if (lesplanning) {
                if (!this.heeftToegangTotElo) {
                    lesplanning = this.setLesitemZichtbaarheidFalse(lesplanning);
                }
                this.lesplanning = lesplanning;

                this.showGeenItemsLabel = !this.heeftLesitems();
            }
        });

        this.afspraak$
            .pipe(
                take(1),
                switchMap((afspraak) => this.medewerkerService.differentiatieToegestaanVoorVestiging(afspraak.vestigingId))
            )
            .subscribe((toegang) => (this.heeftToegangTotDifferentiatie = toegang));
    }

    showNewItemPopup(afspraak: AfspraakQuery['afspraak']) {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 232;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom];

        const popup = this.popupService.popup(this.addIcon, popupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.afspraak = afspraak as Afspraak;
        popup.heeftToegangTotElo = this.heeftToegangTotElo;
        popup.hoogsteSortering = getHoogsteToekenningSortering([...this.lesplanning!.items, ...this.lesplanning!.toekomendeItems]);
        popup.showInleveropdracht = false;
        popup.showUitMethode = false;

        if (this.route.snapshot.parent!.queryParamMap.get('selectedWeek')) {
            popup.week = parseInt(this.route.snapshot.parent!.queryParamMap.get('selectedWeek')!, 10);
        } else if (this.route.snapshot.parent!.queryParamMap.get('dag')) {
            popup.dag = parseYYYYMMDDToDate(this.route.snapshot.parent!.queryParamMap.get('dag')!);
        }
    }

    private verwijderToekenning(toekenning: Toekenning, afspraak: AfspraakQuery['afspraak'], verwijderUitSjabloon = false) {
        let week: number | undefined;
        let jaar: number | undefined;
        let dag: Date | undefined;

        if (this.route.snapshot.parent!.queryParamMap.get('selectedWeek')) {
            week = parseInt(this.route.snapshot.parent!.queryParamMap.get('selectedWeek')!, 10);
            jaar = parseInt(this.route.snapshot.parent!.queryParamMap.get('jaar')!, 10);
        } else if (this.route.snapshot.parent!.queryParamMap.get('dag')) {
            dag = parseYYYYMMDDToDate(this.route.snapshot.parent!.queryParamMap.get('dag')!);
        }

        this.lesplanningDataService.deleteToekenning(toekenning, afspraak, verwijderUitSjabloon, week, jaar, dag);
    }

    onVerwijderToekenning(toekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        if (toekenning.synchroniseertMet && !toekenning.studiewijzeritem.inleverperiode) {
            this.openSyncVerwijderGuard(toekenning, afspraak);
        } else {
            this.verwijderToekenning(toekenning, afspraak);
        }
    }

    openSyncVerwijderGuard(toekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, syncedLesitemVerwijderUitLesplanningPopupProperties);
        popup.onConfirmFn = () => {
            this.verwijderToekenning(toekenning, afspraak);
            return true;
        };
        popup.onCancelFn = () => {
            this.verwijderToekenning(toekenning, afspraak, true);
            this.sidebarService.closeSidebar();
        };
    }

    onOntkoppelToekenning(toekenning: Toekenning) {
        const refetchQueryies = this.route.snapshot.queryParamMap.get('selectedWeek')
            ? [namedOperations.Query.lesplanningVoorWeek]
            : [namedOperations.Query.lesplanning];
        this.studiewijzerDataService.ontkoppelToekenning(toekenning.id, refetchQueryies).subscribe();
    }

    onEditing() {
        this.showGeenItemsLabel = false;
        this.isEditing = true;
    }

    onDoneEditing() {
        this.toEditSwi = undefined;
        this.showGeenItemsLabel = !this.heeftLesitems();
        this.isEditing = false;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    heeftLesitems(): boolean {
        return some(this.lesplanning?.items) || some(this.lesplanning?.toekomendeItems);
    }

    openZwevendeLesitemsSidebar() {
        this.router.navigate([], {
            queryParams: {
                zwevendSidebar: true
            },
            queryParamsHandling: 'merge'
        });
    }

    openWerkdrukSidebar(afspraak: AfspraakQuery['afspraak']) {
        const beginVanJaar = new Date(afspraak.jaar, 0, 1);
        const peildatum = addWeeks(beginVanJaar, afspraak.week - 1);
        const schooljaar = getSchooljaar(peildatum);

        const geselecteerdeJaar = this.route.snapshot.queryParamMap.get('jaar');
        const geselecteerdeWeek = this.route.snapshot.queryParamMap.get('week');
        // Kijk naar 4 januari. Deze kan nooit in week 53 vallen
        const geselecteerdeDatum = addWeeks(new Date(Number(geselecteerdeJaar), 0, 4), Number(geselecteerdeWeek) - 1);

        this.sidebarService.openSidebar(WerkdrukSidebarComponent, {
            lesgroepen: afspraak.lesgroepen,
            initielePeildatum: geselecteerdeWeek ? geselecteerdeDatum : peildatum,
            eersteWeek: getISOWeek(schooljaar.start) + 1,
            laatsteWeek: getISOWeek(schooljaar.eind),
            initieleLeerlingenContext: [],
            showAddItem: true
        });
    }

    saveToekenning(toekenningenContainer: SaveToekenningContainer, oudeToekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        const toekenning = toekenningenContainer.toekenningen[0];
        const toSaveToekenningen = toekenning.id ? [toekenning] : afspraak.lesgroepen.map((lesgroep) => ({ ...toekenning, lesgroep }));

        if ((<AfspraakToekenning>toekenning).afgerondOpDatumTijd) {
            const wasDagToekenning = Boolean(oudeToekenning.id) && !!(<DagToekenning>oudeToekenning).datum;
            if (wasDagToekenning) {
                const lesgroepIds = afspraak.lesgroepen.map(toId);
                this.lesplanningDataService.dagNaarAfspraakToekenning(
                    <DagToekenning>oudeToekenning,
                    <AfspraakToekenning>toekenning,
                    afspraak,
                    lesgroepIds
                );
            } else {
                this.lesplanningDataService.saveAfspraakToekenning$(toSaveToekenningen as AfspraakToekenning[]).subscribe();
            }
        } else if ((<DagToekenning>toekenning).datum) {
            const wasAfspraakToekenning = Boolean(oudeToekenning.id) && !!(<AfspraakToekenning>oudeToekenning).afgerondOpDatumTijd;
            if (wasAfspraakToekenning) {
                const lesgroepIds = afspraak.lesgroepen.map(toId);
                this.lesplanningDataService.afspraakNaarDagToekenning(
                    <AfspraakToekenning>oudeToekenning,
                    <DagToekenning>toekenning,
                    afspraak,
                    lesgroepIds
                );
            } else {
                const baseAfspraakId = this.route.snapshot.parent!.paramMap.get('id')!;
                this.lesplanningDataService.saveDagToekenning$(toSaveToekenningen as DagToekenning[], afspraak, baseAfspraakId).subscribe();
            }
        } else {
            const jaarParam = this.route.snapshot.parent!.queryParamMap.get('jaar');
            const jaar = jaarParam ? Number(jaarParam) : new Date().getFullYear();

            this.lesplanningDataService.saveWeekToekenning(toSaveToekenningen as WeekToekenning[], afspraak, jaar);
        }

        this.sidebarService.closeSidebar(StudiewijzeritemSidebarComponent);
        this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: true });
        if (toekenningenContainer.copyOnSave) {
            setTimeout(() =>
                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                    toekenning: copyToekenning(toekenning),
                    openInEditMode: true,
                    openWithDirtyForm: true,
                    afspraak: afspraak as Afspraak
                })
            );
        }
    }

    onDifferentiatieToekennenClick(toekenning: Toekenning) {
        this.sidebarService.openSidebar(DifferentiatieToekennenSidebarComponent, {
            lesgroep: toekenning.lesgroep,
            toekenning,
            disableSidebarAnimation: false
        });
    }

    verwijderAlleDiffLeerlingen(toekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        const updatedToekenning: Toekenning = { ...toekenning, differentiatieleerlingen: [] };
        this.saveToekenning({ toekenningen: [updatedToekenning] }, toekenning, afspraak);
    }

    verwijderDiffLeerling(leerlingId: string, toekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        const updatedToekenning = {
            ...toekenning,
            differentiatieleerlingen: [...toekenning.differentiatieleerlingen].filter(notEqualsId(leerlingId))
        };
        this.saveToekenning({ toekenningen: [updatedToekenning] }, toekenning, afspraak);
    }

    verwijderDiffGroep(groepId: string, toekenning: Toekenning, afspraak: AfspraakQuery['afspraak']) {
        const updatedToekenning = {
            ...toekenning,
            differentiatiegroepen: [...toekenning.differentiatiegroepen].filter(notEqualsId(groepId))
        };
        this.saveToekenning({ toekenningen: [updatedToekenning] }, toekenning, afspraak);
    }

    private setLesitemZichtbaarheidFalse(lesplanning: Lesplanning): Lesplanning {
        const isLesstof = into({ studiewijzeritem: (item: Studiewijzeritem) => item.huiswerkType === HuiswerkType.LESSTOF });
        return updateAll<Lesplanning>(
            set('items', all(), 'studiewijzeritem', 'notitieZichtbaarVoorLeerling')(false),
            set('items', matching(isLesstof), 'studiewijzeritem', 'zichtbaarVoorLeerling')(false),
            set('items', all(), 'studiewijzeritem', 'bijlagen', all(), 'zichtbaarVoorLeerling')(false),
            set('toekomendeItems', all(), 'studiewijzeritem', 'notitieZichtbaarVoorLeerling')(false),
            set('toekomendeItems', matching(isLesstof), 'studiewijzeritem', 'zichtbaarVoorLeerling')(false),
            set('toekomendeItems', all(), 'studiewijzeritem', 'bijlagen', all(), 'zichtbaarVoorLeerling')(false)
        )(lesplanning);
    }
}
