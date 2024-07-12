import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PillComponent } from 'harmony';

@Component({
    selector: 'dt-bijlage-extensie',
    template: ` <hmy-pill class="extensie" [text]="extensie | uppercase"></hmy-pill>`,
    styleUrls: ['./bijlage-extensie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [UpperCasePipe, PillComponent]
})
export class BijlageExtensieComponent {
    @Input() extensie = '';
}
