import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconChevronOnder, IconPijlKleinRechts, provideIcons } from 'harmony-icons';
import { memoize } from 'lodash-es';
import { BaseAfspraakFragment } from '../../../../../generated/_types';
import { LesmomentDag, QueriedWerkdrukLesgroepen } from '../../../../core/models/werkdruk.model';
import { formatBeginEindTijd } from '../../../../rooster-shared/utils/date.utils';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { LesgroepenPipe } from '../../../pipes/lesgroepen.pipe';
import { RoosterToetsPipe } from '../../../pipes/roostertoets.pipe';
import { LesuurComponent } from '../../lesuur/lesuur.component';

@Component({
    selector: 'dt-werkdruk-rooster',
    templateUrl: './werkdruk-rooster.component.html',
    styleUrls: ['./werkdruk-rooster.component.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, RouterLink, LesuurComponent, LesgroepenPipe, RoosterToetsPipe, DtDatePipe, IconDirective],
    providers: [provideIcons(IconPijlKleinRechts, IconChevronOnder)]
})
export class WerkdrukRoosterComponent {
    @Input() lesmomentDagen: LesmomentDag[];
    @Input() lesgroepen: QueriedWerkdrukLesgroepen[number]['lesgroep'][] = [];
    @Input() isOpen = false;

    onToggleRooster = output<boolean>();

    toggleRooster() {
        this.onToggleRooster.emit(this.isOpen);
        this.isOpen = !this.isOpen;
    }

    tooltipContent = (afspraak: BaseAfspraakFragment) =>
        memoize(() => {
            let tooltipString = `${formatBeginEindTijd(afspraak.begin, afspraak.eind)}`;
            if (afspraak.locatie) {
                tooltipString += `, ${afspraak.locatie}`;
            }

            return tooltipString;
        });
}
