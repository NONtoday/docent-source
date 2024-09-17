import { ChangeDetectorRef, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent, CheckboxComponent } from 'harmony';
import { RegistratieCategorieFilter } from '../../core/models/mentordashboard.model';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { LeerlingoverzichtDataService } from '../leerlingoverzicht/leerlingoverzicht-data.service';

@Component({
    selector: 'dt-leerlingregistraties-weergave-popup',
    templateUrl: './leerlingregistraties-weergave-popup.component.html',
    styleUrls: ['./leerlingregistraties-weergave-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, ButtonComponent, CheckboxComponent]
})
export class LeerlingregistratiesWeergavePopupComponent implements OnInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() columns: RegistratieCategorieFilter[];
    @Input() gtmTag: string;
    @Input() leerlingId: string;
    @Input() afterOpslaan: () => void;

    private cdr = inject(ChangeDetectorRef);

    selectedColumnsForm: FormGroup<Record<string, FormControl<boolean>>>;

    private leerlingoverzichtDataService = inject(LeerlingoverzichtDataService);
    private formBuilder = inject(NonNullableFormBuilder);

    ngOnInit(): void {
        const groupValues = this.columns.reduce(
            (recurring, value) => {
                recurring[value.id] = value.selected;
                return recurring;
            },
            {} as Record<string, boolean>
        );

        this.selectedColumnsForm = this.formBuilder.group(groupValues);
    }

    public mayClose(): boolean {
        return true;
    }

    get allSelected(): boolean {
        return this.columns.length === this.selectedControls().length;
    }

    toggleSelectAll = () => (this.allSelected ? this.deselectAll() : this.selectAll());

    onSubmit() {
        const weergaves = Object.entries(this.selectedColumnsForm.value)
            .filter(([, value]) => value)
            .map(([key]) => key);

        this.leerlingoverzichtDataService.setLeerlingoverzichtWeergaveInstellingen(this.leerlingId, weergaves);
        this.afterOpslaan?.();
        this.popup.onClose();
    }

    private selectAll = () => this.columns.forEach((column) => this.selectControl(column.id));
    private deselectAll = () => this.columns.forEach((column) => this.deselectControl(column.id));
    private selectedControls = () => this.columns.filter((column) => this.selectedColumnsForm.controls[column.id]?.value);
    private selectControl = (controlName: string) => this.selectedColumnsForm.controls[controlName].setValue(true);
    private deselectControl = (controlName: string) => this.selectedColumnsForm.controls[controlName].setValue(false);

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 356;
        popupSettings.showCloseButton = false;
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
