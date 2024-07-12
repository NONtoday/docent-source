import { Route } from '@angular/router';
import { deactivatableGuard } from '../core/guards/deactivatable.guard';
import { SjabloonDetailComponent } from './sjabloon-detail/sjabloon-detail.component';
import { SjabloonOverzichtComponent } from './sjabloon-overzicht/sjabloon-overzicht.component';
import { StudiewijzerDetailComponent } from './studiewijzer-detail/studiewijzer-detail.component';
import { StudiewijzerOverzichtComponent } from './studiewijzer-overzicht/studiewijzer-overzicht.component';

export default [
    {
        path: '',
        component: StudiewijzerOverzichtComponent
    },
    {
        path: 'sjablonen',
        component: SjabloonOverzichtComponent,
        pathMatch: 'full',
        data: { subtitle: 'Sjablonen', icon: 'sjabloon' }
    },
    {
        path: 'sjablonen/:id',
        component: SjabloonDetailComponent,
        canDeactivate: [deactivatableGuard],
        data: { subtitle: 'Sjablonen', icon: 'sjabloon' }
    },
    {
        path: ':id',
        component: StudiewijzerDetailComponent,
        canDeactivate: [deactivatableGuard]
    }
] satisfies Route[];
