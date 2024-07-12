import { Component, Input } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { Studiewijzeritem } from '../../../../generated/_types';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { StudiewijzeritemTitelPipe } from '../../../rooster-shared/pipes/studiewijzeritem-titel.pipe';

@Component({
    selector: 'dt-selected-lesitems',
    templateUrl: './selected-lesitems.component.html',
    styleUrls: ['./selected-lesitems.component.scss'],
    standalone: true,
    imports: [TooltipDirective, StudiewijzeritemTitelPipe, IconDirective],
    providers: [provideIcons(IconInformatie)]
})
export class SelectedLesitemsComponent {
    @Input() selectedStudiewijzeritems: Studiewijzeritem[];
    @Input() tooltip: string;
}
