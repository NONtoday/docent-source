import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { MaatregelToekenning } from '@docent/codegen';
import { IconActief, provideIcons } from 'harmony-icons';
import type { MaatregelToekenningenMetStatus } from '../../core/services/maatregeltoekenning-data.service';
import { MaatregeltoekenningComponent } from '../maatregeltoekenning/maatregeltoekenning.component';

@Component({
    selector: 'dt-maatregelen-lijst',
    standalone: true,
    imports: [MaatregeltoekenningComponent],
    templateUrl: './maatregelen-lijst.component.html',
    styleUrls: ['./maatregelen-lijst.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconActief)]
})
export class MaatregelenLijstComponent {
    @Input({ required: true }) maatregelToekenningen: MaatregelToekenningenMetStatus;
    @Input() editMode = true;

    onBewerken = output<MaatregelToekenning>();
    onVerwijderen = output<MaatregelToekenning>();
    onAfgehandeld = output<MaatregelToekenning>();
}
