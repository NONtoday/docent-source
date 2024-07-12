import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, HostBinding, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconCheckbox, provideIcons } from 'harmony-icons';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-switch',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true
        },
        provideIcons(IconCheckbox)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent implements ControlValueAccessor {
    private changeDetector = inject(ChangeDetectorRef);
    @Input() label: Optional<string>;

    @HostBinding('class.disabled') disabled = false;

    public isSelected: boolean;

    @HostListener('click')
    toggle() {
        if (this.disabled) {
            return;
        }
        this.isSelected = !this.isSelected;
        this._onChange(this.isSelected);
        this.changeDetector.markForCheck();
    }

    private _onChange = (value: boolean) => {};
    private _onTouch = () => {};

    writeValue(obj: boolean): void {
        this.isSelected = obj;
        this.changeDetector.markForCheck();
    }

    registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouch = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
