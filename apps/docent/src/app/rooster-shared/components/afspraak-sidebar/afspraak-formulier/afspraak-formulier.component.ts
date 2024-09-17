import { AsyncPipe, NgClass } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import {
    Afspraak,
    AfspraakHerhalingDag,
    AfspraakHerhalingEindeType,
    AfspraakHerhalingType,
    BijlageFieldsFragment,
    HerhalendeAfspraak
} from '@docent/codegen';
import { addDays, addHours, isBefore, isValid, setHours, setMinutes, startOfDay, subHours } from 'date-fns';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconVerversen, IconVerwijderen, provideIcons } from 'harmony-icons';
import { isEqual } from 'lodash-es';
import {
    BehaviorSubject,
    Observable,
    Subject,
    debounceTime,
    delay,
    distinctUntilChanged,
    filter,
    map,
    startWith,
    take,
    takeUntil,
    tap
} from 'rxjs';
import { Schooljaar } from '../../../../core/models/schooljaar.model';
import { TijdInput } from '../../../../core/models/shared.model';
import { PopupService } from '../../../../core/popup/popup.service';
import { ComponentUploadService } from '../../../../core/services/component-upload.service';
import { DeviceService } from '../../../../core/services/device.service';
import { MedewerkerDataService } from '../../../../core/services/medewerker-data.service';
import { herhalendeAfspraakSchooljaarValidator } from '../../../../core/validators/herhalende-afspraak-schooljaar-validator';
import { startVoorEindValidator } from '../../../../core/validators/startVoorEind.validator';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConferenceDateRange } from '../../../../shared/components/editor-form-control/editor-form-control.component';
import { replaceInArray } from '../../../../shared/utils/array.utils';
import { AutofocusDirective } from '../../../directives/autofocus.directive';
import { getSchooljaar } from '../../../utils/date.utils';
import {
    afspraakHerhalingEindeOptions,
    dagWerkdagOptions,
    herhalingDagOptions,
    herhalingTypeOptions,
    maandXsteOptions
} from '../../../utils/dropdown.util';
import { Optional, formatNL, hhmmToDate } from '../../../utils/utils';
import { ButtonComponent } from '../../button/button.component';
import { DagenSelectieComponent } from '../../dagen-selectie/dagen-selectie.component';
import { DatepickerStartEindComponent } from '../../datepicker-start-eind/datepicker-start-eind.component';
import { DatepickerComponent } from '../../datepicker/datepicker.component';
import { DeelnemerSelectieComponent } from '../../deelnemer-selectie/deelnemer-selectie.component';
import { FormDropdownComponent } from '../../form-dropdown/form-dropdown.component';
import { OmschrijvingEnBijlageComponent } from '../../omschrijving-en-bijlage/omschrijving-en-bijlage.component';
import { OutlineButtonComponent } from '../../outline-button/outline-button.component';

type HerhalendeAfspraakFormInput = HerhalendeAfspraak & { herhalingEindeType: AfspraakHerhalingEindeType };
type HerhalingAfspraakValidatorMap = { [Property in keyof Partial<HerhalendeAfspraakFormInput>]: (formValues: any) => ValidatorFn[] };

@Component({
    selector: 'dt-afspraak-formulier',
    templateUrl: './afspraak-formulier.component.html',
    styleUrls: ['./afspraak-formulier.component.scss'],
    providers: [ComponentUploadService, provideIcons(IconVerversen, IconVerwijderen)],
    standalone: true,
    imports: [
        FormsModule,
        NgClass,
        ReactiveFormsModule,
        AutofocusDirective,
        DeelnemerSelectieComponent,
        DatepickerStartEindComponent,
        FormDropdownComponent,
        DagenSelectieComponent,
        DatepickerComponent,
        OmschrijvingEnBijlageComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe,
        IconDirective,
        CheckboxComponent
    ]
})
export class AfspraakFormulierComponent implements OnInit, OnDestroy {
    private formbuilder = inject(UntypedFormBuilder);
    private medewerkerDataService = inject(MedewerkerDataService);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    @ViewChild('uploadIcon', { read: ViewContainerRef }) uploadIcon: ViewContainerRef;
    @ViewChild('fileInput', { read: ElementRef, static: true }) fileInput: ElementRef;
    @ViewChild(OmschrijvingEnBijlageComponent) omschrijvingEnBijlage: OmschrijvingEnBijlageComponent;

    @ViewChild('beginDatumPicker', { read: MatDatepicker }) beginDatumPicker: MatDatepicker<Date>;
    @ViewChild('eindDatumPicker', { read: MatDatepicker }) eindDatumPicker: MatDatepicker<Date>;

    @Input() afspraak: Afspraak;

    onSaveAfspraak = output<Afspraak>();
    onCancel = output<void>();

    public editAfspraakForm: UntypedFormGroup;
    public showMaandOpties: boolean;
    public showWeekOpties: boolean;
    public showHerhaalOpOpties: boolean;
    public showMaxHerhalingen: boolean;
    public showHerhalingEinddatum = true;
    public showHerhaling$ = new BehaviorSubject<boolean>(false);
    public isTouch$: Observable<boolean>;

    public conferenceDateRange: ConferenceDateRange;

    public schooljaar$: Observable<Schooljaar>;
    public minDatePicker$: Observable<Date>;
    public minEindDatePicker$: Observable<Date>;
    public maxDatepicker$: Observable<Date>;
    public uploadingFiles = new Subject<FileList>();

    public herhalingTypeOptions = herhalingTypeOptions;
    public maandXsteOptions = maandXsteOptions;
    public herhalingDagOptions = herhalingDagOptions;
    public afspraakHerhalingEindeOptions = afspraakHerhalingEindeOptions;
    public dagWerkdagOptions = dagWerkdagOptions;
    public aantalToekomstigeHerhalingen: Optional<number>;

    private afspraakCopy: Afspraak;
    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.afspraakCopy = { ...this.afspraak };
        this.showHerhaling$.next(!!this.afspraak.herhalendeAfspraak);
        this.aantalToekomstigeHerhalingen = this.afspraak.aantalToekomstigeHerhalingen;

        this.isTouch$ = this.deviceService.onDeviceChange$.pipe(
            map(() => this.deviceService.isTouch()),
            startWith(this.deviceService.isTouch())
        );

        let afspraakBeginTijd: Optional<string> = null;
        let afspraakEindTijd: Optional<string> = null;

        // bestaande afspraken en afspraken die via een vrij uur veld worden aangemaakt hebben een eind tijd,
        // dus daarvan moet de tijd ingesteld worden in het formulier.
        if (this.afspraak.eind) {
            afspraakBeginTijd = formatNL(this.afspraak.begin, 'HH:mm');
            afspraakEindTijd = formatNL(this.afspraak.eind, 'HH:mm');
        } else {
            this.medewerkerDataService
                .getDagBegintijd()
                .pipe(take(1))
                .subscribe((beginTijd: string) => {
                    this.begin!.setValue(beginTijd);
                    this.eind!.setValue(formatNL(addHours(hhmmToDate(beginTijd), 1), 'HH:mm'));
                });
        }

        const herhalendeAfspraak = this.afspraak.herhalendeAfspraak ?? this.herhalingDefaults;
        const disableHerhalingControls = this.afspraak.herhalendeAfspraak;
        this.editAfspraakForm = this.formbuilder.group(
            {
                datum: [
                    { value: startOfDay(this.afspraak.begin), disabled: this.afspraak.presentieRegistratieVerwerkt },
                    Validators.required
                ],
                begin: [{ value: afspraakBeginTijd, disabled: this.afspraak.presentieRegistratieVerwerkt }, Validators.required],
                eind: [{ value: afspraakEindTijd, disabled: this.afspraak.presentieRegistratieVerwerkt }, Validators.required],
                omschrijving: [this.afspraak.omschrijving],
                titel: [this.afspraak.titel, [Validators.required, Validators.maxLength(100)]],
                deelnemers: [this.afspraak.participantenEigenAfspraak],
                locatie: [this.afspraak.locatie, Validators.maxLength(20)],
                presentieregistratie: new UntypedFormControl(
                    {
                        value: this.afspraak.presentieRegistratieVerplicht ?? false,
                        disabled: this.afspraak.presentieRegistratieVerwerkt
                    },
                    Validators.required
                ),
                herhalendeAfspraak: this.formbuilder.group(
                    {
                        beginDatum: [{ value: herhalendeAfspraak.beginDatum, disabled: disableHerhalingControls }, Validators.required],
                        eindDatum: [herhalendeAfspraak.eindDatum, Validators.required],
                        maxHerhalingen: [herhalendeAfspraak.maxHerhalingen, [Validators.min(1), Validators.max(365)]],
                        type: [{ value: herhalendeAfspraak.type, disabled: disableHerhalingControls }, Validators.required],
                        afspraakHerhalingDagen: [
                            { value: herhalendeAfspraak.afspraakHerhalingDagen, disabled: disableHerhalingControls },
                            Validators.required
                        ],
                        skip: [{ value: herhalendeAfspraak.skip, disabled: disableHerhalingControls }, Validators.required],
                        cyclus: [
                            { value: herhalendeAfspraak.cyclus, disabled: disableHerhalingControls },
                            [Validators.required, Validators.min(1), Validators.max(365)]
                        ],
                        herhalingEindeType: [AfspraakHerhalingEindeType.OP, Validators.required]
                    },
                    { validators: [startVoorEindValidator('beginDatum', 'eindDatum'), herhalendeAfspraakSchooljaarValidator] }
                )
            },
            { validators: [startVoorEindValidator('begin', 'eind')] }
        );

        const herhalendeAfspraakValidators: HerhalingAfspraakValidatorMap = {
            beginDatum: () => [Validators.required],
            eindDatum: (formValues) =>
                formValues.herhalingEindeType === AfspraakHerhalingEindeType.OP ||
                formValues.herhalingEindeType === AfspraakHerhalingEindeType.EINDESCHOOLJAAR
                    ? [Validators.required]
                    : [],
            type: () => [Validators.required],
            skip: () => [Validators.required],
            maxHerhalingen: (formValues) =>
                formValues.herhalingEindeType === AfspraakHerhalingEindeType.NA_AANTAL
                    ? [Validators.required, Validators.min(1), Validators.max(365)]
                    : [],
            afspraakHerhalingDagen: () => [Validators.required],
            cyclus: () => [Validators.required, Validators.min(1), Validators.max(365)],
            herhalingEindeType: () => [Validators.required]
        };

        this.showHerhaling$.pipe(takeUntil(this.destroy$)).subscribe((showHerhaling) => {
            if (showHerhaling) {
                // wanneer herhaling (weer) aangezet wordt, voeg dan weer de validators toe
                Object.entries(herhalendeAfspraakValidators).forEach(([key, validatorFn]) => {
                    this.herhalingForm.controls[key].setValidators(validatorFn(this.herhalingForm.value));
                    this.herhalingForm.controls[key].updateValueAndValidity();
                });
                this.herhalingForm.setValidators([
                    startVoorEindValidator('beginDatum', 'eindDatum'),
                    herhalendeAfspraakSchooljaarValidator
                ]);
            } else {
                // wanneer herhaling (weer) uitgezet wordt, verwijder dan alle validators
                Object.keys(this.herhalingForm.controls).forEach((key) => {
                    this.herhalingForm.controls[key].clearValidators();
                    this.herhalingForm.controls[key].updateValueAndValidity();
                });
                this.herhalingForm.clearValidators();
            }
            this.herhalingForm.updateValueAndValidity();
            this.changeDetector.detectChanges();
        });

        this.type.valueChanges
            .pipe(
                filter(() => this.showHerhaling$.value),
                delay(0),
                takeUntil(this.destroy$)
            )
            .subscribe((type) => {
                // Omdat de Dagen/Werkdagen dropdown dezelfde 'dagen' (afspraakHerhalingDagen) property gebruikt in core
                // als de dagen selectie die je krijgt bij de wekelijks optie, moeten we
                // de data weer resetten bij het switchen.

                // de delay(0) is omdat afspraakHerhalingDagen op het moment van de setValue in de HTML nog gelinkt(via formcontrolName)
                // aan de dropdown waarvan je 'wegnavigeert'. Als je bijvoorbeeld van Dagelijks -> Maandelijks gaat, hangt afspraakHerhalingDagen
                // nog aan de dropdown met de opties 'DAG', 'WERKDAGEN'. Hierdoor kan de optie die we setten niet gevonden worden en resulteert dit
                // in een lege dropdown.
                if (type === AfspraakHerhalingType.DAGELIJKS) {
                    this.afspraakHerhalingDagen.setValue([AfspraakHerhalingDag.WERKDAG]);
                } else if (type === AfspraakHerhalingType.WEKELIJKS) {
                    this.afspraakHerhalingDagen.setValue([]);
                } else if (type === AfspraakHerhalingType.MAANDELIJKS) {
                    const dag: AfspraakHerhalingDag =
                        AfspraakHerhalingDag[formatNL(this.afspraak.begin, 'EEEE').toUpperCase() as keyof typeof AfspraakHerhalingDag];
                    this.afspraakHerhalingDagen.setValue([dag]);
                }
                this.afspraakHerhalingDagen.updateValueAndValidity();
            });

        // bij het switchen van het einde type halen we de propertie maxHerhalingen of eindDatum leeg,
        // of vullen hem met het einde schooljaar en zetten we juiste de validators erop.
        this.herhalingEindeType.valueChanges
            .pipe(
                filter(() => this.showHerhaling$.value),
                takeUntil(this.destroy$)
            )
            .subscribe((einde) => {
                // update het form, zodat de waardes die we meesturen naar de validatormap up to date zijn.
                this.herhalingForm.updateValueAndValidity();

                ['maxHerhalingen', 'eindDatum'].forEach((key: keyof HerhalingAfspraakValidatorMap) => {
                    this.herhalingForm.controls[key].setValidators(herhalendeAfspraakValidators[key]!(this.herhalingForm.value));
                    this.herhalingForm.controls[key].updateValueAndValidity();
                });

                if (einde === AfspraakHerhalingEindeType.OP) {
                    this.herhalingForm.patchValue({
                        maxHerhalingen: null
                    });
                } else if (einde === AfspraakHerhalingEindeType.NA_AANTAL) {
                    this.herhalingForm.patchValue({
                        eindDatum: null,
                        maxHerhalingen: 1
                    });
                } else if (einde === AfspraakHerhalingEindeType.EINDESCHOOLJAAR) {
                    const beginDatum = this.herhalingForm.value.beginDatum ?? new Date();
                    this.herhalingForm.patchValue({
                        eindDatum: getSchooljaar(beginDatum).eind,
                        maxHerhalingen: null
                    });
                }
            });

        this.schooljaar$ = this.datum!.valueChanges.pipe(
            map((datum) => getSchooljaar(datum)),
            startWith(getSchooljaar(this.datum!.value)),
            distinctUntilChanged()
        );
        this.maxDatepicker$ = this.schooljaar$.pipe(map((schooljaar) => schooljaar.eind));
        this.minEindDatePicker$ = this.herhalingForm.controls['beginDatum'].valueChanges.pipe(
            map((start) => addDays(start, 1)),
            tap((minEind) => {
                const herhalingEinddatum = this.herhalingForm.get('eindDatum')!.value;
                // wanneer de begindatum achter de einddatum is geplaatst
                if (herhalingEinddatum && isBefore(herhalingEinddatum, minEind)) {
                    this.herhalingForm.get('eindDatum')!.setValue(null);
                }
            }),
            startWith(this.herhalingForm.get('beginDatum')!.value)
        );

        this.herhalingForm.valueChanges
            .pipe(
                filter(() => this.showHerhaling$.value),
                startWith(herhalendeAfspraak),
                map(() => this.herhalingForm.getRawValue()),
                takeUntil(this.destroy$)
            )
            .subscribe(this.updateHerhalingFormFieldVisibility);

        this.begin!.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((data: string) => {
            const begintijd = hhmmToDate(data);
            const eindtijd = hhmmToDate(this.eind!.value);
            if (isValid(begintijd) && isValid(eindtijd)) {
                this.setConferenceDateRange();
            }

            if (isValid(begintijd) && (!isValid(eindtijd) || begintijd > eindtijd)) {
                if (begintijd > hhmmToDate('22:59')) {
                    this.eind!.setValue('23:59');
                } else {
                    this.eind!.setValue(formatNL(addHours(begintijd, 1), 'HH:mm'));
                }
                this.changeDetector.detectChanges();
            }
        });
        this.eind!.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((data: string) => {
            const begintijd = hhmmToDate(this.begin!.value);
            const eindtijd = hhmmToDate(data);

            if (isValid(begintijd) && isValid(eindtijd)) {
                this.setConferenceDateRange();
            }
            if (eindtijd < begintijd) {
                if (eindtijd < hhmmToDate('1:00')) {
                    this.begin!.setValue('00:00');
                } else {
                    this.begin!.setValue(formatNL(subHours(eindtijd, 1), 'HH:mm'));
                }

                this.changeDetector.detectChanges();
            }
        });

        this.conferenceDateRange = {
            start: this.afspraak.begin.toISOString(),
            eind: this.afspraak.eind?.toISOString()
        };
    }

    updateHerhalingFormFieldVisibility = (values: any) => {
        this.showMaandOpties = values.type === AfspraakHerhalingType.MAANDELIJKS;
        this.showWeekOpties = values.type === AfspraakHerhalingType.WEKELIJKS;
        this.showHerhaalOpOpties = values.type !== AfspraakHerhalingType.DAGELIJKS;
        this.showMaxHerhalingen = values.herhalingEindeType === AfspraakHerhalingEindeType.NA_AANTAL;
        this.showHerhalingEinddatum = values.herhalingEindeType === AfspraakHerhalingEindeType.OP;
        this.changeDetector.detectChanges();
    };

    maakHerhalendeAfspraak = () => {
        this.showHerhaling$.next(true);
        this.editAfspraakForm.markAsDirty();
    };
    verwijderHerhaling = () => {
        this.showHerhaling$.next(false);
        const defaults = this.herhalingDefaults;
        this.aantalToekomstigeHerhalingen = 0;
        this.herhalingForm.patchValue({
            beginDatum: defaults.beginDatum,
            eindDatum: defaults.eindDatum,
            maxHerhalingen: defaults.maxHerhalingen,
            type: defaults.type,
            afspraakHerhalingDagen: defaults.afspraakHerhalingDagen,
            skip: defaults.skip,
            cyclus: defaults.cyclus,
            herhalingEindeType: AfspraakHerhalingEindeType.OP
        });

        this.herhalingForm.get('beginDatum')!.enable();
        this.herhalingForm.get('type')!.enable();
        this.herhalingForm.get('afspraakHerhalingDagen')!.enable();
        this.herhalingForm.get('skip')!.enable();
        this.herhalingForm.get('cyclus')!.enable();

        this.editAfspraakForm.markAsDirty();
    };

    setConferenceDateRange() {
        const begin = this.setTime(this.datum!.value, this.begin!.value);
        const eind = this.setTime(this.datum!.value, this.eind!.value);
        this.conferenceDateRange = {
            start: begin.toISOString(),
            eind: eind.toISOString()
        };
    }

    onFilesAdded(files: Event) {
        this.uploadingFiles.next((files.target as HTMLInputElement).files!);
    }

    onSubmit() {
        if (this.editAfspraakForm.valid) {
            const herhalingGewijzigd =
                !isEqual(this.afspraakCopy.herhalendeAfspraak?.eindDatum, this.herhalingForm.value.eindDatum) ||
                !isEqual(!!this.afspraakCopy.herhalendeAfspraak, this.showHerhaling$.value);

            // een guard tonen wanneer je de velden van een afspraak met een bestaande herhalende afspraak wijzigd
            if (this.afspraak.id && this.afspraak.herhalendeAfspraak && !herhalingGewijzigd) {
                const popup = this.popupService.popup(
                    this.viewContainerRef,
                    ConfirmationDialogComponent.defaultPopupSettings,
                    ConfirmationDialogComponent
                );
                popup.title = 'Je wijzigt een herhaalafspraak';
                popup.actionLabel = 'Doorgaan';
                popup.cancelLabel = 'Annuleren';
                popup.showLoaderOnConfirm = false;
                popup.onConfirmFn = () => {
                    this.onSaveAfspraak.emit(this.convertFormDataToAfspraak());
                    return true;
                };
                popup.message =
                    'Wijzigingen van deelnemers en herhaling gelden voor deze en toekomstige afspraken. Alle andere wijzigingen gelden alleen voor deze afspraak.';
            } else {
                this.onSaveAfspraak.emit(this.convertFormDataToAfspraak());
            }
        }
    }

    fileUploaded(bijlage: BijlageFieldsFragment) {
        this.afspraak = {
            ...this.afspraak,
            bijlagen: [...this.afspraak.bijlagen, bijlage]
        } as Afspraak;
        this.editAfspraakForm.markAsDirty();
        this.changeDetector.detectChanges();
    }

    removeBijlage(bijlageToRemove: BijlageFieldsFragment) {
        this.afspraak = {
            ...this.afspraak,
            bijlagen: this.afspraak.bijlagen.filter((bijlage) => bijlage !== bijlageToRemove)
        };
        this.editAfspraakForm.markAsDirty();
    }

    upload() {
        this.fileInput.nativeElement.click();
    }

    onBijlageSave({ bijlage, index }: { bijlage: BijlageFieldsFragment; index: number }) {
        this.afspraak = {
            ...this.afspraak,
            bijlagen: replaceInArray(index, bijlage, this.afspraak.bijlagen)
        };
        this.editAfspraakForm.markAsDirty();
    }

    private convertFormDataToAfspraak = (): Afspraak => {
        const begin = this.setTime(this.datum!.value, this.begin!.value);
        const eind = this.setTime(this.datum!.value, this.eind!.value);

        // haal herhalingEindeType propertie uit formulier waardes.
        const herhalendeAfspraak = {
            ...this.herhalingForm.getRawValue(),
            id: this.afspraak.herhalendeAfspraak?.id
        };
        delete herhalendeAfspraak.herhalingEindeType;

        return {
            ...this.afspraak,
            id: this.afspraak.id,
            titel: this.titel!.value,
            begin,
            eind,
            locatie: this.editAfspraakForm.value.locatie,
            omschrijving: this.editAfspraakForm.value.omschrijving,
            herhalendeAfspraak: this.showHerhaling$.value ? herhalendeAfspraak : null,
            lesuur: null,
            eindLesuur: null,
            groteToets: this.afspraak.groteToets || false,
            toets: this.afspraak.toets || false,
            huiswerk: this.afspraak.huiswerk || false,
            lesstof: this.afspraak.lesstof || false,
            participantenEigenAfspraak: this.editAfspraakForm.value.deelnemers || [],
            presentieRegistratieVerplicht: this.editAfspraakForm.value.presentieregistratie || false
        };
    };

    setTime(date: Date, time: TijdInput) {
        const minuten = setMinutes(date, parseInt(time.split(':')[1]));
        return setHours(minuten, parseInt(time.split(':')[0]));
    }

    public get herhalingForm() {
        return <UntypedFormGroup>this.editAfspraakForm.controls['herhalendeAfspraak'];
    }

    public get begin() {
        return this.editAfspraakForm.get('begin');
    }

    public get eind() {
        return this.editAfspraakForm.get('eind');
    }

    public get titel() {
        return this.editAfspraakForm.get('titel');
    }

    public get datum() {
        return this.editAfspraakForm.get('datum');
    }

    public get deelnemers() {
        return this.editAfspraakForm.get('deelnemers') as UntypedFormControl;
    }

    public get type() {
        return this.herhalingForm.get('type') as UntypedFormControl;
    }

    public get herhalingEindeType() {
        return this.herhalingForm.get('herhalingEindeType') as UntypedFormControl;
    }

    public get afspraakHerhalingDagen() {
        return this.herhalingForm.get('afspraakHerhalingDagen') as UntypedFormControl;
    }

    public get isUploading(): boolean {
        return this.omschrijvingEnBijlage?.isUploading;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private get herhalingDefaults(): Partial<HerhalendeAfspraak> {
        return {
            beginDatum: this.afspraak.begin,
            eindDatum: null,
            type: AfspraakHerhalingType.DAGELIJKS,
            skip: 1,
            maxHerhalingen: null,
            afspraakHerhalingDagen: [AfspraakHerhalingDag.WERKDAG],
            cyclus: 1
        };
    }
}
