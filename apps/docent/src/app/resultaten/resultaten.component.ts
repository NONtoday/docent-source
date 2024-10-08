import { AsyncPipe, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    Signal,
    ViewChild,
    ViewContainerRef,
    computed,
    inject,
    runInInjectionContext
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
    CijferPeriode,
    KolomZichtbaarheid,
    Lesgroep,
    LesgroepenQuery,
    Maybe,
    Sortering,
    SorteringOrder,
    SorteringVeld,
    Toetskolom,
    VoortgangsdossierKolomZichtbaarheidQuery,
    VoortgangsdossierMatrixVanLesgroepQuery,
    VoortgangsdossiersQuery
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { isWithinInterval, subWeeks } from 'date-fns';
import { DropdownComponent, DropdownItem, IconDirective, SpinnerComponent } from 'harmony';
import {
    IconAZ,
    IconChevronOnder,
    IconGroep,
    IconOpties,
    IconPinned,
    IconResultaten,
    IconVoortgangsdossier,
    IconZA,
    provideIcons
} from 'harmony-icons';
import { uniqBy } from 'lodash-es';
import { NgStringPipesModule } from 'ngx-pipes';
import { BehaviorSubject, Observable, Subject, combineLatest, identity } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { allowChildAnimations } from '../core/core-animations';
import { SorteerOrder } from '../core/models/inleveropdrachten/inleveropdrachten.model';
import { KolomZichtbaarheidKey, LeerlingResultatenSidebarData, ToetskolomSidebarData } from '../core/models/resultaten/resultaten.model';
import { shareReplayLastValue } from '../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../core/popup/popup.service';
import { PopupDirection, defaultPopupOffsets } from '../core/popup/popup.settings';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../core/services/device.service';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { SidebarService } from '../core/services/sidebar.service';
import { HeaderComponent } from '../layout/header/header.component';
import { ResultaatMenuPopupComponent } from '../layout/menu/resultaat-menu-popup/resultaat-menu-popup.component';
import { LesgroepDeeplinkPopupComponent } from '../les/lesgroep-deeplink-popup/lesgroep-deeplink-popup.component';
import {
    ActionsPopupComponent,
    SorteerButtonClickFn,
    sorteerButtons
} from '../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../rooster-shared/components/background-icon/background-icon.component';
import { MessageComponent } from '../rooster-shared/components/message/message.component';
import { Optional, sortLocale } from '../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeactivatableComponentDirective } from '../shared/components/deactivatable.component';
import { LeerlingComponent } from '../shared/components/leerling/leerling.component';
import { replaceInArray } from '../shared/utils/array.utils';
import { LeerlingResultatenSidebarComponent } from './leerling-resultaten-sidebar/leerling-resultaten-sidebar.component';
import { ResultaatDataService } from './resultaat-data.service';
import { ResultaatPeriodeComponent } from './resultaat-periode/resultaat-periode.component';
import { PeriodeStatus, ResultaatService, defaultPeriodeStatus } from './resultaat.service';
import { ResultatenSaveIndicatorComponent } from './resultaten-save-indicator/resultaten-save-indicator.component';
import { defaultPeriodeKolomZichtbaarheid, resultatenOpslaanGuardProperties } from './resultaten.utils';
import { ToetskolomSidebarComponent } from './toetskolom-sidebar/toetskolom-sidebar.component';

const defaultSortering: Sortering = {
    naam: 'resultaten',
    order: SorteringOrder.ASC,
    veld: SorteringVeld.ACHTERNAAM
};

export interface VoortgangsdossierNiveau {
    voortgangsdossier: VoortgangsdossiersQuery['voortgangsdossiers'][number];
    omschrijving: string;
    isStandaardNiveau: boolean;
    active: boolean;
}

interface ResultatenComponentData {
    matrix: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep'];
    onderwijssoorten: string[];
    niveaus: VoortgangsdossierNiveau[];
    magKolomBewerken: boolean;
    magBekoeldePeriodeBewerken: boolean;
    cijferPeriodes: CijferPeriode[];
    leerlingSortering: Sortering;
    sortedLeerlingen: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'];
    kolommenzichtbaarheid: VoortgangsdossierKolomZichtbaarheidQuery['voortgangsdossierKolomZichtbaarheid'];
    lesgroepId: string;
    alternatiefNiveau: boolean;
}

@Component({
    selector: 'dt-resultaten',
    templateUrl: './resultaten.component.html',
    styleUrls: ['./resultaten.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    providers: [
        ResultaatService,
        provideIcons(IconVoortgangsdossier, IconGroep, IconChevronOnder, IconOpties, IconAZ, IconZA, IconPinned, IconResultaten)
    ],
    standalone: true,
    imports: [
        HeaderComponent,
        BackgroundIconComponent,
        ResultatenSaveIndicatorComponent,
        NgClass,
        LeerlingComponent,
        ResultaatPeriodeComponent,
        ToetskolomSidebarComponent,
        LeerlingResultatenSidebarComponent,
        MessageComponent,
        SpinnerComponent,
        AsyncPipe,
        NgStringPipesModule,
        IconDirective,
        DropdownComponent
    ]
})
export class ResultatenComponent extends DeactivatableComponentDirective implements OnInit, OnDestroy {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    public resultaatDataService = inject(ResultaatDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    public deviceService = inject(DeviceService);
    private sidebarService = inject(SidebarService);
    private changedetector = inject(ChangeDetectorRef);
    public resultaatService = inject(ResultaatService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptions: ViewContainerRef;
    @ViewChild('lesgroep', { read: ViewContainerRef }) lesgroepRef: ViewContainerRef;
    @ViewChild('sorteerheader', { read: ViewContainerRef }) sorteerheader: ViewContainerRef;

    public templateColumns = '240px';
    public defaultPeriodeKolomZichtbaarheid = defaultPeriodeKolomZichtbaarheid;

    public viewModel: Signal<ResultatenComponentData | undefined>;

    public selectedTab$ = new BehaviorSubject<'leerlingen' | 'toetsen'>('leerlingen');
    public highlight$: Observable<Optional<number>>;
    public showSuccesMessage: boolean;
    public succesMessage: string;
    public toetskolomSidebar$: Observable<ToetskolomSidebarData>;
    public leerlingResultatenSidebar$: Observable<LeerlingResultatenSidebarData>;
    public huidigePeriodeIndex$: Observable<number>;
    public resultatenOpgeslagenOp$: Observable<Maybe<string>>;

    public activeLeerling$: Observable<Optional<string>>;
    public pinned$: Observable<Optional<number>>;

    public toonLeerlingen: boolean;
    public toonToetsen: boolean;
    public isPhoneOrTabletPortrait: boolean;
    private destroy$ = new Subject<void>();
    private injector = inject(Injector);

    ngOnInit() {
        const lesgroepId$ = this.route.paramMap.pipe(
            map((params) => params.get('id')!),
            shareReplayLastValue()
        );
        const voortgangsdossierId$ = this.route.queryParamMap.pipe(
            map((params) => params.get('voortgangsdossier')),
            startWith(null)
        );
        this.resultatenOpgeslagenOp$ = this.resultaatService.laatstOpgeslagenOp$;

        runInInjectionContext(this.injector, () => {
            this.viewModel = toSignal(
                combineLatest([lesgroepId$, voortgangsdossierId$]).pipe(
                    switchMap(([lesgroepId, voortgangsdossierId]) =>
                        combineLatest([
                            this.resultaatDataService.getVoortgangsdossierMatrixVanLesgroep(lesgroepId, voortgangsdossierId).pipe(
                                filter((matrix) => !!matrix.id),
                                // na het ophalen van de matrix, maar voordat alle data klaar is, moeten de juiste periodes
                                // worden (in/uit)geklapt en wordt het echte voortgangsdossierId in de service gezet.
                                tap((matrix) => {
                                    this.resultaatService.nextIndexToPin(null);
                                    this.resultaatService.setVoortgangsdossierId(matrix.voortgangsdossier.id, false);
                                    this.resultaatService.laatstOpgeslagen = matrix.laatstGewijzigdDatum;

                                    if (this.resultaatService.periodeCollapsedStatus$.value === defaultPeriodeStatus) {
                                        const statussen: PeriodeStatus = {};
                                        matrix.periodes
                                            .map((periode) => periode.cijferPeriode)
                                            .forEach((periode) => (statussen[periode.nummer] = !periode.isHuidig));

                                        // wanneer alle periodes dicht zijn, zet dan periode 1 open
                                        const allesDicht = Object.values(statussen).every(identity);
                                        statussen[1] = allesDicht ? false : statussen[1];

                                        this.resultaatService.periodeCollapsedStatus$.next(statussen);
                                    }
                                })
                            ),
                            this.resultaatService.alternatiefNiveau$,
                            this.medewerkerDataService.getSorteringVanMedewerker('resultaten'),
                            this.medewerkerDataService.getMedewerker(),
                            this.resultaatDataService.getVoortgangsdossiers(lesgroepId),
                            this.resultaatDataService.getVoortgangsdossierKolomZichtbaarheid(lesgroepId)
                        ])
                    ),
                    map(([matrix, alternatiefNiveau, sorteringVanMedewerker, medewerker, dossiers, kolomZichtbaarheid]) => {
                        const lesgroepId = this.route.snapshot.paramMap.get('id')!;
                        // we halen het voortgangsdossier uit de service, omdat het id niet altijd in de url staat en dit id na het ophalen
                        // van het voortgangsdossier (obv lesgroepId) in de service is gezet.
                        const voortgangsdossierId = this.resultaatService.voortgangsdossierId;
                        const sortering = sorteringVanMedewerker ?? defaultSortering;
                        const niveaus = this.mapVoortgangsdossierNiveaus(dossiers, voortgangsdossierId, alternatiefNiveau);
                        return {
                            matrix,
                            niveaus,
                            onderwijssoorten: uniqBy(niveaus, 'voortgangsdossier.onderwijssoortLeerjaar').map(
                                (niveau) => niveau.voortgangsdossier.onderwijssoortLeerjaar
                            ),
                            magKolomBewerken: Boolean(
                                medewerker.settings.heeftVoortgangsdossierLesgroepToetsenBewerkenRecht &&
                                    matrix.voortgangsdossier.lesgroepToetsenToegestaan
                            ),
                            magBekoeldePeriodeBewerken: Boolean(medewerker.settings.heeftBekoeldeResultatenBewerkenRecht),
                            cijferPeriodes: matrix.periodes.map((periode) => periode.cijferPeriode),
                            leerlingSortering: sorteringVanMedewerker ?? defaultSortering,
                            sortedLeerlingen: sortering
                                ? sortLocale(
                                      matrix.leerlingen,
                                      [sortering.veld.toLowerCase() as any],
                                      [sortering.order.toLowerCase() as SorteerOrder]
                                  )
                                : matrix.leerlingen,
                            kolommenzichtbaarheid: matrix.periodes.map((_, i) => kolomZichtbaarheid[i] ?? defaultPeriodeKolomZichtbaarheid),
                            lesgroepId,
                            alternatiefNiveau
                        };
                    }),
                    tap((viewModel) => {
                        if (viewModel.matrix.leerlingen.length === 0) {
                            const anderNiveau = viewModel.niveaus.find(
                                (niveau) =>
                                    niveau.voortgangsdossier.onderwijssoortLeerjaar !==
                                    viewModel.matrix.voortgangsdossier.onderwijssoortLeerjaar
                            );
                            // Het voortgangsdossier van de lesgroep bevat geen leerlingen, maar er is een ander niveau gevonden,
                            // dus ga naar het voortgangsdossier van dat andere niveau (onderwijssoort).
                            if (anderNiveau) {
                                this.navigateToNiveau(anderNiveau);
                            }
                        }
                    })
                )
            );
        });

        combineLatest([this.deviceService.onDeviceChange$, this.resultaatService.periodeCollapsedStatus$])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([deviceState, periodeStatussen]) => {
                const periodes = Object.values(periodeStatussen).map((ingeklapt) => (ingeklapt ? 'max-content' : '1fr'));
                const allesDicht = Object.values(periodeStatussen).every(identity);
                const leerlingenSize = deviceState.breakpoints[tabletQuery] ? '200px' : '240px';
                this.templateColumns = `${leerlingenSize} ${periodes.join(' ')} ${allesDicht ? 'minmax(0, 1fr)' : '0'}`;
                this.changedetector.markForCheck();
            });

        combineLatest([this.selectedTab$, this.deviceService.onDeviceChange$])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([tab, state]) => {
                const isPhoneOrTabletPortrait = state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery];
                this.toonLeerlingen = isPhoneOrTabletPortrait ? tab === 'leerlingen' : true;
                this.toonToetsen = isPhoneOrTabletPortrait ? tab === 'toetsen' : true;
                this.isPhoneOrTabletPortrait = isPhoneOrTabletPortrait;
            });

        this.highlight$ = this.resultaatService.highlightIndex$;
        this.pinned$ = this.resultaatService.pinnedIndex$;
        this.activeLeerling$ = this.resultaatService.activeLeerlingUUID$;
        this.toetskolomSidebar$ = this.sidebarService.watchFor(ToetskolomSidebarComponent);
        this.leerlingResultatenSidebar$ = this.sidebarService.watchFor(LeerlingResultatenSidebarComponent);
    }

    onNiveauClick(niveau: VoortgangsdossierNiveau) {
        // Wanneer we switchen van niveau willen we de ingevoerde resultaten opslaan
        // We doen een setTimeout zodat de huidige cell met focus wordt meegenomen
        // foutieve invoer/errors wordt genegeerd/weggehaald
        setTimeout(() => {
            if (this.resultaatService.isAllSaved) {
                this.navigateToNiveau(niveau);
            } else {
                this.resultaatService.saveResultsFromId$('niveau-switch').subscribe(() => {
                    this.resultaatService.clearErrorsAndRetrys();
                    this.navigateToNiveau(niveau);
                });
                this.resultaatService.saveOnce('niveau-switch');
            }
        });
    }

    navigateToNiveau(niveau: VoortgangsdossierNiveau) {
        this.router.navigate([], {
            queryParams: {
                voortgangsdossier: niveau.voortgangsdossier.id,
                alternatiefNiveau: niveau.isStandaardNiveau ? null : true
            },
            queryParamsHandling: 'merge'
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    canDeactivate(): boolean {
        return this.resultaatService.isAllSaved;
    }

    onMoreOptions(lesgroep: LesgroepenQuery['lesgroepen'][number]) {
        const popup = this.popupService.popup(
            this.moreOptions,
            LesgroepDeeplinkPopupComponent.defaultPopupsettings,
            LesgroepDeeplinkPopupComponent
        );

        popup.lesgroepen = [lesgroep] as Lesgroep[];
        popup.metStudiewijzerLink = true;
        popup.metVoortgangsdossierLink = false;
    }

    sorteerClick(sortering: Sortering) {
        const popup = this.popupService.popup(this.sorteerheader, ActionsPopupComponent.sorteerPopupsettings, ActionsPopupComponent);
        const onSortOptionClick: SorteerButtonClickFn = (veld, order) =>
            this.medewerkerDataService.saveSortering('resultaten', veld, order);

        popup.customButtons = sorteerButtons(
            sortering.veld,
            sortering.order,
            [SorteringVeld.VOORNAAM, SorteringVeld.ACHTERNAAM],
            onSortOptionClick
        );
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    togglePeriodeStatus(periodenummer: number, collapsed: boolean) {
        this.resultaatService.periodeCollapsedStatus$.next({
            ...this.resultaatService.periodeCollapsedStatus$.value,
            [periodenummer]: collapsed
        });
    }

    toggleKolom(kolom: KolomZichtbaarheidKey, periode: number, zichtbaarheid: KolomZichtbaarheid[]) {
        const periodeZichtbaarheid = zichtbaarheid[periode - 1];
        const toggledZichtbaarheid = { ...periodeZichtbaarheid, [kolom]: !periodeZichtbaarheid[kolom] };

        this.resultaatDataService.setKolomZichtbaarheid(
            this.route.snapshot.paramMap.get('id')!,
            replaceInArray(periode - 1, toggledZichtbaarheid, zichtbaarheid)
        );
    }

    onToetskolomSaved(toetsKolom: Toetskolom) {
        this.succesMessage = `Toetskolom ${toetsKolom.id ? 'bewerkt' : 'toegevoegd'}`;
        this.showSuccesMessage = true;
    }

    deleteToetsKolom(toetskolom: Toetskolom, lesgroepId: string) {
        this.resultaatDataService.deleteToetsKolom(toetskolom, lesgroepId);
        this.succesMessage = 'Toetskolom verwijderd';
        this.showSuccesMessage = true;
    }

    isDeactivationAllowed() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = resultatenOpslaanGuardProperties.title;
        popup.message = resultatenOpslaanGuardProperties.message;
        popup.cancelLabel = resultatenOpslaanGuardProperties.cancelLabel;
        popup.actionLabel = resultatenOpslaanGuardProperties.actionLabel;
        popup.outlineConfirmKnop = resultatenOpslaanGuardProperties.outlineConfirmKnop;
        popup.buttonColor = resultatenOpslaanGuardProperties.buttonColor;

        popup.onConfirmFn = () => {
            this.resultaatService.saveAllResultaten();
            return true;
        };

        return popup.getResult();
    }

    openLeerlingResultaten(leerling: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'][number]) {
        this.sidebarService.openSidebar(LeerlingResultatenSidebarComponent, { leerling });
    }

    oudResultaatInDateRange(date: Optional<Date>): boolean {
        return date ? isWithinInterval(date, { start: subWeeks(new Date(), 1), end: new Date() }) : false;
    }

    openResultatenQuickNavPopup() {
        if (!this.popupService.isPopupOpenFor(this.lesgroepRef)) {
            const settings = ResultaatMenuPopupComponent.defaultPopupSettings;
            settings.offsets = defaultPopupOffsets;
            settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Right];
            this.popupService.popup(this.lesgroepRef, settings, ResultaatMenuPopupComponent);
        }
    }
    mapVoortgangsdossierNiveaus(
        dossiers: VoortgangsdossiersQuery['voortgangsdossiers'],
        selectedVoortgangsdossierId: string,
        selectedAlternatiefNiveau: boolean
    ): VoortgangsdossierNiveau[] {
        return dossiers.flatMap((dossier) => {
            const niveaus: VoortgangsdossierNiveau[] = [
                {
                    voortgangsdossier: dossier,
                    isStandaardNiveau: true,
                    omschrijving: dossier.meervoudigeToetsnorm
                        ? `${dossier.toetsdossier.naam} - ${dossier.toetsNormering1 ?? 'Standaard'}`
                        : dossier.toetsdossier.naam,
                    active: selectedVoortgangsdossierId === dossier.id && !selectedAlternatiefNiveau
                }
            ];
            if (dossier.meervoudigeToetsnorm) {
                niveaus.push({
                    voortgangsdossier: dossier,
                    isStandaardNiveau: false,
                    omschrijving: `${dossier.toetsdossier.naam} - ${dossier.toetsNormering2 ?? 'Alternatief'}`,
                    active: selectedVoortgangsdossierId === dossier.id && selectedAlternatiefNiveau
                });
            }
            return niveaus;
        });
    }

    onderwijssoortOpties: () => DropdownItem<string>[] = computed(() => {
        return this.viewModel()?.onderwijssoorten.map((onderwijssoort) => ({ label: onderwijssoort, data: onderwijssoort })) || [];
    });

    selectedOnderwijssoort = computed(() => {
        const onderwijssoortVanDossier = this.viewModel()?.matrix.voortgangsdossier.onderwijssoortLeerjaar;
        return this.onderwijssoortOpties().find((option) => option.data === onderwijssoortVanDossier);
    });

    selectOnderwijssoort(onderwijssoort: string, niveaus: VoortgangsdossierNiveau[]) {
        const eersteDossierMetNiveau = niveaus.find((niveau) => niveau.voortgangsdossier.onderwijssoortLeerjaar === onderwijssoort)!;
        this.onNiveauClick(eersteDossierMetNiveau);
    }

    onderwijssoortVoortgangsdossierNiveauOpties: () => DropdownItem<VoortgangsdossierNiveau>[] = computed(() => {
        const onderwijssoortVanDossier = this.viewModel()?.matrix.voortgangsdossier.onderwijssoortLeerjaar;
        return (
            this.viewModel()
                ?.niveaus.filter((niveau) => niveau.voortgangsdossier.onderwijssoortLeerjaar === onderwijssoortVanDossier)
                .map((niveau) => ({ label: niveau.omschrijving, data: niveau })) || []
        );
    });

    selectedVoortgangsdossierNiveau = computed(() => {
        const voortgangsdossierId = this.viewModel()?.matrix.voortgangsdossier.id;
        const alternatiefNiveau = this.viewModel()?.alternatiefNiveau;
        return this.onderwijssoortVoortgangsdossierNiveauOpties().find(
            (option) => option.data.voortgangsdossier.id === voortgangsdossierId && option.data.isStandaardNiveau === !alternatiefNiveau
        );
    });
}
