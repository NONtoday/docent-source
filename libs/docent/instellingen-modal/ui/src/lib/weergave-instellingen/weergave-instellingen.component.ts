import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import { outputFromObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IngelogdeMedewerkerQuery } from '@docent/codegen';
import { ToggleComponent } from 'harmony';
import { map, merge } from 'rxjs';

@Component({
    selector: 'dt-weergave-instellingen',
    standalone: true,
    imports: [CommonModule, ToggleComponent, ReactiveFormsModule],
    templateUrl: './weergave-instellingen.component.html',
    styleUrl: './weergave-instellingen.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeergaveInstellingenComponent implements OnInit {
    instellingen = input.required<IngelogdeMedewerkerQuery['ingelogdeMedewerker']['settings']['themeSettings']>();
    theme = new FormControl<string>('light', { nonNullable: true });
    useSystemTheme = new FormControl<boolean>(false, { nonNullable: true });

    updateSettings = outputFromObservable(
        merge(this.theme.valueChanges, this.useSystemTheme.valueChanges).pipe(
            map(() => ({
                theme: this.theme.value,
                useSystemTheme: this.useSystemTheme.value
            })),
            takeUntilDestroyed()
        )
    );

    constructor() {
        this.useSystemTheme.valueChanges.pipe(takeUntilDestroyed()).subscribe((useSystemTheme) => {
            if (useSystemTheme) {
                this.theme.disable({ emitEvent: false });
                this.theme.setValue(window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light', {
                    emitEvent: false
                });
            } else {
                this.theme.enable({ emitEvent: false });
            }
        });
    }

    ngOnInit(): void {
        this.theme.setValue(this.instellingen().theme, { emitEvent: false });
        this.useSystemTheme.setValue(this.instellingen().useSystemTheme, { emitEvent: false });
        if (this.instellingen().useSystemTheme) {
            this.theme.disable({ emitEvent: false });
        }
    }
}
