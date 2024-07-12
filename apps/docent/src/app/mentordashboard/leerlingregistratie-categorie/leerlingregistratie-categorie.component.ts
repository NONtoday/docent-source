import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { IconDirective, IconPillComponent, NotificationColor, NotificationSolidComponent, TooltipDirective } from 'harmony';
import { IconTrendBeneden, IconTrendBoven, provideIcons } from 'harmony-icons';
import { LeerlingAfwezigheidsKolom } from '../../../generated/_types';
import { MentordashboardOverzichtTijdspanOptie } from '../../core/models/mentordashboard.model';
import { Optional } from '../../rooster-shared/utils/utils';
import { registratieContent } from '../leerlingoverzicht/leerlingoverzicht.model';
import { formatMinutenAlsUren, formatPercentage } from '../mentordashboard.utils';
import { MentordashboardRegistratieTrendTooltipPipe } from '../pipes/mentordashboard-registratie-trend-tooltip.pipe';
import { RegistratieTrendPillColorPipe } from '../pipes/registratie-trend-pill-color.pipe';
import { TotaalRegistratieCategorieNaamPipe } from '../pipes/totaal-registratie-categorie-naam.pipe';

@Component({
    selector: 'dt-leerlingregistratie-categorie',
    standalone: true,
    templateUrl: './leerlingregistratie-categorie.component.html',
    styleUrls: ['./leerlingregistratie-categorie.component.scss'],
    imports: [
        TooltipDirective,
        NotificationSolidComponent,
        IconDirective,
        IconPillComponent,
        RegistratieTrendPillColorPipe,
        TotaalRegistratieCategorieNaamPipe,
        MentordashboardRegistratieTrendTooltipPipe
    ],
    providers: [provideIcons(IconTrendBoven, IconTrendBeneden)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingregistratieCategorieComponent implements OnChanges {
    @Input({ required: true }) kolom: Optional<LeerlingAfwezigheidsKolom>;
    @Input({ required: true }) naam: string;
    @Input({ required: true }) aantalLessen: number;
    @Input({ required: true }) totaalMinuten: Optional<number>;
    @Input({ required: true }) aantalRegistraties: number;
    @Input({ required: true }) aantalRegistratiesTijdensLes: number;
    @Input() trend: Optional<number>;
    @Input() periode: Optional<MentordashboardOverzichtTijdspanOptie>;

    kleur: NotificationColor;
    label: string;
    tooltip: string;
    inverted: boolean;

    ngOnChanges(): void {
        const content = this.kolom ? registratieContent[this.kolom] : registratieContent['VRIJ_VELD'];
        this.kleur = content.kleur;
        this.inverted = content.inverted ?? false;

        if (this.totaalMinuten) {
            this.label = `${formatMinutenAlsUren(this.totaalMinuten)} uur`;
        } else if (this.aantalRegistratiesTijdensLes && this.aantalLessen) {
            const percentage = formatPercentage(this.aantalRegistratiesTijdensLes, this.aantalLessen);
            this.tooltip = `${this.aantalRegistratiesTijdensLes}/${this.aantalLessen} lesuren`;
            this.label = `${Math.round(percentage)}% van de lesuren`;
        }
    }
}
