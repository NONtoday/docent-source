import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    inject,
    Input,
    NgZone,
    Renderer2,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { IconDirective } from 'harmony';
import {
    IconBericht,
    IconFeedback,
    IconName,
    IconTelefoon,
    IconTerugNaarSomtoday,
    IconWaarschuwing,
    IconZoeken,
    provideIcons
} from 'harmony-icons';
import { fromEvent, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Medewerker } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { ZoekPopupComponent } from '../../rooster-shared/components/zoek-popup/zoek-popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { MenuComponent } from '../menu/menu.component';
import { FeedbackMenuPopupComponent } from './feedback-menu-popup/feedback-menu-popup.component';
import { FeedbackPopupComponent } from './feedback-popup/feedback-popup.component';
import { HeaderService } from './header.service';
import { ProfileMenuPopupComponent } from './profile-menu-popup/profile-menu-popup.component';

@Component({
    selector: 'dt-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MenuComponent, CommonModule, TooltipDirective, IconDirective, AvatarComponent, VolledigeNaamPipe],
    providers: [provideIcons(IconTelefoon, IconZoeken, IconBericht, IconFeedback, IconWaarschuwing, IconTerugNaarSomtoday)]
})
export class HeaderComponent {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private uriService = inject(UriService);
    private headerService = inject(HeaderService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private router = inject(Router);
    @HostBinding('class.met-navigatie') @Input() metNavigatie = false;
    @Input() titel: string;
    @Input() icon: IconName;

    private ngZone = inject(NgZone);

    public isPopupOpen: boolean;
    public showDarkModeToggle = false;
    public medewerker$: Observable<Medewerker>;
    public isCoreReturnUrlSet$: Observable<boolean>;
    public heeftBerichtenInzienRecht$: Observable<boolean>;
    public aantalOngelezenBerichten$ = this.medewerkerDataService.aantalOngelezenBerichten$;
    public isUpdateBeschikbaar$: Observable<boolean>;

    @ViewChild('avatarContainer', { read: ViewContainerRef }) avatar: ViewContainerRef;
    @ViewChild('feedback', { read: ViewContainerRef, static: true }) feedbackRef: ViewContainerRef;
    @ViewChild('zoeken', { read: ViewContainerRef }) zoekenRef: ViewContainerRef;

    private renderer = inject(Renderer2);

    constructor() {
        this.medewerker$ = this.headerService.medewerker$.pipe(shareReplayLastValue());
        this.heeftBerichtenInzienRecht$ = this.medewerker$.pipe(
            map((medewerker) => medewerker.settings?.heeftBerichtenInzienRecht ?? false)
        );
        this.isCoreReturnUrlSet$ = this.uriService.getCoreReturnUrlSetObservable();

        this.isUpdateBeschikbaar$ = this.headerService.isUpdateBeschikbaar$;

        this.showDarkModeToggle = ['topicusonderwijs.build', 'localhost:4200'].some((omgeving) => window.location.host.includes(omgeving));

        this.ngZone.runOutsideAngular(() => {
            fromEvent(window, 'keydown')
                .pipe(
                    filter(
                        (event: KeyboardEvent) =>
                            (event.ctrlKey && event.code === 'Space' && !document.querySelector('dt-sidebar')) || event.code === 'Escape'
                    ),
                    takeUntilDestroyed()
                )
                .subscribe((event: KeyboardEvent) => {
                    if (event.ctrlKey && event.code === 'Space') {
                        this.ngZone.run(() => {
                            event.preventDefault();
                            this.openZoekenPopup();
                        });
                    }

                    if (event.code === 'Escape') {
                        this.ngZone.run(() => {
                            this.popupService.closePopUp();
                        });
                    }
                });
        });
    }

    toggleDarkMode() {
        document.documentElement.classList.contains('dark')
            ? this.renderer.removeClass(document.documentElement, 'dark')
            : this.renderer.addClass(document.documentElement, 'dark');
    }

    public toggleProfileMenu(heeftUpdate: Optional<boolean>) {
        if (this.isPopupOpen) {
            this.popupService.closePopUp();
            this.isPopupOpen = false;
        } else {
            this.isPopupOpen = true;
            const popupSettings = new PopupSettings();
            popupSettings.showHeader = false;
            popupSettings.showCloseButton = false;
            popupSettings.onCloseFunction = this.onPopUpClose;
            popupSettings.preferedDirection = [PopupDirection.Bottom];

            popupSettings.width = 320;
            popupSettings.appearance = {
                mobile: Appearance.Rollup,
                tabletportrait: Appearance.Popout,
                tablet: Appearance.Popout,
                desktop: Appearance.Popout
            };
            const popup = this.popupService.popup(this.avatar, popupSettings, ProfileMenuPopupComponent);
            popup.isUpdateBeschikbaar = heeftUpdate ?? false;
        }
    }

    onPopUpClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.markForCheck();
    };

    openFeedbackOpties() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 308;

        const popup = this.popupService.popup(this.feedbackRef, popupSettings, FeedbackMenuPopupComponent);
        popup.onFeedbackClick = () => this.openFeedback();
    }

    onSomtodayButtonClicked() {
        this.uriService.navigateToSomtoday();
    }

    openBerichtenSidebar() {
        this.router.navigate([], {
            queryParams: { berichtenSidebar: true },
            queryParamsHandling: 'merge'
        });
    }

    openZoekenPopup() {
        this.popupService.popup(this.zoekenRef, ZoekPopupComponent.defaultPopupSettings, ZoekPopupComponent);
    }

    public openFeedback(): void {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = true;
        popupSettings.title = 'Wat is je ervaring met Somtoday Docent?';
        popupSettings.height = 350;
        popupSettings.width = 700;
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        this.popupService.popup(this.avatar, popupSettings, FeedbackPopupComponent);
    }
}
