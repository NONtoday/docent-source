import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewContainerRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { localOrCookieStorage } from './auth/storage-config';
import { ToastComponent } from './core/toast/toast.component';
import { ENVIRONMENT_CONFIG } from './environment.config';

@Component({
    selector: 'dt-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet, ToastComponent]
})
export class AppComponent implements OnInit, OnDestroy {
    private doc = inject<any>(DOCUMENT);
    private router = inject(Router);
    private previousUrl: string;
    private onDestroy$ = new Subject<void>();

    // wordt gebruikt voor modals/sidebars
    public appViewContainerRef = inject(ViewContainerRef);
    private environment = inject(ENVIRONMENT_CONFIG);

    constructor() {
        this.previousUrl = this.router.url;
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this.onDestroy$)
            )
            .subscribe((event: NavigationEnd) => {
                const currentUrl = event.urlAfterRedirects;
                this.clearContextStorage(this.previousUrl, currentUrl);
                this.previousUrl = currentUrl;
            });
    }

    ngOnInit(): void {
        this.setGoogleTagManager();

        document.documentElement.style.setProperty('--iw', `${window.innerWidth}px`);
        document.documentElement.style.setProperty('--ih', `${window.innerHeight}px`);

        fromEvent(window, 'resize')
            .pipe(debounceTime(20))
            .subscribe(() => {
                document.documentElement.style.setProperty('--iw', `${window.innerWidth}px`);
                document.documentElement.style.setProperty('--ih', `${window.innerHeight}px`);
            });
    }

    private clearContextStorage(previousUrl: string, currentUrl: string) {
        if (previousUrl.startsWith('/inleveropdrachten') && !currentUrl.startsWith('/inleveropdrachten')) {
            localOrCookieStorage.removeItem('inleveropdrachten.navigatie.jaar');
            localOrCookieStorage.removeItem('inleveropdrachten.navigatie.tab');
            localOrCookieStorage.removeItem('inleveropdrachten.navigatie.scrollpositie');
        }
    }

    private setGoogleTagManager() {
        const s = this.doc.createElement('script');
        s.type = 'text/javascript';
        s.innerHTML =
            '(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push' +
            "({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)" +
            "[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
            "'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '" +
            '&gtm_auth=' +
            this.environment.gtmAuthId +
            '&gtm_preview=' +
            this.environment.gtmEnv +
            "&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);})" +
            "(window,document,'script','dataLayer','" +
            this.environment.tagManagerId +
            "');";
        const head = this.doc.getElementsByTagName('head')[0];
        head.appendChild(s);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
