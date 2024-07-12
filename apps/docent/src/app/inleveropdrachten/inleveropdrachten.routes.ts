import { Route } from '@angular/router';
import { InleveringenOverzichtComponent } from './inleveringen-overzicht/inleveringen-overzicht.component';
import { InleveropdrachtenOverzichtComponent } from './inleveropdrachten-overzicht/inleveropdrachten-overzicht.component';

export default [
    {
        path: '',
        component: InleveropdrachtenOverzichtComponent
    },
    {
        path: ':id',
        component: InleveringenOverzichtComponent
    }
] satisfies Route[];
