import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { KeyValue, KeyValuePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AfspraakHerhalingDag } from '@docent/codegen';
import { NgStringPipesModule } from 'ngx-pipes';

type Dag = 'MAANDAG' | 'DINSDAG' | 'WOENSDAG' | 'DONDERDAG' | 'VRIJDAG' | 'ZATERDAG' | 'ZONDAG';

@Component({
    selector: 'dt-dagen-selectie',
    templateUrl: './dagen-selectie.component.html',
    styleUrls: ['./dagen-selectie.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DagenSelectieComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SlicePipe, KeyValuePipe, NgStringPipesModule]
})
export class DagenSelectieComponent implements ControlValueAccessor {
    public changeDetector = inject(ChangeDetectorRef);
    dagenSelectie: Record<Dag, boolean> = {
        MAANDAG: false,
        DINSDAG: false,
        WOENSDAG: false,
        DONDERDAG: false,
        VRIJDAG: false,
        ZATERDAG: false,
        ZONDAG: false
    };
    disabled = false;

    toggleDag(dag: KeyValue<string, boolean>) {
        if (!this.disabled) {
            this.dagenSelectie[dag.key as Dag] = !dag.value;
            const newControlValue: AfspraakHerhalingDag[] = Object.keys(this.dagenSelectie)
                .filter((key: Dag) => this.dagenSelectie[key])
                .map((key: Dag) => AfspraakHerhalingDag[key]);

            this.onChange(newControlValue);
            this.onTouched();
        }
    }

    onChange = (dagen: AfspraakHerhalingDag[]) => {};

    onTouched = () => {};

    writeValue(dagen: AfspraakHerhalingDag[]): void {
        Object.keys(this.dagenSelectie).forEach((key: Dag) => (this.dagenSelectie[key] = false));
        // Filter "DAG" en "WERKDAG" uit de meegegeven dagen
        dagen
            ?.filter((dag: AfspraakHerhalingDag | 'DAG' | 'WERKDAG') => (<any>this.dagenSelectie)[dag] !== undefined)
            .forEach((dag) => ((<any>this.dagenSelectie)[dag] = true));
        this.changeDetector.detectChanges();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.changeDetector.detectChanges();
    }

    public keepObjectOrder() {
        return 0;
    }
}
