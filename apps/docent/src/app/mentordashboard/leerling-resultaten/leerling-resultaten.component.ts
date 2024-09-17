import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    GetMentorDashboardExamendossierVoorPlaatsingQuery,
    GetMentorDashboardResultatenContextQuery,
    GetMentorDashboardVoortgangsdossierVoorLeerlingQuery,
    Maybe
} from '@docent/codegen';
import { SpinnerComponent } from 'harmony';
import { IconResultaten, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, distinctUntilChanged, map, switchMap } from 'rxjs';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { DeviceService } from '../../core/services/device.service';
import { Optional, toId } from '../../rooster-shared/utils/utils';
import { ExamendossierComponent } from '../examendossier/examendossier.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardService } from '../mentordashboard.service';
import { OnderwijssoortNavigatieComponent } from '../onderwijssoort-navigatie/onderwijssoort-navigatie.component';
import { Layout, VoortgangsdossierComponent } from '../voortgangsdossier/voortgangsdossier.component';

@Component({
    selector: 'dt-leerling-resultaten',
    templateUrl: './leerling-resultaten.component.html',
    styleUrls: ['./../table.scss', './leerling-resultaten.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [OnderwijssoortNavigatieComponent, ExamendossierComponent, VoortgangsdossierComponent, SpinnerComponent, AsyncPipe],
    providers: [provideIcons(IconResultaten)]
})
export class LeerlingResultatenComponent implements OnInit {
    public deviceService = inject(DeviceService);
    public mentordashboardDataService = inject(MentordashboardDataService);
    private mentordashboardService = inject(MentordashboardService);
    private route = inject(ActivatedRoute);
    public stamgroepenEnResultatenMatrix$: Observable<{
        contexten: GetMentorDashboardResultatenContextQuery['getMentorDashboardResultatenContext'];
        resultaten: {
            examenResultaten: Maybe<GetMentorDashboardExamendossierVoorPlaatsingQuery['getMentorDashboardExamendossierVoorPlaatsing']>;
            voortgangsResultaten: Maybe<
                GetMentorDashboardVoortgangsdossierVoorLeerlingQuery['getMentorDashboardVoortgangsdossierVoorLeerling']
            >;
        };
    }>;

    public alternatieveNormeringParam$: Observable<{ value: boolean }>;
    public plaatsingParam$: Observable<{ id: string | null }>;
    public lichtingParam$: Observable<{ id: string | null }>;
    public vestigingId$: Observable<Optional<string>>;

    public showResultatenAs$: Observable<Layout>;

    ngOnInit() {
        this.mentordashboardService.setActions([]);

        const stamgroepParam$ = this.route.queryParamMap.pipe(
            map((params) => ({ id: params.get('stamgroep') })),
            distinctUntilChanged()
        );

        this.alternatieveNormeringParam$ = this.route.queryParamMap.pipe(
            map((params) => ({ value: params.has('alternatieveNormering') })),
            distinctUntilChanged()
        );

        this.plaatsingParam$ = this.route.queryParamMap.pipe(
            map((params) => ({ id: params.get('plaatsing') })),
            distinctUntilChanged()
        );

        this.lichtingParam$ = this.route.queryParamMap.pipe(
            map((params) => ({ id: params.get('lichting') })),
            distinctUntilChanged()
        );

        const leerling$ = this.mentordashboardService.huidigeLeerling$.pipe(map(toId), shareReplayLastValue());
        this.vestigingId$ = this.mentordashboardService.huidigeLeerling$.pipe(
            map((leerling) => leerling.vestigingId),
            shareReplayLastValue()
        );

        const contexten$ = leerling$.pipe(
            switchMap((leerlingId) => this.mentordashboardDataService.getMentorDashboardResultatenContext(leerlingId))
        );

        const resultatenMatrix$ = combineLatest([leerling$, stamgroepParam$, this.plaatsingParam$, this.lichtingParam$]).pipe(
            switchMap(([leerlingId, stamgroepParam, plaatsingParam, lichtingParam]) => {
                if (plaatsingParam?.id) {
                    return this.mentordashboardDataService.getMentorDashboardExamenDossier(plaatsingParam.id, lichtingParam?.id);
                } else {
                    return this.mentordashboardDataService.getMentorDashboardLeerlingDossier(leerlingId, stamgroepParam.id);
                }
            }),
            shareReplayLastValue()
        );

        this.stamgroepenEnResultatenMatrix$ = combineLatest([contexten$, resultatenMatrix$, this.alternatieveNormeringParam$]).pipe(
            map(([contexten, resultaten, alternatieveNormeringParam]) => {
                if (resultaten.__typename === 'MentorDashboardVoortgangsDossier') {
                    return {
                        contexten,
                        resultaten: {
                            examenResultaten: null,
                            voortgangsResultaten: {
                                ...resultaten,
                                vakPeriodes: resultaten.vakPeriodes.filter(
                                    (vakPeriode) => !alternatieveNormeringParam.value || vakPeriode.heeftAlternatieveNormering
                                )
                            }
                        }
                    };
                } else {
                    return {
                        contexten,
                        resultaten: {
                            examenResultaten: <
                                GetMentorDashboardExamendossierVoorPlaatsingQuery['getMentorDashboardExamendossierVoorPlaatsing']
                            >resultaten,
                            voortgangsResultaten: null
                        }
                    };
                }
            })
        );

        this.showResultatenAs$ = this.deviceService.isTabletOrDesktop$.pipe(
            map((tabletOrDesktop) => (tabletOrDesktop ? Layout.TABLE : Layout.MOBILE))
        );
    }
}
