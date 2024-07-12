import { Route } from '@angular/router';
import { authGuard } from './auth';
import { DeepLinkComponent } from './auth/deeplink/deep-link.component';
import { InternalDeepLinkComponent } from './auth/deeplink/internal/internal-deep-link-component';
import { deactivatableGuard } from './core/guards/deactivatable.guard';
import { toegangTotEloEnSwGuard } from './core/guards/toegang-tot-elo-en-sw.guard';
import { unsupportedBrowserGuard } from './core/guards/unsupported-browser.guard';
import { OAuthRouteComponent } from './core/oauth-route/oauth-route.component';
import { PageNotFoundComponent } from './core/page-not-found.component';
import { DashComponent } from './layout/dash/dash.component';
import { roosterRouteMatcher } from './rooster-shared/utils/utils';
import { RoosterComponent } from './rooster/rooster.component';

export const APP_ROUTES: Route[] = [
    {
        path: '',
        component: DashComponent,
        // canActivate heeft de AuthGuard zodat de ToegangTotEloEnSwGuard getriggerd kan worden na de AuthGuard.
        canActivate: [unsupportedBrowserGuard, authGuard],
        // canActivateChild heeft de AuthGuard zodat routing tussen children ook autorisatie controleert.
        canActivateChild: [authGuard],
        children: [
            {
                path: '', // default route
                component: RoosterComponent,
                title: 'Rooster'
            },
            {
                matcher: roosterRouteMatcher,
                component: RoosterComponent,
                data: { subtitle: 'Rooster', icon: 'rooster' }
            },
            {
                path: 'rooster/les',
                loadChildren: () => import('./les/les.routes')
            },
            {
                path: 'studiewijzers',
                canMatch: [toegangTotEloEnSwGuard],
                loadChildren: () => import('./studiewijzers/studiewijzers.routes'),
                title: 'Studiewijzers'
            },
            {
                path: 'inleveropdrachten',
                canLoad: [],
                loadChildren: () => import('./inleveropdrachten/inleveropdrachten.routes'),
                title: 'Inleveropdrachten'
            },
            {
                path: 'mentordashboard',
                loadChildren: () => import('./mentordashboard/mentordashboard.routes'),
                title: 'Mentorleerlingen'
            },
            {
                path: 'resultaten',
                canLoad: [],
                loadChildren: () => import('./resultaten/resultaten.routes'),
                title: 'Resultaten'
            },
            {
                path: 'notitieboek',
                loadComponent: () => import('./notitieboek/notitieboek.component').then((mod) => mod.NotitieboekComponent),
                runGuardsAndResolvers: 'pathParamsOrQueryParamsChange',
                canDeactivate: [deactivatableGuard],
                title: 'Notitieboek'
            },
            { path: 'deeplink', component: DeepLinkComponent },
            { path: 'internal', component: InternalDeepLinkComponent }
        ]
    },
    { path: 'oauth', component: OAuthRouteComponent },
    {
        path: 'share',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            {
                path: 'meeting',
                loadComponent: () =>
                    import('./shared/components/video-conference/video-conference.component').then((mod) => mod.VideoConferenceComponent)
            },
            {
                path: 'link',
                loadComponent: () =>
                    import('./shared/components/share-content/share-content.component').then((mod) => mod.ShareContentComponent)
            }
        ]
    },
    {
        path: 'microsoft',
        children: [
            {
                path: 'auth',
                loadComponent: () =>
                    import('./shared/components/video-conference/video-conference.component').then((mod) => mod.VideoConferenceComponent),
                canActivate: [authGuard]
            }
        ]
    },
    {
        path: 'unsupportedbrowser',
        loadComponent: () =>
            import('./core/unsupported-browser/unsupported-browser.component').then((mod) => mod.UnsupportedBrowserComponent)
    },
    { path: '**', component: PageNotFoundComponent }
];
