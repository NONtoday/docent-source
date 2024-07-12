import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { isSameDay } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconReacties, IconTijd, IconToets, IconToetsGroot, provideIcons } from 'harmony-icons';
import { join } from 'lodash-es';
import { HuiswerkType, Registratie } from '../../../generated/_types';
import { LesuurComponent } from '../../rooster-shared/components/lesuur/lesuur.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { formatBeginEindTijd, formatDateNL } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-leerlingregistraties-detail-regel',
    templateUrl: './leerlingregistraties-detail-regel.component.html',
    styleUrls: ['./leerlingregistraties-detail-regel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LesuurComponent, TooltipDirective, IconDirective],
    providers: [provideIcons(IconToets, IconToetsGroot, IconReacties, IconTijd)]
})
export class LeerlingregistratiesDetailRegelComponent implements OnChanges {
    @HostBinding('class.indent-left') @Input() indentLeft: boolean;

    @Input() registratie: Registratie;
    @Input() isAfwezigKolom: boolean;

    omschrijving: string;
    toelichting: string;
    tijdsindicatie: string;
    toets: boolean;
    groteToets: boolean;

    ngOnChanges() {
        this.omschrijving = this.generateOmschrijving();
        this.tijdsindicatie = this.generateTijdsindicatie();
        this.toets = this.registratie.toetsmoment === HuiswerkType.TOETS;
        this.groteToets = this.registratie.toetsmoment === HuiswerkType.GROTE_TOETS;
    }

    private generateOmschrijving(): string {
        if (this.isAfwezigKolom && this.registratie.vakOfTitel) {
            return `${this.registratie.vakOfTitel} · ${this.registratie.absentieReden ?? 'Ongeoorloofd afwezig'}`;
        } else if (this.registratie.vakOfTitel) {
            return join([this.registratie.vakOfTitel, this.registratie.absentieReden].filter(Boolean), ' · ');
        } else if (this.isAfwezigKolom) {
            return this.registratie.absentieReden ?? 'Ongeoorloofd afwezig';
        } else {
            return this.registratie.absentieReden ?? formatDateNL(this.registratie.beginDatumTijd, 'dag_kort_dagnummer_maand_kort');
        }
    }

    private generateTijdsindicatie(): string {
        const datePrefix =
            this.registratie.vakOfTitel || this.registratie.absentieReden
                ? `${formatDateNL(this.registratie.beginDatumTijd, 'dag_kort_dagnummer_maand_kort')}, `
                : '';
        if (this.registratie.minutenGemist && this.registratie.minutenGemist > 0) {
            return `${datePrefix}${this.registratie.minutenGemist} min gemist`;
        } else if (this.isAfwezigKolom) {
            return this.formatBeginEindDatumTijd(this.registratie.beginDatumTijd, this.registratie.eindDatumTijd);
        } else {
            return `${datePrefix}${formatBeginEindTijd(this.registratie.beginDatumTijd, this.registratie.eindDatumTijd)}`;
        }
    }

    private formatDatumTijd(datum: Date) {
        return `${formatDateNL(datum, 'dag_kort_dagnummer_maand_kort')}, ${formatDateNL(datum, 'tijd')}`;
    }

    private formatBeginEindDatumTijd(begin: Date, eind?: Optional<Date>) {
        let tijdsindicatie = this.formatDatumTijd(begin);
        if (eind) {
            tijdsindicatie += ' - ';
            if (isSameDay(begin, eind)) {
                tijdsindicatie += formatDateNL(eind, 'tijd');
            } else {
                tijdsindicatie += this.formatDatumTijd(eind);
            }
        } else {
            tijdsindicatie += ' - heden';
        }
        return tijdsindicatie;
    }
}
