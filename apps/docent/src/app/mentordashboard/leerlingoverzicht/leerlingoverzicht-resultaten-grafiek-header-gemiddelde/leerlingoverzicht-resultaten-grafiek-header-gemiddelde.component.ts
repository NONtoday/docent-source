import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { Optional } from '../../../rooster-shared/utils/utils';
import { CommaResultPipe } from '../../../shared/pipes/comma-result.pipe';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten-grafiek-header-gemiddelde',
    standalone: true,
    imports: [IconDirective, TooltipDirective, CommaResultPipe],
    templateUrl: './leerlingoverzicht-resultaten-grafiek-header-gemiddelde.component.html',
    styleUrl: './leerlingoverzicht-resultaten-grafiek-header-gemiddelde.component.scss',
    providers: [provideIcons(IconInformatie)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenGrafiekHeaderGemiddeldeComponent {
    @Input({ required: true }) gemiddelde: Optional<number>;
    @Input({ required: true }) titel: string;
    @Input({ required: true }) tooltip: string;
    @Input({ required: true }) isOnvoldoende: boolean;
}
