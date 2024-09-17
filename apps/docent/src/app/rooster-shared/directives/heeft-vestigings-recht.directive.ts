import { ChangeDetectorRef, Directive, inject, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { VestigingRechten } from '@docent/codegen';
import { isEmpty } from 'lodash-es';
import { take } from 'rxjs/operators';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';

// alle booleans uit VestigingRechten
export type MedewerkerVestigingsRecht = {
    [P in keyof VestigingRechten]: VestigingRechten[P] extends boolean ? P : never;
}[keyof VestigingRechten];
type Operation = 'AND' | 'OR';

@Directive({
    selector: '[dtHeeftVestigingsRecht]',
    standalone: true
})
export class HeeftVestigingsRechtDirective implements OnChanges {
    private vestigingsRechten: VestigingRechten[];
    private rechten: Exclude<MedewerkerVestigingsRecht, undefined>[];
    private operation: Operation = 'AND';
    private vestigingId: string;

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
                this.vestigingsRechten = medewerker.settings.vestigingRechten;
                this.updateView();
                this.changeDetectorRef.detectChanges();
            });
    }

    @Input({ required: true }) set dtHeeftVestigingsRecht(rechten: Exclude<MedewerkerVestigingsRecht, undefined>[]) {
        this.rechten = rechten;
    }

    @Input({ required: true }) set dtHeeftVestigingsRechtVestigingId(vestigingId: string) {
        this.vestigingId = vestigingId;
    }

    @Input() set dtHeeftVestigingsRechtOperation(operation: Operation) {
        this.operation = operation;
    }

    private updateView() {
        const vestigingRechten = this.vestigingsRechten.find((vestigingRecht) => vestigingRecht.vestigingId === this.vestigingId);

        if (isEmpty(this.rechten) || !vestigingRechten) {
            this.viewContainerRef.clear();
            return;
        }

        const heeftRecht =
            this.operation === 'AND'
                ? this.rechten.every((recht) => vestigingRechten[recht])
                : this.rechten.some((recht) => vestigingRechten[recht]);

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
