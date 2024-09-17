import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TotaalRegistratieDetailsQuery } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconTrend, provideIcons } from 'harmony-icons';
import { Observable, map, switchMap } from 'rxjs';
import { Maand, Maanden } from '../../core/models/shared.model';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarAvatar, SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { UrenDurationPipe } from '../../shared/pipes/uren-duration.pipe';
import { LeerlingregistratiesDetailLijstComponent } from '../leerlingregistraties-detail-lijst/leerlingregistraties-detail-lijst.component';
import { TotaalRegistratie } from '../leerlingregistraties-totalen/leerlingregistraties-totalen.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { formatPercentage } from '../mentordashboard.utils';

@Component({
    selector: 'dt-leerlingregistraties-totaal-sidebar',
    templateUrl: './leerlingregistraties-totaal-sidebar.component.html',
    styleUrls: ['./leerlingregistraties-totaal-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        TooltipDirective,
        LeerlingregistratiesDetailLijstComponent,
        SpinnerComponent,
        AsyncPipe,
        UrenDurationPipe,
        IconDirective
    ],
    providers: [provideIcons(IconTrend)]
})
export class LeerlingregistratiesTotaalSidebarComponent extends BaseSidebar implements OnInit, OnChanges {
    public sidebarService = inject(SidebarService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private route = inject(ActivatedRoute);
    @Input() totaalAantalLessen: number;
    @Input() registratie: TotaalRegistratie;
    @Input() sidebarAvatar: SidebarAvatar;

    public registratieDetail$: Observable<TotaalRegistratieDetailsQuery['totaalRegistratieDetails']>;
    public formatPercentageAfwezig = formatPercentage;
    public isAfwezigKolom: boolean;
    public huidigeMaand: Maand;
    public maanden = Maanden;

    ngOnInit(): void {
        this.registratieDetail$ = this.route.params.pipe(
            map((params) => params.id),
            switchMap((leerlingId) =>
                this.mentordashboardDataService.getTotaalRegistratieDetails(
                    leerlingId,
                    this.registratie.kolom,
                    this.registratie.vrijVeld?.id,
                    this.registratie.keuzelijstWaarde?.id
                )
            )
        );

        this.huidigeMaand = this.maanden[new Date().getMonth()];
    }

    ngOnChanges(): void {
        this.isAfwezigKolom = this.registratie.kolom?.toLowerCase().includes('afwezig');
    }
}
