import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconNietZichtbaarCheckbox, IconZichtbaarCheckbox, provideIcons } from 'harmony-icons';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-zichtbaarheidstoggle',
    template: `
        <i [hmyIcon]="isZichtbaar ? 'zichtbaarCheckbox' : 'nietZichtbaarCheckbox'" size="medium"></i>
        @if (label) {
            <span class="label text-content-semi">{{ label }}</span>
        }
    `,
    styleUrls: ['./zichtbaarheidstoggle.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective],
    providers: [provideIcons(IconZichtbaarCheckbox, IconNietZichtbaarCheckbox)]
})
export class ZichtbaarheidstoggleComponent {
    @HostBinding('class.is-zichtbaar') @Input() isZichtbaar: Optional<boolean>;
    @Input() label: string;
}
