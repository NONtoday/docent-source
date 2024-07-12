import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { Differentiatiegroep, Leerling } from '../../../../../generated/_types';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { equalsId, toId } from '../../../../rooster-shared/utils/utils';
import { LeerlingGroepFormControlComponent } from '../../leerling-groep-form-control/leerling-groep-form-control.component';
import { DifferentiatiegroepFormControlComponent } from '../differentiatiegroep-form-control/differentiatiegroep-form-control.component';

@Component({
    selector: 'dt-differentiatie-selectie',
    templateUrl: './differentiatie-selectie.component.html',
    styleUrls: ['./differentiatie-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        DifferentiatiegroepFormControlComponent,
        FormsModule,
        ReactiveFormsModule,
        LeerlingGroepFormControlComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe
    ]
})
export class DifferentiatieSelectieComponent implements OnInit {
    @Input() differentiatiegroepen: Differentiatiegroep[];
    @Input() leerlingen: Leerling[];

    onToevoegen = output<{
        leerlingen: Leerling[];
        groepen: Differentiatiegroep[];
    }>();
    onAnnuleren = output<void>();

    leerlingenFormGroup = new UntypedFormGroup({});
    groepenFormGroup = new UntypedFormGroup({});

    filteredLeerlingen$ = new BehaviorSubject<Leerling[]>([]);
    aantalGeselecteerd$: Observable<number>;
    alleLeerlingenGeselecteerd$: Observable<boolean>;

    ngOnInit(): void {
        this.filteredLeerlingen$.next(this.leerlingen);

        this.createControls(this.leerlingen?.map(toId), this.leerlingenFormGroup);
        this.createControls(this.differentiatiegroepen?.map(toId), this.groepenFormGroup);

        const aantalGeselecteerdeGroepen$ = this.groepenFormGroup.valueChanges.pipe(
            tap(() => this.filterLeerlingControls(true)),
            map(this.countSelectedControls),
            startWith(0)
        );
        const aantalGeselecteerdeLeerlingen$ = this.leerlingenFormGroup.valueChanges.pipe(
            tap(() => this.filterLeerlingControls(false)),
            map(this.countSelectedControls),
            startWith(0)
        );
        this.alleLeerlingenGeselecteerd$ = aantalGeselecteerdeLeerlingen$.pipe(
            map((aantalGeselecteerd) => aantalGeselecteerd === this.filteredLeerlingen$.value.length)
        );
        this.aantalGeselecteerd$ = combineLatest([aantalGeselecteerdeGroepen$, aantalGeselecteerdeLeerlingen$]).pipe(
            map(([groepen, geselecteerdeLeerlingen]) => groepen + geselecteerdeLeerlingen)
        );
    }

    voegToe() {
        const leerlingen: Leerling[] = this.selectedControls(this.leerlingen, this.leerlingenFormGroup);
        const groepen: Differentiatiegroep[] = this.selectedControls(this.differentiatiegroepen, this.groepenFormGroup);

        this.onToevoegen.emit({ leerlingen, groepen });
    }

    onSelectAll() {
        this.leerlingen
            .filter((leerling) => !this.selectedGroepenLeerlingen.some(equalsId(leerling.id)))
            .forEach((leerling) => this.selectControl(leerling.id, this.leerlingenFormGroup));
    }

    onDeselectAll() {
        this.leerlingen.forEach((leerling) => this.deselectControl(leerling.id, this.leerlingenFormGroup));
    }

    filterLeerlingControls = (deselectControls?: boolean) => {
        if (deselectControls) {
            this.selectedGroepenLeerlingen.forEach((leerling) => this.leerlingenFormGroup.controls[leerling.id]?.setValue(false));
        }

        this.filteredLeerlingen$.next(this.leerlingen.filter((leerling) => !this.selectedGroepenLeerlingen.some(equalsId(leerling.id))));
    };

    get selectedGroepenLeerlingen(): Leerling[] {
        return this.selectedControls(this.differentiatiegroepen, this.groepenFormGroup)?.flatMap((groep) => groep.leerlingen);
    }

    trackById(index: number, item: Differentiatiegroep | Leerling) {
        return item.id;
    }

    private createControl = (id: string, formGroup: UntypedFormGroup) => formGroup.addControl(id, new UntypedFormControl(false));
    private createControls = (ids: string[], formGroup: UntypedFormGroup) => ids.forEach((id) => this.createControl(id, formGroup));
    private selectedControls = (values: any[], formGroup: UntypedFormGroup) =>
        values.filter((value) => formGroup.controls[value.id]?.value);
    private countSelectedControls = (values: any[]) => Object.values(values).filter(Boolean).length;
    private selectControl = (controlName: string, formGroup: UntypedFormGroup) => formGroup.controls[controlName].setValue(true);
    private deselectControl = (controlName: string, formGroup: UntypedFormGroup) => formGroup.controls[controlName].setValue(false);
}
