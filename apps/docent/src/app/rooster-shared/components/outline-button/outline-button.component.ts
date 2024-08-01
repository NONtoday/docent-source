import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconName } from 'harmony-icons';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ActionColor } from '../../utils/color-token-utils';
import { Optional } from '../../utils/utils';

export type IconRangeOption = 'mobile' | 'tablet-portrait' | 'tablet' | 'desktop' | 'never';

@Component({
    selector: 'dt-outline-button',
    template: `
        @if (icon) {
            <i [hmyIcon]="icon" [sizes]="iconSizes"></i>
        }
        <span class="text text-content-semi" [dtTooltip]="tooltipIfEllipsed" [showIfEllipsed]="true">
            <ng-content></ng-content>
        </span>
        @if (notificationCount && notificationCount > 0) {
            <span class="link-notification">{{ notificationCount }}</span>
        }
    `,
    styleUrls: ['./outline-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, IconDirective]
})
export class OutlineButtonComponent implements OnChanges {
    private elementRef = inject(ElementRef);
    @HostBinding('class.with-icon') @Input() icon: Optional<IconName>;
    @HostBinding('class.disabled') @Input() disabled: boolean;
    @HostBinding('class.dashed') @Input() dashed: boolean;
    @HostBinding('class.word-wrap') @Input() wordWrap = false;
    @HostBinding('class.icon-right') @Input() iconRight: boolean;
    @HostBinding('attr.color') @Input() color: ActionColor = 'primary';
    @Input() @HostBinding('attr.icon-only-range') iconOnlyRangeEnd: IconRangeOption = 'never';
    @Input() @HostBinding('class.hide-icon-for-mobile') hideIconForMobile = false;
    @Input() iconSizes: IconSize[] = ['large', 'large', 'large', 'medium'];

    @Input() notificationCount: Optional<number> = 0;
    @Input() tooltipIfEllipsed: string;

    desktopSmall: boolean;

    ngOnChanges(): void {
        // Er werd al magie gedaan o.b.v. deze class, maar ook benodigd voor het icon
        this.desktopSmall = this.elementRef.nativeElement.classList.contains('desktop-small');
        if (this.desktopSmall) {
            this.iconSizes = ['large', 'large', 'large', 'small'];
        }
    }
}
