import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear, isBefore } from 'date-fns';
import { IconDirective, PillComponent, SpinnerComponent } from 'harmony';
import { IconAZ, IconInleveropdracht, IconPijlLinks, IconToevoegen, IconZA, provideIcons } from 'harmony-icons';
import { curry, flatMap, negate } from 'lodash-es';
import { NgStringPipesModule } from 'ngx-pipes';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { toekenningMutationFields } from '../../../generated/_operations';
import {
    Afrondingsoverzicht,
    AfspraakToekenning,
    DagToekenning,
    Lesgroep,
    Projectgroep,
    Toekenning,
    ToekenningFieldsFragment
} from '../../../generated/_types';
import { localOrCookieStorage } from '../../auth/storage-config';
import { allowChildAnimations } from '../../core/core-animations';
import {
    InleveropdrachtSorteerHeader,
    InleveropdrachtenTab,
    SorteerOrder,
    inleveropdrachtSorteringen
} from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { SaveToekenningContainer } from '../../core/models/lesplanning.model';
import { Differentiatie } from '../../core/models/studiewijzers/shared.model';
import { startLoading, stopLoading } from '../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { InleveropdrachtenDataService } from '../../core/services/inleveropdrachten-data.service';
import { MaskService } from '../../core/services/mask.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { UploadDataService } from '../../core/services/upload-data.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { ActionsPopupComponent, sorteerButton } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { sidebarMaskId } from '../../rooster-shared/components/sidebar/sidebar.component';
import { getSchooljaar, getSchooljaarStartEnEind } from '../../rooster-shared/utils/date.utils';
import { differentiatiegroepenBevatLeerling, loadingState, sortLocale } from '../../rooster-shared/utils/utils';
import { AfrondingsoverzichtPopupComponent } from '../../shared-studiewijzer-les/afrondingsoverzicht-popup/afrondingsoverzicht-popup.component';
import { inleveropdrachtVerwijderenGuardProperties } from '../../shared-studiewijzer-les/utils/inleveropdrachten-verwijderen.utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DifferentiatieToekennenSidebarComponent } from '../../shared/components/differentiatie-toekennen-sidebar/differentiatie-toekennen-sidebar.component';
import { LesgroepSelectieSidebarComponent } from '../../shared/components/lesgroep-selectie-sidebar/lesgroep-selectie-sidebar.component';
import { SorteerColumnHeaderComponent } from '../../shared/components/sorteer-column-header/sorteer-column-header.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { copyToekenning, createInleveropdrachtToekenning } from '../../shared/utils/toekenning.utils';
import { StudiewijzerDataService } from '../../studiewijzers/studiewijzer-data.service';
import { InleveropdrachtComponent } from '../inleveropdracht/inleveropdracht.component';
import { InleveropdrachtenHeaderNavigatieComponent } from './inleveropdrachten-header-navigatie/inleveropdrachten-header-navigatie.component';

@Component({
    selector: 'dt-inleveropdrachten-overzicht',
    templateUrl: './inleveropdrachten-overzicht.component.html',
    styleUrls: ['./inleveropdrachten-overzicht.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 200 }), allowChildAnimations],
    standalone: true,
    imports: [
        HeaderComponent,
        InleveropdrachtenHeaderNavigatieComponent,
        SorteerColumnHeaderComponent,
        InleveropdrachtComponent,
        RouterLink,
        SpinnerComponent,
        OutlineButtonComponent,
        LesgroepSelectieSidebarComponent,
        StudiewijzeritemSidebarComponent,
        DifferentiatieToekennenSidebarComponent,
        AsyncPipe,
        NgStringPipesModule,
        IconDirective,
        PillComponent
    ],
    providers: [provideIcons(IconInleveropdracht, IconAZ, IconZA, IconToevoegen, IconPijlLinks), UploadDataService]
})
export class InleveropdrachtenOverzichtComponent implements OnInit, AfterViewInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private inleveropdrachtenDataService = inject(InleveropdrachtenDataService);
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private deviceService = inject(DeviceService);
    private viewContainerRef = inject(ViewContainerRef);
    private changeDetector = inject(ChangeDetectorRef);
    private maskService = inject(MaskService);
    private medewerkerService = inject(MedewerkerDataService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    @ViewChild('sorteer', { read: ViewContainerRef }) huidigeSortering: ViewContainerRef;
    @ViewChildren(InleveropdrachtComponent) inleveropdrachtenList: QueryList<InleveropdrachtComponent>;

    public schooljaar$: Observable<number>;
    public huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
    public activeSort$ = new BehaviorSubject<[InleveropdrachtSorteerHeader, SorteerOrder]>(['deadline', 'desc']);
    public activeTab$ = new BehaviorSubject<InleveropdrachtenTab>(
        <InleveropdrachtenTab>localOrCookieStorage.getItem('inleveropdrachten.navigatie.tab') || 'aankomend'
    );
    public inleveropdrachten$: Observable<ToekenningFieldsFragment[]>;
    public inleveropdrachtenAankomend$: Observable<ToekenningFieldsFragment[]>;
    public inleveropdrachtenVerlopen$: Observable<ToekenningFieldsFragment[]>;
    public aantalVerlopen$: Observable<number>;
    public aantalAankomend$: Observable<number>;
    public toonDifferentiatie$ = new BehaviorSubject<boolean>(true);

    public differentiatieToekennenSidebar$: SidebarInputs<DifferentiatieToekennenSidebarComponent>;
    public studiewijzeritemSidebar$: SidebarInputs<StudiewijzeritemSidebarComponent>;
    public lesgroepSelectieSidebar$: SidebarInputs<LesgroepSelectieSidebarComponent>;

    public loadingState = loadingState();
    private heeftToegangTotDifferentiatie: boolean;
    private onDestroy$ = new Subject<void>();

    ngOnInit(): void {
        this.schooljaar$ = this.route.queryParamMap.pipe(
            tap((queryParams) => {
                // Bij schooljaarnavigatie moet de activeTab altijd overschreven worden naar verlopen of aankomend o.b.v. het jaar.
                const schooljaarFromQueryParam = parseInt(queryParams.get('jaar')!, 10);
                if (schooljaarFromQueryParam) {
                    this.updateActiveTab(schooljaarFromQueryParam < this.huidigSchooljaar ? 'verlopen' : 'aankomend');
                }
            }),
            map(
                (queryParams) =>
                    parseInt(queryParams.get('jaar')!, 10) ||
                    parseInt(localOrCookieStorage.getItem('inleveropdrachten.navigatie.jaar')!, 10) ||
                    this.huidigSchooljaar
            ),
            tap((schooljaar) => localOrCookieStorage.setItem('inleveropdrachten.navigatie.jaar', schooljaar.toString())),
            distinctUntilChanged(),
            shareReplayLastValue()
        );

        const isVerlopenToekenning = (toekenning: ToekenningFieldsFragment) =>
            isBefore(toekenning.studiewijzeritem.inleverperiode!.eind, new Date());
        const isAankomendeToekenning = negate(isVerlopenToekenning);
        const activeTabFilter$ = this.activeTab$.pipe(
            map((activeTab) => (activeTab === 'verlopen' ? isVerlopenToekenning : isAankomendeToekenning))
        );

        const inleveropdrachtAankomendWatchQuery$ = this.schooljaar$.pipe(
            startLoading(this.loadingState, 0),
            tap(() => setTimeout(() => this.changeDetector.detectChanges(), 0)),
            switchMap((schooljaar) => this.inleveropdrachtenDataService.getInleveropdrachtenVanSchooljaarAankomend(schooljaar)),
            stopLoading(this.loadingState),
            shareReplayLastValue()
        );

        const sortArguments$ = this.activeSort$.pipe(map(([sortering, order]) => inleveropdrachtSorteringen[sortering][order]));
        this.inleveropdrachtenAankomend$ = combineLatest([inleveropdrachtAankomendWatchQuery$, activeTabFilter$, sortArguments$]).pipe(
            map(([toekenningen, tabFilter, activeSort]) =>
                sortLocale(toekenningen.filter(tabFilter), activeSort.properties as any, activeSort.order)
            )
        );

        const inleveropdrachtVerlopenWatchQuery$ = combineLatest([this.schooljaar$, this.activeTab$]).pipe(
            startLoading(this.loadingState, 0),
            tap(() => setTimeout(() => this.changeDetector.detectChanges(), 0)),
            switchMap(([schooljaar, activeTab]) =>
                activeTab === 'verlopen' ? this.inleveropdrachtenDataService.getInleveropdrachtenVanSchooljaarVerlopen(schooljaar) : of([])
            ),
            stopLoading(this.loadingState),
            shareReplayLastValue()
        );

        this.inleveropdrachtenVerlopen$ = combineLatest([inleveropdrachtVerlopenWatchQuery$, activeTabFilter$, sortArguments$]).pipe(
            map(([toekenningen, tabFilter, activeSort]) =>
                sortLocale(toekenningen.filter(tabFilter), activeSort.properties as any, activeSort.order)
            )
        );

        this.inleveropdrachten$ = combineLatest([this.inleveropdrachtenAankomend$, this.inleveropdrachtenVerlopen$]).pipe(
            map(([aankomend, verlopen]) => [...aankomend, ...verlopen])
        );

        this.aantalVerlopen$ = this.schooljaar$.pipe(
            startLoading(this.loadingState, 0),
            tap(() => setTimeout(() => this.changeDetector.detectChanges(), 0)),
            switchMap((schooljaar) => this.inleveropdrachtenDataService.getAantalInleveropdrachtenVanSchooljaarVerlopen(schooljaar)),
            stopLoading(this.loadingState),
            shareReplayLastValue()
        );
        this.aantalAankomend$ = inleveropdrachtAankomendWatchQuery$.pipe(map((toekenningen) => toekenningen.length));

        this.activeTab$.pipe(takeUntil(this.onDestroy$)).subscribe((activeTab) => this.loadSorteringFromStorage(activeTab));

        this.activeSort$.pipe(takeUntil(this.onDestroy$)).subscribe(([header, order]) => this.saveSorteringToStorage(header, order));

        this.medewerkerService
            .heeftToegangTotDifferentiatie()
            .pipe(
                tap((toegang) => (this.heeftToegangTotDifferentiatie = toegang)),
                filter((toegang) => !toegang),
                switchMap(() => this.inleveropdrachten$),
                map((toekeningen) =>
                    toekeningen.some(
                        (toekenning) => toekenning.differentiatiegroepen.length !== 0 || toekenning.differentiatieleerlingen.length !== 0
                    )
                ),
                takeUntil(this.onDestroy$)
            )
            .subscribe((tonen) => {
                this.toonDifferentiatie$.next(tonen);
            });

        this.studiewijzeritemSidebar$ = this.sidebarService.watchFor(StudiewijzeritemSidebarComponent);
        this.differentiatieToekennenSidebar$ = this.sidebarService.watchFor(DifferentiatieToekennenSidebarComponent);
        this.lesgroepSelectieSidebar$ = this.sidebarService.watchFor(LesgroepSelectieSidebarComponent);
    }

    ngAfterViewInit(): void {
        this.scrollToInleveropdracht(localOrCookieStorage.getItem('inleveropdrachten.navigatie.scrollpositie')!, 'auto');
    }

    private get scrollMargin() {
        return this.deviceService.isPhone() ? 55 : 0;
    }

    scrollToInleveropdracht(inleveropdrachtId: string, scrollBehavior: ScrollBehavior) {
        if (inleveropdrachtId) {
            this.inleveropdrachtenList.changes
                .pipe(
                    switchMap((inleveropdrachtComponents) => inleveropdrachtComponents._results),
                    filter(
                        (inleveropdrachtComponent: InleveropdrachtComponent) =>
                            inleveropdrachtComponent.inleveropdracht.id === inleveropdrachtId
                    ),
                    take(1)
                )
                .subscribe((inleveropdrachtComponent: InleveropdrachtComponent) => {
                    window.scrollTo({
                        top: inleveropdrachtComponent.elementRef.nativeElement.offsetTop - this.scrollMargin,
                        left: 0,
                        behavior: scrollBehavior
                    });
                });
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    updateSortering(header: InleveropdrachtSorteerHeader) {
        const currentSortValue = this.activeSort$.getValue();
        const currentHeader = currentSortValue[0];
        const currentOrder = currentSortValue[1];

        // Sortering omdraaien bij update van dezelfde header, anders laten staan
        let newOrder = currentOrder;
        if (header === currentHeader) {
            newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        }

        this.activeSort$.next([header, newOrder]);
    }

    loadSorteringFromStorage(activeTab: InleveropdrachtenTab) {
        const header =
            <InleveropdrachtSorteerHeader>localOrCookieStorage.getItem(`inleveropdrachten.sortering.${activeTab}.header`) || 'deadline';
        const order =
            <SorteerOrder>localOrCookieStorage.getItem(`inleveropdrachten.sortering.${activeTab}.order`) ||
            (activeTab === 'aankomend' ? 'asc' : 'desc');

        this.activeSort$.next([header, order]);
    }

    saveSorteringToStorage(activeSort: InleveropdrachtSorteerHeader, activeOrder: SorteerOrder) {
        const activeTab = this.activeTab$.getValue();
        localOrCookieStorage.setItem(`inleveropdrachten.sortering.${activeTab}.header`, activeSort);
        localOrCookieStorage.setItem(`inleveropdrachten.sortering.${activeTab}.order`, activeOrder);
    }

    openSorteerPopup(activeSort: InleveropdrachtSorteerHeader, activeOrder: SorteerOrder) {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 190;
        const popup = this.popupService.popup(this.huidigeSortering, popupSettings, ActionsPopupComponent);

        const customSorteerButton = curry(sorteerButton)(activeSort, activeOrder);
        const ascSorteerButton = (header: InleveropdrachtSorteerHeader) =>
            customSorteerButton(() => this.activeSort$.next([header, 'asc']), header, 'asc');
        const descSorteerButton = (header: InleveropdrachtSorteerHeader) =>
            customSorteerButton(() => this.activeSort$.next([header, 'desc']), header, 'desc');

        popup.customButtons = flatMap(
            Object.keys(inleveropdrachtSorteringen).map((header: InleveropdrachtSorteerHeader) => [
                ascSorteerButton(header),
                descSorteerButton(header)
            ])
        );
        popup.onActionClicked = () => popup.popup.onClose();
    }

    saveOpdracht(toekenningContainer: SaveToekenningContainer) {
        const toekenning = toekenningContainer.toekenningen[0];
        const isNieuweToekenning = !toekenning.id;
        const isDagToekenning = (<DagToekenning>toekenning).datum;

        if (isDagToekenning) {
            if (isNieuweToekenning) {
                this.inleveropdrachtenDataService
                    .saveDagToekenning$(toekenningContainer.toekenningen as DagToekenning[])
                    .subscribe((response) => {
                        if (!toekenningContainer.copyOnSave) {
                            if (response.data!.saveDagToekenning.toekenningen.length > 1) {
                                this.sidebarService.closeSidebar();
                            } else {
                                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                                    toekenning: response.data!.saveDagToekenning.toekenningen[0] as DagToekenning,
                                    heeftToegangTotDifferentiatie: this.heeftToegangTotDifferentiatie
                                });
                            }
                        }
                        this.updateActiveTab('aankomend');
                    });
            } else {
                this.inleveropdrachtenDataService
                    .saveDagToekenning$([<DagToekenning>toekenning])
                    .pipe(map((result) => result.data!.saveDagToekenning.toekenningen[0]))
                    .subscribe((newToekenning) => {
                        this.sidebarService.updateData(StudiewijzeritemSidebarComponent, {
                            toekenning: this.inleveropdrachtenDataService.cache.readFragment<DagToekenning>({
                                id: this.inleveropdrachtenDataService.cache.identify(newToekenning),
                                fragment: toekenningMutationFields,
                                fragmentName: 'toekenningMutationFields'
                            })!,
                            heeftToegangTotDifferentiatie: this.heeftToegangTotDifferentiatie
                        });
                    });
            }
        } else {
            this.inleveropdrachtenDataService
                .updateAfspraakToekenning$(<AfspraakToekenning>toekenning)
                .pipe(map((result) => result.data!.saveAfspraakToekenning.toekenningen[0]))
                .subscribe((newToekenning) => {
                    this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                        toekenning: newToekenning as AfspraakToekenning,
                        heeftToegangTotDifferentiatie: this.heeftToegangTotDifferentiatie
                    });
                });
        }

        if (toekenningContainer.copyOnSave) {
            this.maskService.removeMask(sidebarMaskId, true);
            this.sidebarService.closeSidebar();
            setTimeout(() => {
                this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                    toekenning: copyToekenning(toekenning),
                    openInEditMode: true,
                    openWithDirtyForm: true
                });
            });
        }
    }

    verwijderOpdracht(toekenning: Toekenning) {
        if (toekenning.studiewijzeritem.inleverperiode!.inleveringenAantal > 0) {
            this.openInleveropdrachtVerwijderGuard(toekenning);
        } else {
            this.verwijderToekenning(toekenning);
        }
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

    openLesgroepSelectie(schooljaar: number) {
        this.sidebarService.openSidebar(LesgroepSelectieSidebarComponent, { schooljaar });
    }

    openStudiewijzerItemSidebar(lesgroepen: Lesgroep[], schooljaar: number) {
        const datum = this.huidigSchooljaar === schooljaar ? new Date() : getSchooljaarStartEnEind(schooljaar).start;
        const toekenning = createInleveropdrachtToekenning(datum, 0);

        this.medewerkerService.differentiatieToegestaanVoorVestiging(lesgroepen[0].vestigingId).subscribe((heeftToegang) => {
            this.sidebarService.updateOptions(LesgroepSelectieSidebarComponent, {
                onMaskClick: () => {
                    // do nothing
                }
            });
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                selectedLesgroepen: lesgroepen,
                toekenning,
                heeftToegangTotDifferentiatie: lesgroepen.length <= 1 && heeftToegang,
                openInEditMode: true,
                sidebar: {
                    icon: 'pijlLinks',
                    iconClickable: true,
                    title: 'Nieuwe inleveropdracht',
                    onIconClick: () => {
                        this.sidebarService.updateOptions(LesgroepSelectieSidebarComponent, {
                            onMaskClick: () => this.sidebarService.closeSidebar()
                        });
                        this.sidebarService.hideSidebar(StudiewijzeritemSidebarComponent);
                    }
                }
            });
        });
    }

    verwijderToekenning(toekenning: Toekenning) {
        this.inleveropdrachtenDataService.verwijderInleveropdracht(toekenning);
    }

    updateActiveTab(activeTab: InleveropdrachtenTab) {
        this.activeTab$.next(activeTab);
        localOrCookieStorage.setItem('inleveropdrachten.navigatie.tab', activeTab.toString());
    }

    openInleveringenPopup(iconRef: ViewContainerRef, toekenning: ToekenningFieldsFragment) {
        const popup = this.popupService.popup(
            iconRef,
            AfrondingsoverzichtPopupComponent.defaultPopupSettings,
            AfrondingsoverzichtPopupComponent
        );
        const projectgroepen = toekenning.studiewijzeritem.projectgroepen;
        popup.datasource$ =
            projectgroepen.length > 0
                ? of<Afrondingsoverzicht>({
                      afgerond: sortLocale(
                          projectgroepen.filter((g) => g.heeftInlevering),
                          ['hoogstePlagiaat', 'naam'],
                          ['desc', 'asc']
                      ) as Projectgroep[],
                      nietAfgerond: projectgroepen.filter((g) => !g.heeftInlevering) as Projectgroep[]
                  })
                : (this.studiewijzerDataService.getInleveroverzicht(toekenning.id) as Observable<Afrondingsoverzicht>);
        popup.afgerondLabel = 'Ingeleverd';
        popup.onafgerondLabel = 'Niet ingeleverd';
        popup.typeLabel = projectgroepen.length > 0 ? 'projectgroepen' : 'leerlingen';
        popup.toekenningId = toekenning.id;
    }

    onDifferentiatieToekennenClick(toekenning: Toekenning) {
        this.maskService.removeMask(sidebarMaskId, true);
        this.sidebarService.closeSidebar();
        setTimeout(() => {
            this.sidebarService.openSidebar(DifferentiatieToekennenSidebarComponent, {
                lesgroep: toekenning.lesgroep!,
                toekenning,
                disableSidebarAnimation: true
            });
        });
    }

    onDifferentiatieToekennen(event: { differentiatie: Differentiatie; toekenning: Toekenning }) {
        const toekenning = event.toekenning;
        const filteredLeerlingen = event.differentiatie.differentiatieleerlingen.filter(
            (leerling) => !differentiatiegroepenBevatLeerling(toekenning.differentiatiegroepen, leerling.id)
        );
        const updatedToekenning: Toekenning = {
            ...toekenning,
            differentiatiegroepen: [...toekenning.differentiatiegroepen, ...event.differentiatie.differentiatiegroepen],
            differentiatieleerlingen: [...toekenning.differentiatieleerlingen, ...filteredLeerlingen]
        };

        this.saveOpdracht({ toekenningen: [updatedToekenning] });
        this.maskService.removeMask(sidebarMaskId, true);
        setTimeout(() => {
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                toekenning: updatedToekenning,
                openInEditMode: false
            });
        });
    }

    showSchooljaar(schooljaar: number) {
        this.router.navigate([], { queryParams: { jaar: schooljaar }, queryParamsHandling: 'merge' });
    }
}
