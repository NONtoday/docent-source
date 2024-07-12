import { AsyncPipe, NgClass } from '@angular/common';
import {
    AfterContentInit,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { addWeeks, differenceInCalendarDays, getISOWeek, isBefore, isSameDay } from 'date-fns';
import { IconDirective, PillComponent } from 'harmony';
import {
    IconAZ,
    IconBlokken,
    IconBulkCheck,
    IconBulkUncheck,
    IconCheck,
    IconKlok,
    IconLijst,
    IconNoRadio,
    IconWaarschuwing,
    IconYesRadio,
    IconZA,
    provideIcons
} from 'harmony-icons';
import { get, intersection, some } from 'lodash-es';
import { NgStringPipesModule } from 'ngx-pipes';
import { Observable, Subject, Subscription, combineLatest, fromEvent, timer } from 'rxjs';
import { debounceTime, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import {
    AbsentieMelding,
    AbsentieRedenFieldsFragment,
    AbsentieSoort,
    ActueleNotitieItemsQuery,
    AfspraakQuery,
    ExterneRegistraties,
    KeuzelijstWaardeMogelijkheid,
    Leerling,
    LeerlingRegistratie,
    LesRegistratie,
    LesRegistratieQuery,
    PartialLeerlingFragment,
    PeriodeQuery,
    SignaleringenInstellingenQuery,
    SignaleringenQuery,
    Sortering,
    SorteringOrder,
    SorteringVanMedewerkerQuery,
    SorteringVeld,
    VrijVeld,
    VrijVeldSignalering,
    VrijVeldWaarde
} from '../../../generated/_types';
import { localOrCookieStorage } from '../../auth/storage-config';
import { allowChildAnimations } from '../../core/core-animations';
import { SorteerOrder } from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { IdObject } from '../../core/models/shared.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import {
    ActionsPopupComponent,
    SorteerButtonClickFn,
    sorteerButtons
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackToTopComponent } from '../../rooster-shared/components/back-to-top/back-to-top.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { WerkdrukSidebarComponent } from '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { formatDateNL, getSchooljaar } from '../../rooster-shared/utils/date.utils';
import {
    LeerlingRegistratieQueryType,
    createDefaultRegistratiePopupSettings,
    createVrijVeldKeuzePopupCustomButtons,
    heeftExterneRegistratie,
    isTeLaatGemeldDoorAndereDocent,
    magAbsentieMeldingBewerken
} from '../../rooster-shared/utils/registratie.utils';
import { Optional, sortLocaleNested } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeactivatableComponentDirective } from '../../shared/components/deactivatable.component';
import { LesDataService } from '../les-data.service';
import { LesService } from '../les.service';
import { LesgroepDeeplinkPopupComponent } from '../lesgroep-deeplink-popup/lesgroep-deeplink-popup.component';
import { AbsentieMeldingPopupComponent } from './absentie-melding-popup/absentie-melding-popup.component';
import { FlexibeleRegistratiePopupComponent } from './flexibele-registratie-popup/flexibele-registratie-popup.component';
import { InfopanelsSidebarComponent, infopanelsNavItem } from './infopanels-sidebar/infopanels-sidebar.component';
import { LeerlingBlockRegistratieComponent } from './leerling-block-registratie/leerling-block-registratie.component';
import { LeerlingListRegistratieComponent } from './leerling-list-registratie/leerling-list-registratie.component';
import { NotitieAccordionComponent } from './notitie-accordion/notitie-accordion.component';
import { RegistratieDataService } from './registratie-data.service';
import { SignaleringenComponent } from './signaleringen/signaleringen.component';
import { VandaagAfwezigComponent } from './vandaag-afwezig/vandaag-afwezig.component';

const defaultSortering: Sortering = {
    naam: 'registratie',
    order: SorteringOrder.ASC,
    veld: SorteringVeld.ACHTERNAAM
};

const BULK_DUMMY_REGISTRATIE_ID = 'bulk-dummy-registratie';
const BULK_DUMMY_LEERLING_ID = 'bulk-dummy-leerling';

@Component({
    selector: 'dt-registratie',
    templateUrl: './registratie.component.html',
    styleUrls: ['./registratie.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    standalone: true,
    imports: [
        NgClass,
        TooltipDirective,
        NotitieAccordionComponent,
        VandaagAfwezigComponent,
        SignaleringenComponent,
        InfopanelsSidebarComponent,
        LeerlingBlockRegistratieComponent,
        LeerlingListRegistratieComponent,
        ButtonComponent,
        BackToTopComponent,
        AsyncPipe,
        NgStringPipesModule,
        DtDatePipe,
        IconDirective,
        PillComponent
    ],
    providers: [
        provideIcons(
            IconAZ,
            IconZA,
            IconBulkCheck,
            IconBulkUncheck,
            IconLijst,
            IconBlokken,
            IconCheck,
            IconYesRadio,
            IconNoRadio,
            IconKlok,
            IconWaarschuwing
        )
    ]
})
export class RegistratieComponent extends DeactivatableComponentDirective implements OnInit, OnDestroy, AfterContentInit {
    private route = inject(ActivatedRoute);
    private regDataService = inject(RegistratieDataService);
    private lesDataService = inject(LesDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    public deviceService = inject(DeviceService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private lesService = inject(LesService);
    private sidebarService = inject(SidebarService);
    private renderer2 = inject(Renderer2);
    private notitieboekDataservice = inject(NotitieboekDataService);
    @HostBinding('class.block-view') blockView = false;

    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;
    @ViewChild('sorteerheader', { read: ViewContainerRef }) sorteerheader: ViewContainerRef;
    @ViewChild('headers', { read: ElementRef, static: false }) headers: ElementRef;
    @ViewChild('aanwezigheidHeader', { read: ViewContainerRef }) aanwezigheidHeader: ViewContainerRef;
    @ViewChild('verwijderdHeader', { read: ViewContainerRef }) verwijderdHeader: ViewContainerRef;
    @ViewChild('huiswerkHeader', { read: ViewContainerRef }) huiswerkHeader: ViewContainerRef;
    @ViewChild('materiaalHeader', { read: ViewContainerRef }) materiaalHeader: ViewContainerRef;
    @ViewChild('extraRegistraties', { read: ViewContainerRef }) extraRegistraties: ViewContainerRef;
    @ViewChildren('extraRegistratiesLosHeaders', { read: ViewContainerRef }) extraRegistratiesLosHeaders: QueryList<ViewContainerRef>;

    public lesRegistratie: LesRegistratieQuery['lesRegistratie'];
    public alleVrijveldDefinities: LesRegistratie['overigeVrijVeldDefinities'];
    public alleExtraVrijveldDefinities: LesRegistratie['overigeVrijVeldDefinities'] = [];
    public afspraak: Optional<AfspraakQuery['afspraak']>;
    public sortering: SorteringVanMedewerkerQuery['sorteringVanMedewerker'];
    public laatstGewijzigdDatum: Optional<Date>;
    public dirty: boolean;
    public enabled: boolean;
    public loading = false;
    public aantalTotaal: number;
    public aantalAanwezig: number;
    public aantalAfwezig: number;
    public teLaatMeldingToegestaan: boolean;
    public verwijderdMeldingToegestaan: boolean;
    public savePressed = false;
    public afspraakIsVandaag: boolean;
    public afspraakIsDagInToekomst: boolean;

    public infopanelsSidebar$: Observable<InfopanelsSidebarComponent>;

    public periodeSignaleringen$: Observable<PeriodeQuery['periode']>;
    public unfilteredSignaleringen$: Observable<Optional<SignaleringenQuery['signaleringen']>>;
    public signaleringInstellingen$: Observable<SignaleringenInstellingenQuery['signaleringenInstellingen']>;
    public signaleringen$: Observable<SignaleringenQuery['signaleringen']>;

    public heeftNotitieboekToegang$: Observable<boolean>;
    public actueleNotities$: Observable<ActueleNotitieItemsQuery['actueleNotitieItems']>;
    public aantalActueleNotities$: Observable<number>;

    public aantalExtraRegistratiesTonen = 0;

    private pollingSub: Subscription;
    private unsubscribe$: Subject<void> = new Subject<void>();

    public readonly afwezigheidNav = infopanelsNavItem.AFWEZIGHEID;
    public readonly signaleringenNav = infopanelsNavItem.SIGNALERINGEN;
    public readonly notitiesNav = infopanelsNavItem.NOTITIES;

    public heeftIedereenExterneRegistratie: boolean;
    public heeftIedereenRegistratieVerwijderd: boolean;
    public isIedereenAfwezig: boolean;
    public heeftIedereenRegistratieHuiswerk: boolean;
    public heeftIedereenRegistratieMateriaal: boolean;
    public vrijeVeldenMetVolledigeRegistratie: string[] = [];

    @HostListener('window:scroll', ['$event'])
    onScroll() {
        if (!this.headers) return;

        if (this.headers.nativeElement.offsetTop <= window.scrollY) {
            this.renderer2.setAttribute(this.headers.nativeElement, 'stuck', '');
        } else {
            this.renderer2.removeAttribute(this.headers.nativeElement, 'stuck');
        }
    }

    ngOnInit() {
        this.blockView = localOrCookieStorage.getItem('registratieBlockView') === 'true';

        this.infopanelsSidebar$ = this.sidebarService.watchFor(InfopanelsSidebarComponent);

        this.route
            .parent!.paramMap.pipe(
                tap(() => this.lesService.startLoading()),
                switchMap((params) =>
                    combineLatest([
                        this.lesDataService
                            .getAfspraakWatchQuery(params.get('id')!)
                            .pipe(
                                switchMap((afspraak) =>
                                    this.regDataService
                                        .getLesRegistratie(afspraak)
                                        .pipe(map((registratieRes) => ({ registratieRes, afspraak })))
                                )
                            ),
                        this.medewerkerDataService.getMedewerker(),
                        this.medewerkerDataService
                            .getSorteringVanMedewerker('registratie')
                            .pipe(map((sortering) => sortering ?? defaultSortering))
                    ])
                ),
                tap(() => this.lesService.stopLoading()),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(([{ registratieRes, afspraak }, medewerker, sortering]) => {
                const data = registratieRes.data;
                this.loading = registratieRes.loading;

                this.afspraak = afspraak;
                this.sortering = sortering;
                this.afspraakIsVandaag = isSameDay(afspraak.begin, new Date());
                this.afspraakIsDagInToekomst = differenceInCalendarDays(afspraak.begin, new Date()) > 0;

                this.periodeSignaleringen$ = this.regDataService.getPeriode(afspraak.id);
                this.unfilteredSignaleringen$ = this.regDataService.getSignaleringen(afspraak.id);
                this.signaleringInstellingen$ = this.regDataService.getSignaleringenInstellingen(this.medewerkerDataService.medewerkerId);

                if (!this.enabled) {
                    this.enabled =
                        afspraak.presentieRegistratieVerplicht &&
                        (this.afspraakIsVandaag ||
                            (isBefore(this.afspraak.begin, new Date()) && !this.afspraak.presentieRegistratieVerwerkt));
                }

                let moetVerwijderdInitieelInBeeldStaan = false;

                if (get(medewerker, 'settings.vestigingRechten')) {
                    const settingsVoorVestiging = medewerker.settings.vestigingRechten.filter(
                        (setting) => setting.vestigingId === this.afspraak?.vestigingId
                    );

                    if (settingsVoorVestiging.length > 0) {
                        this.teLaatMeldingToegestaan = settingsVoorVestiging[0].teLaatMeldingToegestaan;
                        if (this.verwijderdMeldingToegestaan !== settingsVoorVestiging[0].verwijderdMeldingToegestaan) {
                            this.verwijderdMeldingToegestaan = settingsVoorVestiging[0].verwijderdMeldingToegestaan;
                            moetVerwijderdInitieelInBeeldStaan = true;
                        }
                    }
                }

                if (data && data.lesRegistratie) {
                    const sorteringVeld: 'voornaam' | 'achternaam' = sortering.veld.toLowerCase() as any;
                    const sortOrder = sortering.order.toLowerCase() as SorteerOrder;
                    const leerlingRegistraties = [...data.lesRegistratie.leerlingRegistraties];
                    const sortedRegistraties = sortLocaleNested(
                        leerlingRegistraties,
                        (leerlingReg) => leerlingReg.leerling,
                        [sorteringVeld],
                        [sortOrder]
                    );
                    this.lesRegistratie = {
                        ...data.lesRegistratie,
                        leerlingRegistraties: sortedRegistraties
                    };
                    this.alleVrijveldDefinities = data.lesRegistratie.overigeVrijVeldDefinities;
                    this.alleExtraVrijveldDefinities = data.lesRegistratie.overigeVrijVeldDefinities.filter((vvd) => !vvd.vastgezet);
                    this.dirty = some(data.lesRegistratie.leerlingRegistraties, { dirty: true });
                    this.laatstGewijzigdDatum = data.lesRegistratie.laatstGewijzigdDatum;
                    if (data.lesRegistratie.leerlingRegistraties) {
                        this.aantalTotaal = data.lesRegistratie.leerlingRegistraties.length;
                        this.aantalAanwezig = data.lesRegistratie.leerlingRegistraties.filter((registratie) => registratie.aanwezig).length;
                        this.aantalAfwezig = data.lesRegistratie.leerlingRegistraties.filter((registratie) => !registratie.aanwezig).length;
                    }
                }

                if (!this.pollingSub) {
                    this.pollingSub = timer(1000 * 60 * 5)
                        .pipe(
                            switchMap(() => this.regDataService.getExterneRegistraties(afspraak.id)),
                            map((result) => result.data.externeRegistraties),
                            takeUntil(this.unsubscribe$)
                        )
                        .subscribe((externeRegistraties: ExterneRegistraties) => {
                            this.regDataService.updateRegistratiesNaPolling(externeRegistraties, afspraak);
                            this.bepaalIedereenExternGeregistreerd();
                        });
                }

                this.updateExtraRegistraties(moetVerwijderdInitieelInBeeldStaan);
                this.bepaalIedereenExternGeregistreerd();
            });

        fromEvent(window, 'resize')
            .pipe(debounceTime(20), takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.updateExtraRegistraties();
            });

        /* Aan een afspraak kunnen leerlingen of groepen hangen van een andere vestiging,
        maar dit weet je pas bij het ophalen van de lesregistratie.
        Dit dient dus als een check vooraf of de docent überhaupt bij de notitieboek functionaliteit mag.
        Zo kunnen de actuele notities onafhankelijk van de lesregistratie worden opgehaald. */
        this.heeftNotitieboekToegang$ = this.medewerkerDataService.heeftNotitieboekToegang().pipe(take(1), shareReplayLastValue());

        this.actueleNotities$ = combineLatest([this.heeftNotitieboekToegang$, this.route.parent!.paramMap]).pipe(
            filter(([heeftToegang]) => heeftToegang),
            switchMap(([, params]) => this.notitieboekDataservice.actueleNotitieItems(params.get('id')!)),
            shareReplayLastValue()
        );
        this.aantalActueleNotities$ = this.actueleNotities$.pipe(
            map((notitieItems) => notitieItems.length),
            shareReplayLastValue()
        );
    }

    ngAfterContentInit() {
        this.updateExtraRegistraties();
    }

    // Voordat er data opgevraagd is staat verwijderd niet in beeld, bij de eerste keer data data binnenkomt weet je of je wel of geen verwijderd in beeld moet hebben.
    // Mocht verwijderd wel in beeld staan, trek dan de breedte van een kolom van de width af, aangezien deze header nu nog niet getoond staat.
    updateExtraRegistraties(moetVerwijderdInitieelInBeeldStaan = false) {
        if (!this.extraRegistraties || !this.deviceService.isDesktop()) return;

        let width = this.extraRegistraties.element.nativeElement.clientWidth;
        if (moetVerwijderdInitieelInBeeldStaan) {
            width -= 88;
        }

        const aantalPlek = Math.max(1, Math.floor(width / 88));
        const aantalExtra = this.alleExtraVrijveldDefinities?.length ?? 0;

        if (aantalPlek >= aantalExtra) {
            this.aantalExtraRegistratiesTonen = aantalExtra;
        } else {
            // aantalPlek-1 voor de extra registraties knop en aantalExtra-2 omdat we niet een knop tonen
            // voor 1 extra registratie want dan zou dit passen.
            this.aantalExtraRegistratiesTonen = Math.min(aantalPlek - 1, Math.max(aantalExtra - 2, 0));
        }
        this.extraRegistraties?.element.nativeElement.style.setProperty(
            '--aantal-extra-registraties-tonen',
            this.aantalExtraRegistratiesTonen
        );
    }

    sorteerClick(sortering: Sortering) {
        const popup = this.popupService.popup(this.sorteerheader, ActionsPopupComponent.sorteerPopupsettings, ActionsPopupComponent);
        const onSortOptionClick: SorteerButtonClickFn = (veld, order) =>
            this.medewerkerDataService.saveSortering('registratie', veld, order);

        popup.customButtons = sorteerButtons(
            sortering.veld,
            sortering.order,
            [SorteringVeld.VOORNAAM, SorteringVeld.ACHTERNAAM],
            onSortOptionClick
        );
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    onSubmit() {
        if (this.afspraak && !this.loading && !this.savePressed) {
            this.regDataService.saveLesRegistratie(this.afspraak, this.medewerkerDataService.medewerkerId);
            this.savePressed = true;
            setTimeout(() => {
                this.savePressed = false;
            }, 1000);
        }
    }

    trackById(index: number, item: IdObject) {
        return item.id;
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    canDeactivate(): boolean {
        return !this.dirty;
    }

    isDeactivationAllowed(): Observable<boolean> | Promise<boolean> | boolean {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);
        popup.title = 'Let op, registratie is nog niet opgeslagen';
        popup.message =
            'Je staat op het punt om een pagina te verlaten zonder deze op te slaan.\nSla de pagina op om wijzigingen te behouden.';
        popup.actionLabel = 'Opslaan';
        popup.cancelLabel = 'Niet opslaan';
        popup.onConfirmFn = () => {
            this.onSubmit();
            return true;
        };
        // reset de signaleringen bij het wegnavigeren
        popup.onCancelFn = () => this.afspraak && this.regDataService.removeLesRegistratieFromCache(this.afspraak.id);
        return popup.getResult();
    }

    enableListView() {
        this.blockView = false;
        localOrCookieStorage.setItem('registratieBlockView', this.blockView.toString());
    }

    enableBlockView() {
        this.blockView = true;
        localOrCookieStorage.setItem('registratieBlockView', this.blockView.toString());
    }

    onMoreOptions() {
        if (!this.afspraak || this.afspraak.lesgroepen?.length === 0) {
            return;
        }
        const popup = this.popupService.popup(
            this.moreOptionsRef,
            LesgroepDeeplinkPopupComponent.defaultPopupsettings,
            LesgroepDeeplinkPopupComponent
        );
        popup.lesgroepen = this.afspraak.lesgroepen;
        popup.metStudiewijzerLink = true;
        popup.toonNieuweNotitie = true;
    }

    openWerkdruk(leerling: PartialLeerlingFragment) {
        if (!this.afspraak) {
            return;
        }

        const beginVanJaar = new Date(this.afspraak.jaar, 0, 1);
        const peildatum = addWeeks(beginVanJaar, this.afspraak.week);
        const schooljaar = getSchooljaar(peildatum);

        this.sidebarService.openSidebar(WerkdrukSidebarComponent, {
            lesgroepen: this.afspraak.lesgroepen,
            initielePeildatum: peildatum,
            eersteWeek: getISOWeek(schooljaar.start) + 1,
            laatsteWeek: getISOWeek(schooljaar.eind),
            initieleLeerlingenContext: [leerling],
            showAddItem: false
        });
    }

    get isExtraRegistratiesVisible() {
        return (
            this.lesRegistratie?.overigeVrijVeldDefinities &&
            this.lesRegistratie?.overigeVrijVeldDefinities?.some((vrijveld) => !vrijveld.vastgezet)
        );
    }

    get registratieDisabled() {
        return this.loading || !this.enabled;
    }

    openInfopanelsSidebar(navItem: infopanelsNavItem) {
        if (this.unfilteredSignaleringen$ && this.lesRegistratie) {
            if (!this.signaleringen$) {
                this.loadSignaleringen();
            }
            const titel = formatDateNL(this.afspraak!.begin, 'dag_uitgeschreven_dagnummer_maand');
            this.sidebarService.openSidebar(InfopanelsSidebarComponent, {
                titel,
                navItem,
                leerlingRegistraties: this.lesRegistratie?.leerlingRegistraties,
                vrijVeldDefinities: this.alleVrijveldDefinities
            });
        }
    }

    public loadSignaleringen() {
        this.unfilteredSignaleringen$
            .pipe(take(1))
            .subscribe(() => this.regDataService.addRegistratiesToSignaleringen(this.lesRegistratie, this.afspraak!.id));

        this.signaleringen$ = combineLatest([this.unfilteredSignaleringen$, this.signaleringInstellingen$]).pipe(
            map(([signaleringen, signaleringenInstellingen]) => {
                const alleZichtbareVrijVelden: VrijVeld[] = this.alleVrijveldDefinities.filter(
                    (def) => !signaleringenInstellingen.verborgenVrijeVeldenIds.includes(def.id)
                );
                return {
                    ...signaleringen,
                    vrijVeldSignaleringen: alleZichtbareVrijVelden.map((vrijVeldDef) => {
                        const gevondenVrijVeldSignalering = signaleringen?.vrijVeldSignaleringen?.find(
                            (vvs) => vvs.vrijVeld.naam === vrijVeldDef.naam
                        );
                        const leerlingSignaleringen = gevondenVrijVeldSignalering ? gevondenVrijVeldSignalering.leerlingSignaleringen : [];
                        const keuzelijstWaardeSignaleringen = vrijVeldDef.keuzelijstWaardeMogelijkheden!.map((klwm) => {
                            const gevondenKeuzelijstWaardeSignalering = gevondenVrijVeldSignalering?.keuzelijstWaardeSignaleringen?.find(
                                (ksig) => ksig.keuzelijstWaarde.id === klwm.id
                            );
                            return gevondenKeuzelijstWaardeSignalering
                                ? gevondenKeuzelijstWaardeSignalering
                                : { keuzelijstWaarde: klwm, leerlingSignaleringen: [] };
                        });
                        return {
                            vrijVeld: vrijVeldDef,
                            leerlingSignaleringen: leerlingSignaleringen.filter((lsig) => lsig.aantal >= signaleringenInstellingen.aantal),
                            keuzelijstWaardeSignaleringen: keuzelijstWaardeSignaleringen.map((keuze) => ({
                                ...keuze,
                                leerlingSignaleringen: keuze.leerlingSignaleringen.filter(
                                    (lsig) => lsig.aantal >= signaleringenInstellingen.aantal
                                )
                            }))
                        } as VrijVeldSignalering;
                    })
                } as SignaleringenQuery['signaleringen'];
            })
        );
    }

    private createDefaultRegistratiePopupSettings(): PopupSettings {
        const popupSettings = createDefaultRegistratiePopupSettings(this.deviceService.isPhoneOrTablet());
        popupSettings.scrollable = true;
        popupSettings.showHeader = false;
        return popupSettings;
    }

    private bepaalIedereenExternGeregistreerd() {
        this.heeftIedereenExterneRegistratie = this.lesRegistratie.leerlingRegistraties.every((leerlingReg) =>
            heeftExterneRegistratie(this.afspraak!, leerlingReg)
        );
    }

    bepaalBulkStatusVerwijderd() {
        if (!this.lesRegistratie) {
            return;
        }
        this.isIedereenAfwezig = this.getAlleNietExterneRegistraties().every((leerlingReg) => !leerlingReg.aanwezig);

        // Iedereen die verwijderd *kan* worden, is verwijderd (en er is tenminste 1 persoon daadwerkelijk verwijderd.)
        this.heeftIedereenRegistratieVerwijderd =
            this.lesRegistratie.leerlingRegistraties.every(
                (leerlingReg) => heeftExterneRegistratie(this.afspraak!, leerlingReg) || !leerlingReg.aanwezig || leerlingReg.verwijderd
            ) && Boolean(this.lesRegistratie.leerlingRegistraties.find((leerlingReg) => leerlingReg.verwijderd));
    }

    bepaalBulkStatusHuiswerk() {
        this.heeftIedereenRegistratieHuiswerk = this.lesRegistratie?.leerlingRegistraties.every(
            (leerlingReg) => leerlingReg.huiswerkNietInOrde
        );
    }

    bepaalBulkStatusMateriaal() {
        this.heeftIedereenRegistratieMateriaal = this.lesRegistratie?.leerlingRegistraties.every(
            (leerlingReg) => leerlingReg.materiaalVergeten
        );
    }

    heeftIedereenRegistratieAankruisVakVrijVeld(vrijVeldId: string): boolean {
        const vrijVeld = this.lesRegistratie.overigeVrijVeldDefinities.find((vvdefinitie) => vvdefinitie.id === vrijVeldId)!;
        if (!this.isAankruisvak(vrijVeld)) return false;

        return Boolean(this.vrijeVeldenMetVolledigeRegistratie.find((id) => id === vrijVeldId));
    }

    private getVrijVeldWaarde(
        leerlingReg: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number],
        vrijVeldId: string
    ): Optional<VrijVeldWaarde> {
        return leerlingReg.overigeVrijVeldWaarden.find((vrijVeldWaarde) => vrijVeldWaarde.vrijveld.id === vrijVeldId);
    }

    heeftGevuldeVrijVeldWaarde(
        leerlingReg: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number],
        vrijVeldId: string
    ): boolean {
        const vrijVeldWaarde = this.getVrijVeldWaarde(leerlingReg, vrijVeldId);
        if (!vrijVeldWaarde) {
            return false;
        }
        return Boolean(vrijVeldWaarde.booleanWaarde || vrijVeldWaarde.keuzelijstWaarde);
    }

    private setBulkStatusLosVrijVeld(vrijVeldId: string, heeftIedereenRegistratieVrijVeld: boolean) {
        if (heeftIedereenRegistratieVrijVeld) {
            if (!this.vrijeVeldenMetVolledigeRegistratie.find((id) => id === vrijVeldId)) {
                this.vrijeVeldenMetVolledigeRegistratie.push(vrijVeldId);
            }
        } else {
            this.vrijeVeldenMetVolledigeRegistratie = this.vrijeVeldenMetVolledigeRegistratie.filter((id) => id !== vrijVeldId);
        }
    }

    bepaalBulkStatusLosVrijVeld(vrijVeldId: string) {
        const heeftIedereenRegistratieVrijVeld = this.lesRegistratie?.leerlingRegistraties.every((leerlingReg) =>
            this.heeftGevuldeVrijVeldWaarde(leerlingReg, vrijVeldId)
        );

        this.setBulkStatusLosVrijVeld(vrijVeldId, heeftIedereenRegistratieVrijVeld);
    }

    /**
     * De toegestane absentieredenen kunnen per leerling verschillen (zijn afhankelijk van de vestiging van de plaatsing.)
     * Voor bulkregistratie zijn daarom alleen de absentieredenen beschikbaar die alle leerlingen gemeenschappelijk hebben.
     */
    private getAbsentieRedenenVoorIedereenBeschikbaar(): AbsentieRedenFieldsFragment[] {
        const absentieRedenenAlleLeerlingen = this.lesRegistratie.leerlingRegistraties.map(
            (leerlingReg) => leerlingReg.absentieRedenenToegestaanVoorDocent
        );
        return intersection(...absentieRedenenAlleLeerlingen);
    }

    private createBulkDummyRegistratie() {
        return {
            id: BULK_DUMMY_REGISTRATIE_ID,
            leerling: {
                id: BULK_DUMMY_LEERLING_ID
            } as Leerling,
            overigeVrijVeldWaarden: [],
            huiswerkNietInOrde: false,
            materiaalVergeten: false,
            aanwezig: true,
            dirty: false,
            absentieRedenenToegestaanVoorDocent: [],
            notitieboekToegankelijk: false
        } as LeerlingRegistratie;
    }

    private getLeerlingAbsentieMeldingFromBulkDummy(
        leerlingReg: LeerlingRegistratieQueryType,
        bulkAbsentieMelding: AbsentieMelding | null,
        bulkAbsentieSoort: AbsentieSoort
    ): AbsentieMelding | null {
        if (bulkAbsentieSoort === AbsentieSoort.Absent && !magAbsentieMeldingBewerken(this.afspraak!, leerlingReg)) {
            // Als de evt. bestaande melding niet bewerkt mag worden (lopende ziekmelding / telaat door externe docent),
            // willen we nog wel een afwezig-constatering kunnen doen.
            return (leerlingReg.absent ?? leerlingReg.teLaat ?? null) as AbsentieMelding | null;
        }

        if (!bulkAbsentieMelding) {
            return null;
        }

        const actualId = bulkAbsentieMelding.id
            .replace(BULK_DUMMY_REGISTRATIE_ID, leerlingReg.id)
            .replace(BULK_DUMMY_LEERLING_ID, leerlingReg.leerling.id);

        return {
            ...bulkAbsentieMelding,
            id: actualId
        };
    }

    private openBulkAbsentieMeldingPopup(
        connectedComponent: ViewContainerRef,
        bulkAbsentieSoort: AbsentieSoort,
        toepasbareRegistraties: LeerlingRegistratieQueryType[]
    ) {
        const bulkRegistratie = this.createBulkDummyRegistratie();
        bulkRegistratie.absentieRedenenToegestaanVoorDocent = this.getAbsentieRedenenVoorIedereenBeschikbaar();

        const popupSettings = this.createDefaultRegistratiePopupSettings();

        const popup = this.popupService.popup(connectedComponent, popupSettings, AbsentieMeldingPopupComponent);
        popup.registratie = bulkRegistratie;
        popup.afspraak = this.afspraak!;
        popup.absentieSoort = bulkAbsentieSoort;
        popup.absentieRedenLabel = 'Afwezigheidsreden voor iedereen';

        if (bulkAbsentieSoort === AbsentieSoort.Verwijderd) {
            popup.saveButtonGtmTag = 'lesregistratie-bulk-verwijderd';
        }

        popup.onSave = (bulkAbsentieMelding: AbsentieMelding | null) => {
            toepasbareRegistraties.forEach((leerlingReg) => {
                const leerlingAbsentieMelding = this.getLeerlingAbsentieMeldingFromBulkDummy(
                    leerlingReg,
                    bulkAbsentieMelding,
                    bulkAbsentieSoort
                );

                this.regDataService.registreerAfwezigTeLaatOfVerwijderd(
                    leerlingReg.id,
                    this.afspraak!.id,
                    bulkAbsentieSoort,
                    leerlingAbsentieMelding
                );
            });

            if (bulkAbsentieSoort === AbsentieSoort.Verwijderd) {
                this.heeftIedereenRegistratieVerwijderd = true;
            }
        };
    }

    private getAlleNietExterneRegistraties(): LeerlingRegistratieQueryType[] {
        return this.lesRegistratie.leerlingRegistraties.filter((leerlingReg) => !heeftExterneRegistratie(this.afspraak!, leerlingReg));
    }

    private bulkRegistreerAanwezig() {
        const toepasbareRegistraties = this.getAlleNietExterneRegistraties();
        toepasbareRegistraties.forEach((leerlingReg) => this.regDataService.registreerAanwezig(leerlingReg.id, this.afspraak!.id));
    }

    private bulkRegistreerAfwezig() {
        const toepasbareRegistraties = this.getAlleNietExterneRegistraties();
        const beschikbareAbsentieRedenenTypeAbsent = this.getAbsentieRedenenVoorIedereenBeschikbaar().filter(
            (absentieReden) => absentieReden.absentieSoort === AbsentieSoort.Absent
        );

        if (beschikbareAbsentieRedenenTypeAbsent.length > 0) {
            this.openBulkAbsentieMeldingPopup(this.aanwezigheidHeader, AbsentieSoort.Absent, toepasbareRegistraties);
        } else {
            toepasbareRegistraties.forEach((leerlingReg) =>
                this.regDataService.registreerAfwezig(leerlingReg.id, this.afspraak!.id, leerlingReg.absent)
            );
        }
    }

    private bulkRegistreerTeLaat() {
        // Extra check op telaatmelding door externe docent, want dit is niet altijd een externe registratie ivm nog kunnen toevoegen eigen constatering.
        // Maar de te laat-melding mag dan niet bewerkt worden, en telaat registreren is ook niet de route voor een eigen aanwezig/afwezig constatering.
        const toepasbareRegistraties = this.getAlleNietExterneRegistraties().filter(
            (leerlingReg) => !isTeLaatGemeldDoorAndereDocent(this.afspraak!, leerlingReg)
        );
        this.openBulkAbsentieMeldingPopup(this.aanwezigheidHeader, AbsentieSoort.Telaat, toepasbareRegistraties);
    }

    openBulkAanwezigheidSelectiePopup() {
        if (!this.enabled || this.loading) {
            return;
        }

        if (this.popupService.isPopupOpenFor(this.aanwezigheidHeader)) {
            this.popupService.closePopUp();
            return;
        }

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 226;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(this.aanwezigheidHeader, popupSettings, ActionsPopupComponent);
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };

        popup.title = 'Registreer iedereen';
        popup.customButtons = [
            {
                icon: 'yesRadio',
                iconcolor: 'accent_positive_1',
                text: 'Aanwezig',
                gtmTag: 'lesregistratie-bulk-aanwezig',
                onClickFn: () => this.bulkRegistreerAanwezig()
            },
            {
                icon: 'noRadio',
                iconcolor: 'accent_negative_1',
                text: 'Afwezig',
                gtmTag: 'lesregistratie-bulk-afwezig',
                onClickFn: () => this.bulkRegistreerAfwezig()
            }
        ];

        if (this.teLaatMeldingToegestaan) {
            popup.customButtons.push({
                icon: 'klok',
                iconcolor: 'secondary_1',
                text: 'Te laat',
                gtmTag: 'lesregistratie-bulk-telaat',
                onClickFn: () => this.bulkRegistreerTeLaat()
            });
        }
    }

    private openBulkRegistreerVerwijderdPopup() {
        if (this.popupService.isPopupOpenFor(this.verwijderdHeader)) {
            this.popupService.closePopUp();
            return;
        }

        const toepasbareRegistraties = this.getAlleNietExterneRegistraties().filter((leerlingReg) => leerlingReg.aanwezig);
        this.openBulkAbsentieMeldingPopup(this.verwijderdHeader, AbsentieSoort.Verwijderd, toepasbareRegistraties);
    }

    private openBulkRegistratiePopup(
        connectedComponent: ViewContainerRef,
        title: string,
        check: boolean,
        onBulkConfirm: (check: boolean) => void
    ) {
        if (this.popupService.isPopupOpenFor(connectedComponent)) {
            this.popupService.closePopUp();
            return;
        }

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 226;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(connectedComponent, popupSettings, ActionsPopupComponent);
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };

        popup.title = title;

        const icon = check ? 'bulkCheck' : 'bulkUncheck';
        const text = check ? 'Registreer iedereen' : 'Wis voor iedereen';
        const actionColor = check ? 'primary_1' : 'accent_negative_1';
        const gtmTag = check ? 'lesregistratie-bulk-registreer-iedereen' : undefined;

        popup.customButtons = [
            {
                icon,
                iconcolor: actionColor,
                text,
                textcolor: actionColor,
                gtmTag,
                onClickFn: () => onBulkConfirm(check)
            }
        ];
    }

    private bulkWisVerwijderdMelding = () => {
        this.getAlleNietExterneRegistraties().forEach((leerlingReg) => this.regDataService.annuleerVerwijderdMelding(leerlingReg.id));
        this.heeftIedereenRegistratieVerwijderd = false;
    };

    openBulkVerwijderdMeldingPopup() {
        if (!this.enabled || this.loading || this.heeftIedereenExterneRegistratie || this.isIedereenAfwezig) {
            return;
        }

        if (this.heeftIedereenRegistratieVerwijderd) {
            this.openBulkRegistratiePopup(this.verwijderdHeader, 'Verwijderd', false, this.bulkWisVerwijderdMelding);
        } else {
            this.openBulkRegistreerVerwijderdPopup();
        }
    }

    private bulkRegistreerHuiswerk = (booleanWaarde: boolean) => {
        this.lesRegistratie.leerlingRegistraties.forEach((leerlingReg) =>
            this.regDataService.registreerHuiswerk(leerlingReg.id, leerlingReg.leerling.id, this.afspraak!.id, booleanWaarde)
        );
        this.heeftIedereenRegistratieHuiswerk = booleanWaarde;
    };

    openBulkHuiswerkPopup() {
        if (!this.enabled || this.loading) {
            return;
        }

        const booleanWaarde = !this.heeftIedereenRegistratieHuiswerk;
        this.openBulkRegistratiePopup(this.huiswerkHeader, 'Huiswerk niet in orde', booleanWaarde, this.bulkRegistreerHuiswerk);
    }

    private bulkRegistreerMateriaal = (booleanWaarde: boolean) => {
        this.lesRegistratie.leerlingRegistraties.forEach((leerlingReg) =>
            this.regDataService.registreerMateriaal(leerlingReg.id, leerlingReg.leerling.id, this.afspraak!.id, booleanWaarde)
        );
        this.heeftIedereenRegistratieMateriaal = booleanWaarde;
    };

    openBulkMateriaalPopup() {
        if (!this.enabled || this.loading) {
            return;
        }

        const booleanWaarde = !this.heeftIedereenRegistratieMateriaal;
        this.openBulkRegistratiePopup(this.materiaalHeader, 'Materiaal niet in orde', booleanWaarde, this.bulkRegistreerMateriaal);
    }

    private bulkRegistreerAankruisvakVrijVeld(booleanWaarde: boolean, vrijVeldId: string) {
        this.lesRegistratie.leerlingRegistraties.forEach((leerlingReg) =>
            this.regDataService.registreerOverigeAankruisvakVrijVeldWaarde(
                this.afspraak!.id,
                leerlingReg.id,
                leerlingReg.leerling.id,
                vrijVeldId,
                booleanWaarde
            )
        );
        this.setBulkStatusLosVrijVeld(vrijVeldId, booleanWaarde);
    }

    private bulkRegistreerKeuzelijstVrijVeld(vrijveld: VrijVeld, keuzelijstWaarde: KeuzelijstWaardeMogelijkheid | null) {
        this.lesRegistratie.leerlingRegistraties.forEach((leerlingReg) =>
            this.regDataService.registreerOverigeKeuzelijstVrijVeldWaarde(
                this.afspraak!.id,
                leerlingReg.id,
                leerlingReg.leerling.id,
                vrijveld.id,
                keuzelijstWaarde
            )
        );
        this.setBulkStatusLosVrijVeld(vrijveld.id, keuzelijstWaarde !== null);
    }

    /**
     * Vergelijkt de booleanWaarde van beide VrijVeldWaarden, waarbij een ontbrekende VrijVeldWaarde gelijk is aan een false-waarde.
     */
    private booleanVrijVeldWaardeEqual = (a: Optional<VrijVeldWaarde>, b: Optional<VrijVeldWaarde>): boolean => {
        return Boolean(a?.booleanWaarde) === Boolean(b?.booleanWaarde);
    };
    /**
     * Vergelijkt de keuzelijstWaarde van beide VrijVeldWaarden. Ontbrekende VrijVeldWaarden of keuzeLijstWaarden worden als ongelijk gezien.
     */
    private keuzelijstVrijVeldWaardeEqual = (a: Optional<VrijVeldWaarde>, b: Optional<VrijVeldWaarde>): boolean => {
        return a?.keuzelijstWaarde === b?.keuzelijstWaarde;
    };

    getVrijVeldWaardeVanIedereen(vrijVeld: VrijVeld): Optional<VrijVeldWaarde> {
        if (this.lesRegistratie.leerlingRegistraties.length === 0) {
            return undefined;
        }
        const eersteRegistratie = this.lesRegistratie.leerlingRegistraties[0];
        const eersteVrijVeldWaarde = this.getVrijVeldWaarde(eersteRegistratie, vrijVeld.id);
        const isWaardeEqualFn = this.isKeuzelijst(vrijVeld) ? this.keuzelijstVrijVeldWaardeEqual : this.booleanVrijVeldWaardeEqual;

        const alleWaardenGelijk = this.lesRegistratie.leerlingRegistraties.every((leerlingReg) =>
            isWaardeEqualFn(eersteVrijVeldWaarde, this.getVrijVeldWaarde(leerlingReg, vrijVeld.id))
        );

        return alleWaardenGelijk ? eersteVrijVeldWaarde : undefined;
    }

    private openLosVrijVeldKeuzePopup(vrijveld: VrijVeld, connectedComponent: ViewContainerRef) {
        if (this.popupService.isPopupOpenFor(connectedComponent)) {
            this.popupService.closePopUp();
            return;
        }

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 156;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(connectedComponent, popupSettings, ActionsPopupComponent);
        popup.title = vrijveld.naam;
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };
        popup.customButtons = createVrijVeldKeuzePopupCustomButtons(
            vrijveld,
            this.getVrijVeldWaardeVanIedereen(vrijveld),
            this.bulkRegistreerKeuzelijstVrijVeld.bind(this)
        );
        popup.buttonsBeforeDivider = popup.customButtons.length - 1;
    }

    private isKeuzelijst(vrijVeld: VrijVeld): boolean {
        return Boolean(vrijVeld.keuzelijstWaardeMogelijkheden && vrijVeld.keuzelijstWaardeMogelijkheden.length > 0);
    }
    private isAankruisvak(vrijVeld: VrijVeld): boolean {
        return !this.isKeuzelijst(vrijVeld);
    }

    openBulkLosVrijVeldPopup(vrijVeldId: string, index: number) {
        if (!this.enabled || this.loading) {
            return;
        }

        const heeftIedereenRegistratieVrijVeld = Boolean(this.vrijeVeldenMetVolledigeRegistratie.find((id) => id === vrijVeldId));
        const vrijveld = this.lesRegistratie.overigeVrijVeldDefinities.find((vvdefinitie) => vvdefinitie.id === vrijVeldId)!;
        const losVrijVeldHeader = this.extraRegistratiesLosHeaders.get(index)!;

        if (this.isAankruisvak(vrijveld)) {
            this.openBulkRegistratiePopup(losVrijVeldHeader, vrijveld.naam, !heeftIedereenRegistratieVrijVeld, () =>
                this.bulkRegistreerAankruisvakVrijVeld(!heeftIedereenRegistratieVrijVeld, vrijVeldId)
            );
        } else {
            this.openLosVrijVeldKeuzePopup(vrijveld, losVrijVeldHeader);
        }
    }

    private bulkRegistreerMeerRegistratiePopupWaardes(bulkVrijVeldWaardes: VrijVeldWaarde[]) {
        const meerRegistratiesVrijVelden = this.alleExtraVrijveldDefinities.slice(this.aantalExtraRegistratiesTonen);

        this.lesRegistratie.leerlingRegistraties.forEach((leerlingReg) => {
            const teBehoudenVrijVeldWaardes = leerlingReg.overigeVrijVeldWaarden.filter(
                (vrijVeldWaarde) => !meerRegistratiesVrijVelden.find((vrijveld) => vrijveld.id === vrijVeldWaarde.vrijveld.id)
            );
            const updatedLeerlingVrijVeldWaardes: VrijVeldWaarde[] = [...teBehoudenVrijVeldWaardes];

            bulkVrijVeldWaardes.forEach((bulkWaarde) => {
                const bestaandeLeerlingVrijVeldWaarde = leerlingReg.overigeVrijVeldWaarden.find(
                    (lw) => lw.vrijveld.id === bulkWaarde.vrijveld.id
                );
                if (bestaandeLeerlingVrijVeldWaarde) {
                    const updatedLeerlingVrijVeldWaarde = {
                        ...bestaandeLeerlingVrijVeldWaarde,
                        booleanWaarde: bulkWaarde.booleanWaarde,
                        keuzelijstWaarde: bulkWaarde.keuzelijstWaarde
                    };
                    updatedLeerlingVrijVeldWaardes.push(updatedLeerlingVrijVeldWaarde);
                } else {
                    const nieuweLeerlingVrijVeldWaarde = {
                        ...bulkWaarde,
                        id: leerlingReg.leerling.id + '-' + bulkWaarde.vrijveld.id
                    };
                    updatedLeerlingVrijVeldWaardes.push(nieuweLeerlingVrijVeldWaarde);
                }
            });

            this.regDataService.registreerOverigeVrijVeldWaarden(
                this.afspraak!.id,
                leerlingReg.id,
                leerlingReg.leerling.id,
                updatedLeerlingVrijVeldWaardes
            );
        });
    }

    openBulkMeerRegistratiesPopup() {
        if (!this.enabled || this.loading) {
            return;
        }

        if (this.popupService.isPopupOpenFor(this.extraRegistraties)) {
            this.popupService.closePopUp();
            return;
        }

        const meerRegistratiesVrijVelden = this.alleExtraVrijveldDefinities.slice(this.aantalExtraRegistratiesTonen);
        const vrijVeldWaardesVoorIedereenGelijk = meerRegistratiesVrijVelden
            .map((vrijVeld) => this.getVrijVeldWaardeVanIedereen(vrijVeld))
            .filter(Boolean)
            .map((vrijveldWaarde) => vrijveldWaarde as VrijVeldWaarde);
        const bulkDummyRegistratie = this.createBulkDummyRegistratie();
        bulkDummyRegistratie.overigeVrijVeldWaarden = vrijVeldWaardesVoorIedereenGelijk;

        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.width = 320;

        const popup = this.popupService.popup(this.extraRegistraties, popupSettings, FlexibeleRegistratiePopupComponent);
        popup.leerlingRegistratie = bulkDummyRegistratie;
        popup.vrijveldDefinities = meerRegistratiesVrijVelden;
        popup.toonHWenMT = false;
        popup.saveButtonGtmTag = 'lesregistratie-bulk-meer-registraties';
        popup.save = (vrijveldWaardes: VrijVeldWaarde[]) => this.bulkRegistreerMeerRegistratiePopupWaardes(vrijveldWaardes);
    }
}
