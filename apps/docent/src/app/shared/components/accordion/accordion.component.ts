import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconChevronBoven, IconName, provideIcons } from 'harmony-icons';

@Component({
    selector: 'dt-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective],
    providers: [provideIcons(IconChevronBoven)]
})
export class AccordionComponent {
    @Input() headerIcon: IconName;
    @Input() withShadow = true;
    @Input() expanded = false;
    @Input() isSubAccordion = false;
    // zorgt voor borders aan de zijkant in tablet-portrait en tablet. Mobile heeft nooit borders, desktop altijd.
    @Input() showSideBorders = false;
    @Input() zonderBorderRadius = false;
    @Input() lightBackground: boolean;
    @Input() showChevron = true;

    onToggle = output<boolean>();

    toggle(): void {
        this.expanded = !this.expanded;
        this.onToggle.emit(this.expanded);
    }
}
