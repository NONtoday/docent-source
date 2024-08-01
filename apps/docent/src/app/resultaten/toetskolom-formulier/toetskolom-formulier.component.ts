import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IconHerkansing, IconWeging, provideIcons } from 'harmony-icons';
import { isEqual } from 'lodash-es';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
    Afnamevorm,
    CijferPeriode,
    Deeltoetskolom,
    Herkansing,
    MatrixResultaatkolomFieldsFragment,
    ResultaatLabelLijst,
    ResultaatkolomType,
    ToetsSoort,
    Toetskolom,
    Toetsvorm
} from '../../../generated/_types';
import { Schooljaar } from '../../core/models/schooljaar.model';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { DatepickerComponent } from '../../rooster-shared/components/datepicker/datepicker.component';
import { FormDropdownComponent } from '../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { AutofocusDirective } from '../../rooster-shared/directives/autofocus.directive';
import { AutosizeDirective } from '../../rooster-shared/directives/autosize.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { DropDownOption } from '../../rooster-shared/utils/dropdown.util';
import { Optional } from '../../rooster-shared/utils/utils';
import { convertHerkansingToNaam } from '../pipes/herkansing-naam.pipe';
import { ToetskolomHerberekeningRelevanteVelden, isKolomOfType } from '../resultaten.utils';

enum LegeOptie {
    Leeg = 'LEEG'
}
type ToetsvormOptions = Toetsvorm | LegeOptie;
type AfnamevormOptions = Afnamevorm | LegeOptie;

@Component({
    selector: 'dt-toetskolom-formulier',
    templateUrl: './toetskolom-formulier.component.html',
    styleUrls: ['./toetskolom-formulier.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        FormDropdownComponent,
        AutofocusDirective,
        DatepickerComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AutosizeDirective
    ],
    providers: [provideIcons(IconWeging, IconHerkansing)]
})
export class ToetskolomFormulierComponent implements OnInit, OnDestroy {
    private formBuilder = inject(UntypedFormBuilder);
    @Input() kolom: Optional<MatrixResultaatkolomFieldsFragment['resultaatkolom']>;

    @Input() periode: CijferPeriode;
    @Input() periodes: CijferPeriode[];
    @Input() toetsSoorten: ToetsSoort[];
    @Input() resultaatLabelLijsten: ResultaatLabelLijst[];
    @Input() toonDomeinvelden: boolean;
    @Input() kolomType: ResultaatkolomType;
    @Input() magBeoordelingWijzigen = true;

    onSubmit = output<{
        toetskolom: Toetskolom;
        herberekeningVereist: boolean;
    }>();
    onAnnuleren = output<void>();

    toetskolomForm: UntypedFormGroup;
    schooljaar: Schooljaar;
    isSamengesteldeToets: boolean;
    isDeeltoets: boolean;
    initieleWaardenVoorHerberekening: ToetskolomHerberekeningRelevanteVelden;

    // Periode dropdown
    periodesDropDownOptions: DropDownOption<CijferPeriode>[];
    selectedPeriode: Optional<DropDownOption<CijferPeriode>>;

    // Soort toets
    toetsSoortDropDownOptions: DropDownOption<ToetsSoort>[];
    selectedToetsSoort: Optional<DropDownOption<ToetsSoort>>;
    private readonly defaultToetsSoortNaam = 'Theoretische toets';

    // Herkansing
    herkansingDropDownOptions: DropDownOption<Herkansing>[];
    selectedHerkansing: Optional<DropDownOption<Herkansing>>;
    private readonly defaultHerkansingOption = Herkansing.Geen;

    // Beoordeling
    resultaatLabelLijstDropDownOptions: DropDownOption<ResultaatLabelLijst>[];
    selectedResultaatLabelLijst: DropDownOption<ResultaatLabelLijst>;
    private readonly defaultCijferLabelOption: DropDownOption<ResultaatLabelLijst> = { text: 'Cijfer (0-10)', value: {} as any };

    // Toetsvorm
    toetsvormDropDownOptions: DropDownOption<ToetsvormOptions>[];
    selectedToetsvorm: DropDownOption<ToetsvormOptions>;

    // Afnamevorm
    afnamevormDropDownOptions: DropDownOption<AfnamevormOptions>[];
    selectedAfnamevorm: DropDownOption<AfnamevormOptions>;

    public toetsomschrijvingPlaceholder = 'Typ een omschrijving van deze toets';

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.isSamengesteldeToets = this.kolomType === ResultaatkolomType.SAMENGESTELDE_TOETS;
        this.isDeeltoets = this.kolomType === ResultaatkolomType.DEELTOETS;

        if (this.isDeeltoets) {
            this.toetsomschrijvingPlaceholder = 'Typ een omschrijving van deze deeltoets';
        }

        this.periodesDropDownOptions = this.periodes.map((periode) => ({
            text: `Periode ${periode.nummer}`,
            value: periode
        }));
        this.selectedPeriode =
            this.periodesDropDownOptions.find((option) => option.value?.nummer === this.kolom?.periode) ??
            this.periodesDropDownOptions.find((option) => option.value?.nummer === this.periode?.nummer);

        this.toetsSoortDropDownOptions = this.toetsSoorten.map((soort) => ({
            text: soort.naam,
            value: soort
        }));
        this.selectedToetsSoort =
            this.toetsSoortDropDownOptions.find((type) => type.value.id === (<Toetskolom>this.kolom)?.toetsSoort?.id) ??
            this.toetsSoortDropDownOptions.find((type) => type.value.naam === this.defaultToetsSoortNaam);

        this.herkansingDropDownOptions = Object.keys(Herkansing).map((type: keyof typeof Herkansing) => ({
            text: convertHerkansingToNaam(Herkansing[type]),
            value: Herkansing[type]
        }));
        this.selectedHerkansing =
            this.herkansingDropDownOptions.find((type) => type.value === (<Toetskolom>this.kolom)?.herkansing) ??
            this.herkansingDropDownOptions.find((type) => type.value === this.defaultHerkansingOption);

        this.resultaatLabelLijstDropDownOptions = [
            ...this.resultaatLabelLijsten.map((labelLijst) => ({
                text: labelLijst.naam,
                value: labelLijst
            })),
            this.defaultCijferLabelOption
        ];
        this.selectedResultaatLabelLijst =
            this.resultaatLabelLijstDropDownOptions.find(
                (labelLijst) => labelLijst.value?.afkorting === (<Toetskolom>this.kolom)?.resultaatLabelLijst?.afkorting
            ) ?? this.defaultCijferLabelOption;

        const toetsvormPlaceholder: DropDownOption<LegeOptie> = { text: 'Selecteer een toetsvorm', value: LegeOptie.Leeg };
        const toetsvormOptions = Object.keys(Toetsvorm).map((toetsvorm: keyof typeof Toetsvorm) => ({
            text: toetsvorm,
            value: Toetsvorm[toetsvorm]
        }));
        this.toetsvormDropDownOptions = [toetsvormPlaceholder, ...toetsvormOptions];
        this.selectedToetsvorm =
            this.toetsvormDropDownOptions.find((toetsvormOption) => toetsvormOption.value === (<Toetskolom>this.kolom)?.toetsvorm) ??
            this.toetsvormDropDownOptions[0];

        const afnamevormPlaceholder = { text: 'Selecteer een afnamevorm', value: LegeOptie.Leeg };
        const afnamevormOptions = Object.keys(Afnamevorm).map((afnamevorm: keyof typeof Afnamevorm) => ({
            text: afnamevorm,
            value: Afnamevorm[afnamevorm]
        }));
        this.afnamevormDropDownOptions = [afnamevormPlaceholder, ...afnamevormOptions];
        this.selectedAfnamevorm =
            this.afnamevormDropDownOptions.find((afnamevormOption) => afnamevormOption.value === (<Toetskolom>this.kolom)?.afnamevorm) ??
            this.afnamevormDropDownOptions[0];

        this.schooljaar = getSchooljaar(new Date());

        const weging =
            (isKolomOfType<Deeltoetskolom>(this.kolom, ResultaatkolomType.DEELTOETS)
                ? this.kolom.deeltoetsWeging
                : (<Toetskolom>this.kolom)?.weging ?? this.selectedToetsSoort?.value?.defaultWeging) ?? 1;

        this.initieleWaardenVoorHerberekening = {
            toetsSoort: this.selectedToetsSoort?.value,
            herkansing: this.selectedHerkansing?.value,
            resultaatLabelLijst: this.selectedResultaatLabelLijst.value,
            periode: this.selectedPeriode?.value,
            weging: weging
        };

        this.toetskolomForm = this.formBuilder.group({
            code: [this.kolom?.code, [Validators.required, Validators.maxLength(5)]],
            periode: [this.selectedPeriode?.value, Validators.required],
            toetsSoort: [this.selectedToetsSoort?.value, Validators.required],
            herkansing: [this.selectedHerkansing?.value, Validators.required],
            resultaatLabelLijst: [this.selectedResultaatLabelLijst.value, Validators.required],
            datumToets: [(<Toetskolom>this.kolom)?.datumToets],
            weging: [weging, Validators.min(0)],
            omschrijving: [this.kolom?.omschrijving, [Validators.required, Validators.maxLength(2048)]],
            domeincode: [(<Toetskolom>this.kolom)?.domeincode, Validators.maxLength(50)],
            domeinomschrijving: [(<Toetskolom>this.kolom)?.domeinomschrijving, Validators.maxLength(512)],
            toetsduur: [(<Toetskolom>this.kolom)?.toetsduur],
            toetsvorm: [this.selectedToetsvorm?.value],
            afnamevorm: [this.selectedAfnamevorm?.value]
        });

        this.toetskolomForm.controls['toetsSoort']?.valueChanges
            .pipe(
                map((toetssoort) => toetssoort.defaultWeging),
                takeUntil(this.destroy$)
            )
            .subscribe((weging: number) => this.toetskolomForm.controls['weging']?.setValue(weging));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSubmitClick() {
        if (!this.toetskolomForm.valid) {
            return;
        }

        const resultaatLabelLijst = this.getFormControlValue('resultaatLabelLijst');
        const afnamevorm = this.getFormControlValue('afnamevorm');
        const toetsvorm = this.getFormControlValue('toetsvorm');
        const toetsSoort = this.getFormControlValue('toetsSoort');
        const herkansing = this.isSamengesteldeToets ? Herkansing.Geen : this.getFormControlValue('herkansing');
        const periode = this.getFormControlValue('periode');
        const weging = this.getFormControlValue('weging') ?? (<Toetskolom>this.kolom).toetsSoort?.defaultWeging;

        const huidigeWaardenVoorHerberekening = {
            toetsSoort: toetsSoort,
            herkansing: herkansing,
            resultaatLabelLijst: resultaatLabelLijst,
            periode: periode,
            weging: weging
        };

        this.onSubmit.emit({
            toetskolom: {
                ...(<Toetskolom>this.kolom),
                type: this.kolomType,
                code: this.getFormControlValue('code'),
                toetsSoort: toetsSoort,
                herkansing: herkansing,
                resultaatLabelLijst: resultaatLabelLijst,
                periode: periode.nummer,
                weging: weging,
                omschrijving: this.getFormControlValue('omschrijving'),
                domeincode: this.getFormControlValue('domeincode'),
                domeinomschrijving: this.getFormControlValue('domeinomschrijving'),
                datumToets: this.getFormControlValue('datumToets'),
                toetsduur: this.getFormControlValue('toetsduur'),
                toetsvorm: toetsvorm !== 'LEEG' ? toetsvorm : null,
                afnamevorm: afnamevorm !== 'LEEG' ? afnamevorm : null
            },
            herberekeningVereist: Boolean(this.kolom && !isEqual(this.initieleWaardenVoorHerberekening, huidigeWaardenVoorHerberekening))
        });
    }

    private getFormControlValue(controlName: string) {
        return this.toetskolomForm.get(controlName)?.value;
    }
}
