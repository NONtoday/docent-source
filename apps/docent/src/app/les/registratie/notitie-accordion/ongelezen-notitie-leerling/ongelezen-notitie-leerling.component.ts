import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ActueleNotitieItemFieldsFragment, OngelezenNotitieIndicatie } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconPinned, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../../../rooster-shared/components/avatar/avatar.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';

@Component({
    selector: 'dt-ongelezen-notitie-leerling',
    templateUrl: './ongelezen-notitie-leerling.component.html',
    styleUrls: ['./ongelezen-notitie-leerling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, VolledigeNaamPipe, IconDirective],
    providers: [provideIcons(IconPinned)]
})
export class OngelezenNotitieLeerlingComponent implements OnInit {
    @Input() ongelezenNotitieLeerling: ActueleNotitieItemFieldsFragment;
    tooltipMessage: string;

    ngOnInit(): void {
        this.tooltipMessage = `Leerling heeft een ongelezen notitie${
            this.ongelezenNotitieLeerling.ongelezenNotitieAanwezig === OngelezenNotitieIndicatie.MENTOR ? ' van de mentor' : ''
        }`;
    }
}
