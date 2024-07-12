import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { Observable, take } from 'rxjs';
import { MaatregelToekenning } from '../../../generated/_types';
import { MaatregelToekenningDataService, MaatregelToekenningenMetStatus } from '../../core/services/maatregeltoekenning-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { MaatregelenBewerkenSidebarComponent } from '../maatregelen-bewerken-sidebar/maatregelen-bewerken-sidebar.component';
import { MaatregelenLijstComponent } from '../maatregelen-lijst/maatregelen-lijst.component';

@Component({
    selector: 'dt-maatregelen-sidebar',
    templateUrl: './maatregelen-sidebar.component.html',
    styleUrls: ['./maatregelen-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, HeeftRechtDirective, OutlineButtonComponent, AsyncPipe, MaatregelenLijstComponent],
    providers: [provideIcons(IconToevoegen)]
})
export class MaatregelenSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private maatregelToekenningDataService = inject(MaatregelToekenningDataService);
    @Input() leerlingId: string;
    @Input() vestigingId: string;

    maatregelToekenningen$: Observable<MaatregelToekenningenMetStatus>;

    ngOnInit() {
        this.maatregelToekenningen$ = this.maatregelToekenningDataService.getMaatregeltoekenningenMetStatus(this.leerlingId);
    }

    openEditSidebar(maatregeltoekenning?: MaatregelToekenning) {
        this.maatregelToekenningDataService
            .getMaatregelen(this.vestigingId, true)
            .pipe(take(1))
            .subscribe((maatregelen) => {
                this.sidebarService.openSidebar(MaatregelenBewerkenSidebarComponent, {
                    maatregelToekenning: maatregeltoekenning,
                    leerlingId: this.leerlingId,
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
        this.maatregelToekenningDataService.verwijderMaatregeltoekenning(maatregeltoekenning.id, this.leerlingId).subscribe();
    }
}
