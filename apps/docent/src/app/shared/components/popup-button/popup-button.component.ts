import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { IconName } from 'harmony-icons';
import { DeviceService } from '../../../core/services/device.service';
import { HarmonyColorName } from '../../../rooster-shared/colors';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';

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
    @Input() iconColor: HarmonyColorName = 'primary_1';
    @Input() iconHoverColor: HarmonyColorName;
    @Input() color: HarmonyColorName = 'primary_1';
    @Input() hoverColor: HarmonyColorName;
    @Input() disabled: boolean;
    @Input() text: string;
    @Input() hideOutlineForBreakpointUp: Breakpoint = 'desktop';
    @Input() showChevron: boolean;

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
