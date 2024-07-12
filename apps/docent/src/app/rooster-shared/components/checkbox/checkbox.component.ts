import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { IconCheckbox, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
    selector: 'dt-checkbox',
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, TooltipDirective],
    providers: [provideIcons(IconCheckbox)]
})
export class CheckboxComponent {
    @Input() checkboxControlName?: any;
    @Input() checkboxGroup?: UntypedFormGroup = new UntypedFormGroup({});
    @Input() checked?: boolean;
    @Input() disabled?: boolean;
    @Input() disabledTooltip?: string;

    @HostListener('click', ['$event'])
    onClicked(event: Event) {
        if (this.checkboxControlName) {
            this.checked = !this.checkboxGroup!.controls[this.checkboxControlName].value;
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
    }
}
