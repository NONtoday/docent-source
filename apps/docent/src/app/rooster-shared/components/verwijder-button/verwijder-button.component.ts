import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, inject, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconCheck, IconName, IconSluiten, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Optional } from '../../utils/utils';
import { LinkComponent } from '../link/link.component';
import { IconRangeOption, OutlineButtonComponent } from '../outline-button/outline-button.component';

@Component({
    selector: 'dt-verwijder-button',
    templateUrl: './verwijder-button.component.html',
    styleUrls: ['./verwijder-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [OutlineButtonComponent, LinkComponent, IconDirective],
    providers: [provideIcons(IconCheck, IconSluiten, IconVerwijderen)]
})
export class VerwijderButtonComponent {
    private changeDetector = inject(ChangeDetectorRef);
    public showConfirmationButtons: boolean;

    @Input() @HostBinding('class.with-border') withBorder = false;
    @Input() buttonText = 'Verwijderen';
    @Input() icon: Optional<IconName> = 'verwijderen';
    @Input() gtmTag: Optional<string>;
    @Input() iconOnlyRangeEnd: IconRangeOption = 'never';
    @Input() hideIconForMobile = false;

    onDelete = output<void>();
    onSelection = output<void>();

    resetButton() {
        this.showConfirmationButtons = false;
        this.changeDetector.markForCheck();
    }

    onVerwijderClick(event: Event) {
        this.showConfirmationButtons = true;
        this.onSelection.emit();
        event.stopPropagation();
    }
}
