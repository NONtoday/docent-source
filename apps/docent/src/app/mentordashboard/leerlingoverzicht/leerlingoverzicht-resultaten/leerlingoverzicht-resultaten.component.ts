import { CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
    CssVarPipe,
    IconDirective,
    NotificationCounterComponent,
    SpinnerComponent,
    StackitemComponent,
    StackitemGroupComponent,
    SwitchComponent,
    SwitchGroupComponent,
    TooltipDirective
} from 'harmony';
import { IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconTijd, IconTrend, provideIcons } from 'harmony-icons';
import { derivedAsync } from 'ngxtension/derived-async';
import { derivedFrom } from 'ngxtension/derived-from';
import { combineLatest, filter, map, of, pipe, startWith, switchMap, tap } from 'rxjs';
import { P, match } from 'ts-pattern';
import {
    GroepsoverzichtSorteerKolom,
    MentorDashboardExamenVakSamenvattendeResultaten,
    SorteringOrder,
    VakRapportCijfer
} from '../../../../generated/_types';
import { LeerlingDataService } from '../../../core/services/leerling-data.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { Optional, isPresent } from '../../../rooster-shared/utils/utils';
import { commaResult } from '../../../shared/pipes/comma-result.pipe';
import { docentPendingQuery } from '../../../shared/utils/apollo.utils';
import { injectParentParams } from '../../../shared/utils/inject.utils';
import { MentordashboardDataService } from '../../mentordashboard-data.service';
import { MentordashboardService } from '../../mentordashboard.service';
import { Resultatensoort } from '../../mentordashboard.utils';
import { leerlingResultatenTrendTooltip } from '../../pipes/leerling-resultaten-trend-tooltip.pipe';
import { MentordashboardResultaatTrendColorPipe } from '../../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTextPipe } from '../../pipes/mentordashboard-resultaat-trend-text.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../../pipes/mentordashboard-resultaat-trend-tooltip.pipe';
import {
    LeerlingoverzichtDataService,
    leerlingoverzichtExamenResultatenDefault,
    leerlingoverzichtResultatenDefault
} from '../leerlingoverzicht-data.service';
import { LeerlingoverzichtGemisteToetsenSidebarComponent } from '../leerlingoverzicht-gemiste-toetsen-sidebar/leerlingoverzicht-gemiste-toetsen-sidebar.component';
import { LeerlingoverzichtLaatsteResultatenSidebarComponent } from '../leerlingoverzicht-laatste-resultaten-sidebar/leerlingoverzicht-laatste-resultaten-sidebar.component';
import { LeerlingoverzichtResultatenGrafiekComponent } from '../leerlingoverzicht-resultaten-grafiek/leerlingoverzicht-resultaten-grafiek.component';
import { LeerlingoverzichtVakSamenvattingSidebarComponent } from '../leerlingoverzicht-vak-samenvatting-sidebar/leerlingoverzicht-vak-samenvatting-sidebar.component';
import {
    LeerlingoverzichtResultatenCijferBalk,
    LeerlingoverzichtResultatenVakGrafiekData,
    LeerlingoverzichtResultatenVakGrafiekHeader,
    VergelijkingOptie
} from '../leerlingoverzicht.model';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten',
    standalone: true,
    imports: [
        CommonModule,
        SwitchGroupComponent,
        SwitchComponent,
        LeerlingoverzichtResultatenGrafiekComponent,
        TitleCasePipe,
        StackitemComponent,
        IconDirective,
        NotificationCounterComponent,
        StackitemGroupComponent,
        MentordashboardResultaatTrendIconPipe,
        MentordashboardResultaatTrendTextPipe,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendTooltipPipe,
        CssVarPipe,
        TooltipDirective,
        SpinnerComponent
    ],
    templateUrl: './leerlingoverzicht-resultaten.component.html',
    styleUrls: ['./leerlingoverzicht-resultaten.component.scss'],
    providers: [provideIcons(IconTrend, IconTijd, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconPijlRechts)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenComponent {
    private mdDataService = inject(MentordashboardDataService);
    private loDataService = inject(LeerlingoverzichtDataService);
    private medewerkerDataservice = inject(MedewerkerDataService);
    private sidebarService = inject(SidebarService);
    private leerlingDataService = inject(LeerlingDataService);
    private mentordashboardService = inject(MentordashboardService);

    leerlingId = injectParentParams('id');
    injector = inject(Injector);
    stamgroepId = toSignal(this.mentordashboardService.huidigeStamgroep$.pipe(map((stamgroep) => stamgroep.id)));

    selectedTab = signal<Resultatensoort>('resultaten');
    vergelijking = signal<VergelijkingOptie | undefined>(undefined);

    rechten$ = this.medewerkerDataservice.heeftRecht(['heeftExamendossierInzienRecht']).pipe(
        switchMap((inzienRecht) => combineLatest([toObservable(this.leerlingId, { injector: this.injector }), of(inzienRecht)])),
        switchMap(([leerlingId, inzienRecht]) => (inzienRecht ? this.leerlingDataService.heeftExamendossier(leerlingId) : of(false))),
        map((heeftExamendossier) => ({
            heeftExamendossier,
            loading: false
        })),
        tap((rechten) => {
            if (!rechten.heeftExamendossier && this.selectedTab() === 'examens') {
                this.selectedTab.set('resultaten');
            }
        }),
        startWith({ heeftExamendossier: false, loading: true })
    );

    leerling = derivedFrom(
        [this.rechten$, this.leerlingId],
        pipe(
            map(([rechten, leerlingId]) => ({
                heeftDossier: rechten.heeftExamendossier,
                id: leerlingId,
                loading: rechten.loading
            }))
        )
    );

    vergelijkingQuery = derivedAsync(() => {
        const vergelijking = this.vergelijking();
        if (vergelijking === undefined) return null;

        return this.selectedTab() === 'resultaten'
            ? this.loDataService.leerlingoverzichtResultatenVergelijking(this.leerlingId(), this.selectedPeriode(), vergelijking)
            : this.loDataService.leerlingoverzichtSeResultatenVergelijking(this.leerlingId(), vergelijking);
    });

    instellingen = toSignal(
        toObservable(this.stamgroepId).pipe(
            switchMap((stamgroepId) => this.mdDataService.groepsoverzichtInstellingen(stamgroepId)),
            map((instellingen) => instellingen.resultaten)
        ),
        { initialValue: initialResultaatInstellingen }
    );

    tabs = computed(() => ['resultaten' as const, ...['examens' as const].filter(() => this.leerling().heeftDossier)]);

    gemisteToetsen = derivedFrom(
        [this.leerling, this.selectedTab],
        pipe(
            switchMap(([leerling, tab]) =>
                tab == 'resultaten'
                    ? this.mdDataService.getLeerlingVoortgangsdossierGemisteToetsen(leerling.id)
                    : this.mdDataService.getLeerlingExamendossierGemisteToetsen(leerling.id)
            )
        )
    );

    laatsteResultatenMetTrend = derivedFrom(
        [this.leerling, this.selectedTab],
        pipe(
            switchMap(([leerling, tab]) =>
                tab == 'resultaten'
                    ? this.mdDataService.getLeerlingVoortgangsdossierLaatsteResultatenMetTrend(leerling.id, 5)
                    : this.mdDataService.getLeerlingExamendossierLaatsteResultatenMetTrend(leerling.id, 5)
            )
        )
    );

    selectedPeriode = signal(1);
    resultatenQuery = derivedFrom(
        [this.selectedTab, this.leerling],
        pipe(
            filter(([tab]) => tab === 'resultaten'),
            switchMap(([, leerling]) => this.loDataService.leerlingoverzichtResultaten(leerling.id)),
            tap((resultaten) => this.selectedPeriode.set(resultaten.data.actueleCijferperiode))
        ),
        { initialValue: docentPendingQuery(leerlingoverzichtResultatenDefault) }
    );

    examenResultatenQuery = derivedFrom(
        [this.selectedTab, this.leerling],
        pipe(
            filter(([tab]) => tab === 'examens'),
            switchMap(([, leerling]) => this.loDataService.leerlingoverzichtExamenResultaten(leerling.id))
        ),
        { initialValue: docentPendingQuery(leerlingoverzichtExamenResultatenDefault) }
    );

    periodes = computed(() => this.resultatenQuery().data.periodeRapportCijfers.map((c) => c.cijferperiode));

    periodeGemiddelde = computed(
        () =>
            this.resultatenQuery().data.periodeRapportCijfers.find((c) => c.cijferperiode === this.selectedPeriode())
                ?.periodeTotaalGemiddelde
    );

    grafiekHeaders = computed(() =>
        this.selectedTab() === 'resultaten'
            ? this.resultatenHeaders(
                  this.resultatenQuery().data.actueelTotaalGemiddelde,
                  this.periodeGemiddelde(),
                  this.instellingen().grenswaardeOnvoldoende,
                  this.selectedPeriode()
              )
            : this.examenHeader(
                  this.examenResultatenQuery().data.actueelTotaalGemiddelde,
                  this.instellingen().grenswaardeOnvoldoende,
                  this.examenResultatenQuery().data.heeftTrendindicatie
              )
    );

    resultatenVakgrafieken = computed(() => {
        const periodeCijfers = this.resultatenQuery().data.periodeRapportCijfers.find((c) => c.cijferperiode === this.selectedPeriode());
        if (!periodeCijfers) {
            return [];
        }

        return periodeCijfers.vakRapportCijfers.map(
            (vakRapportCijfer): LeerlingoverzichtResultatenVakGrafiekData => ({
                vak: vakRapportCijfer.vak,
                isAlternatieveNormering: vakRapportCijfer.isAlternatieveNormering,
                cijferbalken: [
                    {
                        cijfer: vakRapportCijfer.rapportCijfer,
                        color: this.cijferbalkColor(vakRapportCijfer.rapportCijfer),
                        vergelijking: this.vergelijkingQuery()?.data.find(
                            (v) =>
                                v.vak.id === vakRapportCijfer.vak.id &&
                                vakRapportCijfer.isAlternatieveNormering === v.isAlternatieveNormering
                        )?.gemiddelde
                    }
                ],
                trend: this.resultatenQuery().data.vakTrends.find((t) => t.vak.id === vakRapportCijfer.vak.id),
                tooltip: this.vakgrafiekTooltip(vakRapportCijfer)
            })
        );
    });

    examenVakgrafieken = computed(() => {
        const showEind = this.examenResultatenQuery().data.examenVakSamenvattendeResultaten.some(
            (resultaten) => resultaten.eindCijfer?.cijfer || resultaten.ceCijfer?.cijfer
        );

        return this.examenResultatenQuery().data.examenVakSamenvattendeResultaten.map(
            (resultaten): LeerlingoverzichtResultatenVakGrafiekData => ({
                vak: resultaten.vak,
                anderNiveau: resultaten.anderNiveau,
                vrijstelling: resultaten.vrijstelling,
                ontheffing: resultaten.ontheffing,
                cijferbalken: [
                    {
                        cijfer: resultaten.seCijfer?.cijfer,
                        color:
                            resultaten.vrijstelling || resultaten.ontheffing
                                ? 'neutral'
                                : this.cijferbalkColor(resultaten.seCijfer?.cijfer),
                        label: 'SE',
                        vergelijking:
                            resultaten.vrijstelling || resultaten.ontheffing
                                ? undefined
                                : this.vergelijkingQuery()?.data.find((v) => v.vak.id === resultaten.vak.id)?.gemiddelde
                    },
                    {
                        cijfer: resultaten.ceCijfer?.cijfer,
                        color:
                            resultaten.vrijstelling || resultaten.ontheffing
                                ? 'neutral'
                                : this.cijferbalkColor(resultaten.ceCijfer?.cijfer),
                        label: 'CE',
                        vergelijking: undefined
                    },
                    {
                        cijfer: resultaten.eindCijfer?.cijfer,
                        color:
                            resultaten.vrijstelling || resultaten.ontheffing
                                ? 'neutral'
                                : this.cijferbalkColor(resultaten.eindCijfer?.cijfer),
                        label: 'E',
                        vergelijking: undefined
                    }
                ].slice(0, showEind ? 3 : 1),
                tooltip: this.vakgrafiekExamenTooltip(resultaten),
                trend:
                    this.examenResultatenQuery().data.heeftTrendindicatie && resultaten.aantalResultatenVoorTrendindicatieSE > 1
                        ? {
                              aantalResultatenVoorTrendindicatie: resultaten.aantalResultatenVoorTrendindicatieSE,
                              vak: resultaten.vak,
                              isAlternatieveNormering: false,
                              trendindicatie: resultaten.trendindicatieSE
                          }
                        : null
            })
        );
    });

    vergelijkingTooltip = computed(() => {
        if (!this.vergelijkingQuery() && !this.vergelijkingQuery()?.isPending) return;

        const aantalVakkenMetVergelijking = this.vakgrafieken()
            .map((vak) => vak.cijferbalken[0].vergelijking)
            .filter(isPresent).length;
        const aantalZonderVergelijking = this.vakgrafieken().length - aantalVakkenMetVergelijking;
        return aantalZonderVergelijking > 0
            ? `Voor ${aantalZonderVergelijking}/${this.vakgrafieken().length} vakken is geen vergelijking mogelijk.`
            : undefined;
    });

    activeQuery = computed(() => (this.selectedTab() === 'resultaten' ? this.resultatenQuery() : this.examenResultatenQuery()));
    vakgrafieken = computed(() => (this.selectedTab() === 'resultaten' ? this.resultatenVakgrafieken() : this.examenVakgrafieken()));
    grafiekLoading = computed(
        () =>
            this.leerling().loading ||
            (this.selectedTab() === 'resultaten' ? this.resultatenQuery().isPending : this.examenResultatenQuery().isPending)
    );
    actuelePeriode = computed(() => this.resultatenQuery().data.actueleCijferperiode);

    cijferbalkColor(cijfer: Optional<number>): LeerlingoverzichtResultatenCijferBalk['color'] {
        return match(cijfer)
            .returnType<LeerlingoverzichtResultatenCijferBalk['color']>()
            .with(P.nullish, () => 'neutral')
            .with(
                P.when((cijfer) => cijfer < this.instellingen().grenswaardeZwaarOnvoldoende),
                () => 'negative'
            )
            .with(
                P.when((cijfer) => cijfer < this.instellingen().grenswaardeOnvoldoende),
                () => 'warning'
            )
            .otherwise(() => 'positive');
    }

    vakgrafiekExamenTooltip(resultaten: MentorDashboardExamenVakSamenvattendeResultaten): string {
        const anderNiveau = resultaten.anderNiveau ? ` (${resultaten.anderNiveau})` : '';
        const vrijstelling = resultaten.vrijstelling ? ' (Vrijstelling)' : '';
        const ontheffing = resultaten.ontheffing ? ' (Ontheffing)' : '';

        const vakVergelijkingsCijfer = this.vergelijkingQuery()?.data.find((v) => v.vak.id === resultaten.vak.id);
        const vergelijking =
            this.vergelijking() && vakVergelijkingsCijfer
                ? `Gem. ${this.vergelijking()} <b>${commaResult(vakVergelijkingsCijfer.gemiddelde)}</b><br>`
                : '';
        return `
            <b>${resultaten.vak.naam}${anderNiveau}${vrijstelling}${ontheffing}</b><br>
            ${vergelijking}
            <hr style="border: none; border-top: 1px dotted black;">
             ${leerlingResultatenTrendTooltip(
                 resultaten.trendindicatieSE,
                 resultaten.aantalResultatenVoorTrendindicatieSE,
                 resultaten.vak.naam,
                 true
             )}<br>
            ${
                resultaten.docenten
                    ? `<hr style="border: none; border-top: 1px dotted black;">
         ${resultaten.docenten}`
                    : ''
            }`;
    }

    vakgrafiekTooltip(vakRapportCijfer: VakRapportCijfer): string {
        const trend = this.resultatenQuery().data.vakTrends.find((t) => t.vak.id === vakRapportCijfer.vak.id);
        if (!trend) return '';

        const periodecijfers = this.resultatenQuery()
            .data.periodeRapportCijfers.map((pr) => ({
                periode: pr.cijferperiode,
                rapportCijfer: pr.vakRapportCijfers.find((vrc) => vrc.vak.id === vakRapportCijfer.vak.id)?.rapportCijfer
            }))
            .map((data) => `P${data.periode} <b>${data.rapportCijfer ? commaResult(data.rapportCijfer) : '-'}</b>`)
            .join(' • ');

        const vakVergelijkingsCijfer = this.vergelijkingQuery()?.data.find(
            (v) => v.vak.id === vakRapportCijfer.vak.id && vakRapportCijfer.isAlternatieveNormering === v.isAlternatieveNormering
        );
        const vergelijking =
            this.vergelijking() && vakVergelijkingsCijfer
                ? `Gem. ${this.vergelijking()} <b>${commaResult(vakVergelijkingsCijfer.gemiddelde)}</b>`
                : '';

        return `
            <b>${vakRapportCijfer.vak.naam}</b><br>
            ${periodecijfers}<br>
            ${vergelijking}
            <hr style="border: none; border-top: 1px dotted black;">
            ${leerlingResultatenTrendTooltip(trend.trendindicatie, trend.aantalResultatenVoorTrendindicatie, trend.vak.naam, false)}<br>
            ${
                vakRapportCijfer.docenten
                    ? `<hr style="border: none; border-top: 1px dotted black;">
            ${vakRapportCijfer.docenten}`
                    : ''
            }
        `;
    }

    selectTab(tab: Resultatensoort) {
        if (this.moetVergelijkingDropdownResetten(tab, this.selectedPeriode())) {
            this.vergelijking.set(undefined);
        }
        this.selectedTab.set(tab);
    }

    openSidebarGemisteToetsen() {
        this.sidebarService.openSidebar(LeerlingoverzichtGemisteToetsenSidebarComponent, {
            gemisteToetsen: this.gemisteToetsen().data,
            title: this.selectedTab() === 'resultaten' ? 'Gemiste toetsen' : 'Gemiste SE toetsen'
        });
    }

    resultatenHeaders = (
        actueelGemiddelde: Optional<number>,
        periodeGemiddelde: Optional<number>,
        grenswaardeOnvoldoende: number,
        selectedPeriode: number
    ): LeerlingoverzichtResultatenVakGrafiekHeader[] => [
        {
            gemiddelde: actueelGemiddelde,
            titel: 'Actueel',
            tooltip: 'Indicatief gemiddelde over de meest actuele rapportcijfers (R) per vak op basis van het laatst behaalde resultaat.',
            isOnvoldoende: !!actueelGemiddelde && actueelGemiddelde < grenswaardeOnvoldoende
        },
        {
            gemiddelde: periodeGemiddelde,
            titel: `Periode ${selectedPeriode}`,
            tooltip: `Indicatief gemiddelde over alle rapportcijfers (R) in de geselecteerde periode.`,
            isOnvoldoende: !!periodeGemiddelde && periodeGemiddelde < grenswaardeOnvoldoende
        }
    ];

    examenHeader = (
        totaalGemiddelde: Optional<number>,
        grenswaardeOnvoldoende: number,
        SE: boolean
    ): LeerlingoverzichtResultatenVakGrafiekHeader[] => [
        {
            gemiddelde: totaalGemiddelde,
            titel: 'Totaalgemiddelde',
            tooltip: `Indicatief gemiddelde over alle recente ${SE ? 'SE cijfers' : 'eindcijfers'} per vak.`,
            isOnvoldoende: !!totaalGemiddelde && totaalGemiddelde < grenswaardeOnvoldoende
        }
    ];

    openVakResultatenSidebar(grafiek: LeerlingoverzichtResultatenVakGrafiekData) {
        const sidebardata = {
            leerlingId: this.leerlingId(),
            periodes: this.periodes(),
            selectedPeriode: this.selectedPeriode(),
            gemisteToetsen: this.gemisteToetsen().data.filter((t) => t.vakNaam === grafiek.vak.naam),
            trend: grafiek.trend,
            vak: grafiek.vak,
            actuelePeriode: this.actuelePeriode()
        };

        this.sidebarService.openSidebar(LeerlingoverzichtVakSamenvattingSidebarComponent, {
            data:
                this.selectedTab() === 'examens'
                    ? { ...sidebardata, isExamen: true, seResultaat: grafiek.cijferbalken[0].cijfer }
                    : { ...sidebardata, isExamen: false }
        });
    }

    openSidebarLaatsteResultaten() {
        this.sidebarService.openSidebar(LeerlingoverzichtLaatsteResultatenSidebarComponent, {
            laatsteResultaten: this.laatsteResultatenMetTrend().data.recenteResultaten,
            resultatenSoort: this.selectedTab(),
            leerlingId: this.leerlingId(),
            trendindicatie: this.laatsteResultatenMetTrend().data.trendindicatie,
            aantalVoorTrendindicatie: this.laatsteResultatenMetTrend().data.aantalResultatenVoorTrendindicatie,
            instellingen: this.instellingen()
        });
    }

    selectPeriode(periode: number) {
        if (this.moetVergelijkingDropdownResetten(this.selectedTab(), periode)) {
            this.vergelijking.set(undefined);
        }
        this.selectedPeriode.set(periode);
    }

    private moetVergelijkingDropdownResetten(tab: Resultatensoort, periode: number) {
        const vergelijking = this.vergelijking();
        const heeftGeenResultatenVergelijkingData =
            vergelijking && tab === 'resultaten' && !this.loDataService.isVergelijkingDataInCache(this.leerlingId(), periode, vergelijking);
        const heeftGeenSeResultatenVergelijkingData =
            vergelijking && tab === 'examens' && !this.loDataService.isSeVergelijkingDataInCache(this.leerlingId(), vergelijking);

        return heeftGeenResultatenVergelijkingData || heeftGeenSeResultatenVergelijkingData;
    }

    public tabGtm: Record<Resultatensoort, string> = {
        examens: 'leerlingoverzicht-examen-tab',
        resultaten: 'leerlingoverzicht-resultaten-tab'
    };
}

export const localstorageResultatenTabKeyLeerlingoverzicht = 'leerlingoverzicht-resultatentab';

// defaults staan ook in mentordashboard.defaults.ts in graphql
export const initialResultaatInstellingen = {
    aantalVakkenOnvoldoende: 1,
    aantalVakkenZwaarOnvoldoende: 1,
    grenswaardeOnvoldoende: 5.5,
    grenswaardeZwaarOnvoldoende: 5.0,
    sorteringen: {
        groepsoverzicht: {
            aandacht: SorteringOrder.ASC,
            extraAandacht: SorteringOrder.ASC,
            opNiveau: SorteringOrder.DESC
        },
        resultatenSidebar: {
            actieveKolom: GroepsoverzichtSorteerKolom.RESULTATEN_SIDEBAR_TREND,
            rWaarde: SorteringOrder.DESC,
            trendWaarde: SorteringOrder.DESC
        },
        examenSidebar: {
            CE: SorteringOrder.DESC,
            SE: SorteringOrder.DESC,
            EIND: SorteringOrder.DESC,
            trendWaarde: SorteringOrder.DESC,
            actieveKolom: GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_TREND
        }
    }
};
