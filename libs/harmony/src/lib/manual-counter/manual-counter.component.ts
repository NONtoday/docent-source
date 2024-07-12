/* eslint-disable @typescript-eslint/no-empty-function */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NumbersOnlyDirective } from '../directives/numbers-only.directive';
import { SelectOnFocusDirective } from '../directives/select-on-focus.directive';

@Component({
    selector: 'hmy-manual-counter',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NumbersOnlyDirective, SelectOnFocusDirective],
    templateUrl: './manual-counter.component.html',
    styleUrls: ['./manual-counter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ManualCounterComponent),
            multi: true
        }
    ]
})
export class ManualCounterComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() minValue = 1;
    @Input() maxValue = 99;
    @Input() initialValue = 1;
    @Input() enableFastMode = false;

    counterValue: FormControl;

    onChange: (value: number) => void = () => {};
    onTouched: () => void = () => {};

    private incrementTimeout: CounterTimeout;
    private decrementTimeout: CounterTimeout;
    private interval = 200;
    private intervalMultiplier = 0.8;

    @HostListener('document:mouseup')
    onDocumentMouseUp() {
        this.stopIncrement();
        this.stopDecrement();
    }

    ngOnInit() {
        this.counterValue = new FormControl(this.initialValue);
    }

    ngOnDestroy() {
        this.stopIncrement();
        this.stopDecrement();
    }

    increment() {
        this.incrementValue();
        if (this.enableFastMode) {
            this.incrementTimeout = setTimeout(() => {
                this.increment();
                this.interval *= this.intervalMultiplier;
            }, this.interval);
        }
    }

    stopIncrement() {
        clearTimeout(this.incrementTimeout);
        this.interval = 200;
    }

    decrement() {
        this.decrementValue();
        if (this.enableFastMode) {
            this.decrementTimeout = setTimeout(() => {
                this.decrement();
                this.interval *= this.intervalMultiplier;
            }, this.interval);
        }
    }

    stopDecrement() {
        clearTimeout(this.decrementTimeout);
        this.interval = 200;
    }

    handleBlur() {
        const value = this.counterValue.value;
        const newValue = Math.max(this.minValue, Math.min(this.maxValue, value || this.minValue));
        this.counterValue.setValue(newValue);
        this.onChange(this.counterValue.value);
    }

    writeValue(value: any): void {
        this.counterValue.setValue(value);
    }

    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) {
            this.counterValue.disable();
        } else {
            this.counterValue.enable();
        }
    }

    private incrementValue() {
        const currentValue = this.counterValue.value;
        if (currentValue < this.maxValue) {
            this.counterValue.setValue(currentValue + 1);
            this.onChange(this.counterValue.value);
        } else {
            if (this.enableFastMode) {
                this.stopIncrement();
            }
        }
    }

    private decrementValue() {
        const currentValue = this.counterValue.value;
        if (currentValue > this.minValue) {
            this.counterValue.setValue(currentValue - 1);
            this.onChange(this.counterValue.value);
        } else {
            if (this.enableFastMode) {
                this.stopDecrement();
            }
        }
    }
}

type CounterTimeout = ReturnType<typeof setTimeout>;
