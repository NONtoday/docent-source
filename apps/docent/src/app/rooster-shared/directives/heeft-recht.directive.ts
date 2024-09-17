import { ChangeDetectorRef, Directive, inject, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { Settings } from '@docent/codegen';
import { isEmpty } from 'lodash-es';
import { take } from 'rxjs';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { Optional } from '../utils/utils';

// alle booleans uit Settings
export type MedewerkerRechten = { [P in keyof Settings]: Settings[P] extends Optional<boolean> ? P : never }[keyof Settings];
export type Operation = 'AND' | 'OR';

@Directive({
    selector: '[dtHeeftRecht]',
    standalone: true
})
export class HeeftRechtDirective implements OnChanges {
    private medewerkerSettings: Settings;
    private rechten: MedewerkerRechten[];
    private operation: Operation = 'AND';

    private changeDetectorRef = inject(ChangeDetectorRef);
    private templateRef = inject(TemplateRef);
    private viewContainerRef = inject(ViewContainerRef);
    private medewerkerDataService = inject(MedewerkerDataService);

    private isVisible = false;

    // Dit staat in de onChanges omdat het anders niet te testen is,
    // maar in de praktijk zal die hier altijd maar 1 keer doorkomen.
    ngOnChanges() {
        this.medewerkerDataService
            .getMedewerker()
            .pipe(take(1))
            .subscribe((medewerker) => {
                this.medewerkerSettings = medewerker.settings;
                this.updateView();
                this.changeDetectorRef.detectChanges();
            });
    }

    @Input() set dtHeeftRecht(rechten: MedewerkerRechten[]) {
        this.rechten = rechten;
    }

    @Input() set dtHeeftRechtOperation(operation: Operation) {
        this.operation = operation;
    }

    private updateView() {
        if (isEmpty(this.rechten)) {
            this.viewContainerRef.clear();
            return;
        }

        const heeftRecht =
            this.operation === 'AND'
                ? this.rechten.every((recht) => this.medewerkerSettings[recht!])
                : this.rechten.some((recht) => this.medewerkerSettings[recht!]);

        if (heeftRecht) {
            if (!this.isVisible) {
                this.isVisible = true;
                this.viewContainerRef.createEmbeddedView(this.templateRef);
            }
        } else {
            this.isVisible = false;
            this.viewContainerRef.clear();
        }
    }
}
