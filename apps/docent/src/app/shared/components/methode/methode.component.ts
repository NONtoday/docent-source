import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Methode } from '@docent/codegen';
import { IconDirective, PillComponent } from 'harmony';
import { IconChevronRechts, provideIcons } from 'harmony-icons';

@Component({
    selector: 'dt-methode',
    templateUrl: './methode.component.html',
    styleUrls: ['./methode.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective, PillComponent],
    providers: [provideIcons(IconChevronRechts)]
})
export class MethodeComponent {
    @Input() methode: Methode;
}
