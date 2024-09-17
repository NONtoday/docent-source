import { CommonModule } from '@angular/common';
import { ApplicationRef, Component, HostBinding, OnDestroy, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Afspraak } from '@docent/codegen';
import { IconDirective, PillComponent } from 'harmony';
import {
    IconChevronRechts,
    IconGroepAlt,
    IconHamburger,
    IconHelp,
    IconInleveropdrachtFilled,
    IconNotitieboek,
    IconResultaten,
    IconRooster,
    IconSluiten,
    IconSomtoday,
    IconStudiewijzer,
    IconTerugNaarSomtoday,
    provideIcons
} from 'harmony-icons';
import { Observable, Subject, identity } from 'rxjs';
import { filter, first, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { UriService } from '../../auth/uri-service';
import { PopupOpenDirective } from '../../core/popup/popup-open.directive';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekMenuPopupComponent } from '../../notitieboek/notitieboek-menu-popup/notitieboek-menu-popup.component';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { RoosterDataService } from '../../rooster/rooster-data.service';
import { HeaderService } from '../header/header.service';
import { WhatsnewComponent } from '../header/whatsnew/whatsnew.component';
import { BaseMenu } from './base-menu';
import { MentorleerlingenPopupComponent } from './mentorleerlingen-popup/mentorleerlingen-popup.component';
import { MenuService } from './menu.service';
import { ResultaatMenuPopupComponent } from './resultaat-menu-popup/resultaat-menu-popup.component';
import { RoosterSubmenuComponent } from './rooster-submenu/rooster-submenu.component';

@Component({
    selector: 'dt-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TooltipDirective,
        WhatsnewComponent,
        RoosterSubmenuComponent,
        HeeftRechtDirective,
        PopupOpenDirective,
        IconDirective,
        PillComponent
    ],
    providers: [
        provideIcons(
            IconHamburger,
            IconSomtoday,
            IconSluiten,
            IconRooster,
            IconChevronRechts,
            IconStudiewijzer,
            IconInleveropdrachtFilled,
            IconResultaten,
            IconNotitieboek,
            IconGroepAlt,
            IconTerugNaarSomtoday,
            IconHelp
        )
    ]
})
export class MenuComponent extends BaseMenu implements OnDestroy {
    private roosterDataService = inject(RoosterDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild('resultaten', { read: ViewContainerRef }) resultatenContainerRef: ViewContainerRef;
    @ViewChild('mentorleerlingen', { read: ViewContainerRef }) mentorleerlingenRef: ViewContainerRef;
    private router = inject(Router);
    private uriService = inject(UriService);
    private popupService = inject(PopupService);
    private headerService = inject(HeaderService);
    private appRef = inject(ApplicationRef);
    @ViewChild('notitieboek', { read: ViewContainerRef }) notitieboekRef: ViewContainerRef;

    @HostBinding('class.is-open') menuOpen: boolean;

    public afspraken$: Observable<Afspraak[]>;
    public vandaag = new Date();
    public menuState: Map<string, boolean>;
    public heeftToegangTotEloEnSw$: Observable<boolean>;
    public heeftMentordashboardToegang$: Observable<boolean>;
    public heeftNotitieboekToegang$: Observable<boolean>;

    public mentordashboardPopupOpen = false;
    public notitieboekPopupOpen = false;
    public heeftOngelezenNotitie: boolean;
    public isTestEnvironment = false;

    private unsubscribe: Subject<void> = new Subject<void>();

    constructor() {
        const menuService = inject(MenuService);
        const deviceService = inject(DeviceService);

        super(menuService, deviceService);

        this.isTestEnvironment = this.uriService.isTestEnvironment();
        this.afspraken$ = this.roosterDataService.getRoosterAfsprakenVanDag(this.vandaag);
        this.heeftToegangTotEloEnSw$ = this.medewerkerDataService.heeftToegangTotEloEnSw();
        this.heeftMentordashboardToegang$ = this.medewerkerDataService.heeftMentordashboardToegang();
        this.heeftNotitieboekToegang$ = this.medewerkerDataService.heeftNotitieboekToegang();
        this.menuService.menuStateChanges.pipe(takeUntil(this.unsubscribe)).subscribe((newMenuState) => {
            this.menuState = newMenuState;
            this.menuOpen = this.menuState.get('Main') ?? false;
        });

        this.heeftNotitieboekToegang$.pipe(take(1), filter(identity)).subscribe(() => {
            const heeftOngelezenNotitieQuery$ = this.headerService.heeftOngelezenNotitieQuery$;

            // start polling als de applicatie er klaar voor is.
            this.appRef.isStable
                .pipe(
                    first((isStable) => isStable === true),
                    switchMap(() => heeftOngelezenNotitieQuery$.valueChanges),
                    map((result) => result.data.ongelezenNotitiesAanwezig)
                )
                .subscribe((heeftOngelezenNotitie) => {
                    this.heeftOngelezenNotitie = heeftOngelezenNotitie;
                    if (heeftOngelezenNotitie) {
                        heeftOngelezenNotitieQuery$.stopPolling();
                    } else {
                        heeftOngelezenNotitieQuery$.startPolling(1000 * 60 * 15);
                    }
                });
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    openResultatenQuickNavPopup() {
        this.closeMenu('Main');
        if (!this.popupService.isPopupOpenFor(this.resultatenContainerRef)) {
            const settings = ResultaatMenuPopupComponent.defaultPopupSettings;
            this.popupService.popup(this.resultatenContainerRef, settings, ResultaatMenuPopupComponent);
        }
    }

    openMentordashboardQuickNavPopup() {
        this.closeMenu('Main');
        if (!this.popupService.isPopupOpenFor(this.mentorleerlingenRef)) {
            this.mentordashboardPopupOpen = true;
            const settings = MentorleerlingenPopupComponent.defaultPopupSettings;
            settings.onCloseFunction = () => (this.mentordashboardPopupOpen = false);
            this.popupService.popup(this.mentorleerlingenRef, settings, MentorleerlingenPopupComponent);
        }
    }

    openNotitieboekQuickNavPopup() {
        this.closeMenu('Main');
        if (!this.popupService.isPopupOpenFor(this.notitieboekRef)) {
            this.notitieboekPopupOpen = true;
            const settings = NotitieboekMenuPopupComponent.defaultPopupSettings;
            settings.onCloseFunction = () => (this.notitieboekPopupOpen = false);
            this.popupService.popup(this.notitieboekRef, settings, NotitieboekMenuPopupComponent);
        }
    }

    isRouterLinkActive(item: string): boolean {
        return this.router.isActive(item, false);
    }

    onClick(menu: string, link: string) {
        if (this.deviceService.isDesktop()) {
            this.router.navigate([link]);
        }
        super.openMenu(menu);
    }

    onHomeClicked() {
        this.router.navigate(['rooster']);
        this.closeMenu('Main');
    }

    naarSomtoday() {
        this.uriService.navigateToSomtoday();
    }

    openInleveropdrachtenDeeplink() {
        window.location.assign(this.uriService.getDeepLinkUrl('/inleverperiodes'));
    }

    get isCoreUriSet() {
        return this.uriService.isCoreReturnUrlSet();
    }
}
