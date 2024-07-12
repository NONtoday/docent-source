import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { slideInRightOnEnterAnimation, slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { IconDirective } from 'harmony';
import {
    IconAZ,
    IconBewerken,
    IconKlok,
    IconLetOp,
    IconPersoon,
    IconPijlLinks,
    IconReactieToevoegen,
    IconReacties,
    IconResultaten,
    IconToevoegen,
    IconWaarschuwing,
    IconZA,
    provideIcons
} from 'harmony-icons';
import { isEmpty, memoize } from 'lodash-es';
import { NgStringPipesModule } from 'ngx-pipes';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import {
    Advieskolom,
    BevrorenStatus,
    CijferPeriode,
    Deeltoetskolom,
    Herkansing,
    KolomActie,
    LeerlingMissendeToets,
    LesgroepenQuery,
    MatrixResultaatkolomFieldsFragment,
    Maybe,
    PartialLeerlingFragment,
    RapportCijferkolom,
    Resultaat,
    ResultaatInputParam,
    ResultaatLabel,
    ResultaatLabelLijst,
    Resultaatkolom,
    ResultaatkolomType,
    SamengesteldeToetskolom,
    Sortering,
    SorteringVeld,
    ToetsSoort,
    Toetskolom
} from '../../../generated/_types';
import { SorteerOrder } from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { toetskolommenConfig } from '../../core/models/resultaten/resultaten.model';
import { SidebarPage } from '../../core/models/studiewijzers/studiewijzer.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService, desktopQuery, tabletQuery } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ToastService } from '../../core/toast/toast.service';
import {
    ActionsPopupComponent,
    SorteerButtonClickFn,
    sorteerButtons
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { Optional, equalsId, isPresent, isStringNullOrEmpty, sortLocale } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
    toetsKolomDirtyPopupProperties,
    toetsKolomMetCijfersVerwijderenPopupProperties
} from '../../shared/components/confirmation-dialog/confirmation-dialog.properties';
import { LeerlingComponent } from '../../shared/components/leerling/leerling.component';
import { CijferhistoriePopupComponent } from '../cijferhistorie-popup/cijferhistorie-popup.component';
import { GeslotenStatusComponent } from '../gesloten-status/gesloten-status.component';
import { OpmerkingPopupComponent } from '../opmerking-popup/opmerking-popup.component';
import { ResultaatKeyPipe, getResultaatKey } from '../pipes/resultaat-key.pipe';
import { ResultaatCellComponent, getInputDisabledBijResultaatLabels$ } from '../resultaat-cell/resultaat-cell.component';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatBerekeningResultMetIcon, ResultaatService, SelecteerCellNaOpslaan } from '../resultaat.service';
import { ResultatenSaveIndicatorComponent } from '../resultaten-save-indicator/resultaten-save-indicator.component';
import {
    LeerlingResultaat,
    getGemiddeldekolomTooltip,
    getLeerlingResultaat,
    getOpmerkingTooltip,
    isKolomOfType,
    isOverschrevenRapportCijfer,
    isToetskolom,
    magOpmerkingToevoegen,
    parseCellId,
    resultatenOpslaanGuardProperties
} from '../resultaten.utils';
import { ToetskolomDetailComponent } from '../toetskolom-detail/toetskolom-detail.component';
import { ToetskolomFormulierComponent } from '../toetskolom-formulier/toetskolom-formulier.component';
import { ToetskolomLesgroepOmschrijvingFormulierComponent } from '../toetskolom-lesgroepomschrijving-formulier/toetskolom-lesgroepomschrijving-formulier.component';

@Component({
    selector: 'dt-toetskolom-sidebar',
    templateUrl: './toetskolom-sidebar.component.html',
    styleUrls: ['./toetskolom-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        slideInUpOnEnterAnimation({ duration: 200 }),
        slideOutDownOnLeaveAnimation({ duration: 100 }),
        slideInRightOnEnterAnimation({ duration: 200 })
    ],
    standalone: true,
    imports: [
        SidebarComponent,
        ToetskolomFormulierComponent,
        ToetskolomLesgroepOmschrijvingFormulierComponent,
        ToetskolomDetailComponent,
        GeslotenStatusComponent,
        ResultatenSaveIndicatorComponent,
        LeerlingComponent,
        TooltipDirective,
        ResultaatCellComponent,
        AsyncPipe,
        NgStringPipesModule,
        ResultaatKeyPipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconAZ,
            IconZA,
            IconLetOp,
            IconPersoon,
            IconReacties,
            IconKlok,
            IconReactieToevoegen,
            IconWaarschuwing,
            IconResultaten,
            IconBewerken,
            IconToevoegen,
            IconPijlLinks
        )
    ]
})
export class ToetskolomSidebarComponent extends BaseSidebar implements OnInit, OnChanges, OnDestroy {
    public sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private resultaatDataService = inject(ResultaatDataService);
    private changeDetector = inject(ChangeDetectorRef);
    public resultaatService = inject(ResultaatService);
    private toastService = inject(ToastService);
    @ViewChildren('cel', { read: ElementRef }) cellen: QueryList<ElementRef>;
    @ViewChild(ToetskolomFormulierComponent) formulier: ToetskolomFormulierComponent;
    @ViewChild(ToetskolomLesgroepOmschrijvingFormulierComponent)
    lesgroepOmschrijvingFormulier: ToetskolomLesgroepOmschrijvingFormulierComponent;
    @ViewChild(ToetskolomDetailComponent) detail: ToetskolomDetailComponent;
    @ViewChild('sorteerheader', { read: ViewContainerRef }) sorteerheader: ViewContainerRef;

    @HostBinding('class.zonder-tabs') hideTabs = false;

    @Input() kolomId: Maybe<string>;
    @Input() herkansingsNummer: Optional<number>;
    @Input() leerlingMissendeToetsen: LeerlingMissendeToets[] = [];
    @Input() kolomType: ResultaatkolomType;
    @Input() alternatiefNiveau = false;
    @Input() leerlingen: PartialLeerlingFragment[];
    @Input() periode: CijferPeriode;
    @Input() lesgroep: LesgroepenQuery['lesgroepen'][number];
    @Input() cijferPeriodes: CijferPeriode[];
    @Input() voortgangsdossierId: string;
    @Input() sortering: Sortering;

    saveToetsKolom = output<Toetskolom>();
    deleteToetsKolom = output<any>();

    public selectedTab$ = new BehaviorSubject<'resultaten' | 'toetsinformatie'>('resultaten');
    public bewerkenState$ = new BehaviorSubject<'editStructuur' | 'editLesgroepOmschrijving' | 'view'>('view');
    public resultaatLabelLijsten$: Observable<ResultaatLabelLijst[]>;
    public toetsSoorten$: Observable<ToetsSoort[]>;
    public toonDomeinvelden$: Observable<boolean>;
    public sortedResultaten: LeerlingResultaat[];
    public hideGemiddelde? = false;
    public resultatenOpgeslagenOp$: Observable<Maybe<string>>;
    public activeCell$: Observable<Maybe<ElementRef>>;
    public matrixKolom: Optional<MatrixResultaatkolomFieldsFragment>;
    public klasgemiddelde: string;
    public isGeimporteerdeToets = false;

    public toetskolomGesloten: boolean;
    public readOnlyCellen = false;
    public magResultatenInvoeren: boolean;
    public magOpmerkingToevoegen: boolean;
    public magStructuurBewerken: boolean;
    public magBeoordelingWijzigen: boolean;
    public vastgezet: boolean;
    public overschrevenRapportcijfer: boolean;
    public opmerkingTooltip = memoize(getOpmerkingTooltip);

    private samengesteldeToetskolom: Maybe<SamengesteldeToetskolom>;
    private kolomBekijkenPage: SidebarPage = {
        titel: 'Toetskolom bekijken',
        icon: null,
        iconClickable: false,
        onIconClick: () => this.onAnnuleren(true)
    };

    private terugNaarSGT = false;

    public heeftGroteResultaatLabels: boolean;
    public inputDisabledBijResultaatLabels$: Observable<boolean>;

    private onDestroy$ = new Subject<void>();

    public gemiddeldeTooltip = memoize(getGemiddeldekolomTooltip, (...args) => JSON.stringify(args));

    ngOnInit(): void {
        this.activeCell$ = this.resultaatService.activeCell$.asObservable();
        this.resultatenOpgeslagenOp$ = this.resultaatService.laatstOpgeslagenOp$;
        if (!isPresent(this.matrixKolom)) {
            this.toggleEditState('editStructuur');
        } else {
            this.sidebarService.changePage({
                ...this.kolomBekijkenPage,
                titel: this.matrixKolom.resultaatkolom
                    ? `${this.matrixKolom.resultaatkolom.code} • ${this.matrixKolom.resultaatkolom.omschrijving}`
                    : this.kolomBekijkenPage.titel
            });
        }

        if (isKolomOfType<Deeltoetskolom>(this.matrixKolom?.resultaatkolom, ResultaatkolomType.DEELTOETS)) {
            this.samengesteldeToetskolom = this.matrixKolom.resultaatkolom.samengesteldeToetskolom;
        }

        this.toonDomeinvelden$ = this.medewerkerDataService
            .getMedewerker()
            .pipe(
                map((medewerker) =>
                    Boolean(
                        medewerker.settings.vestigingRechten.find((rechten) => rechten.vestigingId === this.lesgroep?.vestigingId)
                            ?.toonDomeinvelden
                    )
                )
            );

        this.toetsSoorten$ = this.resultaatDataService.getToetsSoortenVanVestiging(this.lesgroep.vestigingId).pipe(shareReplayLastValue());

        this.resultaatLabelLijsten$ = this.resultaatDataService
            .getResultaatLabelLijstenVanVestiging(this.lesgroep.vestigingId)
            .pipe(shareReplayLastValue());

        this.deviceService.onDeviceChange$
            .pipe(
                map((deviceState) => deviceState.breakpoints[desktopQuery] || deviceState.breakpoints[tabletQuery]),
                takeUntil(this.onDestroy$)
            )
            .subscribe((isTabletOrDesktop) => {
                if (this.hideTabs && isTabletOrDesktop && this.bewerkenState$.value === 'view') {
                    this.closeSidebar();
                    return;
                }
                if (isTabletOrDesktop) {
                    this.selectedTab$.next('toetsinformatie');
                }
            });

        this.bewerkenState$.pipe(takeUntil(this.onDestroy$)).subscribe((bewerkenState) => {
            const kolomConfig = this.matrixKolom?.resultaatkolom ? toetskolommenConfig[this.matrixKolom?.resultaatkolom?.type] : null;
            this.hideGemiddelde = kolomConfig?.hideGemiddelde;
            this.hideTabs = kolomConfig?.hideResultatenTab || kolomConfig?.hideToetsinformatieTab || this.bewerkenState$.value !== 'view';

            if (bewerkenState !== 'view') {
                const bewerkenOfToevoegen = this.matrixKolom?.resultaatkolom ? 'bewerken' : 'toevoegen';
                let type = 'Toetskolom';
                switch (this.kolomType) {
                    case ResultaatkolomType.SAMENGESTELDE_TOETS:
                        type = 'Samengestelde toets';
                        break;
                    case ResultaatkolomType.DEELTOETS:
                        type = 'Deeltoets';
                        break;
                    default:
                        break;
                }
                this.sidebarService.changePage({
                    ...this.kolomBekijkenPage,
                    titel: `${type} ${bewerkenOfToevoegen}`,
                    icon: 'bewerken'
                });
                this.hideTabs = true;
            }
        });
    }

    ngOnChanges() {
        this.matrixKolom = this.kolomId
            ? this.resultaatDataService.getResultaatkolom(this.lesgroep.id, this.voortgangsdossierId, this.kolomId, this.herkansingsNummer)
            : null;
        if (this.matrixKolom) {
            const kolomConfig = toetskolommenConfig[this.matrixKolom.resultaatkolom.type];
            this.readOnlyCellen = Boolean(kolomConfig.readOnlyCellen);
            this.klasgemiddelde =
                (this.alternatiefNiveau ? this.matrixKolom.klasgemiddeldeAlternatiefNiveau : this.matrixKolom.klasgemiddelde) ?? '-';
            this.isGeimporteerdeToets = !!this.matrixKolom.resultaatAnderVakKolom;
        }
        const sortedLeerlingen = sortLocale(
            this.leerlingen,
            [this.sortering.veld as any],
            [this.sortering.order.toLowerCase() as SorteerOrder]
        );

        this.vastgezet = (<RapportCijferkolom>this.matrixKolom?.resultaatkolom)?.vastgezet;
        this.toetskolomGesloten =
            this.vastgezet || this.matrixKolom?.resultaatkolom?.bevrorenStatus !== BevrorenStatus.Ontdooid || this.isGeimporteerdeToets;
        this.sortedResultaten =
            sortedLeerlingen.map((leerling) => getLeerlingResultaat(leerling, this.matrixKolom, this.leerlingMissendeToetsen)) ?? [];
        this.inputDisabledBijResultaatLabels$ = getInputDisabledBijResultaatLabels$(this.deviceService, this.matrixKolom?.resultaatkolom);
        this.heeftGroteResultaatLabels = this.heeftResultaatkolomGroteLabels(this.matrixKolom?.resultaatkolom);
        this.magStructuurBewerken = Boolean(this.matrixKolom?.toegestaneKolomActies.includes(KolomActie.StructuurWijzigen));
        this.magResultatenInvoeren = Boolean(this.matrixKolom?.toegestaneKolomActies.includes(KolomActie.ResultatenInvoeren));
        this.magOpmerkingToevoegen = magOpmerkingToevoegen(this.matrixKolom);
        // Mag beoordeling alleen wijzigen als er geen actieve resultaten zijn.
        this.magBeoordelingWijzigen = !this.matrixKolom?.resultaten.some(
            (resultaat) =>
                !isStringNullOrEmpty(resultaat.formattedResultaat) || !isStringNullOrEmpty(resultaat.formattedResultaatAfwijkendNiveau)
        );
    }

    heeftResultaatkolomGroteLabels(kolom: Optional<Resultaatkolom>): boolean {
        if (!kolom) {
            return false;
        }
        let labels: ResultaatLabel[] = [];
        if (isToetskolom(kolom)) {
            labels = kolom.resultaatLabelLijst?.resultaatLabels ?? [];
        } else if (isKolomOfType<Advieskolom>(kolom, ResultaatkolomType.ADVIES)) {
            labels = kolom.adviesWeergave.resultaatLabels ?? [];
        }
        return labels.some((label) => label.afkorting.length > 3);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    closeSidebar() {
        if (!this.resultaatService.isAllSaved) {
            this.showSaveResultatenGuard(true);
        } else {
            this.sidebarService.closeSidebar();
        }
    }

    switchDetail(
        matrix: MatrixResultaatkolomFieldsFragment,
        editmode: 'editStructuur' | 'editLesgroepOmschrijving' | 'view',
        terugNaarSGT: boolean
    ) {
        const toetskolom = matrix.resultaatkolom;
        if (isToetskolom(toetskolom)) {
            const kolom = matrix.resultaatkolom;
            if (isKolomOfType<Deeltoetskolom>(kolom, ResultaatkolomType.DEELTOETS)) {
                this.samengesteldeToetskolom = kolom.samengesteldeToetskolom;
            } else {
                this.samengesteldeToetskolom = null;
            }

            this.kolomType = kolom.type;
            this.matrixKolom = matrix;
            this.changeDetector.detectChanges();
            this.sidebarService.changePage({
                ...this.kolomBekijkenPage,
                titel: this.matrixKolom.resultaatkolom
                    ? `${this.matrixKolom.resultaatkolom.code} • ${this.matrixKolom.resultaatkolom.omschrijving}`
                    : this.kolomBekijkenPage.titel
            });
            if (editmode) {
                this.terugNaarSGT = terugNaarSGT;
                this.toggleEditState(editmode);
            }
        }
    }

    toggleEditState(editState: 'editStructuur' | 'editLesgroepOmschrijving' | 'view') {
        this.bewerkenState$.next(editState);
        this.selectedTab$.next('toetsinformatie');
    }

    exitEditState() {
        this.bewerkenState$.next('view');
        this.sidebarService.previousPage();
    }

    private switchToViewPage(herkansingVerwijderd = false) {
        this.bewerkenState$.next('view');

        let matrixKolom = this.matrixKolom;

        if (herkansingVerwijderd && matrixKolom) {
            matrixKolom = { ...matrixKolom, herkansingsNummer: null };
        }

        this.sidebarService.changePage({
            ...this.kolomBekijkenPage,
            titel: matrixKolom
                ? `${matrixKolom.resultaatkolom.code} • ${matrixKolom.resultaatkolom.omschrijving}`
                : this.kolomBekijkenPage.titel
        });
    }

    onSaveToetsKolom(toetskolom: Toetskolom, herberekeningVereist: boolean) {
        const herkansingVerwijderd = Boolean(
            this.matrixKolom?.herkansingsNummer &&
                this.matrixKolom?.herkansingsNummer > 0 &&
                (<Toetskolom>this.matrixKolom.resultaatkolom).herkansing !== Herkansing.Geen
        );
        if (isKolomOfType<Deeltoetskolom>(toetskolom, ResultaatkolomType.DEELTOETS)) {
            toetskolom.samengesteldeToetskolom = this.samengesteldeToetskolom!;
            this.terugNaarSGT = true;
        }
        this.resultaatDataService
            .saveToetsKolom(toetskolom, this.lesgroep.id, this.voortgangsdossierId, toetskolom.type)
            .subscribe((result) => {
                if (herberekeningVereist) {
                    this.toastService.info(
                        'De gemaakte wijziging vereist een herberekening, deze vindt momenteel op de achtergrond plaats. Je hoeft hier niet op te wachten.',
                        { timeOut: 7500, toastClass: 'toast toast-wide' }
                    );
                } else {
                    this.saveToetsKolom.emit(toetskolom);
                }
                if (isKolomOfType<SamengesteldeToetskolom>(toetskolom, ResultaatkolomType.SAMENGESTELDE_TOETS) || herkansingVerwijderd) {
                    // setTimeout zodat de UI update, zonder blijft er een lege sidebar staan
                    setTimeout(() => {
                        this.matrixKolom = this.resultaatDataService.getResultaatkolom(
                            this.lesgroep.id,
                            this.voortgangsdossierId,
                            result.data!.saveToetsKolom,
                            toetskolom.herkansingsNummer
                        );
                        this.kolomId = this.matrixKolom!.resultaatkolom.id;
                        this.switchToViewPage(herkansingVerwijderd);
                    });
                } else {
                    this.closeOrExit();
                }
            });
    }

    onSaveLesgroepOmschrijving(matrixKolom: MatrixResultaatkolomFieldsFragment) {
        if (isKolomOfType<Deeltoetskolom>(matrixKolom.resultaatkolom, ResultaatkolomType.DEELTOETS)) {
            this.terugNaarSGT = true;
        }

        const toetskolom = matrixKolom.resultaatkolom as Toetskolom;
        const voortgangsdossierId = this.resultaatService.voortgangsdossierId;
        this.resultaatDataService
            .saveLesgroepOmschrijving(voortgangsdossierId, this.lesgroep.id, toetskolom, matrixKolom.lesgroepSpecifiekeOmschrijving)
            .subscribe(() => {
                this.saveToetsKolom.emit(toetskolom);
                this.matrixKolom = this.resultaatDataService.getResultaatkolom(
                    this.lesgroep.id,
                    voortgangsdossierId,
                    matrixKolom.id,
                    matrixKolom.herkansingsNummer
                );
                this.kolomId = this.matrixKolom!.resultaatkolom.id;

                if (isKolomOfType<SamengesteldeToetskolom>(toetskolom, ResultaatkolomType.SAMENGESTELDE_TOETS)) {
                    setTimeout(() => this.switchToViewPage());
                } else {
                    this.closeOrExit();
                }
            });
    }

    verwijderKolom() {
        if (!this.matrixKolom) {
            this.closeSidebar();
        } else if (this.matrixKolom.resultaten.length > 0) {
            const popup = this.popupService.popup(
                this.viewContainerRef,
                ConfirmationDialogComponent.defaultPopupSettings,
                ConfirmationDialogComponent
            );
            Object.assign(popup, toetsKolomMetCijfersVerwijderenPopupProperties);

            popup.onConfirmFn = () => {
                this.deleteToetsKolom.emit(this.matrixKolom!.resultaatkolom);
                this.closeSidebar();
                return true;
            };
        } else {
            this.deleteToetsKolom.emit(this.matrixKolom.resultaatkolom);
            this.closeSidebar();
        }
    }

    verwijderDeeltoets(deeltoets: Deeltoetskolom) {
        this.deleteToetsKolom.emit(deeltoets);
    }

    onAnnuleren(closeSidebar = false) {
        if (this.formulier?.toetskolomForm.dirty || this.lesgroepOmschrijvingFormulier?.formControl.dirty) {
            const popup = this.popupService.popup(
                this.viewContainerRef,
                ConfirmationDialogComponent.defaultPopupSettings,
                ConfirmationDialogComponent
            );
            Object.assign(popup, toetsKolomDirtyPopupProperties);

            popup.onConfirmFn = () => {
                closeSidebar ? this.closeSidebar() : this.closeOrExit();
                return true;
            };
        } else {
            closeSidebar ? this.closeSidebar() : this.closeOrExit();
        }
    }

    onNieuwResultaat(
        resultaatInput: string,
        isCijfer: boolean,
        selecteerCellNaOpslaan: SelecteerCellNaOpslaan,
        leerlingUUID: string,
        oudeResultaat: Optional<string>
    ) {
        const resultaat: ResultaatInputParam = {
            resultaatInput,
            isCijfer,
            resultaatKey: {
                leerlingUUID,
                resultaatkolomId: this.matrixKolom!.resultaatkolom.id,
                herkansingsNummer: this.matrixKolom!.herkansingsNummer
            },
            isAlternatiefNiveau: this.alternatiefNiveau
        };

        this.resultaatService.registreerResultaat(resultaat, selecteerCellNaOpslaan, this.cellen, oudeResultaat ?? '');
    }

    private closeOrExit = () => {
        if (this.terugNaarSGT) {
            this.terugNaarSGT = false;
            const matrixKolom = this.resultaatDataService.getResultaatkolom(
                this.lesgroep.id,
                this.voortgangsdossierId,
                this.kolomId!,
                this.herkansingsNummer
            );
            const samengesteldeToetskolomId = isKolomOfType<Deeltoetskolom>(matrixKolom!.resultaatkolom, ResultaatkolomType.DEELTOETS)
                ? matrixKolom?.resultaatkolom.samengesteldeToetskolom.id
                : this.samengesteldeToetskolom?.id;
            if (samengesteldeToetskolomId) {
                const samengesteldeToets = this.resultaatDataService.getResultaatkolom(
                    this.lesgroep.id,
                    this.voortgangsdossierId,
                    samengesteldeToetskolomId
                )!;
                this.exitEditState();
                this.switchDetail(samengesteldeToets, 'view', false);
                return;
            }
        }

        if (this.matrixKolom) {
            this.exitEditState();
        } else {
            this.closeSidebar();
        }
    };

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

    voegDeeltoetsToe() {
        if (isKolomOfType<SamengesteldeToetskolom>(this.matrixKolom?.resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS)) {
            this.bewerkenState$.next('editStructuur');
            this.selectedTab$.next('toetsinformatie');
            this.samengesteldeToetskolom = this.matrixKolom.resultaatkolom;
            this.matrixKolom = null;
            this.kolomType = ResultaatkolomType.DEELTOETS;
            this.terugNaarSGT = true;
            this.sidebarService.changePage({
                titel: 'Deeltoets toevoegen',
                icon: 'pijlLinks',
                iconClickable: true,
                onIconClick: () => this.closeOrExit()
            });
        }
    }

    createOrEditOpmerking(activeCell: ElementRef) {
        const schooljaar = getYear(getSchooljaar(new Date()).start);

        this.medewerkerDataService
            .getLesgroepenVanSchooljaar(schooljaar)
            .pipe(
                map((lesgroepen) => lesgroepen.find(equalsId(this.lesgroep.id))),
                switchMap((lesgroep) => this.medewerkerDataService.resultaatOpmerkingTonenInELOToegestaan(lesgroep?.vestigingId))
            )
            .subscribe((opmerkingToegestaan) => {
                const cellId = activeCell.nativeElement.id;
                const parsedCellId = parseCellId(cellId);
                const lResultaat = this.sortedResultaten.find((lResultaat) => lResultaat?.resultaat?.cellId === cellId);
                const resultaat: Resultaat = lResultaat?.resultaat ?? {
                    cellId,
                    leerlingUUID: parsedCellId.leerlingUUID,
                    rapportCijferEnOverschreven: false,
                    rapportCijferEnOverschrevenAfwijkendNiveau: false,
                    toonOpmerkingInELO: false,
                    opmerkingen: null
                };
                const settings = OpmerkingPopupComponent.defaultPopupsettings;
                settings.onCloseFunction = () => this.resultaatService.activeCell$.next(null);
                const popup = this.popupService.popup(this.viewContainerRef, settings, OpmerkingPopupComponent);
                popup.isZichtbaar = resultaat.toonOpmerkingInELO;
                popup.opmerkingen = resultaat.opmerkingen;
                popup.opmerkingInELOTonenToegestaan = opmerkingToegestaan;
                popup.onBewerken = (opmerkingen: string, isZichtbaar: boolean) => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroep.id,
                        cellId,
                        opmerkingen,
                        isZichtbaar
                    );
                    this.popupService.closePopUp();
                };
                popup.onVerwijderen = () => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroep.id,
                        cellId,
                        null,
                        false
                    );
                    popup.popup.onClose();
                };
            });
    }

    openCijferhistorie(cellId: string) {
        const popupSettings = CijferhistoriePopupComponent.defaultPopupsettings;

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, CijferhistoriePopupComponent);
        popup.cellId = cellId;
        popup.alternatiefNiveau = this.alternatiefNiveau;
    }

    onNietGemaakt(leerlingUuid: string, oudeResultaat: string) {
        this.onNieuwResultaat('*', true, 'geen', leerlingUuid, oudeResultaat);
    }

    getErrorVanCell = (cellen: ResultaatBerekeningResultMetIcon[], huidigeCellId: string): ResultaatBerekeningResultMetIcon | undefined =>
        cellen.find(
            (cell) =>
                getResultaatKey(cell.resultaatKey.resultaatkolomId, cell.resultaatKey.leerlingUUID, cell.resultaatKey.herkansingsNummer) ===
                huidigeCellId
        );

    isActiveCell = (activeCell: Optional<ElementRef>, id: string): boolean => activeCell?.nativeElement.id === id;

    heeftBestaandeOpmerking(leerlingResultaat: LeerlingResultaat) {
        return !isEmpty(leerlingResultaat.resultaat?.opmerkingen);
    }

    isOverschrevenRapportCijfer(leerlingResultaat: LeerlingResultaat) {
        if (!this.matrixKolom) {
            return false;
        }

        return isOverschrevenRapportCijfer(this.matrixKolom.resultaatkolom, leerlingResultaat.resultaat, this.alternatiefNiveau);
    }

    private showSaveResultatenGuard(closeSidebar = false) {
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
            if (closeSidebar) {
                this.sidebarService.closeSidebar();
            }

            return true;
        };
    }

    trackByLeerlingId(index: number, item: LeerlingResultaat) {
        return item?.leerling.id;
    }
}
