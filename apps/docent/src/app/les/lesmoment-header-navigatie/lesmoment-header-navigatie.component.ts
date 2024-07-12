import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewContainerRef, output } from '@angular/core';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconPijlLinks, provideIcons } from 'harmony-icons';
import { AfspraakQuery, Maybe } from '../../../generated/_types';
import { LesuurComponent } from '../../rooster-shared/components/lesuur/lesuur.component';
import { roosterToetsTooltip } from '../../rooster-shared/pipes/roostertoets.pipe';
import { formatBeginEindTijd } from '../../rooster-shared/utils/date.utils';
import { HeaderNavigatieButtonsComponent } from '../../shared/components/header-navigatie-buttons/header-navigatie-buttons.component';

@Component({
    selector: 'dt-lesmoment-header-navigatie',
    standalone: true,
    imports: [LesuurComponent, TooltipDirective, HeaderNavigatieButtonsComponent, IconDirective],
    templateUrl: './lesmoment-header-navigatie.component.html',
    styleUrls: ['./lesmoment-header-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconPijlLinks)]
})
export class LesmomentHeaderNavigatieComponent implements OnChanges {
    @Input() afspraak: Maybe<AfspraakQuery['afspraak']>;
    @Input() heeftVorige: boolean;
    @Input() heeftVolgende: boolean;

    meerOptiesClick = output<ViewContainerRef>();
    vorigeClick = output<void>();
    volgendeClick = output<void>();
    terugClick = output<void>();

    public lesuurTooltip: string;
    public titel: string;

    ngOnChanges() {
        if (this.afspraak) {
            this.lesuurTooltip = this.afspraak.isRoosterToets
                ? roosterToetsTooltip(this.afspraak)
                : formatBeginEindTijd(this.afspraak.begin, this.afspraak.eind);
            this.titel =
                this.afspraak.lesgroepen?.length > 0
                    ? this.afspraak.lesgroepen.map((lesgroep) => lesgroep.naam).join(', ')
                    : this.afspraak.titel;
        }
    }

    onMeerOptiesClick = (moreOptionsRef: ViewContainerRef) => this.meerOptiesClick.emit(moreOptionsRef);
    onVorigeClick = () => this.vorigeClick.emit();
    onVolgendeClick = () => this.volgendeClick.emit();
    onTerugClick = () => this.terugClick.emit();
}
