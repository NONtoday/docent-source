import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationCounterComponent, SpinnerComponent } from 'harmony';
import { Observable, map, startWith } from 'rxjs';
import { NotitieContext, VastgeprikteNotitiesPreviewQuery } from '../../../generated/_types';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { NotitieKaartComponent } from '../../notitieboek/notitie-kaart/notitie-kaart.component';
import { NotitiesSidebarComponent } from '../../notitieboek/notities-sidebar/notities-sidebar.component';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';

@Component({
    selector: 'dt-leerling-vastgeprikte-notities-preview',
    templateUrl: './leerling-vastgeprikte-notities-preview.component.html',
    styleUrls: ['./leerling-vastgeprikte-notities-preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AccordionComponent, NotitieKaartComponent, SpinnerComponent, AsyncPipe, NotificationCounterComponent]
})
export class LeerlingVastgeprikteNotitiesPreviewComponent implements OnChanges {
    private notitieDataService = inject(NotitieboekDataService);
    private sidebarService = inject(SidebarService);
    private router = inject(Router);
    @Input() leerlingId: string;

    context: NotitieboekContext;

    preview$: Observable<VastgeprikteNotitiesPreviewQuery['vastgeprikteNotitiesPreview']>;
    aantalVastgeprikteNotities$: Observable<number>;
    huidigSchooljaar = getSchooljaar(new Date());

    ngOnChanges() {
        this.preview$ = this.notitieDataService.getVastgeprikteNotitiesPreview(this.leerlingId);
        this.aantalVastgeprikteNotities$ = this.preview$.pipe(
            map(({ aantalVastgeprikteNotities }) => aantalVastgeprikteNotities),
            startWith(0)
        );

        this.context = {
            id: this.leerlingId,
            context: NotitieContext.LEERLING
        };
    }

    openNotitiesSidebar(_event: Event, notitieId?: string) {
        this.sidebarService.openSidebar(NotitiesSidebarComponent, {
            titel: `Vastgeprikte notities ${this.huidigSchooljaar.start.getFullYear()}/${this.huidigSchooljaar.eind.getFullYear()}`,
            context: this.context,
            notities$: this.notitieDataService.getVastgeprikteNotities(this.leerlingId),
            openNotitieActiveId: notitieId,
            openInNotitieboekCallback: (notitieId) => this.openInNotitieboek(notitieId)
        });
    }

    openInNotitieboek(notitieId: string) {
        this.sidebarService.closeSidebar();

        const leerlingId = this.context.id;
        this.router.navigate([`/mentordashboard/leerling/${leerlingId}/notitieboek`], {
            queryParams: { notitie: notitieId }
        });
    }
}
