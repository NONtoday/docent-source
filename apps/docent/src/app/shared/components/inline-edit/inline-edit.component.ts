import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, ViewChild, output } from '@angular/core';
import {
    AbstractControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormControl,
    UntypedFormGroup,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { Maybe } from '@docent/codegen';
import { IconDirective, NumbersOnlyDirective } from 'harmony';
import { IconCheck, IconSluiten, provideIcons } from 'harmony-icons';
import { AutofocusDirective } from '../../../rooster-shared/directives/autofocus.directive';
import { Optional, TextAlign } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-inline-edit',
    templateUrl: './inline-edit.component.html',
    styleUrls: ['./inline-edit.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, AutofocusDirective, NumbersOnlyDirective, IconDirective],
    providers: [provideIcons(IconCheck, IconSluiten)]
})
export class InlineEditComponent implements OnInit, OnChanges {
    @ViewChild('inputField', { static: true }) titleField: ElementRef;

    @Input() inputTextAlign: TextAlign = 'left';

    @Input() value: Optional<string>;
    @Input() placeholder = 'Naam';
    @Input() maxLength = 75;
    @Input() autofocus = true;
    @Input() validators: ((control: AbstractControl) => Maybe<ValidationErrors>)[] = [
        Validators.required,
        Validators.maxLength(this.maxLength)
    ];

    saveClick = output<string>();
    cancelClick = output<void>();

    public form: UntypedFormGroup;

    ngOnInit() {
        this.form = new UntypedFormGroup({
            value: new UntypedFormControl('', this.validators)
        });
        this.form.controls['value'].patchValue(this.value);
    }

    ngOnChanges() {
        if (this.form) {
            const control = this.form.controls['value'];
            control.setValidators(this.validators);
            control.updateValueAndValidity();
        }
    }

    onSubmit() {
        if (this.form.valid) {
            this.saveClick.emit(this.form.controls['value'].value);
        }
    }
}
