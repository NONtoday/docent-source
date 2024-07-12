import { Component, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ButtonComponent } from 'harmony';
import { IconBewerken, provideIcons } from 'harmony-icons';
import { MethodeSelectie, ToSaveMethodeToekenning } from '../../core/models/studiewijzers/methode.model';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { MethodeControleComponent } from '../methode-controle/methode-controle.component';

@Component({
    selector: 'dt-methode-controle-popup',
    templateUrl: './methode-controle-popup.component.html',
    styleUrls: ['./methode-controle-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, MethodeControleComponent, OutlineButtonComponent, ButtonComponent],
    providers: [provideIcons(IconBewerken)]
})
export class MethodeControlePopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public methodeSelectie: MethodeSelectie;
    public saveToekenningenFn: (toSaveSelecties: ToSaveMethodeToekenning[]) => void;
    public onAnnulerenFn: () => void;

    public form = new UntypedFormGroup({
        theorie: new UntypedFormControl('', Validators.required),
        theorieZichtbaarheid: new UntypedFormControl(true),
        huiswerk: new UntypedFormControl('', Validators.required),
        huiswerkZichtbaarheid: new UntypedFormControl(true)
    });

    onAnnulerenClick() {
        this.onAnnulerenFn();
        this.popup.onClose();
    }

    onInplannenClick() {
        this.saveToekenningenFn([
            {
                selectie: this.methodeSelectie,
                huiswerkNaam: this.form.value.huiswerk,
                theorieNaam: this.form.value.theorie,
                huiswerkZichtbaarheid: this.form.value.huiswerkZichtbaarheid,
                theorieZichtbaarheid: this.form.value.theorieZichtbaarheid
            }
        ]);
        this.popup.onClose();
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = true;
        popupSettings.headerIcon = 'bewerken';
        popupSettings.title = 'Controleren en inplannen';
        popupSettings.showCloseButton = true;
        popupSettings.width = 460;
        popupSettings.height = 370;
        popupSettings.clickOutSideToClose = true;
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        return popupSettings;
    }
}
