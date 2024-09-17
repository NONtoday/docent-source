import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Lesgroep, Maybe } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconChevronOnder, IconGroep, IconInformatie, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';

@Component({
    selector: 'dt-lesgroep-dropdown',
    templateUrl: './lesgroep-dropdown.component.html',
    styleUrls: ['./lesgroep-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LesgroepDropdownComponent),
            multi: true
        },
        provideIcons(IconChevronOnder, IconGroep, IconInformatie)
    ],
    standalone: true,
    imports: [BackgroundIconComponent, IconDirective]
})
export class LesgroepDropdownComponent implements ControlValueAccessor {
    @Input() invalid: boolean;
    @Input() placeholder: string;
    @Input() lesgroepen: Lesgroep[];

    public showDropdown = false;
    public selectedLesgroep: Maybe<Lesgroep>;
    public enabled = true;

    set value(lesgroep: Lesgroep) {
        this.selectedLesgroep = lesgroep;
        this.onChange(lesgroep);
        this.onTouched();
        this.showDropdown = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onChange = (lesgroep: Lesgroep) => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onTouched = () => {};

    toggleDropdown() {
        if (this.enabled) {
            this.showDropdown = !this.showDropdown;
        }
    }

    writeValue(obj: Lesgroep): void {
        if (obj) {
            this.value = obj;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.enabled = !isDisabled;
    }
}
