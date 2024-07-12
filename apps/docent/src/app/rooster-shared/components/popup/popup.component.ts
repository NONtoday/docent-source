import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, OnInit, Renderer2, ViewChild, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgClickOutsideDelayOutsideDirective, NgClickOutsideDirective } from 'ng-click-outside2';
import { filter, take, takeUntil } from 'rxjs/operators';

import { IconDirective } from 'harmony';
import { IconSluiten, provideIcons } from 'harmony-icons';
import { PopupPositionCalculator } from '../../../core/popup/popup-position-calculator';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService } from '../../../core/services/device.service';
import { LifeCycleDirective } from '../../../shared/lifecycle.component';
import { popupAnimation } from './popup.animations';

/** Interface to be implemented by specific PopupComponents. */
export interface Popup {
    /** Needs to have a reference to this component through a @viewChild */
    popup: any;
    /** Determines if the popup may be closed. */
    mayClose(instigator: string): boolean;
}
@Component({
    selector: 'dt-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    animations: [popupAnimation],
    standalone: true,
    imports: [CommonModule, NgClickOutsideDirective, NgClickOutsideDelayOutsideDirective, IconDirective],
    providers: [provideIcons(IconSluiten)]
})
export class PopupComponent extends LifeCycleDirective implements OnInit {
    private _renderer2 = inject(Renderer2);
    private deviceService = inject(DeviceService);
    public elementRef = inject(ElementRef);
    private router = inject(Router);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @HostBinding('@popupAnimation') animation = 'desktop';
    @HostBinding('style.top') top: string;
    @HostBinding('style.left') left: string;
    @HostBinding('style.width') width: string;
    @HostBinding('style.height') height: string;
    @HostBinding('style.position') position: string;
    @HostBinding('style.visibility') visibility: string;
    @HostBinding('style.display') display: string;
    @HostBinding('style.z-index') zIndex: number;
    @HostBinding('class.fixed') fixed: boolean;

    @ViewChild('popup', { static: true }) popupRef: ElementRef;
    @ViewChild('popupHeader') headerRef: ElementRef;
    @ViewChild('popupContent', { static: true }) contentRef: ElementRef;

    private originalTop: number;

    public settings: PopupSettings = new PopupSettings();
    public parent: any = { mayClose: () => true };
    public connectedElement: any;

    public popupAppearance: Appearance;

    @HostListener('window:scroll')
    onscroll() {
        if (this.settings.rerenderOnScroll) {
            this.renderPopup();
        } else if (this.settings.isFixed) {
            const clientHeight = document.body.clientHeight;
            const innerHeight = window.innerHeight;
            const pageYOffset = window.pageYOffset;

            const diff = clientHeight - (innerHeight + pageYOffset);

            if (diff <= this.settings.applicationOffset) {
                this._renderer2.setStyle(
                    this.elementRef.nativeElement,
                    'top',
                    `${this.originalTop - this.settings.applicationOffset + diff}px`
                );
            }
        }
    }

    ngOnInit() {
        super.ngOnInit();
        this.afterContentChecked.pipe(takeUntil(this.onDestroy), take(1)).subscribe(() => {
            this.renderPopup();
        });

        this.router.events
            .pipe(
                filter(() => this.settings.closeOnNavigationStart),
                takeUntil(this.onDestroy)
            )
            .subscribe((event) => {
                if (event instanceof NavigationStart) {
                    this.onClose();
                }
            });
    }

    public renderPopup() {
        this.fixed = this.settings.isFixed;
        if (this.deviceService.isDesktop()) {
            this.popupAppearance = this.settings.appearance.desktop;
        } else if (this.deviceService.isTablet()) {
            this.popupAppearance = this.settings.appearance.tablet;
        } else if (this.deviceService.isTabletPortrait()) {
            this.popupAppearance = this.settings.appearance.tabletportrait;
        } else {
            this.popupAppearance = this.settings.appearance.mobile;
        }

        if (this.popupAppearance === Appearance.Rollup) {
            this.animation = 'mobile';
        } else if (this.popupAppearance === Appearance.Rolldown) {
            this.animation = 'mobile-rolldown';
        }

        setTimeout(() => {
            switch (this.popupAppearance) {
                case Appearance.Fullscreen:
                    this.renderFullscreenPopup();
                    break;
                case Appearance.Window:
                    this.renderWindowPopup();
                    break;
                case Appearance.Popout:
                    this.renderPopout();
                    break;
                case Appearance.Rollup:
                    this.renderRollupPopup();
                    break;
                case Appearance.Rolldown:
                    this.renderRolldownPopup();
            }

            if (this.popupService.isModal(this.settings)) {
                this.popupService.disableScroll(this.contentRef.nativeElement);
            }

            this.visibility = 'visible';
        });
    }

    public renderPopout() {
        if (!this.connectedElement) {
            return;
        }
        this._renderer2.addClass(this.elementRef.nativeElement, 'popup-popout');
        const positionCalculator = new PopupPositionCalculator(this.connectedElement, this.settings, this.popupRef);
        const positionData = positionCalculator.calculatePosition();

        if (this.fixed) {
            const boundings = this.connectedElement.getBoundingClientRect();
            let top = positionData.top;
            if (positionData.direction === PopupDirection.Top) {
                top = boundings.top - positionData.height - this.settings.fixedPopupOffset;
            } else if (positionData.direction === PopupDirection.Bottom) {
                top = (boundings.bottom as number) + this.settings.fixedPopupOffset;
            }
            this._renderer2.setStyle(this.popupRef.nativeElement, 'top', '0px');
            this.top = String(top) + positionData.units!;
            this.originalTop = top;
        } else {
            this._renderer2.setStyle(this.popupRef.nativeElement, 'top', String(positionData.innerTop) + positionData.units!);
            this.top = String(positionData.top) + positionData.units!;
            this.originalTop = positionData.top;
        }

        this._renderer2.setStyle(this.popupRef.nativeElement, 'left', String(positionData.innerLeft) + positionData.units!);
        this.left = String(positionData.left) + positionData.units!;
        this.width = '0';
        this.height = '0';
        this._renderer2.setStyle(this.popupRef.nativeElement, 'width', String(positionData.width) + positionData.units!);
        this.changeDetector.markForCheck();
    }

    public renderWindowPopup() {
        this._renderer2.addClass(this.elementRef.nativeElement, 'popup-window');
        this.addStickyHeader();
    }

    public renderFullscreenPopup() {
        this._renderer2.addClass(this.elementRef.nativeElement, 'popup-full-screen');
        this.addStickyHeader();
    }

    public renderRollupPopup() {
        this._renderer2.addClass(this.elementRef.nativeElement, 'popup-rollup');
    }

    public renderRolldownPopup() {
        this._renderer2.addClass(this.elementRef.nativeElement, 'popup-rolldown');
    }

    addStickyHeader() {
        if (this.settings.showHeader && this.deviceService.isTabletOrDesktop()) {
            const scrollHeight = this.popupRef.nativeElement.scrollHeight;
            if (window.innerHeight < scrollHeight) {
                this._renderer2.addClass(this.popupRef.nativeElement.firstElementChild, 'sticky-header');
            } else {
                this._renderer2.removeClass(this.popupRef.nativeElement.firstElementChild, 'sticky-header');
            }
        }
    }

    showCloseButton() {
        if (this.settings) {
            return this.settings.showCloseButton;
        }
        return true;
    }

    onClose(instigator?: string) {
        if (this.parent.mayClose(instigator)) {
            this.popupService.closePopUp();
        } else {
            const content = this.elementRef.nativeElement.querySelector('.content');
            this._renderer2.setStyle(content, 'border', '2px solid #e87722');
            this._renderer2.setStyle(content, 'border-top', 'none');
        }
    }

    onClickedOutside(e: Event) {
        e.stopPropagation();
        e.preventDefault();
        if (this.settings.clickOutSideToClose) {
            this.onClose('outside');
        }
    }

    @HostListener('window:resize') onResize() {
        this.renderPopup();
    }

    get title() {
        return this.settings.title;
    }
    get headerClass() {
        return this.settings.headerClass;
    }
    get headerIcon() {
        return this.settings.headerIcon;
    }
    get headerLabel() {
        return this.settings.headerLabel;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
