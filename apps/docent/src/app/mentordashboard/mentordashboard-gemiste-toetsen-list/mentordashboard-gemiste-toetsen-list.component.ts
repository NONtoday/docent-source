import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { GemistResultaat } from '@docent/codegen';
import { IconDirective, PillComponent, TooltipDirective } from 'harmony';
import { orderBy } from 'lodash-es';

import { IconDeeltoets, IconReacties, IconWeging, provideIcons } from 'harmony-icons';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';

@Component({
    selector: 'dt-mentordashboard-gemiste-toetsen-list',
    standalone: true,
    imports: [IconDirective, PillComponent, TooltipDirective, DtDatePipe],
    templateUrl: './mentordashboard-gemiste-toetsen-list.component.html',
    styleUrl: './mentordashboard-gemiste-toetsen-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconDeeltoets, IconWeging, IconReacties)]
})
export class MentordashboardGemisteToetsenListComponent implements OnInit {
    @Input({ required: true }) gemisteToetsen: GemistResultaat[];

    orderedToetsenView: GemisteToetsInView[] = [];

    ngOnInit(): void {
        this.orderedToetsenView = orderBy(
            this.gemisteToetsen.map((resultaat: GemistResultaat) => {
                /*  TODO: er zit een bug in GeldendResultaat waardoor de "opmerkingen" property niet altijd correct gevuld wordt.
                Dit wordt door team leerling meegenomen bij het oplossen van de rest van de bugs in GeldendResultaat.
                Zodra die aanpassingen zijn gedaan, kan dit hieronder ook aangepast worden. */
                const opmerkingText = resultaat.resultaat.opmerkingen
                    ? resultaat.resultaat.opmerkingen
                    : resultaat.resultaat.opmerkingenEerstePoging;

                const periodeDate = resultaat.geplandeDatumToets || resultaat.laatstGewijzigdDatum;
                const periodeDateText = periodeDate ? formatDateNL(new Date(periodeDate), 'dag_kort_dagnummer_maand_kort') : null;

                return {
                    ...resultaat,
                    tooltipDeeltoets: resultaat.toetscodeSamengesteldeToets
                        ? `<b>Deeltoets van</b><br>${resultaat.toetscodeSamengesteldeToets} • ${resultaat.omschrijvingSamengesteldeToets}`
                        : undefined,
                    tooltipOpmerking: opmerkingText ? `<b>Opmerking</b><br>${opmerkingText}` : undefined,
                    periodeText: 'P' + resultaat.resultaat.periode + (periodeDateText ? ` • ${periodeDateText}` : '')
                };
            }),
            [(t) => (t.geplandeDatumToets ? t.geplandeDatumToets : t.laatstGewijzigdDatum || -1)],
            ['desc']
        );
    }
}

type GemisteToetsInView = GemistResultaat & {
    tooltipDeeltoets?: string;
    tooltipOpmerking?: string;
    periodeText: string;
};
