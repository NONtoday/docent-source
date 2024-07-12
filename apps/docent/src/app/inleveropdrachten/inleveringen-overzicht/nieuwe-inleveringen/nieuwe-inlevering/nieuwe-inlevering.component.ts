import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { isBefore } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconChevronRechts, IconTijd, provideIcons } from 'harmony-icons';
import { memoize } from 'lodash-es';
import {
    InleveringenOverzichtQuery,
    Inleverperiode,
    Leerling,
    PartialLeerlingFragment,
    ProjectgroepFieldsFragment
} from '../../../../../generated/_types';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { dagenUrenMinutenTussenDatums } from '../../../../rooster-shared/utils/date.utils';
import { LeerlingComponent } from '../../../../shared/components/leerling/leerling.component';
import { ProjectgroepNaamComponent } from '../../../projectgroep-naam/projectgroep-naam.component';

@Component({
    selector: 'dt-nieuwe-inlevering',
    templateUrl: './nieuwe-inlevering.component.html',
    styleUrls: ['./nieuwe-inlevering.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingComponent, TooltipDirective, ProjectgroepNaamComponent, DtDatePipe, IconDirective],
    providers: [provideIcons(IconChevronRechts, IconTijd)]
})
export class NieuweInleveringComponent implements OnChanges {
    @Input() inleveraar: PartialLeerlingFragment | ProjectgroepFieldsFragment;
    @Input() inleveringen: InleveringenOverzichtQuery['inleveringenOverzicht']['nieuw'][number]['inleveringen'];
    @Input() inleverperiode: Inleverperiode;

    public isLeerling: boolean;
    public isTeLaat: boolean;
    public laatsteInlevering: Date;

    teLaatTooltipValue = memoize(() => dagenUrenMinutenTussenDatums(this.laatsteInlevering, this.inleverperiode.eind) + ' te laat');

    ngOnChanges(): void {
        this.isLeerling = !!(<Leerling>this.inleveraar)?.achternaam;
        this.isTeLaat = isBefore(this.inleverperiode.eind, this.inleveringen[0].inlevering.inleverdatum);
        this.laatsteInlevering = this.inleveringen[0].inlevering.inleverdatum;
    }
}
