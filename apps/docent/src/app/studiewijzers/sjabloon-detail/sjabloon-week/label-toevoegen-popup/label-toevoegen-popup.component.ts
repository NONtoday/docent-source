import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { IconDirective } from 'harmony';
import { IconCheck, IconSluiten, provideIcons } from 'harmony-icons';
import { Appearance, HorizontalOffset, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-label-toevoegen-popup',
    templateUrl: './label-toevoegen-popup.component.html',
    styleUrls: ['./label-toevoegen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, ButtonComponent, OutlineButtonComponent, IconDirective],
    providers: [provideIcons(IconCheck, IconSluiten)]
})
export class LabelToevoegenPopupComponent implements OnInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('focusfield', { static: true }) focusfield: ElementRef;

    public onSubmitFn: (label: string) => unknown;

    public label = new UntypedFormControl('', [Validators.required, Validators.maxLength(50)]);

    ngOnInit() {
        setTimeout(() => {
            this.focusfield.nativeElement.focus();
        }, 50);
    }

    mayClose(): boolean {
        return true;
    }

    onSubmit() {
        if (this.label.valid) {
            this.onSubmitFn(this.label.value);
            this.popup.onClose();
        }
    }

    public static get defaultPopupSettings(): PopupSettings {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 228;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.horizontalOffset = HorizontalOffset.Center;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Left, PopupDirection.Right, PopupDirection.Top];

        return popupSettings;
    }
}
