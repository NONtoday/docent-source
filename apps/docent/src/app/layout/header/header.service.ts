import { Injectable, inject } from '@angular/core';
import { QueryRef } from 'apollo-angular';
import { Observable, startWith } from 'rxjs';
import { IngelogdeMedewerkerQuery, OngelezenNotitiesAanwezigQuery } from '../../../generated/_types';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SharedDataService } from '../../core/services/shared-data.service';

@Injectable({
    providedIn: 'root'
})
export class HeaderService {
    private medewerkerDataService = inject(MedewerkerDataService);
    private sharedService = inject(SharedDataService);
    medewerker$: Observable<IngelogdeMedewerkerQuery['ingelogdeMedewerker']>;
    isUpdateBeschikbaar$: Observable<boolean>;

    heeftOngelezenNotitieQuery$: QueryRef<OngelezenNotitiesAanwezigQuery>;

    constructor() {
        this.medewerker$ = this.medewerkerDataService.getMedewerker();
        this.isUpdateBeschikbaar$ = this.sharedService.isUpdateBeschikbaar().pipe(startWith(false), shareReplayLastValue());
        this.heeftOngelezenNotitieQuery$ = this.medewerkerDataService.ongelezenNotitiesAanwezigWatchQuery();
    }
}
