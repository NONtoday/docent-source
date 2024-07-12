import { Component, DestroyRef, Input, OnInit, Signal, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { ButtonComponent, IconDirective, ManualCounterComponent, NotificationSolidComponent } from 'harmony';
import { IconChevronRechts, IconInformatie, IconLijst, IconNoRadio, provideIcons } from 'harmony-icons';
import { map, pairwise, startWith } from 'rxjs';
import { GroepsoverzichtResultatenInstellingenInput, MentordashboardResultatenInstellingen } from '../../../../generated/_types';
import { Appearance, PopupDirection } from '../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { CommaResultPipe } from '../../../shared/pipes/comma-result.pipe';
import { GroepsoverzichtDecimalNumberInputComponent } from './groepsoverzicht-decimal-number-input/groepsoverzicht-decimal-number-input.component';

@Component({
    selector: 'dt-groepsoverzicht-instellingen-resultaten-popup',
    standalone: true,
    imports: [
        PopupComponent,
        IconDirective,
        ManualCounterComponent,
        ButtonComponent,
        NotificationSolidComponent,
        GroepsoverzichtDecimalNumberInputComponent,
        CommaResultPipe,
        TooltipDirective,
        ReactiveFormsModule
    ],
    templateUrl: './groepsoverzicht-instellingen-resultaten-popup.component.html',
    styleUrls: ['./groepsoverzicht-instellingen-resultaten-popup.component.scss'],
    providers: [provideIcons(IconInformatie, IconLijst, IconNoRadio, IconChevronRechts)]
})
export class GroepsoverzichtInstellingenResultatenPopupComponent implements Popup, OnInit {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input({ required: true }) instelling: MentordashboardResultatenInstellingen;
    @Input({ required: true }) onOpslaan: (output: GroepsoverzichtResultatenInstellingenInput) => void;

    readonly kolomInstellingenHeaderSubtitle = 'Wanneer verschijnt een leerling in een kolom?';
    readonly onvoldoendeInstellingenHeaderSubtitle = 'Welke cijfers tonen als onvoldoende?';

    popupMode: InstellingenPopupMode = 'resultaat';
    toggleText = 'Onvoldoende-instellingen';
    headerTitle = 'Kolom-instellingen';
    headerSubtitle = this.kolomInstellingenHeaderSubtitle;

    instellingenForm: FormGroup<InstellingenForm>;
    formBuilder = inject(FormBuilder);
    destroyRef = inject(DestroyRef);
    lastChangedValue: Signal<keyof InstellingenForm | undefined>;

    ngOnInit(): void {
        this.instellingenForm.setValue({
            aantalVakkenOnvoldoende: this.instelling.aantalVakkenOnvoldoende,
            aantalVakkenZwaarOnvoldoende: this.instelling.aantalVakkenZwaarOnvoldoende,
            grenswaardeOnvoldoende: this.instelling.grenswaardeOnvoldoende,
            grenswaardeZwaarOnvoldoende: this.instelling.grenswaardeZwaarOnvoldoende
        });
    }

    constructor() {
        this.instellingenForm = this.formBuilder.group(
            {
                aantalVakkenOnvoldoende: [1],
                aantalVakkenZwaarOnvoldoende: [1],
                grenswaardeOnvoldoende: [5.5],
                grenswaardeZwaarOnvoldoende: [5]
            },
            { validators: this.grenswaardeValidator }
        );

        this.lastChangedValue = toSignal(
            this.instellingenForm.valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                startWith(this.instellingenForm.value),
                pairwise(),
                map(([oldValues, newValues]: any): keyof InstellingenForm => {
                    return (
                        (Object.keys(newValues).find((k) => newValues[k] != oldValues[k]) as keyof InstellingenForm) ??
                        this.lastChangedValue()
                    );
                })
            )
        );
    }

    public static get instellingenPopupsettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;
        popupSettings.width = 356;
        popupSettings.offsets.bottom.left = -97;
        popupSettings.offsets.top.left = -97;

        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }

    mayClose(): boolean {
        return true;
    }

    annuleer() {
        this.popup.onClose();
    }

    opslaan() {
        if (!this.instellingenForm.valid) return;
        const instellingenResult = this.instellingenForm.value as GroepsoverzichtResultatenInstellingenInput;
        this.onOpslaan(instellingenResult);
        this.popup.onClose();
    }

    togglePopupMode() {
        this.popupMode = this.popupMode === 'resultaat' ? 'onvoldoende' : 'resultaat';
        this.toggleText = this.popupMode === 'resultaat' ? 'Onvoldoende-instellingen' : 'Kolom-instellingen';
        this.headerTitle = this.popupMode === 'resultaat' ? 'Kolom-instellingen' : 'Onvoldoende-instellingen';
        this.headerSubtitle =
            this.popupMode === 'resultaat' ? this.kolomInstellingenHeaderSubtitle : this.onvoldoendeInstellingenHeaderSubtitle;
    }

    formControlValue(name: keyof InstellingenForm): number {
        if (this.instellingenForm) {
            return this.instellingenForm.controls[name].getRawValue() || 0;
        }
        return 0;
    }
    private grenswaardeValidator: ValidatorFn = () => {
        const grenswaardeZwaarOnvoldoende = this.formControlValue('grenswaardeZwaarOnvoldoende');
        const grenswaardeOnvoldoende = this.formControlValue('grenswaardeOnvoldoende');

        if (grenswaardeOnvoldoende <= grenswaardeZwaarOnvoldoende) {
            return { grenswaarde: true };
        }
        return null;
    };
}

type InstellingenForm = Record<keyof GroepsoverzichtResultatenInstellingenInput, FormControl<number | null>>;
type InstellingenPopupMode = 'resultaat' | 'onvoldoende';
