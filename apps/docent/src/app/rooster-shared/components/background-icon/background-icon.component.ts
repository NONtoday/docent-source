import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconName } from 'harmony-icons';
import { Maybe } from '../../../../generated/_types';
import { HarmonyColor, HarmonyColorName, colorToHex, getHarmonyBackgroundColor, toFillCssClass } from '../../../rooster-shared/colors';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-background-icon',
    template: `<i
        class="icon {{ hover ? hoverCssClass : fillCssClass }}"
        [hmyIcon]="icon"
        [size]="size"
        [sizes]="sizes"
        (mouseover)="hover = true"
        (mouseleave)="hover = false"></i>`,
    styleUrls: ['./background-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective]
})
export class BackgroundIconComponent implements OnChanges {
    @HostBinding('attr.mobilesize') public mobileSize: IconSize;
    @HostBinding('attr.tabletsize') public tabletSize: Maybe<IconSize>;
    @HostBinding('attr.desktopsize') public desktopSize: Maybe<IconSize>;
    @Input() @HostBinding('style.background-color') public harmonyBackgroundColor: HarmonyColor;
    @Input() public color: Optional<HarmonyColorName> = 'primary_1';

    /** Property om makkelijker de size op te geven. array met waardes van mobile -> desktop, waarbij mobile = 0 */
    @Input() public sizes: IconSize[];
    @Input() public size: IconSize;
    @Input() public icon: IconName;
    @Input() public backgroundColor: HarmonyColorName | HarmonyColor | 'blank';
    @Input() public hoverColor: HarmonyColorName;

    public fillCssClass: string;
    public hoverCssClass: string;
    public hover = false;

    ngOnChanges() {
        this.fillCssClass = toFillCssClass(this.color ?? 'primary_1');
        this.hoverCssClass = this.hoverColor ? toFillCssClass(this.hoverColor) : toFillCssClass(this.color ?? 'primary_1');
        this.harmonyBackgroundColor = this.backgroundColor
            ? colorToHex(this.backgroundColor)
            : getHarmonyBackgroundColor(colorToHex(this.color ?? 'primary_1'));

        if (this.size) {
            this.mobileSize = this.size;
            this.tabletSize = null;
            this.desktopSize = null;
        }
        if (this.sizes) {
            this.mobileSize = this.sizes[0];
            this.tabletSize = this.sizes[1];
            this.desktopSize = this.sizes[2];
        }
    }
}
