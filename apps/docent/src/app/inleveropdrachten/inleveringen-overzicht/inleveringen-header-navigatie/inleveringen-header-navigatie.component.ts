import { ChangeDetectionStrategy, Component, Input, ViewContainerRef, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconHistorie, IconPijlLinks, provideIcons } from 'harmony-icons';
import { InleveringenOverzichtQuery } from '../../../../generated/_types';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { StudiewijzeritemTitelPipe } from '../../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { HeaderNavigatieButtonsComponent } from '../../../shared/components/header-navigatie-buttons/header-navigatie-buttons.component';

@Component({
    selector: 'dt-inleveringen-header-navigatie',
    templateUrl: './inleveringen-header-navigatie.component.html',
    styleUrls: ['./inleveringen-header-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, HeaderNavigatieButtonsComponent, StudiewijzeritemTitelPipe, DtDatePipe, IconDirective],
    providers: [provideIcons(IconPijlLinks, IconHistorie)]
})
export class InleveringenHeaderNavigatieComponent {
    @Input() inleveringenOverzicht: InleveringenOverzichtQuery['inleveringenOverzicht'];
    @Input() heeftVorige: boolean;
    @Input() heeftVolgende: boolean;

    meerOptiesClick = output<ViewContainerRef>();
    vorigeClick = output<void>();
    volgendeClick = output<void>();
    terugClick = output<void>();
}
