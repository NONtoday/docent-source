import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpinnerComponent, TooltipDirective } from 'harmony';
import { derivedAsync } from 'ngxtension/derived-async';
import { injectParams } from 'ngxtension/inject-params';
import { map, switchMap } from 'rxjs';
import { Vak, VakToetsTrend } from '../../../../../generated/_types';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { docentPendingQuery } from '../../../../shared/utils/apollo.utils';
import { MentordashboardDataService } from '../../../mentordashboard-data.service';
import { MentordashboardTrendMetInfoComponent } from '../../../mentordashboard-trend-met-info/mentordashboard-trend-met-info.component';
import { MentordashboardService } from '../../../mentordashboard.service';
import { LeerlingoverzichtDataService } from '../../leerlingoverzicht-data.service';
import { initialResultaatInstellingen } from '../../leerlingoverzicht-resultaten/leerlingoverzicht-resultaten.component';
import { LeerlingoverzichtVakToetsResultaatComponent } from '../../leerlingoverzicht-vak-toets-resultaat/leerlingoverzicht-vak-toets-resultaat.component';

@Component({
    selector: 'dt-leerlingoverzicht-vak-alle-resultaten',
    standalone: true,
    imports: [LeerlingoverzichtVakToetsResultaatComponent, MentordashboardTrendMetInfoComponent, TooltipDirective, SpinnerComponent],
    templateUrl: './leerlingoverzicht-vak-alle-resultaten.component.html',
    styleUrl: './leerlingoverzicht-vak-alle-resultaten.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtVakAlleResultatenComponent {
    vakToetsTrend = input.required<Optional<VakToetsTrend>>();
    vak = input.required<Vak>();

    private loDataService = inject(LeerlingoverzichtDataService);
    private mdDataService = inject(MentordashboardDataService);
    private mentordashboardService = inject(MentordashboardService);
    private leerlingId = injectParams('id');

    instellingen = toSignal(
        this.mentordashboardService.huidigeStamgroep$.pipe(
            switchMap((stamgroep) => this.mdDataService.groepsoverzichtInstellingen(stamgroep.id)),
            map((instellingen) => instellingen.resultaten)
        ),
        { initialValue: initialResultaatInstellingen }
    );

    vakResultaatPeriodes = derivedAsync(
        () => this.loDataService.leerlingoverzichtVakDetailPeriodeToetsresultaten(this.leerlingId()!, this.vak().id),
        { initialValue: docentPendingQuery([]) }
    );
}
