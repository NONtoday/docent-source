import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, output } from '@angular/core';
import { IconChevronLinks, IconChevronRechts, IconName, provideIcons } from 'harmony-icons';
import { TooltipDirective, TooltipPosition } from '../directives/tooltip/tooltip.directive';
import { IconDirective } from '../icon/icon.directive';
import { Optional } from '../optional/optional';

@Component({
    selector: 'hmy-browse',
    standalone: true,
    imports: [CommonModule, IconDirective, TooltipDirective],
    templateUrl: './browse.component.html',
    styleUrls: ['./browse.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronLinks, IconChevronRechts)]
})
export class BrowseComponent implements AfterViewInit {
    @ViewChild('back', { read: ElementRef }) backButtonRef: ElementRef;
    @ViewChild('next', { read: ElementRef }) nextButtonRef: ElementRef;

    @Input() text: string;
    @Input() backDisabled = false;
    @Input() nextDisabled = false;
    @Input() backTooltip: Optional<string>;
    @Input() nextTooltip: Optional<string>;
    @Input() tooltipPosition: TooltipPosition = 'top';
    @Input() backAdditionalAttributes: Optional<{ [key: string]: string }>;
    @Input() nextAdditionalAttributes: Optional<{ [key: string]: string }>;
    @Input() backIcon: IconName = 'chevronLinks';
    @Input() nextIcon: IconName = 'chevronRechts';

    backClick = output<void>();
    nextClick = output<void>();

    ngAfterViewInit(): void {
        if (this.backAdditionalAttributes) {
            Object.entries(this.backAdditionalAttributes).forEach(([name, value]) =>
                this.backButtonRef.nativeElement.setAttribute(name, value)
            );
        }

        if (this.nextAdditionalAttributes) {
            Object.entries(this.nextAdditionalAttributes).forEach(([name, value]) =>
                this.nextButtonRef.nativeElement.setAttribute(name, value)
            );
        }
    }
}
