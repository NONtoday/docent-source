import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconRadio, IconRadioSelect, provideIcons } from 'harmony-icons';
import { RadioOption } from '../radio-options';

@Component({
    selector: 'dt-share-content-radio-option',
    templateUrl: './share-content-radio-option.component.html',
    styleUrls: ['./share-content-radio-option.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective],
    providers: [provideIcons(IconRadioSelect, IconRadio)]
})
export class ShareContentRadioOptionComponent {
    @Input() radioOption: RadioOption;
    @Input() checked: boolean;
}
