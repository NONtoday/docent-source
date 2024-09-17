import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    GroepsoverzichtResultatenSidebarSorteringen,
    GroepsoverzichtResultatenSorteringenInput,
    GroepsoverzichtResultatenSorteringsContext,
    GroepsoverzichtSorteerKolom,
    GroepsoverzichtVakRapportResultaatTrend,
    MentordashboardResultatenInstellingen,
    SorteringOrder
} from '@docent/codegen';
import { IconDirective, SpinnerComponent, TableHeaderComponent } from 'harmony';
import { IconChevronRechts, provideIcons } from 'harmony-icons';
import { isNil, orderBy } from 'lodash-es';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { match } from 'ts-pattern';
import { flipSortering } from '../../../../rooster-shared/utils/utils';
import { MentordashboardDataService } from '../../../mentordashboard-data.service';
import { GroepsoverzichtSidebarVakResultaatComponent } from '../groepsoverzicht-sidebar-vak-resultaat/groepsoverzicht-sidebar-vak-resultaat.component';

@Component({
    selector: 'dt-groepsoverzicht-resultaten-sidebar-table',
    standalone: true,
    imports: [SpinnerComponent, GroepsoverzichtSidebarVakResultaatComponent, TableHeaderComponent, IconDirective, AsyncPipe],
    templateUrl: './groepsoverzicht-resultaten-sidebar-table.component.html',
    styleUrls: ['./groepsoverzicht-resultaten-sidebar-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronRechts)]
})
export class GroepsoverzichtResultatenSidebarTableComponent implements OnInit, OnChanges {
    @Input({ required: true }) leerlingId: string;
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;

    sortedTrends$: Observable<GroepsoverzichtVakRapportResultaatTrend[]>;

    private _instellingen$ = new BehaviorSubject<MentordashboardResultatenInstellingen | null>(null);

    public sortInstellingen: GroepsoverzichtResultatenSidebarSorteringen;

    private router = inject(Router);
    private mdDataService = inject(MentordashboardDataService);
    private activatedRoute = inject(ActivatedRoute);

    ngOnChanges(): void {
        this.sortInstellingen = this.instellingen.sorteringen.resultatenSidebar;
        this._instellingen$.next(this.instellingen);
    }

    ngOnInit(): void {
        const stamgroepId = this.activatedRoute.snapshot.params.id;
        // De instellingen$ is er om de watchQuery's opnieuw af te laten gaan wanneer de cache geupdate wordt
        this.sortedTrends$ = combineLatest([
            this._instellingen$,
            stamgroepId
                ? this.mdDataService.getGroepsoverzichtVakRapportResultaatTrends(this.leerlingId, stamgroepId)
                : this.mdDataService.getGroepsoverzichtVakRapportResultaatTrendsIndividueel(this.leerlingId)
        ]).pipe(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            map(([_, resultaatTrends]) => {
                const activeKolom = this.sortInstellingen.actieveKolom;
                const sortDirection =
                    this.sortInstellingen.actieveKolom === GroepsoverzichtSorteerKolom.RESULTATEN_SIDEBAR_TREND
                        ? this.sortInstellingen.trendWaarde
                        : this.sortInstellingen.rWaarde;

                return this.sortResultaten(resultaatTrends, activeKolom, sortDirection);
            })
        );
    }

    sorteerKolom(kolom: `${ResultatenSidebarSorteerKolom}`, property: keyof GroepsoverzichtResultatenSorteringenInput): void {
        const sortIsActive = this.sortInstellingen.actieveKolom === kolom;
        const sorteerRichting = match(kolom)
            .with('RESULTATEN_SIDEBAR_TREND', () => this.sortInstellingen.trendWaarde)
            .with('RESULTATEN_SIDEBAR_R', () => this.sortInstellingen.rWaarde)
            .exhaustive();

        const nieuweSorteerRichting = flipSortering(sorteerRichting);
        const sortInput: GroepsoverzichtResultatenSorteringenInput = {
            context: GroepsoverzichtResultatenSorteringsContext.RESULTATEN_SIDEBAR,
            [property]: sortIsActive ? nieuweSorteerRichting : sorteerRichting,
            actieveKolom: GroepsoverzichtSorteerKolom[kolom]
        };
        this.mdDataService.setGroepsoverzichtResultatenSortering(this.activatedRoute.snapshot.params.id, sortInput);
    }

    public sortResultaten(
        resultatenTrends: GroepsoverzichtVakRapportResultaatTrend[],
        activeKolom: GroepsoverzichtSorteerKolom,
        sortDirection: SorteringOrder
    ): GroepsoverzichtVakRapportResultaatTrend[] {
        const sortFnArray =
            activeKolom === GroepsoverzichtSorteerKolom.RESULTATEN_SIDEBAR_TREND
                ? [
                      (resultaat: GroepsoverzichtVakRapportResultaatTrend) =>
                          isNil(resultaat.trendindicatie) ? Number.NEGATIVE_INFINITY : Math.abs(resultaat.trendindicatie),
                      (resultaat: GroepsoverzichtVakRapportResultaatTrend) => {
                          if (resultaat.rapportCijferkolom !== null) {
                              return resultaat.isAlternatieveNormering
                                  ? resultaat.rapportCijferkolom?.formattedResultaatAlternatief
                                  : resultaat.rapportCijferkolom?.formattedResultaat;
                          }
                          return Number.NEGATIVE_INFINITY.toString();
                      }
                  ]
                : [
                      (resultaat: GroepsoverzichtVakRapportResultaatTrend) => {
                          if (resultaat.rapportCijferkolom !== null) {
                              return resultaat.isAlternatieveNormering
                                  ? resultaat.rapportCijferkolom?.formattedResultaatAlternatief
                                  : resultaat.rapportCijferkolom?.formattedResultaat;
                          }
                          return Number.NEGATIVE_INFINITY.toString();
                      }
                  ];

        const sortDir = sortDirection === SorteringOrder.DESC ? 'desc' : 'asc';
        return orderBy(
            resultatenTrends,
            sortFnArray,
            // sorteer de kolom op asc of desc en bij gelijke waardes altijd hoog-laag (desc)
            [sortDir, 'desc']
        );
    }

    navigateToLeerlingVakresultaten(): void {
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingId}/resultaten`);
    }

    navigateToLeerlingoverzicht(): void {
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingId}/overzicht`);
    }
}

type ResultatenSidebarSorteerKolom =
    | GroepsoverzichtSorteerKolom.RESULTATEN_SIDEBAR_R
    | GroepsoverzichtSorteerKolom.RESULTATEN_SIDEBAR_TREND;
