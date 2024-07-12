import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter, map, switchMap, tap } from 'rxjs';
import { LeerlingkaartQuery } from '../../../generated/_types';
import { allowChildAnimations } from '../../core/core-animations';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { LeerlingContactpersonenComponent } from '../leerling-contactpersonen/leerling-contactpersonen.component';
import { LeerlingGezinssituatieComponent } from '../leerling-gezinssituatie/leerling-gezinssituatie.component';
import { LeerlingMaatregelenComponent } from '../leerling-maatregelen/leerling-maatregelen.component';
import { LeerlingPersonaliaComponent } from '../leerling-personalia/leerling-personalia.component';
import { LeerlingVastgeprikteNotitiesPreviewComponent } from '../leerling-vastgeprikte-notities-preview/leerling-vastgeprikte-notities-preview.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
@Component({
    selector: 'dt-leerlingkaart',
    templateUrl: './leerlingkaart.component.html',
    styleUrls: ['./leerlingkaart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [allowChildAnimations],
    standalone: true,
    imports: [
        LeerlingPersonaliaComponent,
        LeerlingContactpersonenComponent,
        LeerlingGezinssituatieComponent,
        LeerlingMaatregelenComponent,
        LeerlingVastgeprikteNotitiesPreviewComponent,
        AsyncPipe
    ]
})
export class LeerlingkaartComponent implements OnInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private route = inject(ActivatedRoute);
    leerlingkaart$: Observable<LeerlingkaartQuery['leerlingkaart']>;
    notitieboekToegang$: Observable<boolean>;

    public heeftLeerlingPlaatsingenRegistratiesInzienRecht$: Observable<boolean>;
    public indicatiesCounter: number;
    public heeftBerichtenRecht$: Observable<boolean>;

    ngOnInit() {
        this.heeftLeerlingPlaatsingenRegistratiesInzienRecht$ =
            this.medewerkerDataService.heeftLeerlingPlaatsingenRegistratiesInzienRecht();
        this.heeftBerichtenRecht$ = this.medewerkerDataService.heeftBerichtenWijzigenRecht().pipe(shareReplayLastValue());

        this.leerlingkaart$ = this.route.parent!.params.pipe(
            switchMap((params) => this.mentordashboardDataService.getLeerlingkaart(params.id)),
            tap((leerlingkaart) => {
                this.indicatiesCounter =
                    leerlingkaart.beperkingen.length + leerlingkaart.hulpmiddelen.length + leerlingkaart.interventies.length;
            })
        );

        this.notitieboekToegang$ = this.leerlingkaart$.pipe(
            map((kaart) => kaart.leerling?.vestigingId),
            filter(Boolean),
            switchMap((vestigingId) => this.medewerkerDataService.heeftNotitieboekToegangVoorVestiging(vestigingId))
        );
    }
}
