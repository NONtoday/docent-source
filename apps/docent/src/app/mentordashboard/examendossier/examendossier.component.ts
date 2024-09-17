import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CentraalExamenType, GetMentorDashboardExamendossierVoorPlaatsingQuery, ResultaatBijzonderheid, Vak } from '@docent/codegen';
import { DeviceService, IconPillComponent, PillComponent, TooltipDirective, shareReplayLastValue } from 'harmony';
import {
    IconExamenMetVarianten,
    IconHogerNiveau,
    IconSamengesteldeToets,
    IconTrendBeneden,
    IconTrendBoven,
    IconWaarschuwing,
    provideIcons
} from 'harmony-icons';
import { Observable, map } from 'rxjs';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { Optional } from '../../rooster-shared/utils/utils';
import { CommaResultPipe } from '../../shared/pipes/comma-result.pipe';
import { MathAbsPipe } from '../../shared/pipes/math-abs.pipe';
import { MentordashboardResultatenCeSidebarComponent } from '../mentordashboard-resultaten-ce-sidebar/mentordashboard-resultaten-ce-sidebar.component';
import { MentordashboardResultatenSeSidebarComponent } from '../mentordashboard-resultaten-se-sidebar/mentordashboard-resultaten-se-sidebar.component';
import { LeerlingResultatenTrendTooltipPipe } from '../pipes/leerling-resultaten-trend-tooltip.pipe';
import { TrendPillColorPipe } from '../pipes/trend-pill-color.pipe';

@Component({
    selector: 'dt-examendossier',
    templateUrl: './examendossier.component.html',
    styleUrls: ['./../table.scss', './examendossier.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        IconPillComponent,
        PillComponent,
        TooltipDirective,
        MathAbsPipe,
        CommaResultPipe,
        LeerlingResultatenTrendTooltipPipe,
        TrendPillColorPipe,
        AsyncPipe
    ],
    providers: [
        provideIcons(IconHogerNiveau, IconTrendBeneden, IconTrendBoven, IconWaarschuwing, IconExamenMetVarianten, IconSamengesteldeToets)
    ]
})
export class ExamendossierComponent implements OnChanges {
    private sidebarService = inject(SidebarService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private deviceService = inject(DeviceService);

    @Input({ required: true })
    resultaten: GetMentorDashboardExamendossierVoorPlaatsingQuery['getMentorDashboardExamendossierVoorPlaatsing'];
    @Input() plaatsingId: Optional<string>;
    @Input() lichtingId: Optional<string>;
    @Input({ required: true }) vestigingId: Optional<string>;

    public readonly samengesteldCE = CentraalExamenType.SAMENGESTELD;
    public readonly variantenCE = CentraalExamenType.MET_VARIANTEN;

    public readonly ontbrekendResultaat = ResultaatBijzonderheid.NietGemaakt;

    public highlightIndex: Optional<number>;

    public hasAtLeastOneCEOrEindCijfer: boolean;
    public toonTrend$: Observable<boolean>;
    public isPhoneOrTabletPortrait = toSignal(this.deviceService.isPhoneOrTabletPortrait$, { initialValue: false });

    ngOnChanges(): void {
        this.hasAtLeastOneCEOrEindCijfer = this.resultaten?.examenVakSamenvattendeResultaten.some(
            (item) =>
                item.ceCijfer?.labelAfkorting ||
                item.ceCijfer?.formattedResultaat ||
                item.eindCijfer?.labelAfkorting ||
                item.eindCijfer?.formattedResultaat
        );
        this.toonTrend$ = this.medewerkerDataService.getMedewerker().pipe(
            map((medewerker) => {
                const heeftRecht =
                    this.vestigingId &&
                    medewerker.settings.vestigingRechten.find((recht) => recht.vestigingId === this.vestigingId)
                        ?.heeftToegangMentordashboardCompleet;
                return !!heeftRecht && this.resultaten.heeftTrendindicatie;
            }),
            shareReplayLastValue()
        );
    }

    highlight = (row: Optional<number>) => (this.highlightIndex = row);

    public openSEDetailsSidebar(vak: Vak) {
        if (this.plaatsingId) {
            this.sidebarService.openSidebar(MentordashboardResultatenSeSidebarComponent, {
                plaatsingId: this.plaatsingId,
                vak,
                lichtingId: this.lichtingId
            });
        }
    }

    public openCEDetailsSidebar(vak: Vak) {
        if (this.plaatsingId) {
            this.sidebarService.openSidebar(MentordashboardResultatenCeSidebarComponent, {
                plaatsingId: this.plaatsingId,
                vak,
                lichtingId: this.lichtingId
            });
        }
    }
}
