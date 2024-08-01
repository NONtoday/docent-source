import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {
    AbstractControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { addMinutes, isWithinInterval, startOfDay, subMinutes, subSeconds } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconKlok, IconLeerlingVerwijderdCheckbox, IconName, IconNoRadio, IconTijd, provideIcons } from 'harmony-icons';
import get from 'lodash-es/get';
import { Subject, takeUntil } from 'rxjs';
import {
    AbsentieMelding,
    AbsentieRedenFieldsFragment,
    AbsentieSoort,
    AfspraakQuery,
    LesRegistratieQuery,
    Maybe
} from '../../../../generated/_types';
import { DeviceService } from '../../../core/services/device.service';
import { HarmonyColorName, toFillCssClass } from '../../../rooster-shared/colors';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { FormDropdownComponent } from '../../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { AutofocusDirective } from '../../../rooster-shared/directives/autofocus.directive';
import { AutosizeDirective } from '../../../rooster-shared/directives/autosize.directive';
import { TimeInputHelperDirective } from '../../../rooster-shared/directives/time-input-helper.directive';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { DropDownOption } from '../../../rooster-shared/utils/dropdown.util';
import { formatNL, hhmmToDate } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-absentie-melding-popup',
    templateUrl: './absentie-melding-popup.component.html',
    styleUrls: ['./absentie-melding-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        FormsModule,
        ReactiveFormsModule,
        FormDropdownComponent,
        TimeInputHelperDirective,
        TooltipDirective,
        AutosizeDirective,
        AutofocusDirective,
        OutlineButtonComponent,
        ButtonComponent,
        IconDirective
    ],
    providers: [provideIcons(IconTijd, IconNoRadio, IconKlok, IconLeerlingVerwijderdCheckbox)]
})
export class AbsentieMeldingPopupComponent implements OnInit, OnDestroy, Popup {
    private formbuilder = inject(UntypedFormBuilder);
    private deviceService = inject(DeviceService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('opmerkingenRef', { read: ElementRef }) opmerkingenRef: ElementRef;

    title: string;
    icon: IconName;
    iconColorClass: string;

    editAbsentieMeldingForm: UntypedFormGroup;
    isAbsent: boolean;

    tijd: AbstractControl;
    opmerkingen: AbstractControl;
    absentieReden: UntypedFormControl;
    dayOfAfspraak: Date;
    registratie: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number];
    absentieSoort: AbsentieSoort;
    afspraak: AfspraakQuery['afspraak'];

    absentieMeldingFieldName = 'teLaat';
    toegestaneAbsentieRedenen: DropDownOption<Maybe<AbsentieRedenFieldsFragment>>[];
    absentieRedenLabel = 'Afwezigheidsreden';
    saveButtonGtmTag: string;

    onSave: (absentieMelding: AbsentieMelding | null) => void;

    rows = 2;

    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.rows = this.deviceService.isPhone() ? 2 : 1;
        this.dayOfAfspraak = startOfDay(this.afspraak.begin);
        this.absentieMeldingFieldName = this.getAbsentieMeldingFieldName(this.absentieSoort);
        this.isAbsent = this.absentieSoort === AbsentieSoort.Absent;

        this.setIconAndTitle();

        const opmerkingen = get(this.registratie, this.absentieMeldingFieldName + '.opmerkingen', '');
        const tijdstip = get(this.registratie, this.absentieMeldingFieldName + '.tijdstip') as Date;

        this.toegestaneAbsentieRedenen = this.registratie.absentieRedenenToegestaanVoorDocent
            .filter((absentieReden: AbsentieRedenFieldsFragment) => absentieReden.absentieSoort === this.absentieSoort)
            .map((absentieReden) => ({ value: absentieReden, text: `${absentieReden.afkorting} - ${absentieReden.omschrijving}` }));

        if (this.isAbsent) {
            this.toegestaneAbsentieRedenen.unshift({ value: null, text: 'Niet bekend' });
        }
        let selectedAbsentieReden = get(
            this.registratie,
            this.absentieMeldingFieldName + '.absentieReden'
        ) as Maybe<AbsentieRedenFieldsFragment>;
        if (!selectedAbsentieReden && this.toegestaneAbsentieRedenen.length > 0) {
            selectedAbsentieReden = this.toegestaneAbsentieRedenen[0].value;
        }

        const tijdFieldValue = this.getTijdFieldValue(tijdstip, this.afspraak);

        this.editAbsentieMeldingForm = this.formbuilder.group({
            tijd: [tijdFieldValue, [Validators.required, this.tijdValtBinnenHuidigeAfspraak()]],
            opmerkingen: [{ value: opmerkingen, disabled: !selectedAbsentieReden }, Validators.maxLength(255)],
            absentieReden: [selectedAbsentieReden]
        });
        this.tijd = this.editAbsentieMeldingForm.controls['tijd'];
        this.opmerkingen = this.editAbsentieMeldingForm.controls['opmerkingen'];
        this.absentieReden = this.editAbsentieMeldingForm.controls['absentieReden'] as UntypedFormControl;

        this.absentieReden.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => (value ? this.opmerkingen.enable() : this.opmerkingen.disable()));

        // re-render popup after form state changes
        this.editAbsentieMeldingForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.popup.settings.height = undefined;

            this.popup.renderPopup();
        });
    }

    private setIconAndTitle() {
        switch (this.absentieSoort) {
            case AbsentieSoort.Absent:
                this.icon = 'noRadio';
                this.title = 'Afwezig';
                break;
            case AbsentieSoort.Telaat:
                this.icon = 'klok';
                this.title = 'Te laat';
                break;
            case AbsentieSoort.Verwijderd:
                this.icon = 'leerlingVerwijderdCheckbox';
                this.title = 'Verwijderd';
                break;
        }

        const iconColor: HarmonyColorName = this.isAbsent ? 'accent_negative_1' : 'secondary_1';
        this.iconColorClass = toFillCssClass(iconColor);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private getTijdFieldValue(tijdstip: Date, afspraak: AfspraakQuery['afspraak']): string {
        const tijd = tijdstip || new Date();
        if (isWithinInterval(tijd, { start: addMinutes(afspraak.begin, 1), end: subMinutes(afspraak.eind, 1) })) {
            return formatNL(tijd, 'HH:mm');
        } else {
            return formatNL(addMinutes(afspraak.begin, 1), 'HH:mm');
        }
    }

    private getAbsentieMeldingFieldName(absentieSoort: AbsentieSoort) {
        switch (absentieSoort) {
            case AbsentieSoort.Absent:
                return 'absent';
            case AbsentieSoort.Telaat:
                return 'teLaat';
            case AbsentieSoort.Verwijderd:
                return 'verwijderd';
        }
    }

    private convertDataToAbsentie(): AbsentieMelding | null {
        if (this.absentieSoort === AbsentieSoort.Absent && !this.absentieReden.value) {
            return null;
        }

        const tijdstip = hhmmToDate(this.tijd.value, this.dayOfAfspraak);
        return {
            id: get(
                this.registratie,
                this.absentieMeldingFieldName + '.id',
                `${this.registratie.id}-${this.registratie.leerling.id}-${this.absentieMeldingFieldName}`
            ),
            opmerkingen: this.opmerkingen.value,
            tijdstip,
            ingevoerdDoor: null,
            absentieReden: this.absentieReden.value,
            heeftEinde: true
        };
    }

    public onSubmit() {
        this.tijd.markAsDirty();
        this.opmerkingen.markAsDirty();
        this.absentieReden.markAsDirty();

        if (this.editAbsentieMeldingForm.valid) {
            this.onSave(this.convertDataToAbsentie());
            return this.popup.onClose('submit');
        }

        this.popup.settings.height = undefined;
        return this.popup.renderPopup();
    }

    tijdValtBinnenHuidigeAfspraak(): ValidatorFn {
        return (control: AbstractControl): Maybe<{ [key: string]: any }> => {
            let valtBinnenHuidigeAfspraak;
            if (this.tijd) {
                if (!this.tijd.value) {
                    return null;
                }
                const begin = subSeconds(addMinutes(new Date(this.afspraak.begin.getTime()), 1), 1);
                const eind = subMinutes(new Date(this.afspraak.eind.getTime()), 1);

                const tijd = hhmmToDate(this.tijd.value, this.dayOfAfspraak);
                valtBinnenHuidigeAfspraak = isWithinInterval(tijd, { start: begin, end: eind });
            }
            return valtBinnenHuidigeAfspraak ? null : { valtBuitenLes: { value: control.value } };
        };
    }

    public focusOpmerkingen() {
        // extra detectChanges nodig omdat de focus anders niet werkt als het opmerkingen veld van disabled -> enabled gaat
        this.changeDetector.detectChanges();
        this.opmerkingenRef.nativeElement.focus();
    }

    public annuleer() {
        return this.popup.onClose('cancel');
    }

    public mayClose(): boolean {
        return true;
    }
}
