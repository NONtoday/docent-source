import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ExamenDossierContextTrend,
    ExamendossierContext,
    GroepsoverzichtExamenSidebarSorteringen,
    GroepsoverzichtResultatenSorteringenInput,
    GroepsoverzichtResultatenSorteringsContext,
    GroepsoverzichtSorteerKolom,
    MentorDashboardExamenVakSamenvattendeResultaten,
    MentordashboardResultatenInstellingen,
    SorteringOrder
} from '@docent/codegen';
import { IconDirective, SpinnerComponent, StackitemComponent, TableHeaderComponent } from 'harmony';
import { IconChevronRechts, provideIcons } from 'harmony-icons';
import { isNil, orderBy } from 'lodash-es';
import { BehaviorSubject, Observable, combineLatest, filter, map } from 'rxjs';
import { match } from 'ts-pattern';
import { flipSortering, isPresent } from '../../../../rooster-shared/utils/utils';
import { MentordashboardDataService } from '../../../mentordashboard-data.service';
import { GroepsoverzichtSidebarExamenVakResultaatComponent } from '../groepsoverzicht-sidebar-examen-vak-resultaat/groepsoverzicht-sidebar-examen-vak-resultaat.component';

@Component({
    selector: 'dt-groepsoverzicht-examen-resultaten-sidebar-table',
    standalone: true,
    imports: [
        GroepsoverzichtSidebarExamenVakResultaatComponent,
        SpinnerComponent,
        StackitemComponent,
        TableHeaderComponent,
        IconDirective,
        AsyncPipe
    ],
    templateUrl: './groepsoverzicht-examen-resultaten-sidebar-table.component.html',
    styleUrls: ['./groepsoverzicht-examen-resultaten-sidebar-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronRechts)]
})
export class GroepsoverzichtExamenResultatenSidebarTableComponent implements OnInit, OnChanges {
    @Input({ required: true }) leerlingId: string;
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;

    public context$: Observable<ExamenDossierContextTrendView>;

    private _instellingen$ = new BehaviorSubject<GroepsoverzichtExamenSidebarSorteringen | null>(null);

    private router = inject(Router);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private activatedRoute = inject(ActivatedRoute);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.instellingen.currentValue) {
            this._instellingen$.next(this.instellingen.sorteringen.examenSidebar);
        }
    }

    ngOnInit(): void {
        // de instellingen$ zit er o.a om de watchQuery opnieuw af te laten gaan wanneer de cache geupdate wordt
        this.context$ = combineLatest([
            this._instellingen$.pipe(filter(isPresent)),
            this.mentordashboardDataService.getGroepsoverzichtExamenVakRapportResultaatTrends(this.leerlingId)
        ]).pipe(
            map(([instellingen, context]) => {
                // disable nodig ivm bug in eslint
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                const sortDirection = match(instellingen.actieveKolom as ExamensidebarSorteerKolom)
                    .with(GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_TREND, () =>
                        context.heeftTrendindicatie ? instellingen.trendWaarde : instellingen.EIND
                    )
                    .with(GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_CE, () => instellingen.CE)
                    .with(GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_SE, () => instellingen.SE)
                    .with(GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_EIND, () => instellingen.EIND)
                    .otherwise(() => SorteringOrder.DESC);

                // wanneer de gebruiker gesorteerd staat op de trend, maar de trend view wordt niet meer getoond, dan wordt er gesorteerd op het eindcijfer
                const actieveKolom =
                    instellingen.actieveKolom === GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_TREND && !context.heeftTrendindicatie
                        ? GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_EIND
                        : // disable nodig ivm bug in eslint
                          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                          (instellingen.actieveKolom as ExamensidebarSorteerKolom);

                const updatedSortInstellingen = { ...instellingen, actieveKolom: actieveKolom };

                return {
                    ...context,
                    vakTrends: this.sortResultaten(context.vakTrends, actieveKolom, sortDirection),
                    instellingen: updatedSortInstellingen
                };
            })
        );
    }

    sorteerKolom(
        instellingen: GroepsoverzichtExamenSidebarSorteringen,
        kolom: `${ExamensidebarSorteerKolom}`,
        property: keyof GroepsoverzichtResultatenSorteringenInput
    ): void {
        const sortIsActive = instellingen.actieveKolom === kolom;
        const sorteerRichting = match(kolom)
            .with('EXAMEN_SIDEBAR_TREND', () => instellingen.trendWaarde)
            .with('EXAMEN_SIDEBAR_CE', () => instellingen.CE)
            .with('EXAMEN_SIDEBAR_SE', () => instellingen.SE)
            .with('EXAMEN_SIDEBAR_EIND', () => instellingen.EIND)
            .exhaustive();

        const nieuweSorteerRichting = flipSortering(sorteerRichting);
        const sortInput: GroepsoverzichtResultatenSorteringenInput = {
            context: GroepsoverzichtResultatenSorteringsContext.EXAMEN_SIDEBAR,
            [property]: sortIsActive ? nieuweSorteerRichting : sorteerRichting,
            actieveKolom: GroepsoverzichtSorteerKolom[kolom]
        };
        this.mentordashboardDataService.setGroepsoverzichtResultatenSortering(this.activatedRoute.snapshot.params.id, sortInput);
    }

    public sortResultaten(
        resultatenTrends: MentorDashboardExamenVakSamenvattendeResultaten[],
        activeKolom: ExamensidebarSorteerKolom,
        sortDirection: SorteringOrder
    ) {
        const sortFn = match(activeKolom)
            .with(GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_TREND, () => [
                (resultaat: MentorDashboardExamenVakSamenvattendeResultaten) =>
                    isNil(resultaat.trendindicatieSE) ? Number.NEGATIVE_INFINITY : Math.abs(resultaat.trendindicatieSE),
                (resultaat: MentorDashboardExamenVakSamenvattendeResultaten) => resultaat.seCijfer?.cijfer ?? Number.NEGATIVE_INFINITY
            ])
            .with(
                GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_CE,
                () => (resultaat: MentorDashboardExamenVakSamenvattendeResultaten) => resultaat.ceCijfer?.cijfer ?? Number.NEGATIVE_INFINITY
            )
            .with(
                GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_SE,
                () => (resultaat: MentorDashboardExamenVakSamenvattendeResultaten) => resultaat.seCijfer?.cijfer ?? Number.NEGATIVE_INFINITY
            )
            .with(
                GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_EIND,
                () => (resultaat: MentorDashboardExamenVakSamenvattendeResultaten) =>
                    resultaat.eindCijfer?.cijfer ?? Number.NEGATIVE_INFINITY
            )
            .exhaustive();

        const sortDirectionColumn = sortDirection === SorteringOrder.DESC ? 'desc' : 'asc';
        return orderBy(
            resultatenTrends,
            sortFn,
            // sorteer de kolom op asc of desc en bij gelijke waardes altijd hoog-laag (desc)
            [sortDirectionColumn, 'desc']
        );
    }

    navigateToLeerlingVakresultaten(context: ExamendossierContext): void {
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingId}/resultaten?plaatsing=${context.plaatsingId}`);
    }

    navigateToLeerlingoverzicht(): void {
        // TODO: de examens tab moet nog worden toegevoegd en dan moet deze link meteen switchen naar die tab
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingId}/overzicht?tab=examens`);
    }
}

type ExamenDossierContextTrendView = ExamenDossierContextTrend & { instellingen: GroepsoverzichtExamenSidebarSorteringen };

type ExamensidebarSorteerKolom =
    | GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_CE
    | GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_SE
    | GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_TREND
    | GroepsoverzichtSorteerKolom.EXAMEN_SIDEBAR_EIND;
