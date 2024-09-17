import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { MentordashboardResultatenInstellingen } from '@docent/codegen';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, provideIcons } from 'harmony-icons';
import { NgPipesModule } from 'ngx-pipes';
import { LeerlingCijferOverzicht } from '../../../core/models/mentordashboard.model';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { CommaResultPipe } from '../../../shared/pipes/comma-result.pipe';
import { LeerlingCijferoverzichtBarComponent } from '../../leerling-cijferoverzicht-bar/leerling-cijferoverzicht-bar.component';
import { MentordashboardResultaatTrendColorPipe } from '../../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../../pipes/mentordashboard-resultaat-trend-tooltip.pipe';

@Component({
    selector: 'dt-groepsoverzicht-leerling-cijfer-kaart',
    standalone: true,
    imports: [
        AvatarComponent,
        VolledigeNaamPipe,
        TooltipDirective,
        LeerlingCijferoverzichtBarComponent,
        CommaResultPipe,
        IconDirective,
        MentordashboardResultaatTrendIconPipe,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendTooltipPipe,
        NgPipesModule
    ],
    providers: [provideIcons(IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven)],
    templateUrl: './groepsoverzicht-leerling-cijfer-kaart.component.html',
    styleUrls: ['./groepsoverzicht-leerling-cijfer-kaart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroepsoverzichtLeerlingCijferKaartComponent implements OnChanges {
    @Input() cijferOverzicht: LeerlingCijferOverzicht;
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;

    gemiddeldeIsOnvoldoende: boolean;
    Math = Math;

    ngOnChanges(): void {
        this.gemiddeldeIsOnvoldoende = this.cijferOverzicht.totaalgemiddelde
            ? this.cijferOverzicht.totaalgemiddelde < this.instellingen.grenswaardeOnvoldoende
            : false;
    }
}
