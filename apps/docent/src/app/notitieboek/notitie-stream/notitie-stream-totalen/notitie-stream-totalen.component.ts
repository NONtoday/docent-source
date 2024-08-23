import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { Router } from '@angular/router';
import { SpinnerComponent, TagComponent } from 'harmony';
import { Observable } from 'rxjs';
import { NotitieLeerlingTotalen } from '../../../core/models/notitieboek.model';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';

@Component({
    selector: 'dt-notitie-stream-totalen',
    standalone: true,
    imports: [CommonModule, AvatarComponent, VolledigeNaamPipe, TagComponent, SpinnerComponent],
    templateUrl: './notitie-stream-totalen.component.html',
    styleUrl: './notitie-stream-totalen.component.scss',
    host: {
        '[class.is-empty]': 'noTotalen()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotitieStreamTotalenComponent {
    private router = inject(Router);

    public noTotalen = input.required<boolean | null>();
    public stream = input.required<Observable<NotitieLeerlingTotalen[] | null>>();
    public selectedLeerlingTotalen = model.required<NotitieLeerlingTotalen | undefined>();

    public selectedLeerlingTotalenId = computed(() => this.selectedLeerlingTotalen()?.leerlingBetrokkene?.id);

    public selectLeerlingTotalen(leerlingTotalen: NotitieLeerlingTotalen) {
        this.selectedLeerlingTotalen.set(leerlingTotalen);
        this.router.navigate([], {
            queryParams: {
                notitie: null,
                edit: null
            },
            queryParamsHandling: 'merge'
        });
    }
}
