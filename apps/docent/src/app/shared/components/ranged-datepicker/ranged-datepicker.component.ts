import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import {
    ControlContainer,
    FormGroupDirective,
    ReactiveFormsModule,
    UntypedFormControl,
    UntypedFormGroup,
    Validators
} from '@angular/forms';
import { DateFilterFn, MatDatepickerModule } from '@angular/material/datepicker';
import { setHours, setMinutes, startOfDay } from 'date-fns';
import { Observable, Subject } from 'rxjs';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';

import { IconDirective } from 'harmony';
import { IconKalenderDag, IconTijd, IconUitklappenRechts, provideIcons } from 'harmony-icons';
import { Schooljaar } from '../../../core/models/schooljaar.model';
import { TijdInput } from '../../../core/models/shared.model';
import { DeviceService } from '../../../core/services/device.service';
import { isWeekend, timeInputRegEx } from '../../../rooster-shared/utils/date.utils';
import { formatNL } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-ranged-datepicker',
    templateUrl: './ranged-datepicker.component.html',
    styleUrls: ['./ranged-datepicker.component.scss'],
    viewProviders: [
        {
            provide: ControlContainer,
            useExisting: FormGroupDirective
        }
    ],
    standalone: true,
    imports: [CommonModule, IconDirective, MatDatepickerModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconUitklappenRechts, IconTijd, IconKalenderDag)]
})
export class RangedDatepickerComponent implements OnInit, OnChanges, OnDestroy {
    private deviceService = inject(DeviceService);
    @HostBinding('class.zonder-tijd') @Input() hideTime = false;
    @Input() rangeGroup: UntypedFormGroup;
    @Input() beginFormControlName = 'begin';
    @Input() eindFormControlName = 'eind';

    @Input() min: Date;
    @Input() max: Date;
    @Input() beginPlaceholder: string;
    @Input() eindPlaceholder: string;
    @Input() schooljaar: Schooljaar;
    @Input() onlyFutureDatesAllowed: boolean;

    @Input() disableWeekends = false;

    public isTouch$: Observable<boolean>;
    public disabled = false;
    public dateFilter: DateFilterFn<Date>;

    public beginTijdControl: UntypedFormControl;
    public eindTijdControl: UntypedFormControl;

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.isTouch$ = this.deviceService.onDeviceChange$.pipe(
            map(() => this.deviceService.isTouch()),
            startWith(this.deviceService.isTouch())
        );
        this.dateFilter = (date) => (this.disableWeekends ? !!date && !isWeekend(date) : true);
        this.beginTijdControl = new UntypedFormControl(formatNL(this.beginControl!.value, 'HH:mm'), Validators.required);
        this.eindTijdControl = new UntypedFormControl(formatNL(this.eindControl!.value, 'HH:mm'), Validators.required);

        this.beginTijdControl.valueChanges
            .pipe(
                startWith(formatNL(this.beginControl!.value, 'HH:mm')),
                filter(() => new RegExp(timeInputRegEx).test(this.beginTijdControl.value)),
                map(() => this.timeToDate(this.beginControl!.value, this.beginTijdControl.value)),
                takeUntil(this.destroy$)
            )
            .subscribe((dateWithTime) => {
                this.rangeGroup.markAsDirty();
                this.beginControl!.setValue(dateWithTime, { emitEvent: false });
            });

        this.eindTijdControl.valueChanges
            .pipe(
                startWith(formatNL(this.eindControl!.value, 'HH:mm')),
                filter(() => new RegExp(timeInputRegEx).test(this.eindTijdControl.value)),
                map(() => this.timeToDate(this.eindControl!.value, this.eindTijdControl.value)),
                takeUntil(this.destroy$)
            )
            .subscribe((dateWithTime) => {
                this.rangeGroup.markAsDirty();
                this.eindControl!.setValue(dateWithTime, { emitEvent: false });
            });
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

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    startChange(date: Date) {
        const dateWithTime = this.timeToDate(date, this.beginTijdControl.value);
        this.beginControl!.setValue(dateWithTime, { emitEvent: false });
    }

    eindChange(date: Date) {
        const dateWithTime = this.timeToDate(date, this.eindTijdControl.value);
        this.eindControl!.setValue(dateWithTime, { emitEvent: false });
    }

    timeToDate(date: Date, time: TijdInput) {
        const timeSplit = time.trim().split(':');
        const hours = timeSplit[0];
        const minutes = timeSplit[1];

        return setMinutes(setHours(date, +hours), +minutes);
    }

    get beginControl() {
        return this.rangeGroup.get(this.beginFormControlName);
    }

    get eindControl() {
        return this.rangeGroup.get(this.eindFormControlName);
    }
}
