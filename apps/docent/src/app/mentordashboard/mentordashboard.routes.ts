import { Route } from '@angular/router';
import { NotitieboekComponent } from '../notitieboek/notitieboek.component';
import { GroepsoverzichtComponent } from './groepsoverzicht/groepsoverzicht.component';
import { LeerlingResultatenComponent } from './leerling-resultaten/leerling-resultaten.component';
import { LeerlingkaartComponent } from './leerlingkaart/leerlingkaart.component';
import { LeerlingoverzichtComponent } from './leerlingoverzicht/leerlingoverzicht.component';
import { LeerlingregistratiesTotalenComponent } from './leerlingregistraties-totalen/leerlingregistraties-totalen.component';
import { LeerlingregistratiesComponent } from './leerlingregistraties/leerlingregistraties.component';
import { mentordashboardLeerlingGuard } from './mentordashboard-leerling-guard';
import { MentordashboardComponent } from './mentordashboard/mentordashboard.component';

export default [
    {
        path: 'gezamenlijk-overzicht',
        component: MentordashboardComponent,
        children: [
            {
                path: '',
                component: GroepsoverzichtComponent
            }
        ]
    },
    {
        path: 'stamgroep/:id',
        component: MentordashboardComponent,
        children: [
            {
                path: '',
                component: GroepsoverzichtComponent
            },
            {
                path: 'notitieboek',
                component: NotitieboekComponent
            }
        ]
    },
    {
        path: 'leerling/:id',
        component: MentordashboardComponent,
        canActivate: [mentordashboardLeerlingGuard],
        children: [
            {
                path: 'profiel',
                component: LeerlingkaartComponent
            },
            {
                path: 'registraties/vakken',
                component: LeerlingregistratiesComponent
            },
            {
                path: 'registraties',
                component: LeerlingregistratiesTotalenComponent
            },
            {
                path: 'resultaten',
                component: LeerlingResultatenComponent
            },
            {
                path: 'notitieboek',
                component: NotitieboekComponent
            },
            {
                path: 'overzicht',
                component: LeerlingoverzichtComponent
            }
        ]
    }
] satisfies Route[];
