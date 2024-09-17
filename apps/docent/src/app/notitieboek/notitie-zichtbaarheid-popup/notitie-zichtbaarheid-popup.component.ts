import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { collapseOnLeaveAnimation, expandOnEnterAnimation } from 'angular-animations';
import { CheckboxComponent } from 'harmony';
import { IconInformatie, IconReacties, provideIcons } from 'harmony-icons';
import { PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { SwitchComponent } from '../../shared/components/switch/switch.component';

export interface NotitieZichtbaarheidForm {
    docenten: boolean;
    mentoren: boolean;
    reactiesToegestaan: boolean;
}
@Component({
    selector: 'dt-notitie-zichtbaarheid-popup',
    standalone: true,
    imports: [
        OutlineButtonComponent,
        PopupComponent,
        FormsModule,
        ReactiveFormsModule,
        CheckboxComponent,
        SwitchComponent,
        ButtonComponent,
        AsyncPipe
    ],
    templateUrl: './notitie-zichtbaarheid-popup.component.html',
    styleUrls: ['./notitie-zichtbaarheid-popup.component.scss'],
    animations: [collapseOnLeaveAnimation(), expandOnEnterAnimation()],
    providers: [provideIcons(IconInformatie, IconReacties)]
})
export class NotitieZichtbaarheidPopupComponent implements Popup, OnInit {
    private formbuilder = inject(FormBuilder);
    @Input() submitButtonText: 'Opslaan' | 'Instellen' = 'Opslaan';
    @Input() docenten = false;
    @Input() mentoren = false;
    @Input() docentenDisabled = false;
    @Input() mentorenDisabled = false;
    @Input() reactiesToegestaan = false;
    @Input() reactiesToegestaanDisabled = false;
    @Input() onSave: (result: NotitieZichtbaarheidForm) => void;

    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public form: FormGroup;

    ngOnInit() {
        this.form = this.formbuilder.group({
            docenten: new FormControl(
                { value: this.docenten && !this.docentenDisabled, disabled: this.docentenDisabled },
                { nonNullable: true, validators: [Validators.required] }
            ),
            mentoren: new FormControl(
                { value: this.mentoren && !this.mentorenDisabled, disabled: this.mentorenDisabled },
                { nonNullable: true, validators: [Validators.required] }
            ),
            reactiesToegestaan: new FormControl(this.reactiesToegestaan, { nonNullable: true, validators: [Validators.required] })
        });
    }

    mayClose(): boolean {
        return true;
    }

    onAnnuleren() {
        this.popup.onClose();
    }

    onSubmit() {
        this.onSave?.(this.form.getRawValue());
        this.popup.onClose();
    }

    public static get defaultPopupsettings(): PopupSettings {
        return {
            ...PopupComponent.defaultPopupsettings,
            width: 312,
            preferedDirection: [PopupDirection.Bottom]
        };
    }
}
