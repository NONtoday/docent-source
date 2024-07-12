import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, OnChanges } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconChevronRechts, IconName, provideIcons } from 'harmony-icons';
import { HarmonyColorName, toColorCssClass, toFillCssClass } from '../../../rooster-shared/colors';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-link, a',
    template: `
        @if (icon) {
            <i class="{{ isHover ? iconHoverClass : iconColorClass }}" [hmyIcon]="icon" size="medium"></i>
        }
        <span
            class="text text-content-semi {{ isHover ? hoverClass : colorClass }}"
            [dtTooltip]="tooltipIfEllipsed"
            [showIfEllipsed]="true">
            <ng-content></ng-content>
        </span>
        @if (showChevron) {
            <i class="{{ isHover ? iconHoverClass : 'fill-background-1' }} chevron-rechts-icon" hmyIcon="chevronRechts" size="medium"></i>
        }
    `,
    styleUrls: ['./link.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, IconDirective],
    providers: [provideIcons(IconChevronRechts)]
})
export class LinkComponent implements OnChanges {
    @HostBinding('class.with-icon') @Input() icon: Optional<IconName>;
    @HostBinding('class.with-chevron') @Input() showChevron: boolean;
    @HostBinding('class.disabled') @Input() disabled: boolean;
    @HostBinding('class.inline') @Input() inline = false;
    @HostBinding('class.use-ellipsis') @Input() useEllipsis = true;
    @Input() iconColor: Optional<HarmonyColorName> = 'primary_1';
    @Input() iconHoverColor: Optional<HarmonyColorName>;
    @Input() color: Optional<HarmonyColorName> = 'primary_1';
    @Input() hoverColor: Optional<HarmonyColorName>;
    @Input() tooltipIfEllipsed: string;

    colorClass: string;
    hoverClass: string;
    iconColorClass: string;
    iconHoverClass: string;

    isHover = false;

    @HostListener('mouseenter') onMouseEnter() {
        this.isHover = true;
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.isHover = false;
    }

    ngOnChanges(): void {
        const color = this.color ?? 'primary_1';
        const iconColor = this.iconColor ?? color;

        this.colorClass = toColorCssClass(color);
        this.hoverClass = toColorCssClass(this.hoverColor || color);
        this.iconColorClass = toFillCssClass(iconColor);
        this.iconHoverClass = toFillCssClass(this.iconHoverColor || this.hoverColor || color);
    }
}
