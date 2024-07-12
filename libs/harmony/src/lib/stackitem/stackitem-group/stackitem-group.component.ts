import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'hmy-stackitem-group',
    standalone: true,
    imports: [CommonModule],
    template: `<ng-content></ng-content>`,
    styleUrls: ['./stackitem-group.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackitemGroupComponent {}
