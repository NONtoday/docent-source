import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LesRegistratie, SignaleringenInstellingenQuery } from '@docent/codegen';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconSluiten, provideIcons } from 'harmony-icons';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MedewerkerDataService } from '../../../../core/services/medewerker-data.service';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { RegistratieDataService } from '../../registratie-data.service';

@Component({
    selector: 'dt-signalering-setting-popup',
    templateUrl: './signalering-setting-popup.component.html',
    styleUrls: ['./signalering-setting-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, OutlineButtonComponent, ButtonComponent, IconDirective, CheckboxComponent],
    providers: [provideIcons(IconSluiten)]
})
export class SignaleringSettingPopupComponent implements Popup, OnInit {
    private formbuilder = inject(UntypedFormBuilder);
    private medewerkerDataService = inject(MedewerkerDataService);
    private registratieDataService = inject(RegistratieDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    // Properties gevuld via de PopupService
    vrijVeldDefinities: LesRegistratie['overigeVrijVeldDefinities'] = [];
    settings$: Observable<SignaleringenInstellingenQuery['signaleringenInstellingen']>;

    settingForm: UntypedFormGroup;

    destroy$ = new Subject<void>();

    ngOnInit() {
        this.settingForm = this.formbuilder.group({
            aantal: [null, Validators.required]
        });

        for (const vrijVeldDef of this.vrijVeldDefinities) {
            this.settingForm.addControl(vrijVeldDef.id, new FormControl(false));
        }

        this.settings$.pipe(takeUntil(this.destroy$)).subscribe((settings) => {
            this.settingForm.controls.aantal.setValue(settings.aantal.toString());
            const geselecteerdeVrijeVelden = this.vrijVeldDefinities.filter((v) => !settings.verborgenVrijeVeldenIds.includes(v.id));
            for (const verborgenVrijVeld of geselecteerdeVrijeVelden) {
                this.settingForm.controls[verborgenVrijVeld.id].setValue(true);
            }
        });
    }

    onDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    mayClose(): boolean {
        return true;
    }

    onSubmit() {
        if (this.settingForm.valid && this.settingForm.dirty) {
            this.registratieDataService.saveSignaleringenInstellingen(
                this.medewerkerDataService.medewerkerId,
                parseInt(this.settingForm.value.aantal, 10),
                Object.keys(this.settingForm.value).filter((key) => !this.settingForm.value[key])
            );
            this.popup.onClose();
        }
    }
}
