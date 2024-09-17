import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { Differentiatiegroep, Leerling, Projectgroep } from '@docent/codegen';
import { CheckboxComponent } from 'harmony';
import { Observable } from 'rxjs';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { differentiatieKleurConverter } from '../../../rooster-shared/utils/color-token-utils';
import { AvatarNaamComponent } from '../avatar-naam/avatar-naam.component';
import { KleurenStackComponent, KleurenStackElement } from '../kleuren-stack/kleuren-stack.component';

@Component({
    selector: 'dt-leerling-groep-form-control',
    templateUrl: './leerling-groep-form-control.component.html',
    styleUrls: ['./leerling-groep-form-control.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CheckboxComponent, AvatarNaamComponent, KleurenStackComponent, AsyncPipe, VolledigeNaamPipe]
})
export class LeerlingGroepFormControlComponent implements OnInit {
    @Input() leerling: Leerling;
    @Input() controlName: string;
    @Input() formGroup: UntypedFormGroup;
    @Input() groepen: Differentiatiegroep[] | Projectgroep[];

    formValueChanges$: Observable<boolean>;
    kleuren: KleurenStackElement[];

    ngOnInit() {
        if (this.groepen && (<Differentiatiegroep>this.groepen[0])?.kleur) {
            this.kleuren = (<Differentiatiegroep[]>this.groepen)?.map((groepen) => ({
                kleur: differentiatieKleurConverter[groepen.kleur].counter,
                border: differentiatieKleurConverter[groepen.kleur].border,
                content: groepen.naam
            }));
        }
        this.formValueChanges$ = this.formGroup.controls[this.controlName]?.valueChanges;
    }
}
