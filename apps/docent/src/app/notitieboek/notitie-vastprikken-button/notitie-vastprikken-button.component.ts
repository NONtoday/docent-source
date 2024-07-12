import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewChild, ViewContainerRef, output } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconPinned, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';

@Component({
    selector: 'dt-notitie-vastprikken-button',
    standalone: true,
    imports: [TooltipDirective, IconDirective],
    templateUrl: './notitie-vastprikken-button.component.html',
    styleUrls: ['./notitie-vastprikken-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconPinned)]
})
export class NotitieVastprikkenButtonComponent {
    @ViewChild('button', { read: ViewContainerRef }) buttonRef: ViewContainerRef;
    @Input() vastgeprikt = false;
    @Input() iconSizes: IconSize[] = ['medium'];

    @HostBinding('class.compact') @Input() compact = false;

    onVastprikken = output<boolean>();

    toggleVastgeprikt() {
        this.vastgeprikt = !this.vastgeprikt;
        this.onVastprikken.emit(this.vastgeprikt);
    }
}
