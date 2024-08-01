import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconName } from 'harmony-icons';
import { Maybe } from '../../../../generated/_types';
import { BackgroundIconColor } from '../../utils/color-token-utils';

/**
 * Dit component gebruikt niet de color input van het hmy-icon directive, maar gebruikt hiervoor eigen styling. Dit om dynamische kleuren ookn samen met hover mogelijk te maken, op basis van css variabelen.
 */
@Component({
    selector: 'dt-background-icon',
    template: `<i class="icon" [hmyIcon]="icon" [size]="size" [sizes]="sizes"></i>`,
    styleUrls: ['./background-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective]
})
export class BackgroundIconComponent implements OnChanges {
    @HostBinding('attr.mobilesize') public mobileSize: IconSize;
    @HostBinding('attr.tabletsize') public tabletSize: Maybe<IconSize>;
    @HostBinding('attr.desktopsize') public desktopSize: Maybe<IconSize>;
    @Input() @HostBinding('attr.color') public color: BackgroundIconColor = 'primary';
    @Input() @HostBinding('class.hoverable') public hoverable = false;

    /** Property om makkelijker de size op te geven. array met waardes van mobile -> desktop, waarbij mobile = 0 */
    @Input() public sizes: IconSize[];
    @Input() public size: IconSize;
    @Input() public icon: IconName;

    ngOnChanges() {
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
