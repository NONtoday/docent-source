import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { DateFilterFn, MatCalendarCellClassFunction, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { BaseAfspraakKwtFragment } from '@docent/codegen';
import { endOfDay, isPast, isSameDay, isWeekend, startOfDay } from 'date-fns';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconKalenderDag, IconVerwijderen, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Schooljaar } from '../../../core/models/schooljaar.model';
import { DeviceService } from '../../../core/services/device.service';
import { DtDatePipe } from '../../pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../pipes/roostertoets.pipe';
import { Optional } from '../../utils/utils';
import { LesuurComponent } from '../lesuur/lesuur.component';

export type DatepickerHighlightColor = 'primary' | 'warning';

export interface DatepickerHighlightDay {
    datum: Date;
    highlightColor: DatepickerHighlightColor;
}
@Component({
    selector: 'dt-datepicker',
    templateUrl: './datepicker.component.html',
    styleUrls: ['./datepicker.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatepickerComponent),
            multi: true
        },
        provideIcons(IconVerwijderen, IconKalenderDag)
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        LesuurComponent,
        TooltipDirective,
        FormsModule,
        MatDatepickerModule,
        ReactiveFormsModule,
        AsyncPipe,
        DtDatePipe,
        RoosterToetsPipe,
        IconDirective
    ]
})
export class DatepickerComponent implements OnInit, OnChanges, ControlValueAccessor {
    private deviceService = inject(DeviceService);
    @Input() min: Optional<Date>;
    @Input() max: Optional<Date>;
    @Input() placeholder: string;
    @Input() schooljaar: Optional<Schooljaar>;
    @Input() afspraak: Optional<BaseAfspraakKwtFragment>;
    @Input() onlyFutureDatesAllowed: boolean;

    @Input() disableWeekends = false;
    @Input() highlightDagen: DatepickerHighlightDay[];
    @Input() isResetable: boolean;

    public disabled = false;
    public _formControl = new UntypedFormControl();
    public isTouch$: Observable<boolean>;
    public datum: Optional<Date>;

    public dateHighlightClass: MatCalendarCellClassFunction<Date>;
    public dateFilter: DateFilterFn<Date>;

    ngOnInit(): void {
        this.isTouch$ = this.deviceService.onDeviceChange$.pipe(
            map(() => this.deviceService.isTouch()),
            startWith(this.deviceService.isTouch())
        );
        this.dateFilter = (date) => (this.disableWeekends ? !!date && !isWeekend(date) : true);
        this.dateHighlightClass = (cellDate) => {
            const matchingDay = this.highlightDagen
                ?.filter((highlightDag) => !isPast(endOfDay(highlightDag.datum)))
                .find((date) => isSameDay(date.datum, new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())));
            return matchingDay ? ['dag-highlight', matchingDay.highlightColor] : '';
        };
    }

    ngOnChanges(): void {
        if (this.schooljaar) {
            this.min = this.schooljaar.start;
            this.max = this.schooljaar.eind;
        }
        if (this.onlyFutureDatesAllowed) {
            this.min = startOfDay(new Date());
        }
    }

    onDateChange(event: MatDatepickerInputEvent<Date>) {
        this.datum = event.value;
        this.onChange(event.value);
        this.onTouched();
    }

    onChange = (datum: Optional<Date>) => {};

    onTouched = () => {};

    writeValue(datum: Optional<Date>): void {
        this.datum = datum;
        this._formControl.setValue(datum);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
        isDisabled ? this._formControl.disable() : this._formControl.enable();
    }

    reset(event: Event) {
        event.stopPropagation();
        this.writeValue(null);
        this.onChange(null);
    }
}
