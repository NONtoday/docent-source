import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    ViewChild,
    forwardRef,
    output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isEqual, isNil } from 'lodash-es';

import { ColorToken, IconDirective } from 'harmony';
import { IconChevronOnder, IconName, IconNoRadio, provideIcons } from 'harmony-icons';
import { NgClickOutsideDelayOutsideDirective, NgClickOutsideDirective } from 'ng-click-outside2';
import { DropDownOption } from '../../utils/dropdown.util';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-form-dropdown',
    templateUrl: './form-dropdown.component.html',
    styleUrls: ['./form-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormDropdownComponent),
            multi: true
        },
        provideIcons(IconNoRadio, IconChevronOnder)
    ],
    standalone: true,
    imports: [NgClickOutsideDirective, NgClickOutsideDelayOutsideDirective, IconDirective]
})
export class FormDropdownComponent<T> implements ControlValueAccessor, OnChanges {
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('dropdown', { read: ElementRef }) dropdownRef: ElementRef;
    @HostBinding('class.with-icon') metIcoon = true;
    @HostBinding('class.is-open') public showDropdown = false;

    @Input() invalid: boolean;
    @Input() enabled = true;
    @Input() placeholder: string;
    @Input() icon: IconName;
    @Input() iconColor: ColorToken;
    @Input() opties: DropDownOption<T>[] = [];
    @Input() selectedOptie: Optional<DropDownOption<T>>;
    @Input() selectBoxHeight: number;
    @Input() chevronIcon: IconName = 'chevronOnder';
    @Input() scrollIntoView = true;

    onOptieClicked = output<any>();

    @HostListener('keydown', ['$event']) keyDown(event: KeyboardEvent) {
        if (this.showDropdown) {
            const option = this.opties.find((optie) => optie.text.toLocaleLowerCase().startsWith(event.key));
            const options: HTMLCollection = this.dropdownRef?.nativeElement.querySelectorAll('.optie');
            const optionElement = Array.from(options).find((optie) => optie.textContent === option?.text);
            optionElement?.scrollIntoView({ block: 'start' });
        }
    }

    ngOnChanges(): void {
        this.metIcoon = Boolean(this.icon) || this.opties?.some((optie) => optie.icon);
    }

    set value(optie: Optional<DropDownOption<T>>) {
        this.selectedOptie = optie;
        this.onChange(optie?.value);
        this.onTouched();
        this.showDropdown = false;
    }

    onChange = (optie: Optional<T>) => {};

    onTouched = () => {};

    toggleDropdown() {
        if (this.enabled) {
            this.showDropdown = !this.showDropdown;
            if (this.showDropdown && this.scrollIntoView) {
                setTimeout(() => {
                    this.dropdownRef?.nativeElement
                        .querySelector('.is-selected')
                        ?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'start' });
                });
            }
        }
    }

    writeValue(obj: T, $event?: Event): void {
        $event?.stopPropagation();

        const newValue = isNil(obj)
            ? this.opties.find((optie) => isNil(optie.value))
            : this.opties.find((optie) => isEqual(optie.value, obj));

        this.value = newValue;
        this.onOptieClicked.emit(newValue?.value);
        this.changeDetector.markForCheck();
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

    closeDropDown(event: Event) {
        this.showDropdown = false;
        event.preventDefault();
        event.stopPropagation();
    }

    isSelected(optie: DropDownOption<T>): boolean {
        return !!this.selectedOptie && optie.value === this.selectedOptie.value;
    }
}
