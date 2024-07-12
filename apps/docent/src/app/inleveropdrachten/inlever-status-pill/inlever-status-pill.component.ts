import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PillComponent, PillTagColor } from 'harmony';
import { InleveringStatus } from '../../../generated/_types';

@Component({
    selector: 'dt-inlever-status-pill',
    templateUrl: './inlever-status-pill.component.html',
    styleUrls: ['./inlever-status-pill.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [PillComponent]
})
export class InleverStatusPillComponent implements OnInit {
    @Input() inleverStatus: InleveringStatus;

    label: string;
    color: PillTagColor;

    ngOnInit(): void {
        if (this.inleverStatus === InleveringStatus.TE_BEOORDELEN) {
            this.label = 'Te beoordelen';
            this.color = 'primary';
        } else if (this.inleverStatus === InleveringStatus.IN_BEOORDELING) {
            this.label = 'In beoordeling';
            this.color = 'warning';
        } else if (this.inleverStatus === InleveringStatus.AFGEWEZEN) {
            this.label = 'Afgewezen';
            this.color = 'negative';
        } else if (this.inleverStatus === InleveringStatus.AKKOORD) {
            this.label = 'Akkoord';
            this.color = 'positive';
        } else if (this.inleverStatus === InleveringStatus.NIET_INGELEVERD) {
            this.label = 'Niet ingeleverd';
            this.color = 'neutral';
        }
    }
}
