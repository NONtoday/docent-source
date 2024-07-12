import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconDirective, PillComponent } from 'harmony';
import { IconChevronRechts, provideIcons } from 'harmony-icons';
import { Methode } from '../../../../generated/_types';

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
