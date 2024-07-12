import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import {
    IconChevronOnder,
    IconKlok,
    IconLeerlingVerwijderdCheckbox,
    IconNoRadio,
    IconReacties,
    IconSlot,
    IconToevoegen,
    IconYesRadio,
    provideIcons
} from 'harmony-icons';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { LeerlingComponent } from '../../../shared/components/leerling/leerling.component';
import { FlexibeleRegistratiePopupComponent } from '../flexibele-registratie-popup/flexibele-registratie-popup.component';
import { LeerlingRegistratieComponent } from '../leerling-registratie/leerling-registratie.component';

@Component({
    selector: 'dt-leerling-block-registratie',
    templateUrl: './leerling-block-registratie.component.html',
    styleUrls: ['./leerling-block-registratie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        VolledigeNaamPipe,
        provideIcons(
            IconChevronOnder,
            IconYesRadio,
            IconNoRadio,
            IconReacties,
            IconKlok,
            IconSlot,
            IconLeerlingVerwijderdCheckbox,
            IconToevoegen
        )
    ],
    standalone: true,
    imports: [LeerlingComponent, TooltipDirective, AsyncPipe, IconDirective]
})
export class LeerlingBlockRegistratieComponent extends LeerlingRegistratieComponent {
    registratieIconSizes: IconSize[] = ['medium'];

    public onFlexibeleRegistratiePopupCreated(popup: FlexibeleRegistratiePopupComponent): void {
        popup.toonHWenMT = true;
    }
}
