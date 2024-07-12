import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LeerlingoverzichtRegistratiesComponent } from './leerlingoverzicht-registraties/leerlingoverzicht-registraties.component';
import { LeerlingoverzichtResultatenComponent } from './leerlingoverzicht-resultaten/leerlingoverzicht-resultaten.component';

@Component({
    selector: 'dt-leerlingoverzicht',
    templateUrl: './leerlingoverzicht.component.html',
    styleUrls: ['./leerlingoverzicht.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingoverzichtRegistratiesComponent, LeerlingoverzichtResultatenComponent]
})
export class LeerlingoverzichtComponent {}
