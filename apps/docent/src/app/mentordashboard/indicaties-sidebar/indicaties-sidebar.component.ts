import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { BaseBeperkingFragment, BaseMedischHulpmiddelFragment, BaseSchoolInterventieFragment, LeerlingkaartQuery } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconInformatie, IconInterventies, IconOOhulpmiddelen, IconZorgindicaties, provideIcons } from 'harmony-icons';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';

type BeperkingMetTooltip = LeerlingkaartQuery['leerlingkaart']['beperkingen'][number] & { tooltip: string };
type HulpmiddelMetTooltip = LeerlingkaartQuery['leerlingkaart']['hulpmiddelen'][number] & { tooltip: string | null | undefined };
type InterventieMetTooltip = LeerlingkaartQuery['leerlingkaart']['interventies'][number] & { tooltip: string };

@Component({
    selector: 'dt-indicaties-sidebar',
    standalone: true,
    templateUrl: './indicaties-sidebar.component.html',
    styleUrls: ['./indicaties-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TooltipDirective, IconDirective, SidebarComponent],
    providers: [provideIcons(IconZorgindicaties, IconInformatie, IconOOhulpmiddelen, IconInterventies)]
})
export class IndicatiesSidebarComponent extends BaseSidebar implements OnInit {
    @Input({ required: true }) leerlingId: string;
    @Input({ required: true }) beperkingen: LeerlingkaartQuery['leerlingkaart']['beperkingen'];
    @Input({ required: true }) hulpmiddelen: LeerlingkaartQuery['leerlingkaart']['hulpmiddelen'];
    @Input({ required: true }) interventies: LeerlingkaartQuery['leerlingkaart']['interventies'];

    public beperkingenMetTooltip: BeperkingMetTooltip[];
    public hulpmiddelenMetTooltip: HulpmiddelMetTooltip[];
    public interventiesMetTooltip: InterventieMetTooltip[];
    public heeftBijzonderheden: boolean;
    public heeftOoHulpmiddelen: boolean;
    public heeftInterventies: boolean;

    ngOnInit(): void {
        this.beperkingenMetTooltip = this.beperkingen.map(this.addBeperkingTooltip);
        this.hulpmiddelenMetTooltip = this.hulpmiddelen.map(this.addHulpmiddelTooltip);
        this.interventiesMetTooltip = this.interventies.map(this.addInterventieTooltip);
        this.heeftBijzonderheden = this.beperkingen.length > 0;
        this.heeftOoHulpmiddelen = this.hulpmiddelen.length > 0;
        this.heeftInterventies = this.interventies.length > 0;
    }

    addBeperkingTooltip = (beperking: BaseBeperkingFragment): BeperkingMetTooltip => ({
        ...beperking,
        tooltip: [
            ['Diagnose', beperking.diagnose],
            ['Medicijngebruik', beperking.medicijnGebruik],
            ['Belemmerende factoren', beperking.belemmerendeFactoren],
            ['Compenserende factoren', beperking.compenserendeFactoren]
        ]
            .filter(([, value]) => value)
            .map(this.tooltipRegel)
            .join('<br><br>')
    });

    addInterventieTooltip = (interventie: BaseSchoolInterventieFragment): InterventieMetTooltip => ({
        ...interventie,
        tooltip: [
            ['Landelijke interventie', interventie.landelijkeInterventie],
            [
                `Start${interventie.einddatum ? '-en einddatum' : 'datum'}`,
                this.interventieDatum(interventie.begindatum, interventie.einddatum)
            ],
            ['Opmerking', interventie.opmerking],
            ['Evaluatie', interventie.evaluatie]
        ]
            .filter(([, value]) => value)
            .map(this.tooltipRegel)
            .join('<br><br>')
    });

    addHulpmiddelTooltip = (hulpmiddel: BaseMedischHulpmiddelFragment): HulpmiddelMetTooltip => ({
        ...hulpmiddel,
        tooltip: hulpmiddel.extraInformatie
    });

    tooltipRegel = ([titel, text]: [string, string]) => `<span class="text-content-small-semi">${titel}</span> <br> ${text}`;

    interventieDatum = (start: Date, eind: Date | undefined | null) => {
        if (!eind) {
            return formatDateNL(start, 'dagnummer_maand_kort');
        }

        return `${formatDateNL(start, 'dagnummer_maand_kort')} t/m ${formatDateNL(eind, 'dagnummer_maand_kort')}`;
    };
}
