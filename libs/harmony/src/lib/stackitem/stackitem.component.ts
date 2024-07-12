import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconName } from 'harmony-icons';
import { IconDirective } from '../icon/icon.directive';
import { Optional } from '../optional/optional';

@Component({
    selector: 'hmy-stackitem',
    standalone: true,
    imports: [CommonModule, IconDirective],
    templateUrl: './stackitem.component.html',
    styleUrls: ['./stackitem.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackitemComponent {
    @Input({ required: true }) titel: string;
    @Input() icon: Optional<IconName>;
    @Input() @HostBinding('class.is-category') isCategory = false;
}
