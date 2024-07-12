import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { allowChildAnimations } from '../../core/core-animations';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { GroepsoverzichtRegistratiesComponent } from './groepsoverzicht-registraties/groepsoverzicht-registraties.component';
import { GroepsoverzichtResultatenComponent } from './groepsoverzicht-resultaten/groepsoverzicht-resultaten.component';

@Component({
    selector: 'dt-groepsoverzicht',
    templateUrl: './groepsoverzicht.component.html',
    styleUrls: ['./groepsoverzicht.component.scss'],
    standalone: true,
    imports: [GroepsoverzichtRegistratiesComponent, GroepsoverzichtResultatenComponent, HeeftRechtDirective],
    animations: [allowChildAnimations],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroepsoverzichtComponent {
    private router = inject(Router);

    isGezamenlijkOverzicht = false;

    constructor() {
        this.isGezamenlijkOverzicht = this.router.url.includes('gezamenlijk-overzicht');
    }
}
