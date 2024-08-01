import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';

import { CheckboxComponent, IconDirective, PillComponent, PillTagColor } from 'harmony';
import { IconSlot, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';

@Component({
    selector: 'dt-inleveringen-overzicht-selectie',
    templateUrl: './inleveringen-overzicht-selectie.component.html',
    styleUrls: ['./inleveringen-overzicht-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CheckboxComponent, TooltipDirective, IconDirective, PillComponent],
    providers: [provideIcons(IconSlot)]
})
export class InleveringenOverzichtSelectieComponent implements OnChanges {
    @Input() labelText: string;
    @Input() aantalInleveringen: number;
    @Input() labelColor: PillTagColor;
    @Input() controlName: string;
    @Input() form: UntypedFormGroup;
    @Input() checkboxEnabled: boolean;

    label: string;

    ngOnChanges(): void {
        this.label = `${this.labelText} (${this.aantalInleveringen})`;
    }
}
