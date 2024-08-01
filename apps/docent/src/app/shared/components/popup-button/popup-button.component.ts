import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { IconName } from 'harmony-icons';
import { DeviceService } from '../../../core/services/device.service';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { ActionColor } from '../../../rooster-shared/utils/color-token-utils';

export type Breakpoint = 'desktop' | 'tablet' | 'tabletPortrait' | 'mobile';

@Component({
    selector: 'dt-popup-button',
    templateUrl: './popup-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LinkComponent, OutlineButtonComponent]
})
export class PopupButtonComponent implements OnChanges {
    private deviceService = inject(DeviceService);
    @Input() icon: IconName;
    @Input() color: ActionColor = 'primary';
    @Input() disabled: boolean;
    @Input() text: string;
    @Input() hideOutlineForBreakpointUp: Breakpoint = 'desktop';

    hideOutline: boolean;

    ngOnChanges() {
        if (this.hideOutlineForBreakpointUp === 'mobile') {
            this.hideOutline = true;
        } else if (this.hideOutlineForBreakpointUp === 'tabletPortrait') {
            this.hideOutline = this.deviceService.isTabletPortraitOrTablet() || this.deviceService.isDesktop();
        } else if (this.hideOutlineForBreakpointUp === 'tablet') {
            this.hideOutline = this.deviceService.isTablet() || this.deviceService.isDesktop();
        } else {
            this.hideOutline = this.deviceService.isDesktop();
        }
    }
}
