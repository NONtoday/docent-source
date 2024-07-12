import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { isSameDay } from 'date-fns';
import { TooltipDirective } from 'harmony';
import { memoize } from 'lodash-es';
import { LesplanNavigatieWeekQuery } from '../../../../../generated/_types';
import { CollegaAvatarsComponent } from '../../../../rooster-shared/components/collega-avatars/collega-avatars.component';
import { LesuurComponent } from '../../../../rooster-shared/components/lesuur/lesuur.component';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../../../rooster-shared/pipes/roostertoets.pipe';
import { formatBeginEindTijd } from '../../../../rooster-shared/utils/date.utils';
import { isPresent } from '../../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-lesplan-navigatie-item',
    templateUrl: './lesplan-navigatie-item.component.html',
    styleUrls: ['./lesplan-navigatie-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CollegaAvatarsComponent, LesuurComponent, TooltipDirective, RoosterToetsPipe, DtDatePipe]
})
export class LesplanNavigatieItemComponent implements OnChanges {
    private changeDetector = inject(ChangeDetectorRef);
    @Input() keuze: LesplanNavigatieWeekQuery['lesplanNavigatieWeek'][number];
    @Input() showCollegas = true;
    @Input() selectedDag: string;
    @Input() selectedWeek: string;
    @Input() selectedAfspraakId: string;
    @Input() baseAfspraakId: string;

    @HostBinding('class.is-selected') isSelected = false;

    // class wordt gebruikt voor de e2e tests
    @HostBinding('class.heeft-lesuur') heeftLesuur = false;

    ngOnChanges() {
        if (!this.selectedWeek) {
            if (this.selectedDag && !this.keuze.afspraak) {
                this.isSelected = isSameDay(this.keuze.datum, new Date(this.selectedDag));
            }

            if (!this.selectedDag && this.keuze.afspraak) {
                const keuzeAfspraakId = this.keuze.afspraak.id;

                this.isSelected = this.selectedAfspraakId
                    ? this.selectedAfspraakId === keuzeAfspraakId
                    : this.baseAfspraakId === keuzeAfspraakId;
            }
        } else {
            this.isSelected = false;
        }

        this.heeftLesuur =
            isPresent(this.keuze.afspraak?.lesuur) || Boolean(this.keuze.afspraak?.isKwt) || Boolean(this.keuze.afspraak?.isRoosterToets);
        this.changeDetector.detectChanges();
    }

    dateTooltip = memoize(
        (begin: Date, eind: Date) => `${formatBeginEindTijd(begin, eind)}`,
        (...args) => JSON.stringify(args)
    );
}
