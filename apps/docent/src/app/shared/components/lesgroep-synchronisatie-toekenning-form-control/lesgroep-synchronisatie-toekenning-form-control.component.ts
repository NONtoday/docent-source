/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChangeDetectionStrategy, Component, forwardRef, HostBinding, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconDirective } from 'harmony';
import { IconKopieren, IconNietKopieren, IconSynchroniseren, provideIcons } from 'harmony-icons';
import { Lesgroep } from '../../../../generated/_types';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';

export interface LesgroepControl {
    checked: boolean;
    lesgroep: Lesgroep;
    disabled: boolean;
    synchroniseert: boolean;
}

@Component({
    selector: 'dt-lesgroep-synchronisatie-toekenning-form-control',
    templateUrl: './lesgroep-synchronisatie-toekenning-form-control.component.html',
    styleUrls: ['./lesgroep-synchronisatie-toekenning-form-control.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LesgroepSynchronisatieToekenningFormControlComponent),
            multi: true
        },
        provideIcons(IconSynchroniseren, IconKopieren, IconNietKopieren)
    ],
    standalone: true,
    imports: [TooltipDirective, IconDirective]
})
export class LesgroepSynchronisatieToekenningFormControlComponent implements ControlValueAccessor {
    @HostBinding('class.disabled') @Input() disabled = false;
    @Input() lesgroep: Lesgroep;
    @Input() synchroniseert: boolean;

    selected = true;

    private _onChange = (_: any) => {};
    private _onTouch = () => {};

    writeValue(value: LesgroepControl): void {
        this._onChange(value);
        this.selected = value.checked;
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

    onControlClick(value: boolean) {
        this.writeValue({
            checked: value,
            lesgroep: this.lesgroep,
            disabled: this.disabled,
            synchroniseert: this.synchroniseert
        });
    }
}
