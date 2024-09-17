import { AsyncPipe } from '@angular/common';
import { ApplicationRef, Component, OnDestroy, OnInit, Renderer2, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconName } from 'harmony-icons';
import { identity } from 'lodash-es';
import get from 'lodash-es/get';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { Observable, Subject, concat, fromEvent, interval } from 'rxjs';
import { filter, first, map, switchMap, takeUntil } from 'rxjs/operators';
import { allowChildAnimations } from '../../core/core-animations';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { ENVIRONMENT_CONFIG } from '../../environment.config';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { HeaderService } from '../header/header.service';
import { MenuComponent } from '../menu/menu.component';
import { MenuService } from '../menu/menu.service';
import { InboxBerichtenSidebarComponent } from './../../rooster-shared/components/berichten-sidebar/inbox-berichten-sidebar.component';
import { WhatsnewSidebarComponent } from './../whatsnew-sidebar/whatsnew-sidebar.component';

const menuUrls = ['/studiewijzers', '/rooster', '/inleveropdrachten', '/resultaten', '/mentordashboard'];

declare global {
    interface Window {
        Appcues: any;
        AppcuesWidget: any;
    }
}
@Component({
    selector: 'dt-dash',
    templateUrl: './dash.component.html',
    styleUrls: ['./dash.component.scss'],
    standalone: true,
    imports: [MenuComponent, AsyncPipe, RouterOutlet, MessageComponent, WhatsnewSidebarComponent, InboxBerichtenSidebarComponent],
    providers: [MenuService],
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 }), allowChildAnimations]
})
export class DashComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private medewerkerService = inject(MedewerkerDataService);
    public appRef = inject(ApplicationRef);
    public updates = inject(SwUpdate);
    private headerService = inject(HeaderService);
    public title: string;
    public icon: IconName;
    public showWhatsNew$: Observable<boolean>;
    public showBerichtenSidebar$: Observable<boolean>;
    public isUpdateBeschikbaar$: Observable<boolean>;
    public isServiceWorkerUpdate$: Observable<VersionEvent>;

    public onDestroy$ = new Subject<void>();

    private renderer2 = inject(Renderer2);

    constructor() {
        const systeemThemeDark = toSignal(
            fromEvent(window.matchMedia('(prefers-color-scheme: dark)'), 'change').pipe(map((event: MediaQueryListEvent) => event.matches)),
            {
                initialValue: window.matchMedia('(prefers-color-scheme: dark)').matches
            }
        );

        const themeSettings = toSignal(this.medewerkerService.getMedewerker().pipe(map((m) => m.settings.themeSettings)));

        explicitEffect([systeemThemeDark, themeSettings], ([systeemThemeDark, themeSettings]) => {
            if (!themeSettings) return;
            if (themeSettings?.useSystemTheme) {
                systeemThemeDark
                    ? this.renderer2.addClass(document.documentElement, 'dark')
                    : this.renderer2.removeClass(document.documentElement, 'dark');
            } else {
                themeSettings.theme === 'dark'
                    ? this.renderer2.addClass(document.documentElement, 'dark')
                    : this.renderer2.removeClass(document.documentElement, 'dark');
            }
        });

        const onMenuItemClick$ = this.router.events.pipe(
            filter((event) => event instanceof NavigationStart),
            filter((navstart: NavigationStart) => menuUrls.includes(navstart.url))
        );

        if (this.updates.isEnabled) {
            this.isServiceWorkerUpdate$ = this.updates.versionUpdates.pipe(filter((event: VersionEvent) => event.type === 'VERSION_READY'));
            this.isServiceWorkerUpdate$
                .pipe(
                    switchMap(() => this.updates.activateUpdate()),
                    switchMap(() => onMenuItemClick$),
                    takeUntil(this.onDestroy$)
                )
                .subscribe((navigation) => {
                    window.location.assign(navigation.url);
                });
        } else {
            this.headerService.isUpdateBeschikbaar$
                .pipe(
                    filter(identity),
                    switchMap(() => onMenuItemClick$),
                    takeUntil(this.onDestroy$)
                )
                .subscribe((navigation) => {
                    window.location.assign(navigation.url);
                });
        }

        this.updates.unrecoverable
            .pipe(
                switchMap(() => onMenuItemClick$),
                takeUntil(this.onDestroy$)
            )
            .subscribe((navigation) => {
                window.location.assign(navigation.url);
            });

        this.showWhatsNew$ = this.activatedRoute.queryParams.pipe(map((params) => params['whatsnew']));

        this.showBerichtenSidebar$ = this.activatedRoute.queryParams.pipe(map((params) => params['berichtenSidebar']));

        if ('serviceWorker' in navigator && inject(ENVIRONMENT_CONFIG).useServiceWorkers) {
            const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable === true));
            const everyHour$ = interval(1 * 60 * 60 * 1000);
            const everyHourOnceAppIsStable$ = concat(appIsStable$, everyHour$);

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            everyHourOnceAppIsStable$.subscribe(() => this.updates.checkForUpdate());
        }
    }

    ngOnInit() {
        this.initializeAppcues();
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onUpdateClick() {
        window.location.reload();
    }

    private initializeAppcues() {
        new Promise<void>((resolve) => {
            const scriptTag = document.createElement('script');
            scriptTag.src = '//fast.appcues.com/52328.js';
            scriptTag.addEventListener('load', () => {
                this.router.events
                    .pipe(
                        filter((event) => event instanceof NavigationEnd),
                        takeUntil(this.onDestroy$)
                    )
                    .subscribe(() => {
                        get(window, 'Appcues')?.page();
                    });

                const appcues = get(window, 'Appcues');
                if (appcues) {
                    appcues.identify(this.medewerkerService.medewerkerId);
                    resolve();
                }
            });
            document.body.appendChild(scriptTag);
        }).then(() => {
            const scriptTag = document.createElement('script');
            scriptTag.src = '//fast.appcues.com/widget-bundle.js';
            scriptTag.addEventListener('load', () => {
                const appcuesWidget = window.AppcuesWidget(window.Appcues.user());
                appcuesWidget.init('#appcuesWidget', {
                    position: 'top-right',
                    header: '<h3>Informatie & uitleg</h3>'
                });
            });
            document.body.appendChild(scriptTag);
        });
    }
}
