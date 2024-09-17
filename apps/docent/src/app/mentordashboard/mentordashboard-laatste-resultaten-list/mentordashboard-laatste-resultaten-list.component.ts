import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Maybe, MentordashboardResultatenInstellingen, RecentResultaat } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconResultaten, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, map, of } from 'rxjs';
import { match } from 'ts-pattern';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardToetsResultaatComponent } from '../mentordashboard-toets-resultaat/mentordashboard-toets-resultaat.component';
import { MentordashboardTrendMetInfoComponent } from '../mentordashboard-trend-met-info/mentordashboard-trend-met-info.component';
import { Resultatensoort } from '../mentordashboard.utils';

@Component({
    selector: 'dt-mentordashboard-laatste-resultaten-list',
    standalone: true,
    imports: [IconDirective, MentordashboardToetsResultaatComponent, SpinnerComponent, MentordashboardTrendMetInfoComponent, AsyncPipe],
    providers: [provideIcons(IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconResultaten)],
    templateUrl: './mentordashboard-laatste-resultaten-list.component.html',
    styleUrl: './mentordashboard-laatste-resultaten-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentordashboardLaatsteResultatenListComponent implements OnInit {
    @Input({ required: true }) laatsteResultaten: RecentResultaat[];
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) resultatenSoort: Resultatensoort;
    @Input({ required: true }) leerlingId: string;
    @Input({ required: true }) trendindicatie: Maybe<number>;
    @Input({ required: true }) aantalVoorTrendindicatie: number;

    public mdDataService = inject(MentordashboardDataService);
    private destroyRef = inject(DestroyRef);

    public laatsteResultatenView$: Observable<MentordashboardLaatsteResultatenSidebarView>;

    showEerdereResultatenSpinner = signal(false);
    showEerdereResultaten = signal(false);

    ngOnInit(): void {
        this.laatsteResultatenView$ = of({
            instellingen: this.instellingen,
            laatsteResultaten: this.laatsteResultaten,
            eerdereResultaten: []
        });
    }

    loadEerdereResultaten() {
        this.showEerdereResultatenSpinner.set(true);
        const laatsteResultaten$ = match(this.resultatenSoort)
            .with('resultaten', () => this.mdDataService.getLeerlingVoortgangsdossierLaatsteResultaten(this.leerlingId, null))
            .with('examens', () => this.mdDataService.getLeerlingExamendossierLaatsteResultaten(this.leerlingId, null))
            .exhaustive();

        combineLatest([this.laatsteResultatenView$, laatsteResultaten$])
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map(([laatsteResultatenView, alleLaatsteResultaten]) => {
                    // Vul de eerdere resultaten met resultaten, filter hierbij de resultaten die al in de laatste resultaten zitten
                    laatsteResultatenView.eerdereResultaten = alleLaatsteResultaten.filter(
                        (res) =>
                            !laatsteResultatenView.laatsteResultaten.some(
                                (lr) => lr.resultaat.id === res.resultaat.id && lr.isAlternatieveNormering === res.isAlternatieveNormering
                            )
                    );
                    return laatsteResultatenView;
                })
            )
            .subscribe((updatedView) => {
                this.laatsteResultatenView$ = of(updatedView);
                this.showEerdereResultatenSpinner.set(false);
                this.showEerdereResultaten.set(true);
            });
    }
}

export interface MentordashboardLaatsteResultatenSidebarView {
    instellingen: MentordashboardResultatenInstellingen;
    laatsteResultaten: RecentResultaat[];
    eerdereResultaten: RecentResultaat[];
}
