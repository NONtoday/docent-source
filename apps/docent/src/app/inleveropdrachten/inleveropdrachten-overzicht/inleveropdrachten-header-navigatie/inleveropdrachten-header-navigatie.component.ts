import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInleveropdracht, provideIcons } from 'harmony-icons';
import { HeaderNavigatieButtonsComponent } from '../../../shared/components/header-navigatie-buttons/header-navigatie-buttons.component';

@Component({
    selector: 'dt-inleveropdrachten-header-navigatie',
    templateUrl: './inleveropdrachten-header-navigatie.component.html',
    styleUrls: ['./inleveropdrachten-header-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderNavigatieButtonsComponent, IconDirective],
    providers: [provideIcons(IconInleveropdracht)]
})
export class InleveropdrachtenHeaderNavigatieComponent {
    @Input() heeftVorige: boolean;
    @Input() heeftVolgende: boolean;
    @Input() schooljaar: number;

    vorigeClick = output<void>();
    volgendeClick = output<void>();
}
