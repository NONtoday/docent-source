import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { LeerlingregistratiesTableComponent } from '../leerlingregistraties-table/leerlingregistraties-table.component';
import { MentordashboardService } from '../mentordashboard.service';

@Component({
    selector: 'dt-leerlingregistraties',
    templateUrl: './leerlingregistraties.component.html',
    styleUrls: ['./leerlingregistraties.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingregistratiesTableComponent, MessageComponent]
})
export class LeerlingregistratiesComponent implements OnDestroy {
    private mentordashboardService = inject(MentordashboardService);
    showIngesteldMessage = false;

    ngOnDestroy() {
        this.mentordashboardService.resetVakNavigatie();
    }
}
