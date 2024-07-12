import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconPijlLinks, provideIcons } from 'harmony-icons';
import { InleveringenOverzichtQuery, Inleverperiode } from '../../../../generated/_types';
import { NieuweInleveringComponent } from './nieuwe-inlevering/nieuwe-inlevering.component';

@Component({
    selector: 'dt-nieuwe-inleveringen',
    templateUrl: './nieuwe-inleveringen.component.html',
    styleUrls: ['./nieuwe-inleveringen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, NieuweInleveringComponent, IconDirective],
    providers: [provideIcons(IconPijlLinks)]
})
export class NieuweInleveringenComponent {
    @Input() ongelezenInleveringen: InleveringenOverzichtQuery['inleveringenOverzicht']['nieuw'];
    @Input() inleverperiode: Inleverperiode;
}
