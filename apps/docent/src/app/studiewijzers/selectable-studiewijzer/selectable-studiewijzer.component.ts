import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Studiewijzer } from '@docent/codegen';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconCheckbox, IconCheckboxDisabled, IconGroep, provideIcons } from 'harmony-icons';
import { isNil } from 'lodash-es';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';

@Component({
    selector: 'dt-selectable-studiewijzer',
    templateUrl: './selectable-studiewijzer.component.html',
    styleUrls: ['./selectable-studiewijzer.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectableStudiewijzerComponent),
            multi: true
        },
        provideIcons(IconCheckboxDisabled, IconGroep, IconCheckbox)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, CheckboxComponent, BackgroundIconComponent, IconDirective]
})
export class SelectableStudiewijzerComponent implements ControlValueAccessor {
    private changeDetector = inject(ChangeDetectorRef);
    static controlIdValue = 1;
    controlId: string;
    checked: boolean;
    disabled: boolean;

    @Input() studiewijzer: Studiewijzer;

    constructor() {
        this.controlId = String(SelectableStudiewijzerComponent.controlIdValue++);
    }

    onTouchedCallback = () => {};
    propagateChange = (_: any) => {};

    writeValue(value: any): void {
        if (!isNil(value)) {
            this.checked = value.checked;
        }
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.changeDetector.markForCheck();
    }

    onCheckboxClick(event: MouseEvent) {
        if ((event.target as HTMLInputElement).type === 'checkbox') {
            const newValue = !this.checked;

            this.checked = newValue;
            this.propagateChange({
                checked: newValue,
                studiewijzer: this.studiewijzer
            });
        }
    }
}
