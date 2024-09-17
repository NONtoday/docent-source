import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    HostBinding,
    inject,
    Input,
    NgZone,
    TemplateRef,
    viewChild,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { InstellingenModalComponent } from '@docent/instellingen-modal/feature-instellingen-modal';
import { IconDirective, ModalService, TooltipDirective } from 'harmony';
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
import { filter } from 'rxjs/operators';
import { VERSION } from 'version-generator';
import { AuthService } from '../../auth';
import { UriService } from '../../auth/uri-service';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { ZoekPopupComponent } from '../../rooster-shared/components/zoek-popup/zoek-popup.component';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { MenuComponent } from '../menu/menu.component';
import { FeedbackMenuPopupComponent } from './feedback-menu-popup/feedback-menu-popup.component';
import { FeedbackPopupComponent } from './feedback-popup/feedback-popup.component';
import { HeaderService } from './header.service';

@Component({
    selector: 'dt-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MenuComponent, CommonModule, TooltipDirective, IconDirective, AvatarComponent, VolledigeNaamPipe, InstellingenModalComponent],
    providers: [provideIcons(IconTelefoon, IconZoeken, IconBericht, IconFeedback, IconWaarschuwing, IconTerugNaarSomtoday)]
})
export class HeaderComponent {
    private popupService = inject(PopupService);
    private uriService = inject(UriService);
    private headerService = inject(HeaderService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private router = inject(Router);
    private modalService = inject(ModalService);
    public authService = inject(AuthService);

    private instellingenModalRef = viewChild.required('instellingenModal', { read: TemplateRef });

    @HostBinding('class.met-navigatie') @Input() metNavigatie = false;
    @Input() titel: string;
    @Input() icon: IconName;

    private ngZone = inject(NgZone);

    public isCoreReturnUrlSet$: Observable<boolean>;
    public aantalOngelezenBerichten$ = this.medewerkerDataService.aantalOngelezenBerichten$;
    public isUpdateBeschikbaar = toSignal(this.headerService.isUpdateBeschikbaar$);

    public medewerker = toSignal(this.medewerkerDataService.getMedewerker());
    public heeftBerichtenInzienRecht = computed(() => this.medewerker()?.settings?.heeftBerichtenInzienRecht ?? false);
    public versie = VERSION;

    @ViewChild('avatarContainer', { read: ViewContainerRef }) avatar: ViewContainerRef;
    @ViewChild('feedback', { read: ViewContainerRef, static: true }) feedbackRef: ViewContainerRef;
    @ViewChild('zoeken', { read: ViewContainerRef }) zoekenRef: ViewContainerRef;

    constructor() {
        this.isCoreReturnUrlSet$ = this.uriService.getCoreReturnUrlSetObservable();

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

    public toggleProfileMenu() {
        this.modalService.modal({
            template: this.instellingenModalRef(),
            settings: { widthModal: '720px', heightModal: '520px', heightRollup: '90%', title: 'Instellingen', contentPadding: 0 }
        });
    }

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
