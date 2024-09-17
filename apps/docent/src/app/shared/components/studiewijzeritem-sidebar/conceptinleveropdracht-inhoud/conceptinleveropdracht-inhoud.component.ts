import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { WeekToekenning } from '@docent/codegen';
import { IconDirective, IconPillComponent, TooltipDirective } from 'harmony';
import { IconCheck, IconKlok, IconNietZichtbaar, IconNotificatie, IconTijd, IconUitklappenRechts, provideIcons } from 'harmony-icons';
import { ToekenningDatumPipe } from '../../../../rooster-shared/pipes/toekenningDatum.pipe';
import { dagNamen } from '../../../../rooster-shared/utils/date.utils';
import { DropDownOption } from '../../../../rooster-shared/utils/dropdown.util';
import { DagenDurationPipe } from '../../../pipes/dagen-duration.pipe';

@Component({
    selector: 'dt-conceptinleveropdracht-inhoud',
    templateUrl: './conceptinleveropdracht-inhoud.component.html',
    styleUrls: ['./conceptinleveropdracht-inhoud.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, LowerCasePipe, DecimalPipe, ToekenningDatumPipe, DagenDurationPipe, IconDirective, IconPillComponent],
    providers: [provideIcons(IconNietZichtbaar, IconUitklappenRechts, IconTijd, IconNotificatie, IconCheck, IconKlok)]
})
export class ConceptinleveropdrachtInhoudComponent {
    @Input() weektoekenning: WeekToekenning;
    @Input() weekOpties: DropDownOption<number>[];

    public dagnamen = dagNamen;

    get swi() {
        return this.weektoekenning.studiewijzeritem;
    }

    get conceptOpdracht() {
        return this.swi.conceptInleveropdracht;
    }
}
