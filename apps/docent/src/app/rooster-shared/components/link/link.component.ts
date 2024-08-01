import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconChevronRechts, IconName, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ActionColor } from '../../utils/color-token-utils';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-link, a',
    template: `
        @if (icon) {
            <i [hmyIcon]="icon" size="medium"></i>
        }
        <span class="text text-content-semi" [dtTooltip]="tooltipIfEllipsed" [showIfEllipsed]="true">
            <ng-content></ng-content>
        </span>
    `,
    styleUrls: ['./link.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, IconDirective],
    providers: [provideIcons(IconChevronRechts)]
})
export class LinkComponent {
    @HostBinding('class.with-icon') @Input() icon: Optional<IconName>;
    @HostBinding('class.disabled') @Input() disabled: boolean;
    @HostBinding('class.inline') @Input() inline = false;
    @HostBinding('class.use-ellipsis') @Input() useEllipsis = true;
    @Input() @HostBinding('attr.color') public color: ActionColor = 'primary';
    @Input() tooltipIfEllipsed: string;
}
