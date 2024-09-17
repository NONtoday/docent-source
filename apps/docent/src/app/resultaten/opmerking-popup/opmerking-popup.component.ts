import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Resultaat } from '@docent/codegen';
import { ButtonComponent, IconDirective } from 'harmony';
import { IconBewerken, IconNietZichtbaar, IconReacties, IconZichtbaar, provideIcons } from 'harmony-icons';
import { memoize } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { VerwijderButtonComponent } from '../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { AutofocusDirective } from '../../rooster-shared/directives/autofocus.directive';
import { ZichtbaarheidsToggleFormControlComponent } from '../../shared/components/zichtbaarheids-toggle-form-control/zichtbaarheids-toggle-form-control.component';

@Component({
    selector: 'dt-opmerking-popup',
    templateUrl: './opmerking-popup.component.html',
    styleUrls: ['./opmerking-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        FormsModule,
        ReactiveFormsModule,
        ZichtbaarheidsToggleFormControlComponent,
        AutofocusDirective,
        VerwijderButtonComponent,
        ButtonComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconReacties, IconZichtbaar, IconNietZichtbaar, IconBewerken)]
})
export class OpmerkingPopupComponent implements OnInit, Popup {
    private formBuilder = inject(UntypedFormBuilder);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    opmerkingen: Resultaat['opmerkingen'];
    isZichtbaar: Resultaat['toonOpmerkingInELO'];

    onBewerken: (opmerking: Resultaat['opmerkingen'], isZichtbaar: Resultaat['toonOpmerkingInELO']) => void;
    onVerwijderen: () => void;

    inEditState$ = new BehaviorSubject<boolean>(false);
    formGroup: UntypedFormGroup;
    opmerkingInELOTonenToegestaan: boolean;

    tooltipFn = memoize(() => (this.formGroup.controls.zichtbaarheid ? 'Zichtbaar voor leerlingen' : 'Niet zichtbaar voor leerlingen'));

    onSubmit = () => this.onBewerken(this.formGroup.controls.opmerkingen.value, this.formGroup.controls.zichtbaarheid.value);

    ngOnInit(): void {
        this.formGroup = this.formBuilder.group({
            opmerkingen: [this.opmerkingen ?? '', Validators.required],
            zichtbaarheid: [this.isZichtbaar ?? this.opmerkingInELOTonenToegestaan, Validators.required]
        });

        this.inEditState$.next(Boolean(!this.opmerkingen));
    }

    mayClose(): boolean {
        return true;
    }

    onBewerkenClick(event: Event) {
        event.stopPropagation();
        this.inEditState$.next(true);
    }

    get zichtbaarheidLabel(): string {
        return (this.formGroup.controls['zichtbaarheid'].value ? 'Zichtbaar' : 'Niet zichtbaar') + ' voor leerling en ouders';
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 400;
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Right, PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
