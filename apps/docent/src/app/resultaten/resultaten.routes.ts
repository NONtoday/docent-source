import { Route } from '@angular/router';
import { ResultatenComponent } from './resultaten.component';

export default [
    {
        path: 'voortgangsdossier/:id',
        component: ResultatenComponent,
        data: { subtitle: 'Voortgangsdossier', icon: 'voortgangsdossier' }
    }
] satisfies Route[];
