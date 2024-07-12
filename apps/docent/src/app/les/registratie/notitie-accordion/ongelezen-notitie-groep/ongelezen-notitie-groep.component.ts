import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconGroep, IconPinned, provideIcons } from 'harmony-icons';
import { ActueleNotitieItemFieldsFragment, OngelezenNotitieIndicatie } from '../../../../../generated/_types';
import { BackgroundIconComponent } from '../../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';

export interface ActueleNotitieItemFieldsGroep extends ActueleNotitieItemFieldsFragment {
    groep: ActueleNotitieItemFieldsFragment['lesgroep'] | ActueleNotitieItemFieldsFragment['stamgroep'];
}

@Component({
    selector: 'dt-ongelezen-notitie-groep',
    templateUrl: './ongelezen-notitie-groep.component.html',
    styleUrls: ['./ongelezen-notitie-groep.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BackgroundIconComponent, TooltipDirective, IconDirective],
    providers: [provideIcons(IconGroep, IconPinned)]
})
export class OngelezenNotitieGroepComponent implements OnChanges {
    @Input() ongelezenNotitieGroep: ActueleNotitieItemFieldsGroep;
    tooltipMessage: string;

    ngOnChanges(): void {
        this.tooltipMessage = `Groep heeft een ongelezen notitie${
            this.ongelezenNotitieGroep.ongelezenNotitieAanwezig === OngelezenNotitieIndicatie.MENTOR ? ' van de mentor' : ''
        }`;
    }
}
