import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { SpinnerComponent } from 'harmony';
import { IconLoader, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, Subject, of, switchMap, takeUntil } from 'rxjs';
import { KeuzelijstWaardeMogelijkheid, RegistratieDetailQuery, VakoverzichtRegistratiesQuery, VrijVeld } from '../../../generated/_types';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarAvatar, SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { UrenDurationPipe } from '../../shared/pipes/uren-duration.pipe';
import { LeerlingregistratiesDetailLijstComponent } from '../leerlingregistraties-detail-lijst/leerlingregistraties-detail-lijst.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { formatPercentage } from '../mentordashboard.utils';

@Component({
    selector: 'dt-leerlingregistraties-sidebar',
    templateUrl: './leerlingregistraties-sidebar.component.html',
    styleUrls: ['./leerlingregistraties-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 })],
    standalone: true,
    imports: [SidebarComponent, LeerlingregistratiesDetailLijstComponent, SpinnerComponent, AsyncPipe, UrenDurationPipe],
    providers: [provideIcons(IconLoader)]
})
export class LeerlingregistratiesSidebarComponent extends BaseSidebar implements OnInit, OnChanges, OnDestroy {
    public sidebarService = inject(SidebarService);
    public mentordashboardDataService = inject(MentordashboardDataService);
    @Input() leerlingId: string;
    @Input() vakId: Optional<string>;
    @Input() kolom: string;
    @Input() vrijVeld: VrijVeld;
    @Input() keuzelijstWaardeMogelijkheid: KeuzelijstWaardeMogelijkheid;
    @Input() periodes: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'];
    @Input() initialPeriode: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number];
    @Input() sidebarAvatar: SidebarAvatar;

    public selectedPeriode$ = new BehaviorSubject<Optional<VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number]>>(
        null
    );
    public registratieDetail$: Observable<RegistratieDetailQuery['registratieDetail']>;
    public isAfwezigKolom: boolean;
    public formatPercentageAfwezig = formatPercentage;

    private onDestroy$ = new Subject<void>();

    ngOnInit(): void {
        this.registratieDetail$ = this.selectedPeriode$.pipe(
            switchMap((periode) =>
                periode && periode.vanaf && periode.tot
                    ? this.mentordashboardDataService.getRegistratiesDetail(
                          this.leerlingId,
                          this.vakId,
                          this.kolom,
                          periode.vanaf,
                          periode.tot,
                          this.vrijVeld?.id,
                          this.keuzelijstWaardeMogelijkheid?.id
                      )
                    : of(this.emptyDetail())
            ),
            takeUntil(this.onDestroy$)
        );
    }

    ngOnChanges(): void {
        this.selectedPeriode$.next(this.initialPeriode);
        this.isAfwezigKolom = this.kolom?.includes('afwezig');
    }

    emptyDetail(): RegistratieDetailQuery['registratieDetail'] {
        return {
            aantal: 0,
            aantalLessen: 0,
            aantalToetsmomenten: 0,
            totaalMinuten: 0,
            registraties: [],
            rapportCijfer: '-'
        };
    }

    trackByNummer(index: number, item: VakoverzichtRegistratiesQuery['vakoverzichtRegistraties']['periodes'][number]) {
        return item.nummer;
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
