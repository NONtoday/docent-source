import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent, IconDirective, NumbersOnlyDirective } from 'harmony';
import { IconNoRadio, provideIcons } from 'harmony-icons';
import { NgStringPipesModule } from 'ngx-pipes';
import { GroepsoverzichtWeergaveInstelling, GroepsoverzichtWeergaveInstellingInput } from '../../../../generated/_types';
import { GroepoverzichtRegistratieWithContent } from '../../../core/models/mentordashboard.model';
import { FormCheckboxComponent } from '../../../rooster-shared/components/form-checkbox/form-checkbox.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { RegistratieCategorieNaamPipe } from '../../pipes/registratie-categorie-naam.pipe';

@Component({
    selector: 'dt-groepsoverzicht-weergave-popup',
    standalone: true,
    imports: [
        PopupComponent,
        ReactiveFormsModule,
        RegistratieCategorieNaamPipe,
        NumbersOnlyDirective,
        NgStringPipesModule,
        OutlineButtonComponent,
        FormCheckboxComponent,
        IconDirective,
        ButtonComponent
    ],
    templateUrl: './groepsoverzicht-weergave-popup.component.html',
    styleUrls: ['./groepsoverzicht-weergave-popup.component.scss'],
    providers: [provideIcons(IconNoRadio)]
})
export class GroepsoverzichtWeergavePopupComponent implements OnInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() weergaves: GroepsoverzichtWeergaveInstelling[];
    @Input() categorieen: GroepoverzichtRegistratieWithContent[];
    @Input() onOpslaan: (output: GroepsoverzichtWeergaveInstellingInput[]) => void;

    public form = new FormGroup({});

    ngOnInit() {
        this.categorieen.forEach((cat) =>
            this.form.addControl(
                cat.categorie.id,
                new FormGroup({
                    selected: new FormControl(false),
                    grenswaarde: new FormControl(null, Validators.min(1))
                })
            )
        );
        this.weergaves.forEach((weergave) => {
            this.form.get(weergave.categorie)?.get('selected')?.setValue(true);
            this.form.get(weergave.categorie)?.get('grenswaarde')?.setValue(weergave.grenswaarde);
        });
    }

    annuleer() {
        this.popup.onClose();
    }

    opslaan() {
        if (this.form.invalid) {
            return;
        }

        this.onOpslaan(this.formToWeergaveInstellingInputs());
        this.popup.onClose();
    }

    private formToWeergaveInstellingInputs(): GroepsoverzichtWeergaveInstellingInput[] {
        return Object.keys(this.form.controls)
            .filter((key) => this.form.get(key)?.get('selected')?.value)
            .map((key): GroepsoverzichtWeergaveInstellingInput => {
                const input = parseInt(this.form.get(key)?.get('grenswaarde')?.value ?? 1, 10);
                return {
                    categorie: key,
                    grenswaarde: isNaN(input) ? 1 : input
                };
            });
    }

    resetValue(id: string) {
        this.form.get(id)?.get('grenswaarde')?.setValue(null);
    }

    public static get popupSettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;
        popupSettings.width = 356;
        popupSettings.offsets = {
            ...PopupComponent.defaultPopupsettings.offsets,
            bottom: { left: -108, top: 0 }
        };

        return popupSettings;
    }

    mayClose(): boolean {
        return true;
    }
}
