import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    Signal,
    ViewChildren,
    ViewContainerRef,
    computed,
    inject,
    runInInjectionContext
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { slideInRightOnEnterAnimation, slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { DropdownComponent, DropdownItem, IconDirective } from 'harmony';
import { IconPijlAfslaanRechts, IconSluiten, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import {
    LeerlingVoortgangsdossiersQuery,
    Maybe,
    ResultaatInputParam,
    Voortgangsdossier,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../../generated/_types';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ResultaatKeyPipe } from '../pipes/resultaat-key.pipe';
import { ResultaatCellComponent } from '../resultaat-cell/resultaat-cell.component';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatService, SelecteerCellNaOpslaan } from '../resultaat.service';
import { ResultatenSaveIndicatorComponent } from '../resultaten-save-indicator/resultaten-save-indicator.component';
import { VoortgangsdossierNiveau } from '../resultaten.component';
import { KolomResultaat, getKolomResultaat, resultatenOpslaanGuardProperties } from '../resultaten.utils';
import { ToetskolomIconsComponent } from '../toetskolom-icons/toetskolom-icons.component';

export interface PeriodeKolomResultaten {
    matrixPeriode: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number];
    resultaten: KolomResultaat[];
    adviesResultaten: KolomResultaat[];
    periodeGemiddelde: Maybe<KolomResultaat>;
    rapportGemiddelde: Maybe<KolomResultaat>;
    rapportCijfer: Maybe<KolomResultaat>;
}

type MatrixResultaatKolom =
    VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number]['resultaatkolommen'][number];

@Component({
    selector: 'dt-leerling-resultaten-sidebar',
    templateUrl: './leerling-resultaten-sidebar.component.html',
    styleUrls: ['./leerling-resultaten-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        slideInUpOnEnterAnimation({ duration: 200 }),
        slideOutDownOnLeaveAnimation({ duration: 100 }),
        slideInRightOnEnterAnimation({ duration: 200 })
    ],
    standalone: true,
    imports: [
        SidebarComponent,
        AvatarComponent,
        ResultatenSaveIndicatorComponent,
        ToetskolomIconsComponent,
        ResultaatCellComponent,
        AsyncPipe,
        VolledigeNaamPipe,
        ResultaatKeyPipe,
        IconDirective,
        DropdownComponent
    ],
    providers: [provideIcons(IconSluiten, IconPijlAfslaanRechts)]
})
export class LeerlingResultatenSidebarComponent extends BaseSidebar implements OnInit, OnDestroy {
    public sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    private resultaatDataService = inject(ResultaatDataService);
    public resultaatService = inject(ResultaatService);
    @ViewChildren('cel', { read: ElementRef }) cellen: QueryList<ElementRef>;

    @Input() initialVoortgangsdossierMatrix: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep'];
    @Input() leerling: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'][number];
    @Input() lesgroepId: string;
    @Input() alternatiefNiveau = false;

    public activeDossierId$ = new BehaviorSubject<string>('');
    public voortgangsdossierMatrix$ = new BehaviorSubject<
        VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep'] | null
    >(null);
    public leerlingVoortgangsdossierMatrix$: Observable<LeerlingVoortgangsdossiersQuery['leerlingVoortgangsdossiers']>;
    public leerlingPeriodeResultaten$: Observable<PeriodeKolomResultaten[]>;
    public niveauOptions: Signal<VoortgangsdossierNiveau[] | undefined>;

    public resultatenOpgeslagenOp$: Observable<Maybe<string>>;
    public activeCell$: BehaviorSubject<Maybe<ElementRef>>;

    private onDestroy$ = new Subject<void>();
    private injector = inject(Injector);

    ngOnInit(): void {
        this.activeCell$ = this.resultaatService.activeCell$;
        this.resultatenOpgeslagenOp$ = this.resultaatService.laatstOpgeslagenOp$;
        this.voortgangsdossierMatrix$.next(this.initialVoortgangsdossierMatrix);
        this.activeDossierId$.next(this.initialVoortgangsdossierMatrix.voortgangsdossier.id);

        this.deviceService.isTabletOrDesktop$.pipe(filter(Boolean), takeUntil(this.onDestroy$)).subscribe(() => this.closeSidebar());

        this.activeDossierId$
            .pipe(
                switchMap((dossierId) => this.resultaatDataService.getVoortgangsdossierMatrixVanLesgroep(this.lesgroepId, dossierId)),
                takeUntil(this.onDestroy$)
            )
            .subscribe(this.voortgangsdossierMatrix$);

        runInInjectionContext(this.injector, () => {
            this.niveauOptions = toSignal(
                this.resultaatDataService.getLeerlingVoortgangsdossiers(this.lesgroepId, this.leerling.id).pipe(
                    map((dossiers: Voortgangsdossier[]) => {
                        const selectedVoortgangsdossierId = this.activeDossierId$.getValue();
                        return dossiers.flatMap((dossier) => {
                            const niveaus: VoortgangsdossierNiveau[] = [
                                {
                                    voortgangsdossier: dossier,
                                    isStandaardNiveau: true,
                                    omschrijving: dossier.meervoudigeToetsnorm
                                        ? `${dossier.toetsdossier.naam} - ${dossier.toetsNormering1 ?? 'Standaard'}`
                                        : dossier.toetsdossier.naam,
                                    active: selectedVoortgangsdossierId === dossier.id && !this.alternatiefNiveau
                                }
                            ];
                            if (dossier.meervoudigeToetsnorm) {
                                niveaus.push({
                                    voortgangsdossier: dossier,
                                    isStandaardNiveau: false,
                                    omschrijving: `${dossier.toetsdossier.naam} - ${dossier.toetsNormering2 ?? 'Alternatief'}`,
                                    active: selectedVoortgangsdossierId === dossier.id && this.alternatiefNiveau
                                });
                            }
                            return niveaus;
                        });
                    })
                )
            );
        });

        this.leerlingPeriodeResultaten$ = this.voortgangsdossierMatrix$.pipe(
            filter(isPresent),
            map((voortgangsdossierMatrix) => {
                return voortgangsdossierMatrix.periodes.map((matrixPeriode) => {
                    const resultaten = matrixPeriode.resultaatkolommen.flatMap((matrixKolom) =>
                        getKolomResultaat(this.leerling, matrixKolom, matrixPeriode.leerlingMissendeToetsen)
                    );
                    const adviesResultaten = matrixPeriode.advieskolommen.flatMap((matrixKolom) =>
                        getKolomResultaat(this.leerling, matrixKolom, matrixPeriode.leerlingMissendeToetsen)
                    );
                    return {
                        matrixPeriode,
                        resultaten,
                        adviesResultaten,
                        periodeGemiddelde: matrixPeriode.periodeGemiddeldeKolom
                            ? getKolomResultaat(this.leerling, matrixPeriode.periodeGemiddeldeKolom, matrixPeriode.leerlingMissendeToetsen)
                            : null,
                        rapportGemiddelde: matrixPeriode.rapportGemiddeldeKolom
                            ? getKolomResultaat(this.leerling, matrixPeriode.rapportGemiddeldeKolom, matrixPeriode.leerlingMissendeToetsen)
                            : null,
                        rapportCijfer: matrixPeriode.rapportCijferkolom
                            ? getKolomResultaat(this.leerling, matrixPeriode.rapportCijferkolom, matrixPeriode.leerlingMissendeToetsen)
                            : null
                    };
                });
            }),
            takeUntil(this.onDestroy$)
        );
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onNiveauClick = (dossierNiveau: VoortgangsdossierNiveau) => {
        // Wanneer we switchen van niveau willen we de ingevoerde resultaten opslaan
        // We doen een setTimeout zodat de huidige cell met focus wordt meegenomen
        // foutieve invoer/errors wordt genegeerd/weggehaald
        const dossier = dossierNiveau.voortgangsdossier;
        const alternatiefNiveau = !dossierNiveau.isStandaardNiveau;
        const onClick = () => {
            if (this.resultaatService.isAllSaved) {
                this.switchActiveDossier(dossier.id, alternatiefNiveau);
            } else {
                this.resultaatService.saveResultsFromId$('niveau-switch').subscribe(() => {
                    this.resultaatService.clearErrorsAndRetrys();
                    this.switchActiveDossier(dossier.id, alternatiefNiveau);
                });
                this.resultaatService.saveOnce('niveau-switch');
            }
        };

        // dit returnt een promise die pas resolved nadat de onClick in de setTimeout gedaan is.
        // dit is zodat later in de floating options de active ook gevonden kan worden
        return new Promise<void>((resolve) =>
            setTimeout(() => {
                onClick();
                resolve();
            })
        );
    };

    closeSidebar() {
        if (this.resultaatService.isAllSaved) {
            this.sidebarService.closeSidebar();
        } else {
            this.showSaveResultatenGuard();
        }
    }

    private showSaveResultatenGuard() {
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
            this.sidebarService.closeSidebar();

            return true;
        };
    }

    onNieuwResultaat(
        resultaatInput: string,
        isCijfer: boolean,
        selecteerCellNaOpslaan: SelecteerCellNaOpslaan,
        leerlingUUID: string,
        oudeResultaat: Optional<string>,
        matrixKolom: MatrixResultaatKolom
    ) {
        const resultaat: ResultaatInputParam = {
            resultaatInput,
            isCijfer,
            resultaatKey: {
                leerlingUUID,
                resultaatkolomId: matrixKolom.id,
                herkansingsNummer: matrixKolom.herkansingsNummer
            },
            isAlternatiefNiveau: this.alternatiefNiveau
        };

        this.resultaatService.registreerResultaat(resultaat, selecteerCellNaOpslaan, this.cellen, oudeResultaat ?? '');
    }

    isActiveCell = (activeCell: Maybe<ElementRef>, id: string): boolean => activeCell?.nativeElement.id === id;

    switchActiveDossier(dossierId: string, alternatiefNiveau: boolean) {
        this.alternatiefNiveau = alternatiefNiveau;
        this.activeDossierId$.next(dossierId);
        this.popupService.closePopUp();
    }

    trackByKolomResultaatId(index: number, item: KolomResultaat) {
        return item?.matrixKolom.id;
    }

    trackByPeriodeKolomId(index: number, item: PeriodeKolomResultaten) {
        return item?.matrixPeriode.cijferPeriode.id;
    }

    onderwijssoortVoortgangsdossierNiveauOpties: () => DropdownItem<VoortgangsdossierNiveau>[] = computed(() => {
        return this.niveauOptions()?.map((niveau: VoortgangsdossierNiveau) => ({ label: niveau.omschrijving, data: niveau })) || [];
    });

    selectedVoortgangsdossierNiveau = computed(() => {
        const voortgangsdossierId = this.activeDossierId$.getValue();
        const alternatiefNiveau = this.alternatiefNiveau;
        return this.onderwijssoortVoortgangsdossierNiveauOpties()?.find(
            (option) => option.data.voortgangsdossier.id === voortgangsdossierId && option.data.isStandaardNiveau === !alternatiefNiveau
        );
    });
}
