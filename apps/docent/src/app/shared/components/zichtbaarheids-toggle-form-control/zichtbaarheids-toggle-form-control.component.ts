import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { memoize } from 'lodash-es';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { ZichtbaarheidstoggleComponent } from '../zichtbaarheidstoggle/zichtbaarheidstoggle.component';

@Component({
    selector: 'dt-zichtbaarheids-toggle-form-control',
    template: `<dt-zichtbaarheidstoggle
        [dtTooltip]="tooltipFn(value)"
        [isZichtbaar]="value"
        [label]="label"
        (click)="writeValue(!value); $event.stopPropagation()"></dt-zichtbaarheidstoggle>`,
    styleUrls: ['./zichtbaarheids-toggle-form-control.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZichtbaarheidsToggleFormControlComponent),
            multi: true
        }
    ],
    standalone: true,
    imports: [ZichtbaarheidstoggleComponent, TooltipDirective]
})
export class ZichtbaarheidsToggleFormControlComponent implements ControlValueAccessor {
    private changeDetector = inject(ChangeDetectorRef);
    @Input() label: string;
    @Input() tooltipFn = memoize((zichtbaar) => (zichtbaar ? 'Zichtbaar voor leerlingen' : 'Niet zichtbaar voor leerlingen'));

    value: boolean;
    private _onChange = (_: any) => {};
    private _onTouch = () => {};

    writeValue(value: boolean): void {
        this._onChange(value);
        this.value = value;
        this.changeDetector.detectChanges();
    }

    registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouch = fn;
    }

    setDisabledState?(isDisabled: boolean): void {}
}
