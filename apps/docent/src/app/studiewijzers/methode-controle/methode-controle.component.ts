import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { IconDirective } from 'harmony';
import { IconHuiswerk, IconLesstof, provideIcons } from 'harmony-icons';
import { HuiswerkType, MethodeInhoud } from '../../../generated/_types';
import { MethodeSelectie } from '../../core/models/studiewijzers/methode.model';
import { ZichtbaarheidsToggleFormControlComponent } from '../../shared/components/zichtbaarheids-toggle-form-control/zichtbaarheids-toggle-form-control.component';

@Component({
    selector: 'dt-methode-controle',
    templateUrl: './methode-controle.component.html',
    styleUrls: ['./methode-controle.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, ZichtbaarheidsToggleFormControlComponent, IconDirective],
    providers: [provideIcons(IconLesstof, IconHuiswerk)]
})
export class MethodeControleComponent implements OnChanges {
    @HostBinding('class.with-header') @Input() showHeader = true;
    @Input() methodeSelectie: MethodeSelectie;
    @Input() form: UntypedFormGroup;
    public theorie: MethodeInhoud[];
    public huiswerk: MethodeInhoud[];

    ngOnChanges(): void {
        this.theorie = this.methodeSelectie.subHoofdstuk.inhoud.filter((inhoud) => inhoud.huiswerkType === HuiswerkType.LESSTOF);
        this.huiswerk = this.methodeSelectie.subHoofdstuk.inhoud.filter((inhoud) => inhoud.huiswerkType === HuiswerkType.HUISWERK);

        const defaultTheorieNaam = `${this.methodeSelectie.hoofdstukNaam}: ${this.methodeSelectie.subHoofdstuk.naam}: Theorie`;
        const defaultHuiswerkNaam = `${this.methodeSelectie.hoofdstukNaam}: ${this.methodeSelectie.subHoofdstuk.naam}: Huiswerk`;

        this.form.patchValue({
            theorie: defaultTheorieNaam,
            huiswerk: defaultHuiswerkNaam
        });
    }
}
