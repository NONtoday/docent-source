import { ChangeDetectionStrategy, Component, Input, OnInit, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatrixResultaatkolomFieldsFragment } from '@docent/codegen';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { AutosizeDirective } from '../../rooster-shared/directives/autosize.directive';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-toetskolom-lesgroepomschrijving-formulier',
    templateUrl: './toetskolom-lesgroepomschrijving-formulier.component.html',
    styleUrls: ['./toetskolom-lesgroepomschrijving-formulier.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, OutlineButtonComponent, ButtonComponent, AutosizeDirective]
})
export class ToetskolomLesgroepOmschrijvingFormulierComponent implements OnInit {
    @Input() kolom: Optional<MatrixResultaatkolomFieldsFragment>;

    onSubmit = output<MatrixResultaatkolomFieldsFragment>();
    onAnnuleren = output<void>();

    toetskolomLesgroepOmschrijvingForm: UntypedFormGroup;
    maxLengthLesgroepOmschrijving = 75;
    heeftBestaandeLesgroepOmschrijving: boolean;

    formControl: UntypedFormControl;

    ngOnInit(): void {
        this.formControl = new UntypedFormControl(
            this.kolom?.lesgroepSpecifiekeOmschrijving,
            Validators.maxLength(this.maxLengthLesgroepOmschrijving)
        );
        this.heeftBestaandeLesgroepOmschrijving = !!this.kolom?.lesgroepSpecifiekeOmschrijving;
    }

    onSubmitClick() {
        if (this.kolom) {
            this.onSubmit.emit({
                ...this.kolom,
                lesgroepSpecifiekeOmschrijving: this.formControl.value
            });
        }
    }
}
