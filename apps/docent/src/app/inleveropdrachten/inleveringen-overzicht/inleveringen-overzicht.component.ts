import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear, isAfter } from 'date-fns';
import { IconDirective, IconPillComponent, PillComponent, SpinnerComponent } from 'harmony';
import {
    IconBericht,
    IconBewerken,
    IconDownloaden,
    IconGroep,
    IconInleveropdracht,
    IconNotificatie,
    IconOpties,
    IconPijlKleinRechts,
    provideIcons
} from 'harmony-icons';
import { concat, find, flatMap, sum } from 'lodash-es';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import {
    AfspraakToekenning,
    DagToekenning,
    Inlevering,
    InleveringStatus,
    InleveringenConversatieQuery,
    InleveringenOverzicht,
    InleveringenOverzichtQuery,
    Lesgroep,
    LesgroepFieldsFragment,
    Toekenning,
    ToekenningFieldsFragment,
    namedOperations
} from '../../../generated/_types';
import { localOrCookieStorage } from '../../auth/storage-config';
import { allowChildAnimations } from '../../core/core-animations';
import { SaveToekenningContainer } from '../../core/models';
import { Differentiatie } from '../../core/models/studiewijzers/shared.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService, desktopQuery, tabletQuery } from '../../core/services/device.service';
import { InleveropdrachtenDataService } from '../../core/services/inleveropdrachten-data.service';
import { MaskService } from '../../core/services/mask.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { UploadDataService } from '../../core/services/upload-data.service';
import { ToastService } from '../../core/toast/toast.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { LesgroepDeeplinkPopupComponent } from '../../les/lesgroep-deeplink-popup/lesgroep-deeplink-popup.component';
import { mapDifferentiatieToKleurenStackElements } from '../../rooster-shared/colors';
import {
    ActionButton,
    ActionsPopupComponent,
    bekijkOpdrachtButton,
    bewerkButton,
    differentiatiegroepen,
    verwijderButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { sidebarMaskId } from '../../rooster-shared/components/sidebar/sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { differentiatiegroepenBevatLeerling } from '../../rooster-shared/utils/utils';
import { inleveropdrachtVerwijderenGuardProperties } from '../../shared-studiewijzer-les/utils/inleveropdrachten-verwijderen.utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DifferentiatieToekennenSidebarComponent } from '../../shared/components/differentiatie-toekennen-sidebar/differentiatie-toekennen-sidebar.component';
import { DifferentiatieSidebarComponent } from '../../shared/components/differentiatie/differentiatie-sidebar/differentiatie-sidebar.component';
import { KleurenStackComponent, KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { copyToekenning } from '../../shared/utils/toekenning.utils';
import { BulkBerichtenVersturenPopupComponent } from '../bulk-berichten-versturen-popup/bulk-berichten-versturen-popup.component';
import { InleveringenDetailComponent } from '../inleveringen-detail/inleveringen-detail.component';
import {
    InleveringenOverzichtProperty,
    getInleveringenAantalPillTagColor,
    inleveringenOverzichtPropToInleveringStatus,
    inleveringenOverzichtStatussen,
    inleveropdrachtenStatussen,
    teDownloadenStatussen
} from '../inleveropdrachten.util';
import { InleveringenHeaderNavigatieComponent } from './inleveringen-header-navigatie/inleveringen-header-navigatie.component';
import { InleveringenOverzichtItemComponent } from './inleveringen-overzicht-item/inleveringen-overzicht-item.component';
import { InleveringenOverzichtSelectieComponent } from './inleveringen-overzicht-selectie/inleveringen-overzicht-selectie.component';
import { InleveringenOverzichtService } from './inleveringen-overzicht.service';
import { NieuweInleveringenComponent } from './nieuwe-inleveringen/nieuwe-inleveringen.component';

@Component({
    selector: 'dt-inleveringen-overzicht',
    templateUrl: './inleveringen-overzicht.component.html',
    styleUrls: ['./inleveringen-overzicht.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    providers: [
        InleveringenOverzichtService,
        UploadDataService,
        provideIcons(
            IconInleveropdracht,
            IconGroep,
            IconPijlKleinRechts,
            IconOpties,
            IconDownloaden,
            IconBericht,
            IconNotificatie,
            IconBewerken
        )
    ],
    standalone: true,
    imports: [
        HeaderComponent,
        InleveringenHeaderNavigatieComponent,
        BackgroundIconComponent,
        KleurenStackComponent,
        IconComponent,
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        InleveringenOverzichtSelectieComponent,
        InleveringenOverzichtItemComponent,
        RouterLinkActive,
        OutlineButtonComponent,
        TooltipDirective,
        SpinnerComponent,
        NieuweInleveringenComponent,
        InleveringenDetailComponent,
        StudiewijzeritemSidebarComponent,
        DifferentiatieToekennenSidebarComponent,
        MessageComponent,
        DifferentiatieSidebarComponent,
        AsyncPipe,
        IconDirective,
        IconPillComponent,
        PillComponent
    ]
})
export class InleveringenOverzichtComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private deviceService = inject(DeviceService);
    private opdrachtenDataService = inject(InleveropdrachtenDataService);
    private sidebarService = inject(SidebarService);
    private router = inject(Router);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private componentService = inject(InleveringenOverzichtService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private maskService = inject(MaskService);
    private toastService = inject(ToastService);
    private changedetectorRef = inject(ChangeDetectorRef);
    @HostBinding('class.show-detail') showDetail = false;
    @ViewChild('berichtenVersturen', { read: ViewContainerRef }) berichtenVersturenRef: ViewContainerRef;
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;

    public detail$: Observable<string | null>;
    public inleveringenOverzicht$: Observable<InleveringenOverzichtQuery['inleveringenOverzicht']>;
    public inleveringenDetail$: Observable<Inlevering[]>;
    public selectedInleveraar$: Observable<InleveringenOverzichtQuery['inleveringenOverzicht']['teBeoordelen'][number]>;
    public inleveringConversatie$: Observable<InleveringenConversatieQuery['inleveringenConversatie']>;
    public bulkActiesOverzichtProperties$: Observable<InleveringenOverzichtProperty[]>;
    public bulkBerichtenVersturenAantal$: Observable<number>;
    public bulkDownloadenAantal$: Observable<number>;
    public showKleurenStackBackground$: Observable<boolean>;
    public kleuren$: Observable<KleurenStackElement[]>;
    public overzichtStatussen = inleveringenOverzichtStatussen;
    public bulkactiesForm = new UntypedFormGroup({});
    public heeftToegangTotDifferentiatie$: Observable<boolean>;
    public heeftBerichtenWijzigenRecht$: Observable<boolean>;
    public headerNavigatie$: Observable<HeaderNavigatie>;
    public isTabletOfDesktop = toSignal(this.deviceService.isTabletOrDesktop$, { initialValue: this.deviceService.isTabletOrDesktop() });
    public getInleveringenAantalColor = getInleveringenAantalPillTagColor;

    public differentiatieSidebar$: SidebarInputs<DifferentiatieSidebarComponent>;
    public studiewijzeritemSidebar$: SidebarInputs<StudiewijzeritemSidebarComponent>;
    public differentiatieToekennenSidebar$: SidebarInputs<DifferentiatieToekennenSidebarComponent>;

    public downloading = false;
    public showMessage = false;
    public message: string;

    constructor() {
        this.showKleurenStackBackground$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[tabletQuery] || state.breakpoints[desktopQuery])
        );

        this.detail$ = combineLatest([this.deviceService.onDeviceChange$, this.route.queryParamMap]).pipe(
            map(([, queryParams]) => queryParams.get('detail')),
            map((detail) => (this.deviceService.isPhoneOrTabletPortrait() ? detail : detail ?? 'nieuw')),
            tap((detail) =>
                setTimeout(() => {
                    this.showDetail = !!detail;
                    this.changedetectorRef.markForCheck();
                }, 0)
            ),
            shareReplayLastValue()
        );

        this.overzichtStatussen
            .map((status) => status.property)
            .forEach((status) => this.bulkactiesForm.addControl(status, new UntypedFormControl()));

        this.studiewijzeritemSidebar$ = this.sidebarService.watchFor(StudiewijzeritemSidebarComponent);
        this.differentiatieToekennenSidebar$ = this.sidebarService.watchFor(DifferentiatieToekennenSidebarComponent);
        this.differentiatieSidebar$ = this.sidebarService.watchFor(DifferentiatieSidebarComponent);
    }

    ngOnDestroy() {
        this.opdrachtenDataService.removeInleveringenEnConversatieFromCache();
    }

    ngOnInit(): void {
        this.inleveringenOverzicht$ = this.route.paramMap.pipe(
            tap((paramMap) => localOrCookieStorage.setItem('inleveropdrachten.navigatie.scrollpositie', paramMap.get('id')!)),
            switchMap((paramMap) => this.opdrachtenDataService.getInleveringenOverzicht(paramMap.get('id')!)),
            shareReplayLastValue()
        );

        this.kleuren$ = this.inleveringenOverzicht$.pipe(
            map((overzicht) =>
                mapDifferentiatieToKleurenStackElements(
                    overzicht.toekenning.differentiatiegroepen,
                    overzicht.toekenning.differentiatieleerlingen
                )
            )
        );

        const detailId$ = this.detail$.pipe(map((detail) => (detail && detail !== 'nieuw' ? detail : 'nieuw')));

        this.selectedInleveraar$ = combineLatest([detailId$, this.inleveringenOverzicht$]).pipe(
            filter(([detail]) => detail !== 'nieuw'),
            tap(([detail, overzicht]) => {
                // Verwijder ongelezen inleveringen wanneer deze er zijn
                if (overzicht.nieuw.map((i) => i.inleveraar.id).includes(detail)) {
                    this.opdrachtenDataService.verwijderOngelezenInleveringen(this.toekenningId, detail);
                }
            }),
            filter(([, overzicht]) => {
                // Als het id van de toekenning niet overeenkomt met de toekenning uit de url.
                // Skip deze value en wacht totdat het juiste overzicht geladen is.
                return overzicht.toekenning.id === this.toekenningId;
            }),
            map(
                ([detail, overzicht]) =>
                    find(
                        concat(
                            overzicht.nieuw.map((nieuw) => nieuw.inleveraar),
                            overzicht.teBeoordelen,
                            overzicht.inBeoordeling,
                            overzicht.akkoord,
                            overzicht.afgewezen,
                            overzicht.nietIngeleverd
                        ),
                        { id: detail }
                    )!
            ),
            filter((inleveraar) => {
                if (!inleveraar) {
                    this.router.navigate([], {
                        queryParams: { detail: 'nieuw' },
                        queryParamsHandling: 'merge'
                    });
                }
                return !!inleveraar;
            }),
            shareReplayLastValue()
        );

        this.inleveringConversatie$ = this.selectedInleveraar$.pipe(
            distinctUntilChanged(),
            switchMap((inleveraar) => this.opdrachtenDataService.getConversatie(this.toekenningId, inleveraar.id))
        );

        this.inleveringenDetail$ = combineLatest([detailId$, this.route.paramMap]).pipe(
            filter(([detail]) => detail !== 'nieuw'),
            switchMap(([detail, paramMap]) => this.opdrachtenDataService.getInleveringen(paramMap.get('id')!, detail))
        );

        this.bulkActiesOverzichtProperties$ = this.bulkactiesForm.valueChanges.pipe(
            map((form) => inleveropdrachtenStatussen.filter((key) => form[key])),
            shareReplayLastValue()
        );

        this.bulkDownloadenAantal$ = this.bulkActiesOverzichtProperties$.pipe(
            withLatestFrom(this.inleveringenOverzicht$),
            map(([geselecteerdeStatussen, overzicht]) => {
                const statussen = geselecteerdeStatussen.filter((status) => teDownloadenStatussen.includes(status));
                return sum(statussen.map((status) => overzicht[status].length));
            })
        );

        this.bulkBerichtenVersturenAantal$ = this.bulkActiesOverzichtProperties$.pipe(
            withLatestFrom(this.inleveringenOverzicht$),
            map(([geselecteerdeStatussen, overzicht]) => sum(geselecteerdeStatussen.map((status) => overzicht[status].length)))
        );

        this.componentService.onBeoordeling$
            .pipe(
                withLatestFrom(this.selectedInleveraar$),
                switchMap(([status, inleveraar]) =>
                    this.opdrachtenDataService.updateInleveringenStatus$(this.toekenningId, inleveraar.id, status)
                )
            )
            .subscribe(() => {
                this.onShowMessage('De inlevering is beoordeeld');
            });

        this.componentService.onDownloadAlles$
            .pipe(
                withLatestFrom(this.selectedInleveraar$),
                switchMap(([inleveringen, inleveraar]) =>
                    this.opdrachtenDataService.downloadInBulk$(this.toekenningId, inleveringen, inleveraar.id)
                ),
                withLatestFrom(this.componentService.onDownloadAlles$)
            )
            .subscribe({
                next: ([result, inleveringen]) => {
                    this.componentService.zipReady(inleveringen);
                    window.open(result.data!.downloadOpdrachtenInBulk);
                },
                error: (e) => this.componentService.zipError(e)
            });

        this.componentService.onDownload$.pipe(withLatestFrom(this.selectedInleveraar$)).subscribe(([inlevering, inleveraar]) => {
            if (inlevering.status === InleveringStatus.TE_BEOORDELEN) {
                this.opdrachtenDataService.updateInleveringenStatus(this.toekenningId, inleveraar.id, InleveringStatus.IN_BEOORDELING);
            }
            window.open(inlevering.inhoud);
        });

        this.componentService.onMessage$
            .pipe(
                withLatestFrom(this.selectedInleveraar$, this.medewerkerDataService.getMedewerker()),
                switchMap(([bericht, inleveraar, medewerker]) =>
                    this.opdrachtenDataService.verstuurInleveringReactie(this.toekenningId, inleveraar.id, bericht, medewerker)
                )
            )
            .subscribe(() => this.onShowMessage('Het bericht is verzonden'));

        this.componentService.onMessageAll$
            .pipe(
                withLatestFrom(this.medewerkerDataService.getMedewerker()),
                switchMap(([bulkBericht, medewerker]) =>
                    this.opdrachtenDataService.verstuurInleveringReacties(this.toekenningId, bulkBericht, medewerker)
                )
            )
            .subscribe(() => {
                this.onShowMessage('Berichten verzonden. Het bericht vind je terug bij de leerling');
                this.bulkactiesForm.reset();
            });

        this.heeftToegangTotDifferentiatie$ = this.inleveringenOverzicht$.pipe(
            switchMap((overzicht) =>
                this.medewerkerDataService.differentiatieToegestaanVoorVestiging(overzicht.toekenning.lesgroep!.vestigingId)
            ),
            shareReplayLastValue()
        );

        this.heeftBerichtenWijzigenRecht$ = this.medewerkerDataService.heeftBerichtenWijzigenRecht().pipe(shareReplayLastValue());

        this.headerNavigatie$ = this.inleveringenOverzicht$.pipe(
            map(({ toekenning }) => {
                const deadline = toekenning.studiewijzeritem.inleverperiode?.eind;

                if (deadline) {
                    // when using mock data, this will only work with the stored schooljaar
                    const storedSchooljaar = localOrCookieStorage.getItem('inleveropdrachten.navigatie.jaar');
                    const schooljaar = storedSchooljaar ? parseInt(storedSchooljaar, 10) : getYear(deadline);
                    const today = new Date();

                    if (isAfter(deadline, today)) {
                        return this.makeHeaderNavigatie(
                            toekenning,
                            this.opdrachtenDataService.readInleveropdrachtenVanSchooljaarAankomendFromCache(schooljaar)
                        );
                    } else {
                        return this.makeHeaderNavigatie(
                            toekenning,
                            this.opdrachtenDataService.readInleveropdrachtenVanSchooljaarVerlopenFromCache(schooljaar)
                        );
                    }
                }
                return {};
            })
        );
    }

    private makeHeaderNavigatie(toekenning: { id: string }, opdrachten?: Array<{ id: string }>): HeaderNavigatie {
        const navigatie: HeaderNavigatie = {};
        if (opdrachten) {
            const toekenningIndex = opdrachten.findIndex((opdracht) => opdracht.id === toekenning.id);
            if (toekenningIndex !== -1) {
                if (toekenningIndex > 0) {
                    navigatie.previousId = opdrachten[toekenningIndex - 1].id;
                }
                if (toekenningIndex < opdrachten.length - 1) {
                    navigatie.nextId = opdrachten[toekenningIndex + 1].id;
                }
            }
        }
        return navigatie;
    }

    downloadStatussen() {
        if (!this.downloading) {
            this.downloading = true;
            const statussen = teDownloadenStatussen
                .filter((key) => this.bulkactiesForm.value[key])
                .map(inleveringenOverzichtPropToInleveringStatus);

            this.opdrachtenDataService.downloadOpdrachtenVanStatussen$(this.toekenningId, statussen).subscribe({
                next: (result) => {
                    this.downloading = false;
                    this.bulkactiesForm.reset();

                    window.open(result.data!.downloadLaatsteOpdrachtenVanStatussen);
                },
                error: () => {
                    this.downloading = false;
                    this.bulkactiesForm.reset();
                    this.toastService.error('Er is een fout opgetreden, probeer het nogmaals.');
                }
            });
        }
    }

    verstuurBerichtenVoorStatussenClick(inleveringenOverzicht: InleveringenOverzichtQuery['inleveringenOverzicht']) {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 185;
        popupSettings.preferedDirection = [PopupDirection.Top];
        popupSettings.isFixed = true;
        popupSettings.fixedPopupOffset = 8;
        popupSettings.applicationOffset = 0;

        const popup = this.popupService.popup(this.berichtenVersturenRef, popupSettings, ActionsPopupComponent);
        const herinneringAction: ActionButton = {
            icon: 'notificatie',
            iconcolor: 'primary_1',
            text: 'Herinnering',
            textcolor: 'primary_1',
            onClickFn: () => this.openBulkBerichtVersturenPopup(inleveringenOverzicht as InleveringenOverzicht, true)
        };
        const berichtAction: ActionButton = {
            icon: 'bewerken',
            iconcolor: 'primary_1',
            text: 'Nieuw bericht',
            textcolor: 'primary_1',
            onClickFn: () => this.openBulkBerichtVersturenPopup(inleveringenOverzicht as InleveringenOverzicht)
        };

        popup.customButtons = [berichtAction, herinneringAction];
    }

    openBulkBerichtVersturenPopup(inleveringenOverzicht: InleveringenOverzicht, herinnering = false) {
        const geadresseerden = flatMap(
            inleveropdrachtenStatussen.filter((key) => this.bulkactiesForm.value[key]).map((property) => inleveringenOverzicht[property])
        );

        const popup = this.popupService.popup(
            this.viewContainerRef,
            BulkBerichtenVersturenPopupComponent.defaultPopupSettings,
            BulkBerichtenVersturenPopupComponent
        );

        popup.toekenning = inleveringenOverzicht.toekenning;
        popup.ingelogdeMedewerker$ = this.medewerkerDataService.getMedewerker();
        popup.herinnering = herinnering;
        popup.geadresseerden = geadresseerden;
    }

    bekijkOpdracht(toekenning: ToekenningFieldsFragment) {
        this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning: toekenning as any });
    }

    bewerkOpdracht(toekenning: ToekenningFieldsFragment) {
        this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
            toekenning: toekenning as any,
            openInEditMode: true
        });
    }

    saveOpdracht(toekenningContainer: SaveToekenningContainer) {
        const toekenning = toekenningContainer.toekenningen[0];
        if ((<DagToekenning>toekenning).datum) {
            this.opdrachtenDataService
                .saveDagToekenning$([<DagToekenning>toekenning], [namedOperations.Query.inleveringenOverzicht])
                .pipe(map((result) => result.data!.saveDagToekenning.toekenningen[0]))
                .subscribe((newToekenning) => {
                    this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                        toekenning: newToekenning as DagToekenning
                    });
                });
        } else {
            this.opdrachtenDataService
                .updateAfspraakToekenning$(<AfspraakToekenning>toekenning)
                .pipe(map((result) => result.data!.saveAfspraakToekenning.toekenningen[0]))
                .subscribe((newToekenning) => {
                    this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                        toekenning: newToekenning as AfspraakToekenning
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

    verwijderToekenning(toekenning: Toekenning) {
        this.opdrachtenDataService.verwijderInleveropdracht(toekenning);
        this.router.navigate(['/inleveropdrachten']);
    }

    get toekenningId() {
        return this.route.snapshot.paramMap.get('id')!;
    }

    onShowMessage(message: string) {
        this.message = message;
        this.showMessage = true;
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
        const filteredLeerlingen = event.differentiatie.differentiatieleerlingen
            .map((leerling) => ({ ...leerling }))
            .filter((leerling) => !differentiatiegroepenBevatLeerling(toekenning.differentiatiegroepen, leerling.id));

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

    onMoreOptions(lesgroep: LesgroepFieldsFragment) {
        const popup = this.popupService.popup(
            this.moreOptionsRef,
            LesgroepDeeplinkPopupComponent.defaultPopupsettings,
            LesgroepDeeplinkPopupComponent
        );

        this.heeftToegangTotDifferentiatie$.subscribe((toegang) => {
            if (toegang) {
                popup.customButtons = [
                    differentiatiegroepen((lesgroep: Lesgroep) => {
                        this.sidebarService.openSidebar(DifferentiatieSidebarComponent, { lesgroep });
                        this.popupService.closePopUp();
                    }, 'open-inleveropdrachten-differentiatie')
                ];
                popup.toonCustomButtons = true;
                popup.showDividerLine = false;
            }
        });
        popup.lesgroepen = [lesgroep as Lesgroep];
        popup.metStudiewijzerLink = true;
    }

    backToInleveropdrachtenOverzicht() {
        this.router.navigate(['/inleveropdrachten']);
    }

    showOpdracht(newId: string) {
        let currentUrlWithoutParams = this.router.url;
        if (currentUrlWithoutParams.indexOf('?') >= 0) {
            currentUrlWithoutParams = currentUrlWithoutParams.split('?')[0];
        }
        this.router.navigate([currentUrlWithoutParams.replace(this.route.snapshot.params.id, newId)]);
    }

    showHeaderMoreOptions(
        headerMoreOptionsRef: ViewContainerRef,
        inleveringenOverzicht: InleveringenOverzichtQuery['inleveringenOverzicht']
    ) {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 185;

        const popup = this.popupService.popup(headerMoreOptionsRef, popupSettings, ActionsPopupComponent);
        popup.customButtons = [
            bekijkOpdrachtButton(() => this.bekijkOpdracht(inleveringenOverzicht.toekenning)),
            bewerkButton(() => this.bewerkOpdracht(inleveringenOverzicht.toekenning)),
            verwijderButton(() => this.verwijderOpdracht(inleveringenOverzicht.toekenning as any), 'inl-overzicht-verwijder-opdracht')
        ];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}

interface HeaderNavigatie {
    nextId?: string;
    previousId?: string;
}
