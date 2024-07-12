import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { endOfWeek } from 'date-fns';
import { TooltipDirective } from 'harmony';
import { Registratie } from '../../../../../generated/_types';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { formatDateNL } from '../../../../rooster-shared/utils/date.utils';
import { RegistratiesVerloopDagComponent } from '../registraties-verloop-dag/registraties-verloop-dag.component';

@Component({
    selector: 'dt-registraties-verloop-week',
    standalone: true,
    templateUrl: './registraties-verloop-week.component.html',
    styleUrl: './registraties-verloop-week.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RegistratiesVerloopDagComponent, DtDatePipe, TooltipDirective]
})
export class RegistratiesVerloopWeekComponent {
    verloopWeek = input.required<RegistratieVerloopWeek>();
    weekTooltip = computed(
        () =>
            `${formatDateNL(this.verloopWeek().week, 'dagnummer_maand_kort')} - ${formatDateNL(endOfWeek(this.verloopWeek().week, { weekStartsOn: 1 }), 'dagnummer_maand_kort')}`
    );
}

export interface RegistratieVerloopWeek {
    week: Date;
    dagenMetRegistraties: {
        datum: Date;
        registraties: Registratie[];
        tooltip: string;
    }[];
}
