import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    GeldendVoortgangsdossierResultaat,
    GetMentorDashboardVoortgangsdossierVoorLeerlingQuery,
    MentorDashboardVakPeriode,
    PeriodeAdviesKolom,
    PeriodeAdviesKolomContext,
    ResultaatBijzonderheid
} from '@docent/codegen';
import { IconPillComponent, PillComponent, TooltipDirective, shareReplayLastValue } from 'harmony';
import { IconReacties, IconTrend, IconTrendBeneden, IconTrendBoven, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { memoize } from 'lodash-es';
import { Observable, map } from 'rxjs';
import { blockInitialRenderAnimation } from '../../core/core-animations';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { CijferPeriodeNaamPipe } from '../../shared/pipes/cijfer-periode-naam.pipe';
import { CommaResultPipe } from '../../shared/pipes/comma-result.pipe';
import { MathAbsPipe } from '../../shared/pipes/math-abs.pipe';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardResultatenSidebarComponent } from '../mentordashboard-resultaten-sidebar/mentordashboard-resultaten-sidebar.component';
import { LeerlingResultatenTrendTooltipPipe } from '../pipes/leerling-resultaten-trend-tooltip.pipe';
import { TrendPillColorPipe } from '../pipes/trend-pill-color.pipe';

export enum Layout {
    TABLE,
    MOBILE
}

@Component({
    selector: 'dt-voortgangsdossier',
    templateUrl: './voortgangsdossier.component.html',
    styleUrls: ['./../table.scss', './voortgangsdossier.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [blockInitialRenderAnimation],
    standalone: true,
    imports: [
        CommonModule,
        CdkTableModule,
        AccordionComponent,
        IconPillComponent,
        TooltipDirective,
        CommaResultPipe,
        PillComponent,
        MathAbsPipe,
        LeerlingResultatenTrendTooltipPipe,
        TrendPillColorPipe,
        CijferPeriodeNaamPipe
    ],
    providers: [provideIcons(IconTrend, IconTrendBeneden, IconTrendBoven, IconReacties, IconWaarschuwing)]
})
export class VoortgangsdossierComponent implements OnInit {
    public deviceService = inject(DeviceService);
    public mentordashboardDataService = inject(MentordashboardDataService);
    public medewerkerDataService = inject(MedewerkerDataService);
    private sidebarService = inject(SidebarService);
    private route = inject(ActivatedRoute);
    @Input({ required: true })
    resultaten: GetMentorDashboardVoortgangsdossierVoorLeerlingQuery['getMentorDashboardVoortgangsdossierVoorLeerling'];
    @Input({ required: true }) alternatieveNormering: boolean;
    @Input({ required: true }) showAs: Optional<Layout>;
    @Input({ required: true }) vestigingId: Optional<string>;

    public readonly layout = Layout.TABLE;
    public readonly resultaatBijzonderheid = ResultaatBijzonderheid;

    public highlightIndex: Optional<number>;

    public heeftMentordashboardCompleet$: Observable<boolean>;
    public zichtbareColumns$: Observable<string[]>;

    ngOnInit(): void {
        this.heeftMentordashboardCompleet$ = this.medewerkerDataService.getMedewerker().pipe(
            map(
                (medewerker) =>
                    !!medewerker.settings.vestigingRechten.find((recht) => recht.vestigingId === this.vestigingId)
                        ?.heeftToegangMentordashboardCompleet
            ),
            shareReplayLastValue()
        );
        this.zichtbareColumns$ = this.heeftMentordashboardCompleet$.pipe(
            map((heeftRecht) => (heeftRecht ? ['naam', 'trend'] : ['naam'])),
            shareReplayLastValue()
        );
    }

    highlight = (row: Optional<number>) => (this.highlightIndex = row);

    trackByVakId(index: number, item: MentorDashboardVakPeriode): string {
        return item.vak.id;
    }

    public getAdviesGeldendResultaatFor(
        vakPeriode: MentorDashboardVakPeriode,
        periode: number,
        adviesContext: PeriodeAdviesKolomContext
    ): Optional<GeldendVoortgangsdossierResultaat> {
        const juisteVakPeriode = vakPeriode.periodes?.filter((item) => item?.volgnummer === periode) ?? [];
        if (!juisteVakPeriode?.length) {
            return null;
        }
        const adviesKolommen = juisteVakPeriode[0]!.advieskolommen;
        if (!adviesKolommen?.length) {
            return null;
        }
        const matchendeAdvieskolommen =
            adviesKolommen.filter(
                (adviesKolom) =>
                    adviesKolom &&
                    adviesKolom.adviesCategorieNaam === adviesContext.adviesCategorieNaam &&
                    adviesKolom.adviesKolomAfkorting === adviesContext.adviesKolomAfkorting
            ) || [];
        if (matchendeAdvieskolommen.length === 1) {
            const adviesKolom = matchendeAdvieskolommen[0];
            return adviesKolom!.geldendResultaat;
        }
        return null;
    }

    public getAdviesFor(vakPeriode: MentorDashboardVakPeriode, periode: number, adviesContext: PeriodeAdviesKolomContext): string {
        const geldendResultaat = this.getAdviesGeldendResultaatFor(vakPeriode, periode, adviesContext);
        return geldendResultaat ? this.getFormattedResultaat(geldendResultaat) : '';
    }

    public getPeriodeFor(vakPeriode: MentorDashboardVakPeriode, periode: number): string {
        const geldendResultaat = this.getPeriodeGeldendResultaatFor(vakPeriode, periode);
        return geldendResultaat ? this.getFormattedResultaat(geldendResultaat) : '';
    }

    public getPeriodeGeldendResultaatFor(
        vakPeriode: MentorDashboardVakPeriode,
        periode: number
    ): Optional<GeldendVoortgangsdossierResultaat> {
        const juisteVakPeriode = vakPeriode.periodes?.filter((item) => item?.volgnummer === periode) || [];
        if (!juisteVakPeriode?.length) {
            return null;
        }
        const periodeGemiddeldeKolom = juisteVakPeriode[0]!.periodeGemiddeldeKolom;
        if (!periodeGemiddeldeKolom) {
            return null;
        }

        return periodeGemiddeldeKolom;
    }

    public getPeriodeVoldoendeFor(vakPeriode: MentorDashboardVakPeriode, periode: number): boolean {
        const geldendResultaat = this.getPeriodeGeldendResultaatFor(vakPeriode, periode);
        return Boolean(
            geldendResultaat ? (this.alternatieveNormering ? geldendResultaat.isVoldoendeAlternatief : geldendResultaat.isVoldoende) : true
        );
    }

    public getFormattedResultaat(item: GeldendVoortgangsdossierResultaat): string {
        const resultaat =
            (this.alternatieveNormering
                ? item.labelAfkortingAlternatief
                    ? item.labelAfkortingAlternatief
                    : item.formattedResultaatAlternatief
                : item.labelAfkorting
                  ? item.labelAfkorting
                  : item.formattedResultaat) || '';
        const mistToetsen = item.bijzonderheid === ResultaatBijzonderheid.NietGemaakt;

        return mistToetsen ? resultaat.replace('!', '') : resultaat;
    }

    public getRapportGeldendResultaatFor(
        vakPeriode: MentorDashboardVakPeriode,
        periode: number
    ): Optional<GeldendVoortgangsdossierResultaat> {
        const juisteVakPeriode = vakPeriode.periodes?.filter((item) => item?.volgnummer === periode) || [];
        if (!juisteVakPeriode?.length) {
            return null;
        }
        const rapportCijferkolom = juisteVakPeriode[0]!.rapportCijferkolom;
        if (!rapportCijferkolom) {
            return null;
        }
        return rapportCijferkolom;
    }

    public getRapportFor(vakPeriode: MentorDashboardVakPeriode, periode: number): string {
        const geldendResultaat = this.getRapportGeldendResultaatFor(vakPeriode, periode);
        return geldendResultaat ? this.getFormattedResultaat(geldendResultaat) : '';
    }

    public openDetailsSidebar(vakPeriode: MentorDashboardVakPeriode, periode: number, kolommenPeriodes: PeriodeAdviesKolom[]) {
        const periodes =
            kolommenPeriodes.filter(Boolean).map((kolom) => {
                return { nummer: kolom.periode, afkorting: kolom.afkorting };
            }) ?? [];
        this.sidebarService.openSidebar(MentordashboardResultatenSidebarComponent, {
            leerlingId: this.route.parent?.snapshot.params.id,
            vak: vakPeriode.vak,
            periode,
            periodes,
            alternatieveNormering: this.alternatieveNormering
        });
    }

    public getRapportVoldoendeFor(vakPeriode: MentorDashboardVakPeriode, periode: number): boolean {
        const geldendResultaat = this.getRapportGeldendResultaatFor(vakPeriode, periode);
        return Boolean(
            geldendResultaat ? (this.alternatieveNormering ? geldendResultaat.isVoldoendeAlternatief : geldendResultaat.isVoldoende) : true
        );
    }

    public getTrendVoorNormering(
        vakRow: GetMentorDashboardVoortgangsdossierVoorLeerlingQuery['getMentorDashboardVoortgangsdossierVoorLeerling']['vakPeriodes'][number],
        alternatieveNormering: boolean
    ) {
        return {
            trend: alternatieveNormering ? vakRow.trendindicatieAlternatieveNormering : vakRow.trendindicatie,
            aantalResultaten: alternatieveNormering
                ? vakRow.aantalResultatenVoorTrendindicatieAlternatieveNormering
                : vakRow.aantalResultatenVoorTrendindicatie
        };
    }

    periodeTooltip = memoize(
        (
            periode: GetMentorDashboardVoortgangsdossierVoorLeerlingQuery['getMentorDashboardVoortgangsdossierVoorLeerling']['adviesKolommenPerPeriode'][number]
        ) => {
            if (periode.datumVan && periode.datumTot) {
                const startDatum: string = formatDateNL(periode.datumVan, 'dagnummer_maand_kort');
                const eindDatum: string = formatDateNL(periode.datumTot, 'dagnummer_maand_kort');

                return `<span class="text-content-small-semi">Cijferperiode</span><br><span text-content-small>${startDatum} tot ${eindDatum}</span>`;
            }

            return `<span class="text-content-small-semi">Cijferperiode</span><br><span class="text-content-small">Geen data ingesteld voor periode ${periode.periode}</span>`;
        },
        (...args) => JSON.stringify(args)
    );
}
