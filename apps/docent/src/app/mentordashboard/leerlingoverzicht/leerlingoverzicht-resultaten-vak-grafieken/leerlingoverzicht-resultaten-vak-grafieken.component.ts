import { ChangeDetectionStrategy, Component, Input, computed, output, signal } from '@angular/core';
import { FloatingScrollButtonComponent, HorizontalScrollDirective, TooltipDirective } from 'harmony';
import { LeerlingoverzichtResultatenVakGrafiekComponent } from '../leerlingoverzicht-resultaten-vak-grafiek/leerlingoverzicht-resultaten-vak-grafiek.component';
import { LeerlingoverzichtResultatenVakGrafiekData } from '../leerlingoverzicht.model';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten-vak-grafieken',
    standalone: true,
    imports: [LeerlingoverzichtResultatenVakGrafiekComponent, TooltipDirective, HorizontalScrollDirective, FloatingScrollButtonComponent],
    templateUrl: './leerlingoverzicht-resultaten-vak-grafieken.component.html',
    styleUrl: './leerlingoverzicht-resultaten-vak-grafieken.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenVakGrafiekenComponent {
    readonly schaal = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

    vakgrafieken = signal<LeerlingoverzichtResultatenVakGrafiekData[]>([]);
    @Input({ required: true, alias: 'vakgrafieken' }) set _vakgrafieken(grafieken: LeerlingoverzichtResultatenVakGrafiekData[]) {
        this.vakgrafieken.set(grafieken);
    }

    openVakResultatenSidebar = output<LeerlingoverzichtResultatenVakGrafiekData>();

    toonEindcijfer = computed(() => this.vakgrafieken().some((grafiek) => grafiek.cijferbalken.length > 1));
    toonAlternatieveNormering = computed(() => this.vakgrafieken().some((grafiek) => grafiek.isAlternatieveNormering));
}
