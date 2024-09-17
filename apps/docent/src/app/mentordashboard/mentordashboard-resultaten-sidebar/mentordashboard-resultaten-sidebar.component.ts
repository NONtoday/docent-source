import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { GetMentorDashboardVakResultatenQuery, ResultaatBijzonderheid, Vak } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconReacties, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { sortBy } from 'lodash-es';
import { BehaviorSubject, Observable, filter, map, switchMap } from 'rxjs';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { CijferPeriodeNaamPipe } from '../../shared/pipes/cijfer-periode-naam.pipe';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardResultaatComponent } from '../mentordashboard-resultaat/mentordashboard-resultaat.component';

@Component({
    selector: 'dt-mentordashboard-resultaten-sidebar',
    templateUrl: './mentordashboard-resultaten-sidebar.component.html',
    styleUrls: ['./mentordashboard-resultaten-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        MentordashboardResultaatComponent,
        TooltipDirective,
        SpinnerComponent,
        AsyncPipe,
        IconDirective,
        CijferPeriodeNaamPipe
    ],
    providers: [provideIcons(IconReacties, IconWaarschuwing)]
})
export class MentordashboardResultatenSidebarComponent extends BaseSidebar implements OnInit, OnChanges {
    public sidebarService = inject(SidebarService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    @Input() leerlingId: string;
    @Input() vak: Vak;
    @Input() periode: number;
    @Input() periodes: { nummer: number; afkorting?: Optional<string> }[];
    @Input() alternatieveNormering: Optional<boolean>;

    selectedPeriode$ = new BehaviorSubject<Optional<number>>(null);
    vakResultaten$: Observable<GetMentorDashboardVakResultatenQuery['getMentorDashboardVakResultaten']>;
    resultaatBijzonderheid = ResultaatBijzonderheid;

    ngOnInit() {
        this.vakResultaten$ = this.selectedPeriode$.pipe(
            filter(Boolean),
            switchMap((periode) => this.mentordashboardDataService.getMentorDashboardVakResultaten(this.leerlingId, this.vak.id, periode)),
            map((vakResultaten) => ({
                ...vakResultaten,
                toetskolommen: sortBy(vakResultaten.toetskolommen, 'volgnummer'),
                advieskolommen: sortBy(vakResultaten.advieskolommen, 'geldendResultaat.volgnummer')
            }))
        );
    }

    ngOnChanges() {
        this.selectedPeriode$.next(this.periode);
    }

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }

    selectPeriode(periode: number) {
        this.selectedPeriode$.next(periode);
    }

    getFormattedResultaat(resultaat: Optional<string>) {
        return resultaat?.replace('!', '');
    }

    toonKolommen(vakResultaten: GetMentorDashboardVakResultatenQuery['getMentorDashboardVakResultaten']): boolean {
        return (
            vakResultaten.advieskolommen.length > 0 ||
            vakResultaten.toetskolommen.length > 0 ||
            Boolean(vakResultaten.periodeGemiddeldeKolom) ||
            Boolean(vakResultaten.rapportCijferkolom) ||
            Boolean(vakResultaten.rapportGemiddeldekolom)
        );
    }
}
