import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconTijd, provideIcons } from 'harmony-icons';
import { TimeInputHelperDirective } from '../../directives/time-input-helper.directive';
import { DatepickerComponent } from '../datepicker/datepicker.component';

@Component({
    selector: 'dt-datepicker-start-eind',
    templateUrl: './datepicker-start-eind.component.html',
    styleUrls: ['./datepicker-start-eind.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [
        {
            provide: ControlContainer,
            useExisting: FormGroupDirective
        }
    ],
    standalone: true,
    imports: [DatepickerComponent, FormsModule, ReactiveFormsModule, TimeInputHelperDirective],
    providers: [provideIcons(IconTijd)]
})
export class DatepickerStartEindComponent {
    @Input() dateControlName: string;
    @Input() startControlName: string;
    @Input() eindControlName: string;
    @Input() min: Date;
    @Input() max: Date;
}
