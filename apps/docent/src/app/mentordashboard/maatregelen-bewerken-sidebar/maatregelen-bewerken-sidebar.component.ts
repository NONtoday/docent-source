import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MaatregelInput, MaatregelToekenningFragment, MaatregelToekenningInput, MaatregelenQuery } from '../../../generated/_types';
import { Schooljaar } from '../../core/models/schooljaar.model';
import { MaatregelToekenningDataService } from '../../core/services/maatregeltoekenning-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { background_1 } from '../../rooster-shared/colors';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { DatepickerComponent } from '../../rooster-shared/components/datepicker/datepicker.component';
import { FormCheckboxComponent } from '../../rooster-shared/components/form-checkbox/form-checkbox.component';
import { FormDropdownComponent } from '../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { AutosizeDirective } from '../../rooster-shared/directives/autosize.directive';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { convertToLocalDate, getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { DropDownOption } from '../../rooster-shared/utils/dropdown.util';

type Maatregel = MaatregelenQuery['maatregelen'][number];

@Component({
    selector: 'dt-maatregelen-bewerken-sidebar',
    templateUrl: './maatregelen-bewerken-sidebar.component.html',
    styleUrls: ['./maatregelen-bewerken-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        FormsModule,
        ReactiveFormsModule,
        FormDropdownComponent,
        DatepickerComponent,
        FormCheckboxComponent,
        OutlineButtonComponent,
        ButtonComponent,
        MessageComponent,
        AutosizeDirective
    ]
})
export class MaatregelenBewerkenSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private formBuilder = inject(UntypedFormBuilder);
    @Input() maatregelToekenning: MaatregelToekenningFragment;
    @Input() maatregelen: MaatregelenQuery['maatregelen'] = [];
    @Input() leerlingId: string;

    maatregelForm: UntypedFormGroup;
    schooljaar: Schooljaar = getSchooljaar(new Date());
    maatregelenOptions: DropDownOption<Maatregel>[];
    maatregelInactiefMessage: string;
    background_1 = background_1;

    private maatregelToekenningDataService = inject(MaatregelToekenningDataService);

    ngOnInit(): void {
        this.maatregelenOptions = this.maatregelen.map((maatregel) => ({
            text: maatregel.omschrijving,
            value: maatregel,
            labelstyle: 'primary'
        }));

        const currentMaatregel = this.maatregelToekenning?.maatregel.id;
        const selectedMaatregel = this.maatregelenOptions.find((option) => option.value.id === currentMaatregel);
        if (currentMaatregel && !selectedMaatregel) {
            this.maatregelInactiefMessage = `Maatregel '${this.maatregelToekenning?.maatregel.omschrijving}' is inactief gemaakt door de applicatiebeheerder.`;
        }
        this.maatregelForm = this.formBuilder.group({
            maatregel: [selectedMaatregel?.value, Validators.required],
            datum: [this.maatregelToekenning?.maatregelDatum ?? new Date(), Validators.required],
            opmerking: [this.maatregelToekenning?.opmerkingen ?? '', Validators.maxLength(2048)],
            afgehandeld: [Boolean(this.maatregelToekenning?.nagekomen), Validators.required]
        });
    }

    onSubmitClick() {
        if (this.maatregelForm.valid) {
            const controls = this.maatregelForm.controls;
            const toekenning = {
                id: this.maatregelToekenning?.id ?? null,
                maatregel: {
                    id: controls.maatregel.value.id,
                    omschrijving: controls.maatregel.value.omschrijving
                } as MaatregelInput,
                maatregelDatum: convertToLocalDate(controls.datum.value) as any,
                nagekomen: controls.afgehandeld.value,
                opmerkingen: controls.opmerking.value,
                automatischToegekend: Boolean(this.maatregelToekenning?.automatischToegekend),
                leerlingId: this.leerlingId
            } as MaatregelToekenningInput;
            this.maatregelToekenningDataService.saveMaatregeltoekenning(toekenning, this.maatregelToekenning?.id);
            this.closeSidebar();
        }
    }

    closeSidebar() {
        this.sidebarService.closeSidebar(MaatregelenBewerkenSidebarComponent);
    }
}
