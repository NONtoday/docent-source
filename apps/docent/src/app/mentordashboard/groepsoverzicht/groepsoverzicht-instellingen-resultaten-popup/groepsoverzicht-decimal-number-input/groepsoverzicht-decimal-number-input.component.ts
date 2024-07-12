/* eslint-disable @typescript-eslint/no-empty-function */

import { ChangeDetectionStrategy, Component, Input, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NumbersOnlyDirective, SelectOnFocusDirective } from 'harmony';

@Component({
    selector: 'dt-groepsoverzicht-decimal-number-input',
    standalone: true,
    imports: [ReactiveFormsModule, NumbersOnlyDirective, SelectOnFocusDirective],
    templateUrl: './groepsoverzicht-decimal-number-input.component.html',
    styleUrls: ['./groepsoverzicht-decimal-number-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => GroepsoverzichtDecimalNumberInputComponent),
            multi: true
        }
    ]
})
export class GroepsoverzichtDecimalNumberInputComponent implements OnInit, ControlValueAccessor {
    @Input() initialValue = 1.0;
    @Input() hasError = false;

    inputControl: FormControl;

    private currentValue: number;

    ngOnInit() {
        this.currentValue = this.initialValue;
        this.inputControl = new FormControl(this.currentValue.toFixed(1).replace('.', ','));
    }

    handleBlur() {
        this.currentValue = this.getNumericValue(this.inputControl.value);
        this.inputControl.patchValue(this.currentValue.toFixed(1).replace('.', ','), { emitEvent: false });
        this.onChange(this.currentValue);
        this.onTouched(this.currentValue);
    }

    onChange: (value: number) => void = () => {};
    onTouched: (value: number) => void = () => {};

    writeValue(value: any): void {
        if (value !== undefined) {
            const formattedValue = value.toFixed(1).replace('.', ',');
            this.inputControl.setValue(formattedValue, { emitEvent: false });
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) {
            this.inputControl.disable();
        } else {
            this.inputControl.enable();
        }
    }

    private getNumericValue(input: string): number {
        // regex: (group: 0-n numbers) [ignore: 0-n delimiters] (group: 0-n numbers)
        const match = input.match(/(\d*)[.,]*(\d*)/);

        // use current value in case of no valid match
        if (!match || match[0].length === 0 || (match[1].length === 0 && match[2].length === 0)) {
            return this.currentValue;
        }

        // first element is the full match, which can be ignored
        const [, integerMatch, fractionalMatch] = match;
        let integer = 0;
        let fractional = 0;

        if (integerMatch.length > 0) {
            integer = parseInt(integerMatch[0]);

            if (integerMatch.length > 1) {
                fractional = parseInt(integerMatch[1]);
            }
        }

        if (fractionalMatch.length > 0) {
            fractional = parseInt(fractionalMatch[0]);
        }

        // 0,0 is invalid, so use current value
        if (integer === 0 && fractional === 0) {
            return this.currentValue;
        }

        const totalValue = integer + fractional / 10;

        return totalValue;
    }
}
