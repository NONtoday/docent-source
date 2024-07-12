import { Route } from '@angular/router';
import { deactivatableGuard } from '../core/guards/deactivatable.guard';
import { roosterAfspraakGuard } from '../core/guards/rooster-afspraak.guard';
import { LesComponent } from './les.component';
import { LesplanningComponent } from './lesplanning/lesplanning.component';
import { RegistratieComponent } from './registratie/registratie.component';

export default [
    {
        path: ':id',
        component: LesComponent,
        children: [
            {
                path: 'registratie',
                canActivate: [roosterAfspraakGuard],
                component: RegistratieComponent,
                canDeactivate: [deactivatableGuard],
                title: 'Deze les'
            },
            {
                path: 'lesplanning',
                component: LesplanningComponent,
                canActivate: [roosterAfspraakGuard],
                title: 'Deze les'
            }
        ]
    }
] satisfies Route[];
