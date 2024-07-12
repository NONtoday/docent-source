import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, HostBinding, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconCheckbox, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
    selector: 'dt-form-checkbox',
    template: `
        <label
            class="checkbox-container"
            [class.disabled]="disabled"
            [dtTooltip]="disabledTooltip"
            [onTouchAllowed]="true"
            [tooltipDisplayable]="disabled"
            [maxWidth]="320"
            position="bottom">
            <input [(ngModel)]="isSelected" [disabled]="disabled" (change)="toggleCheckbox($event)" type="checkbox" />
            <span class="checkmark" [class.disabled]="disabled"></span>
            @if (label) {
                <div class="label" [class.disabled]="disabled">{{ label }}</div>
            }
        </label>
    `,
    styleUrls: ['./form-checkbox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormCheckboxComponent),
            multi: true
        },
        provideIcons(IconCheckbox)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, FormsModule]
})
export class FormCheckboxComponent implements ControlValueAccessor {
    private changeDetector = inject(ChangeDetectorRef);
    @HostBinding('class.disabled') disabled = false;
    @Input() label: string;
    @Input() disabledTooltip: string;

    public isSelected: boolean;

    toggleCheckbox(event: Event) {
        if (this.disabled) {
            return;
        }
        this.isSelected = (<HTMLInputElement>event.target).checked;
        this._onChange(this.isSelected);
    }

    private _onChange = (value: boolean) => {};
    private _onTouch = () => {};

    writeValue(obj: any): void {
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
