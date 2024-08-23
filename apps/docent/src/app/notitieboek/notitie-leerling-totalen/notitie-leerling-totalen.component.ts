import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeviceService, IconDirective } from 'harmony';
import { IconPijlLinks, IconToevoegen, provideIcons } from 'harmony-icons';
import { NotitieFieldsFragment } from '../../../generated/_types';
import { NotitieLeerlingTotalen, NotitieboekContext } from '../../core/models/notitieboek.model';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { NotitieKaartComponent } from '../notitie-kaart/notitie-kaart.component';
import { NotitieFilter, NotitieboekFilterComponent } from '../notitieboek-filter/notitieboek-filter.component';

@Component({
    selector: 'dt-notitie-leerling-totalen',
    standalone: true,
    imports: [
        CommonModule,
        DtDatePipe,
        NotitieKaartComponent,
        RouterModule,
        OutlineButtonComponent,
        BackgroundIconComponent,
        NotitieboekFilterComponent,
        IconDirective,
        AvatarComponent,
        VolledigeNaamPipe
    ],
    providers: [provideIcons(IconToevoegen, IconPijlLinks)],
    templateUrl: './notitie-leerling-totalen.component.html',
    styleUrl: './notitie-leerling-totalen.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotitieLeerlingTotalenComponent {
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private deviceService = inject(DeviceService);

    public context = input.required<NotitieboekContext>();
    public filterOptie = model.required<NotitieFilter | undefined>();
    public huidigeSchooljaarSelected = input.required<boolean>();
    public schooljaar = model.required<number | undefined>();
    public searchValue = model.required<string>();
    public totalen = input.required<NotitieLeerlingTotalen | undefined>();
    public onTerug = output<void>();

    protected isTabletOrDesktop = toSignal(this.deviceService.isTabletOrDesktop$);
    protected leerlingId = computed(() => JSON.stringify([this.totalen()?.leerlingBetrokkene.id]));

    protected notitieBewerken(notitie: NotitieFieldsFragment) {
        const queryIndex = this.router.url.indexOf('?');
        const redirectUrl = this.router.url.substring(0, queryIndex === -1 ? undefined : queryIndex);
        this.router.navigate([redirectUrl], {
            queryParams: {
                ...this.activatedRoute.snapshot.queryParams,
                [this.context().context.toLowerCase()]: this.context().id,
                notitie: notitie.id,
                edit: 'true'
            }
        });
    }
}
