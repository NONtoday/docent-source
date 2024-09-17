import { CdkTableModule } from '@angular/cdk/table';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject, output, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    KeuzelijstWaardeMogelijkheid,
    LeerlingAfwezigheidsKolom,
    PartialLeerlingFragment,
    RegistratiePeriode,
    SignaleringFilter,
    SignaleringenFiltersQuery,
    Vak,
    VakRegistraties,
    VakoverzichtRegistratiesQuery,
    VrijVeld,
    VrijveldRegistratiesFieldsFragment
} from '@docent/codegen';
import { IconDirective, PillComponent, SpinnerComponent, TooltipDirective } from 'harmony';
import {
    IconBlokken,
    IconChevronOnder,
    IconFilter,
    IconInformatie,
    IconMarkeren,
    IconSettings,
    IconUitklappenLinks,
    IconUitklappenRechts,
    IconWaarschuwing,
    provideIcons
} from 'harmony-icons';
import { identity, pickBy, times } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { allowChildAnimations } from '../../core/core-animations';
import { CellData, RegistratieTabel, TabelKolom, VakKolom } from '../../core/models/mentordashboard.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService, phoneQuery, tabletPortraitQuery } from '../../core/services/device.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { TableService } from '../../core/services/table.service';
import { VakKolomSelectiePopupComponent } from '../../layout/header/vakkolom-selectie-popup/vakkolom-selectie-popup.component';
import { MentorleerlingenPopupComponent } from '../../layout/menu/mentorleerlingen-popup/mentorleerlingen-popup.component';
import { Optional, isPresent, toId } from '../../rooster-shared/utils/utils';
import { LeerlingoverzichtDataService } from '../leerlingoverzicht/leerlingoverzicht-data.service';
import { registratieContent } from '../leerlingoverzicht/leerlingoverzicht.model';
import { LeerlingregistratiesSidebarComponent } from '../leerlingregistraties-sidebar/leerlingregistraties-sidebar.component';
import { LeerlingregistratiesSignaleringenTotaalPopupComponent } from '../leerlingregistraties-signaleringen-totaal-popup/leerlingregistraties-signaleringen-totaal-popup.component';
import { LeerlingregistratiesTotaalPopupComponent } from '../leerlingregistraties-totaal-popup/leerlingregistraties-totaal-popup.component';
import { LeerlingregistratiesWeergavePopupComponent } from '../leerlingregistraties-weergave-popup/leerlingregistraties-weergave-popup.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardService } from '../mentordashboard.service';
import {
    invertedVrijVeldNaam,
    loaderTooltip,
    registratieDetailTooltip,
    registratiePeriodeTooltip,
    vrijVeldNaam,
    vrijveldRegistratiesCategorieId
} from '../mentordashboard.utils';
import { SignaleringAantalPopupComponent, SignaleringPopupFilter } from '../signalering-aantal-popup/signalering-aantal-popup.component';

export interface VakHeaderNavigatie {
    vakkolom: VakKolom;
    leerling: PartialLeerlingFragment;
    onTerugClick: () => void;
    onVakNaamClick: (avatarRef: ViewContainerRef) => void;
}

@Component({
    selector: 'dt-leerlingregistraties-table',
    templateUrl: './leerlingregistraties-table.component.html',
    styleUrls: ['./../table.scss', './leerlingregistraties-table.component.scss'],
    animations: [allowChildAnimations],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, CdkTableModule, TooltipDirective, SpinnerComponent, AsyncPipe, KeyValuePipe, IconDirective, PillComponent],
    providers: [
        provideIcons(
            IconWaarschuwing,
            IconChevronOnder,
            IconMarkeren,
            IconSettings,
            IconUitklappenLinks,
            IconUitklappenRechts,
            IconInformatie,
            IconFilter,
            IconBlokken
        )
    ]
})
export class LeerlingregistratiesTableComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private tableService = inject(TableService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    public mentordashboardService = inject(MentordashboardService);
    private sidebarService = inject(SidebarService);
    @ViewChild('filterButton', { read: ViewContainerRef }) filterButtonRef: ViewContainerRef;
    @ViewChild('filterButtonMobile', { read: ViewContainerRef }) filterButtonMobileRef: ViewContainerRef;
    @ViewChild('signaleringButton', { read: ViewContainerRef }) signaleringButtonRef: ViewContainerRef;

    onSignaleringenSave = output<void>();

    public registratieTabel$: Observable<RegistratieTabel>;

    public selectedPeriode$ = new BehaviorSubject<number>(1);
    public selectedItemIndex$ = new BehaviorSubject<Optional<number>>(null);
    public leerlingRegistratiesSidebar$: SidebarInputs<LeerlingregistratiesSidebarComponent>;

    public highlightIndex: Optional<number>;
    public detailTooltip = signal<Optional<string>>(loaderTooltip);
    private tooltipDelay: NodeJS.Timeout;

    // Ghost (loading) table
    loadingDataSourceRows: Record<string, string>[] = times(20, (index: number) => ({ [`empty${index}`]: '' }));
    loadingDataSourceColumns: string[] = times(7, (index: number) => `empty${index}`);
    loadingEmptySource: { empty: string }[] = times(20, () => ({ empty: '' }));

    private destroy$ = new Subject<void>();

    private leerlingoverzichtDataService = inject(LeerlingoverzichtDataService);

    ngOnInit(): void {
        const leerlingId$ = this.route.parent!.paramMap.pipe(
            map((map) => map.get('id')),
            filter(isPresent),
            shareReplayLastValue()
        );

        const signaleringen$ = this.mentordashboardDataService.getSignaleringenFilters();
        const registraties$ = leerlingId$.pipe(
            filter(isPresent),
            switchMap((leerlingId) => this.mentordashboardDataService.getVakoverzichtRegistraties(leerlingId)),
            shareReplayLastValue()
        );

        const isPhoneOrTabletPortrait$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery]),
            startWith(this.deviceService.isPhoneOrTabletPortrait()),
            tap((isPhoneOrTablet) => {
                // wanneer we terug switchen naar tablet/desktop moet de header navigatie weer terug gezet worden
                if (!isPhoneOrTablet) {
                    this.selectedItemIndex$.next(null);
                    this.mentordashboardService.setVakNavigatie(null);
                    this.tableService.showAllMenus();
                }
            }),
            shareReplayLastValue()
        );

        /**
         * Dit vult de mentordashboardService.periodeGeopend$ met een object van periodenummer als key, en of de periode open staat als value
         * bv: { 1: true, 2: false, 3: false }.
         * Wanneer de gebruiker een periode open of dicht heeft geklikt moet deze open of dicht blijven
         */
        combineLatest([isPhoneOrTabletPortrait$, registraties$])
            .pipe(
                map(([isMobile, registraties]) =>
                    registraties.periodes.reduce(
                        (acc, periode) => ({
                            ...acc,
                            [periode.nummer]:
                                this.mentordashboardService.isPeriodeOpen(periode.nummer) ||
                                (this.mentordashboardService.isPeriodeOpen(periode.nummer) === undefined && periode.isHuidig) ||
                                isMobile
                        }),
                        {}
                    )
                ),
                takeUntil(this.destroy$)
            )
            .subscribe(this.mentordashboardService.setPeriodeGeopend);

        registraties$
            .pipe(
                map((registraties) => registraties.periodes.find((periode) => periode.isHuidig)?.nummer ?? 1),
                takeUntil(this.destroy$)
            )
            .subscribe(this.selectedPeriode$);

        const leerlingoverzichtWeergaves$ = leerlingId$.pipe(
            switchMap((id) => this.leerlingoverzichtDataService.leerlingoverzichtInstellingen(id)),
            map((instellingen) => instellingen.weergaves)
        );

        /**
         * Dit is de data van de gehele tabel. Deze tabel bevat de vakken voor de linkerkant, en voor elke periode een tabel met een datasource
         * De datasource is een array van objecten met de kolommen van de tabel als keys en als value een object met daarin de data van de cell,
         * zoals het label en of die gehightlight moet zijn (vanwege een signalering filter). Verder bevat een periodetabel data voor de header
         * (het gedeelte dat je in en uit kan klappen) en welke kolommen er getoond moeten worden.
         *
         * Wanneer er gefiltert wordt of wanneer een periode dicht wordt geklapt, wordt de tabel opnieuw aangemaakt, maar dan met de data
         * die dan nog zichtbaar moet zijn op dat moment. Is een periode dichtgeklapt dan zou deze maar 1 rij bevatten, met daarin objecten met
         * alleen een 'empty' key.
         */
        this.registratieTabel$ = combineLatest([
            registraties$,
            signaleringen$,
            this.mentordashboardService.periodeGeopend$,
            leerlingoverzichtWeergaves$
        ]).pipe(
            map(([registraties, signalFilters, periodeOpen, zichtbareKolommen]) => {
                const leerlingId = this.route.parent!.snapshot.paramMap.get('id');

                const iedereenSignal = signalFilters.filters.reduce(this.toSignaleringObject, {});
                const leerlingSignal =
                    signalFilters.leerlingFilters
                        .find((filter) => filter.leerlingId === leerlingId)
                        ?.filters.reduce(this.toSignaleringObject, {}) ?? {};

                const vasteKolommen = [
                    LeerlingAfwezigheidsKolom.ONGEOORLOOFD_AFWEZIG,
                    LeerlingAfwezigheidsKolom.GEOORLOOFD_AFWEZIG,
                    LeerlingAfwezigheidsKolom.TE_LAAT,
                    LeerlingAfwezigheidsKolom.VERWIJDERD
                ].map(leerlingAfwezigheidsKolomToTabelKolom);
                // elke periode heeft dezelfde vrijeVelden, dus we halen ze uit de eerste periode
                const vrijeVeldenKolommen = registraties.periodes[0].totaalVrijVeldRegistraties.map(vrijVeldRegistratiestoTabelKolom);
                const kolomIds = [...vrijeVeldenKolommen.map(toId), ...vasteKolommen.map(toId)];
                const columns = [...vasteKolommen, ...vrijeVeldenKolommen];
                const huidigePeriode = registraties.periodes.find((periode) => periode.isHuidig);

                // signaleringen is een object met alle instellingen voor iedereen,
                // maar alle ingestelde leerling instellingen overschrijven de iedereen instellingen
                // de PickBy zorgt ervoor dat alle niet ingestelde leerling instellingen genegeerd worden
                const signaleringen = Object.assign(iedereenSignal, pickBy(leerlingSignal, identity));

                const signaleringPopupData = this.createSignaleringPopupData(columns, signalFilters, leerlingId!);
                return {
                    signaleringPopupData,
                    aantalSignaleringen: Object.keys(signaleringen).length,
                    aantalActieveSignaleringen: Object.values(signaleringen).filter((signalering) => signalering && signalering > 0).length,
                    // er kunnen vrije velden in mongo staan die niet meer actief zijn. Filter deze uit de zichtbare columns
                    zichtbareKolommen: zichtbareKolommen.filter((kolom) => kolomIds.includes(kolom)),
                    columns,
                    periodes: registraties.periodes,
                    tables: registraties.periodes.map((periode) => {
                        const isOpen = periodeOpen[periode.nummer];

                        const filteredColumns = columns.filter((kolom) => zichtbareKolommen.includes(kolom.id));

                        const kolommen = isOpen ? filteredColumns.map((kolom) => kolom.tabelHeaderNaam) : ['empty'];
                        const kolomTooltips = isOpen ? filteredColumns.map((kolom) => kolom.naam) : ['empty'];

                        return {
                            header: {
                                nummer: periode.nummer,
                                label: `P${periode.nummer}`,
                                name: `Periode ${periode.nummer}`,
                                open: isOpen,
                                tooltip: registratiePeriodeTooltip(periode)
                            },
                            kolommen: isOpen ? kolommen : ['empty'],
                            kolomTooltips: isOpen ? kolomTooltips : ['empty'],
                            rijen: [
                                this.createTotaalRij(periode, signaleringen),
                                ...this.createVakRijen(periode, signaleringen),
                                this.createZonderVakRij(periode, signaleringen)
                            ]
                                .filter(isPresent) // filter mogelijke 'Geen vak' rij eruit wanneer deze niet bestaat. Zou niet voor moeten komen
                                .map((rij) => (isOpen ? rij : { empty: '', isTotaal: rij.isTotaal, isEmpty: true }))
                        };
                    }),
                    vakken: [
                        { naam: 'Totaal', isTotaal: true },
                        ...registraties.vakken.map((vak) => {
                            const vakregistraties = huidigePeriode?.vakRegistraties.find(
                                (vakRegistraties) => vakRegistraties.vak?.id === vak.id
                            );
                            const rij = vakregistraties ? this.rijData(vakregistraties) : [];

                            // we maken een nieuw object met alleen de gehightlighte registraties
                            // bv { 'Geoorloofd afwezig': 2, 'Ongeoorloofd afwezig': 1 }
                            const highlightedPeriodeSignaleringen = rij
                                .filter((cell) => this.heeftHighlight(cell.aantal, signaleringen[cell.kolom]))
                                .reduce((rij, cell) => ({ ...rij, [cell.kolom]: cell.aantal }), {});

                            return {
                                huidigePeriode,
                                naam: vak.naam,
                                isTotaal: false,
                                signals: Object.keys(highlightedPeriodeSignaleringen).length,
                                highlightedPeriodeSignaleringen
                            };
                        }),
                        { naam: 'Geen vak', isTotaal: false }
                    ]
                };
            }),
            takeUntil(this.destroy$),
            shareReplayLastValue()
        );

        combineLatest([this.selectedItemIndex$, this.registratieTabel$])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([selectedItemIndex, tabel]) => {
                if (!this.deviceService.isPhoneOrTabletPortrait()) {
                    this.mentordashboardService.setActions([]);
                    return;
                }
                const popupData = tabel.signaleringPopupData;

                const signaleringenButton = {
                    icon: 'settings' as const,
                    name: 'Signaleringen',
                    notificatie:
                        popupData.leerlingFilters.filter((filter, index) => filter.value || popupData.iedereenFilters[index].value).length >
                        0,
                    action: () => this.openSignaleringPopup(popupData),
                    gtmTag: 'leerling-registraties-signaleringen-button'
                };

                const filterButton = {
                    icon: 'filter' as const,
                    name: 'Filters',
                    notificatie: tabel.zichtbareKolommen.length > 0,
                    action: () => this.openFilterPopup(tabel.columns, tabel.zichtbareKolommen),
                    cyTag: 'filter-button'
                };

                this.mentordashboardService.setActions(selectedItemIndex ? [signaleringenButton, filterButton] : [signaleringenButton]);
            });
    }

    private createZonderVakRij(
        periode: RegistratiePeriode,
        signaleringen: ReturnType<LeerlingregistratiesTableComponent['toSignaleringObject']>
    ) {
        const zonderVakRegistraties = periode.vakRegistraties.find((vakRegistraties) => !isPresent(vakRegistraties.vak));
        if (!zonderVakRegistraties) return null;

        const standaardRijData = {
            vak: null,
            periode: periode,
            isTotaal: false
        };

        const rij = this.rijData(zonderVakRegistraties);

        /**
         * De rijData is een array van objecten met de kolommen en de aantallen
         * bv [{kolom: 'Te laat', aantal: 10}, ...].
         *
         * Van deze array van objecten maken we weer 1 groot object met alle kolommen als keys
         * en als value een object met wat data die nodig is voor de cell. Aan dit object wordt
         * wat standaard data voor de hele rij toegevoegd.
         */
        return rij.reduce(
            (rij, cell) => ({
                ...rij,
                [cell.kolom]: {
                    naam: cell.altDisplay ?? cell.kolom,
                    value: cell.aantal,
                    label: this.cellDisplayLabel(cell.aantal),
                    signal: this.heeftHighlight(cell.aantal, signaleringen[cell.kolom]),
                    vrijVeld: cell.vrijVeld,
                    cy: `Geen-vak-${cell.kolom.replace(new RegExp(' ', 'g'), '-').toLowerCase()}-${periode.nummer}`
                }
            }),
            standaardRijData
        );
    }

    /**
     *  Elk vak zetten we om naar een rij in de tabel. Een rij ziet er bv zo uit:
     *  { Ongeoorloofd afwezig: { value: 10, label: 10x, signal: true }, ... }
     *  Een rij is dus een object met de kolommen als keys. Ook krijgt elke rij wat
     *  standaard data mee zoals de periode en het vak.
     */
    private createVakRijen(
        periode: RegistratiePeriode,
        signaleringen: ReturnType<LeerlingregistratiesTableComponent['toSignaleringObject']>
    ) {
        return periode.vakRegistraties
            .filter((vakRegistraties) => isPresent(vakRegistraties.vak))
            .map((vakRegistraties) => {
                const standaardRijData = {
                    vak: vakRegistraties.vak,
                    periode: periode,
                    isTotaal: false
                };

                const rij = this.rijData(vakRegistraties);
                /**
                 * De rijData is een array van objecten met de kolommen en de aantallen
                 * bv [{kolom: 'Te laat', aantal: 10}, ...].
                 *
                 * Van deze array van objecten maken we weer 1 groot object met alle kolommen als keys
                 * en als value een object met wat data die nodig is voor de cell. Aan dit object wordt
                 * wat standaard data voor de hele rij toegevoegd.
                 */
                return rij.reduce(
                    (rij, cell) => ({
                        ...rij,
                        [cell.kolom]: {
                            value: cell.aantal,
                            naam: cell.altDisplay ?? cell.kolom,
                            label: this.cellDisplayLabel(cell.aantal),
                            signal: this.heeftHighlight(cell.aantal, signaleringen[cell.signaleringKey ?? cell.kolom]),
                            vrijVeld: cell.vrijVeld,
                            keuzelijstWaardeMogelijkheid: cell.keuzelijstWaardeMogelijkheid,
                            cy: `${vakRegistraties.vak?.naam.replace(new RegExp(' ', 'g'), '-').toLowerCase()}-${cell.kolom
                                .replace(new RegExp(' ', 'g'), '-')
                                .toLowerCase()}-${periode.nummer}`
                        }
                    }),
                    standaardRijData
                );
            });
    }

    private createTotaalRij(
        periode: RegistratiePeriode,
        signaleringen: ReturnType<LeerlingregistratiesTableComponent['toSignaleringObject']>
    ) {
        return {
            [registratieContent['ONGEOORLOOFD_AFWEZIG'].naam]: {
                naam: registratieContent['ONGEOORLOOFD_AFWEZIG'].naam,
                label: this.cellDisplayLabel(periode.totaalOngeoorloofdAfwezig),
                cy: `totaal-ongeoorloofd-afwezig-${periode.nummer}`
            },
            [registratieContent['GEOORLOOFD_AFWEZIG'].naam]: {
                naam: registratieContent['GEOORLOOFD_AFWEZIG'].naam,
                label: this.cellDisplayLabel(periode.totaalGeoorloofdAfwezig),
                cy: `totaal-geoorloofd-afwezig-${periode.nummer}`
            },
            [registratieContent['TE_LAAT'].naam]: {
                naam: registratieContent['TE_LAAT'].naam,
                label: this.cellDisplayLabel(periode.totaalTeLaat),
                cy: `totaal-te-laat-${periode.nummer}`
            },
            [registratieContent['VERWIJDERD'].naam]: {
                naam: registratieContent['VERWIJDERD'].naam,
                label: this.cellDisplayLabel(periode.totaalVerwijderd),
                cy: `totaal-verwijderd-${periode.nummer}`
            },
            ...periode.totaalVrijVeldRegistraties.reduce(
                (acc, curr) => ({
                    ...acc,
                    [invertedVrijVeldNaam(curr)]: {
                        naam: vrijVeldNaam(curr),
                        value: curr.aantal,
                        label: this.cellDisplayLabel(curr.aantal),
                        signal: this.heeftHighlight(curr.aantal, signaleringen[vrijVeldNaam(curr)]),
                        cy: `totaal-${vrijVeldNaam(curr)}-${periode.nummer}`
                    }
                }),
                {}
            ),
            isTotaal: true
        };
    }

    ngOnDestroy(): void {
        this.mentordashboardService.setActions([]);
        this.removeTooltip();
        this.destroy$.next();
        this.destroy$.complete();
    }

    generateTooltip(
        vak: Optional<Vak>,
        kolom: string,
        vrijVeld: VrijVeld | undefined,
        keuzelijstWaardeMogelijkheid: KeuzelijstWaardeMogelijkheid | undefined,
        periode: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number]
    ) {
        // Clear vorige delay
        if (this.tooltipDelay) {
            clearTimeout(this.tooltipDelay);
        }

        // geen tooltip op een lege cell of totaal cell (zonder vak)
        if (!vak) {
            return;
        }

        const leerlingId = this.route.parent!.snapshot.paramMap.get('id')!;
        const kolomEndpoint = kolom.replace(' ', '_').toLowerCase();
        const cachedDetails = this.mentordashboardDataService.getRegistratiesDetailFromCache(
            leerlingId,
            vak.id,
            kolomEndpoint,
            periode.vanaf!,
            periode.tot!,
            vrijVeld?.id,
            keuzelijstWaardeMogelijkheid?.id
        );

        if (cachedDetails) {
            this.detailTooltip.set(registratieDetailTooltip(cachedDetails.registratieDetail, kolom, periode.nummer, vak.naam));
            return;
        }

        this.detailTooltip.set(loaderTooltip);

        this.tooltipDelay = setTimeout(() => {
            this.fetchAndSetTooltip(
                leerlingId,
                vak.id,
                kolomEndpoint,
                periode.vanaf!,
                periode.tot!,
                vrijVeld?.id,
                keuzelijstWaardeMogelijkheid?.id,
                kolom,
                periode.nummer,
                vak.naam
            );
        }, 2000);
    }

    private fetchAndSetTooltip(
        leerlingId: string,
        vakId: string,
        kolomEndpoint: string,
        vanaf: Date,
        tot: Date,
        vrijVeldId: string | undefined,
        keuzelijstWaardeMogelijkheidId: string | undefined,
        kolom: string,
        periodeNummer: number,
        vakNaam: string
    ) {
        this.mentordashboardDataService
            .getRegistratiesDetail(leerlingId, vakId, kolomEndpoint, vanaf, tot, vrijVeldId, keuzelijstWaardeMogelijkheidId)
            .pipe(take(1))
            .subscribe({
                next: (detail) => {
                    if (this.tooltipDelay) {
                        this.detailTooltip.set(registratieDetailTooltip(detail, kolom, periodeNummer, vakNaam));
                    }
                },
                error: () => this.removeTooltip()
            });
    }

    removeTooltip() {
        if (this.tooltipDelay) {
            clearTimeout(this.tooltipDelay);
        }
        this.detailTooltip.set(loaderTooltip);
    }

    onClickCell(
        vak: Optional<Vak>,
        kolom: string,
        vrijVeld: VrijVeld | undefined,
        periode: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number],
        periodes: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'],
        keuzelijstWaardeMogelijkheid: KeuzelijstWaardeMogelijkheid
    ) {
        const kolomEndpoint = kolom.replace(' ', '_').toLowerCase();
        const kolomOfVrijVeldNaam = vrijVeld ? vrijVeldNaam({ vrijVeld, keuzelijstWaarde: keuzelijstWaardeMogelijkheid }) : kolom;

        this.sidebarService.openSidebar(LeerlingregistratiesSidebarComponent, {
            sidebarAvatar: {
                url: this.mentordashboardService.huidigeLeerling?.pasfoto,
                initialen: this.mentordashboardService.huidigeLeerling?.initialen ?? ''
            },
            sidebar: {
                title: `${vak ? vak.naam : 'Geen vak'} • ${kolomOfVrijVeldNaam}`,
                icon: null
            },
            leerlingId: this.route.parent!.snapshot.paramMap.get('id')!,
            vakId: vak?.id,
            kolom: kolomEndpoint,
            vrijVeld: vrijVeld,
            keuzelijstWaardeMogelijkheid: keuzelijstWaardeMogelijkheid,
            initialPeriode: periode,
            periodes: periodes
        });
    }

    onMobileKolomClick(
        periodeTabelData: RegistratieTabel['tables'][number]['rijen'],
        kolom: string,
        periodes: RegistratieTabel['periodes']
    ) {
        if (!this.deviceService.isPhoneOrTabletPortrait()) return;

        const selectedPeriode = this.selectedPeriode$.value;
        const registratie = periodeTabelData[this.selectedItemIndex$.value!];
        const isTotaal = registratie.isTotaal;

        if (isTotaal) {
            const periodeNaam = `Periode ${selectedPeriode}`;

            /**
             *  We lopen door alle vakken in de periode tabel (de slice haalt de 'totaal' rij weg)
             *  Dan willen we alle vakken die tenminste 1 registratie hebben
             *  Deze zetten we om naar een object met de vaknaam als key en de value het aantal registraties
             *  Deze sorteren we op het aantal registraties
             */
            const vakkenMetRegistraties = periodeTabelData
                .slice(1)
                .filter((rij) => rij[kolom].value > 0)
                .map((rij) => ({ [rij.vak.naam]: rij[kolom].value }))
                .sort(this.sortRegistraties)
                .reverse();

            const popup = this.popupService.popup(
                this.viewContainerRef,
                LeerlingregistratiesTotaalPopupComponent.defaultPopupSettings,
                LeerlingregistratiesTotaalPopupComponent
            );

            popup.titel = kolom;
            popup.periodeNaam = periodeNaam;
            popup.registraties = vakkenMetRegistraties;
        } else {
            const rij = periodeTabelData[this.selectedItemIndex$.value!];
            const vrijVeld = rij[kolom].vrijVeld;
            const keuzelijstWaardeMogelijkheid = rij[kolom].keuzelijstWaardeMogelijkheid;

            this.onClickCell(rij.vak, kolom, vrijVeld, rij.periode, periodes, keuzelijstWaardeMogelijkheid);
        }
    }

    private sortRegistraties = (a: { [vak: string]: number }, b: { [vak: string]: number }): number =>
        a[Object.keys(a)[0]] - b[Object.keys(b)[0]];

    openFilterPopup(columns: TabelKolom[], zichtbareKolommen: string[]) {
        const popup = this.popupService.popup(
            this.filterButtonRef ?? this.viewContainerRef,
            LeerlingregistratiesWeergavePopupComponent.defaultPopupSettings,
            LeerlingregistratiesWeergavePopupComponent
        );
        popup.columns = columns.map((column) => ({
            id: column.id,
            display: column.naam,
            selected: zichtbareKolommen.includes(column.id)
        }));
        popup.leerlingId = this.route.parent!.snapshot.paramMap.get('id')!;
        popup.gtmTag = 'leerlingregistraties-kolommen-filteren';
    }

    openSignaleringenTotaalPopup(event: Event, vak: VakKolom, index: number, vakken: VakKolom[]) {
        event.stopPropagation();
        const periodeNummer = vak.huidigePeriode!.nummer;
        const popup = this.popupService.popup(
            this.viewContainerRef,
            LeerlingregistratiesSignaleringenTotaalPopupComponent.defaultPopupSettings,
            LeerlingregistratiesSignaleringenTotaalPopupComponent
        );
        popup.periodeNummer = periodeNummer;
        popup.isHuidigePeriode = true;
        popup.title = vak.naam;
        popup.signaleringen = vak.highlightedPeriodeSignaleringen ?? {};
        popup.onDetailClick = () => {
            this.onVakClick(index, vakken);
            this.popupService.closePopUp();
        };
    }

    createSignaleringPopupData(columns: TabelKolom[], filters: SignaleringenFiltersQuery['signaleringenFilters'], leerlingId: string) {
        const iedereenFilters = filters?.filters ?? [];
        const leerlingFilters = filters?.leerlingFilters?.find((llf) => llf.leerlingId === leerlingId)?.filters ?? [];

        const uiIedereen: SignaleringPopupFilter[] = [];
        const uiLeerling: SignaleringPopupFilter[] = [];

        columns.forEach((column) => {
            const iedereenValue = iedereenFilters.find((filter) => filter.kolom === column.naam)?.value;
            uiIedereen.push({
                column: column.naam,
                value: iedereenValue,
                placeholder: '-'
            });
            uiLeerling.push({
                column: column.naam,
                value: leerlingFilters.find((filter) => filter.kolom === column.naam)?.value,
                placeholder: iedereenValue?.toString() ?? '-'
            });
        });

        return {
            iedereenFilters: uiIedereen,
            leerlingFilters: uiLeerling
        };
    }

    openSignaleringPopup(data: RegistratieTabel['signaleringPopupData']) {
        const popup = this.popupService.popup(
            this.signaleringButtonRef,
            SignaleringAantalPopupComponent.defaultPopupSettings,
            SignaleringAantalPopupComponent
        );
        popup.signaleringPopupData = data;
        popup.leerlingId = this.route.parent!.snapshot.paramMap.get('id')!;
        popup.onIngesteld = () => this.onSignaleringenSave.emit();
    }

    switchPeriode(nummer: number) {
        this.selectedPeriode$.next(nummer);
    }

    onVakClick(vakIndex: number, vakken: VakKolom[]) {
        this.mentordashboardService.setVakNavigatie({
            vakkolom: vakken[vakIndex],
            leerling: this.mentordashboardService.huidigeLeerling!,
            onTerugClick: () => {
                this.selectedItemIndex$.next(null);
                this.tableService.showAllMenus();
                this.mentordashboardService.setVakNavigatie(null);
            },
            onVakNaamClick: (avatarRef: ViewContainerRef) => {
                const settings = MentorleerlingenPopupComponent.defaultPopupSettings;
                settings.preferedDirection = [PopupDirection.Bottom];
                settings.offsets.bottom = {
                    top: 8,
                    left: 160
                };
                const popup = this.popupService.popup(avatarRef, settings, VakKolomSelectiePopupComponent);
                popup.currentItemId = vakIndex.toString();
                popup.kolommen = vakken;
                popup.onKolomSelectie = (index) => {
                    this.onVakClick(index, vakken);
                    this.popupService.closePopUp();
                };
            }
        });

        this.selectedItemIndex$.next(vakIndex);

        if (this.deviceService.isPhoneOrTabletPortrait()) {
            this.tableService.hideMenus(['mentordashboard-navigatie']);
        }
    }

    highlight = (row: Optional<number>) => (this.highlightIndex = row);
    toSignaleringObject = (acc: Record<string, number>, filter: SignaleringFilter) => ({ ...acc, [filter.kolom]: filter.value });

    keepObjectOrder = () => 0;
    cellDisplayLabel = (aantal: number) => (aantal === 0 ? '-' : `${aantal}x`);
    heeftHighlight = (aantal: number, signaleringAantal: Optional<number>) =>
        signaleringAantal && aantal > 0 && signaleringAantal !== 0 && aantal >= signaleringAantal;

    rijData = (vakregistraties: VakRegistraties): CellData[] => [
        { kolom: registratieContent['ONGEOORLOOFD_AFWEZIG'].naam, aantal: vakregistraties.aantalOngeoorloofdAfwezig },
        { kolom: registratieContent['GEOORLOOFD_AFWEZIG'].naam, aantal: vakregistraties.aantalGeoorloofdAfwezig },
        { kolom: registratieContent['TE_LAAT'].naam, aantal: vakregistraties.aantalTeLaat },
        { kolom: registratieContent['VERWIJDERD'].naam, aantal: vakregistraties.aantalVerwijderd },
        ...vakregistraties.vrijveldRegistraties.map(
            (vrijVeldRegistratie): CellData => ({
                kolom: invertedVrijVeldNaam(vrijVeldRegistratie),
                aantal: vrijVeldRegistratie.aantal,
                altDisplay: vrijVeldNaam(vrijVeldRegistratie),
                signaleringKey: vrijVeldNaam(vrijVeldRegistratie),
                vrijVeld: vrijVeldRegistratie.vrijVeld,
                keuzelijstWaardeMogelijkheid: vrijVeldRegistratie.keuzelijstWaarde
            })
        )
    ];
}

const leerlingAfwezigheidsKolomToTabelKolom = (kolom: LeerlingAfwezigheidsKolom): TabelKolom => ({
    id: kolom,
    naam: registratieContent[kolom].naam,
    tabelHeaderNaam: registratieContent[kolom].naam
});

const vrijVeldRegistratiestoTabelKolom = (kolom: VrijveldRegistratiesFieldsFragment): TabelKolom => ({
    id: vrijveldRegistratiesCategorieId(kolom),
    naam: vrijVeldNaam(kolom),
    tabelHeaderNaam: invertedVrijVeldNaam(kolom)
});
