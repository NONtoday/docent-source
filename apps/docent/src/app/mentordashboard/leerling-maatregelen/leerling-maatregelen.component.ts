import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NotificationCounterComponent, SpinnerComponent } from 'harmony';
import { IconBewerken, IconVerwijderen, provideIcons } from 'harmony-icons';
import { switchMap, take, tap } from 'rxjs';
import { MaatregelToekenning } from '../../../generated/_types';
import { MaatregelToekenningDataService } from '../../core/services/maatregeltoekenning-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { MaatregelenBewerkenSidebarComponent } from '../maatregelen-bewerken-sidebar/maatregelen-bewerken-sidebar.component';
import { MaatregelenSidebarComponent } from '../maatregelen-sidebar/maatregelen-sidebar.component';
import { MaatregeltoekenningComponent } from '../maatregeltoekenning/maatregeltoekenning.component';

@Component({
    selector: 'dt-leerling-maatregelen',
    templateUrl: './leerling-maatregelen.component.html',
    styleUrls: ['./leerling-maatregelen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AccordionComponent, MaatregeltoekenningComponent, SpinnerComponent, NotificationCounterComponent],
    providers: [provideIcons(IconBewerken, IconVerwijderen)]
})
export class LeerlingMaatregelenComponent {
    private maatregelToekenningDataService = inject(MaatregelToekenningDataService);
    private sidebarService = inject(SidebarService);

    leerlingId = signal('');
    @Input({ alias: 'leerlingId' }) set _leerlingId(id: string) {
        this.leerlingId.set(id);
    }
    @Input() vestigingId: string;

    private preview = toSignal(
        toObservable(this.leerlingId).pipe(
            switchMap((id) => this.maatregelToekenningDataService.getMaatregeltoekenningenPreview(id)),
            tap(() => this.loading.set(false))
        ),
        { initialValue: { aantal: 0, maatregeltoekenningen: [] } }
    );
    public maatregelToekenningen = computed(() => this.preview().maatregeltoekenningen);
    public aantalMaatregelToekenningen = computed(() => this.preview().aantal);
    public loading = signal(true);

    openEditSidebar(maatregeltoekenning?: MaatregelToekenning) {
        this.maatregelToekenningDataService
            .getMaatregelen(this.vestigingId, true)
            .pipe(take(1))
            .subscribe((maatregelen) => {
                this.sidebarService.openSidebar(MaatregelenBewerkenSidebarComponent, {
                    maatregelToekenning: maatregeltoekenning,
                    leerlingId: this.leerlingId(),
                    maatregelen
                });
            });
    }

    onAfgehandeld(maatregeltoekenning: MaatregelToekenning) {
        this.maatregelToekenningDataService
            .updateMaatregeltoekenningAfgehandeld(maatregeltoekenning.id, !maatregeltoekenning.nagekomen)
            .subscribe();
    }

    onVerwijderen(maatregeltoekenning: MaatregelToekenning) {
        this.maatregelToekenningDataService.verwijderMaatregeltoekenning(maatregeltoekenning.id, this.leerlingId()).subscribe();
    }

    onVolledigOverzicht(event: Event) {
        event.stopPropagation();
        this.sidebarService.openSidebar(MaatregelenSidebarComponent, { leerlingId: this.leerlingId(), vestigingId: this.vestigingId });
    }
}
