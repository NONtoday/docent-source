import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconName } from 'harmony-icons';
import { TooltipDirective } from '../../directives/tooltip.directive';

export type IconColor = 'primary' | 'positive' | 'negative' | 'typography' | 'background' | 'background-light' | 'warning';

@Component({
    selector: 'dt-icon',
    template: `<i [hmyIcon]="icon" [size]="size" [sizes]="sizes" [dtTooltip]="tooltip"></i>`,
    styleUrls: ['./icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, IconDirective]
})
export class IconComponent {
    @Input() public icon: IconName;
    @Input() public size: IconSize = 'medium';
    @Input() public sizes: IconSize[];
    @Input() @HostBinding('attr.color') public color: IconColor = 'primary';
    @Input() public tooltip: string;
}
