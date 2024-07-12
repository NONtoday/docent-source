import {
    ApplicationRef,
    ComponentFactoryResolver,
    ComponentRef,
    EmbeddedViewRef,
    inject,
    Injectable,
    Renderer2,
    RendererFactory2,
    Type,
    ViewContainerRef
} from '@angular/core';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../rooster-shared/utils/utils';
import { DeviceService } from '../services/device.service';
import { MaskService } from '../services/mask.service';
import { PopupStateService } from '../services/popup-state.service';
import { Appearance, PopupSettings } from './popup.settings';

@Injectable({
    providedIn: 'root'
})
export class PopupService {
    private factoryResolver = inject(ComponentFactoryResolver);
    private maskService = inject(MaskService);
    private appRef = inject(ApplicationRef);
    private device = inject(DeviceService);
    private popupComponent: Optional<ComponentRef<any>>;
    private _renderer: Renderer2;
    private popupStateService = inject(PopupStateService);

    constructor() {
        const rendererFactory = inject(RendererFactory2);

        this._renderer = rendererFactory.createRenderer(null, null);
    }

    popup<T extends Popup>(connectedComponent: ViewContainerRef, popupSettings: PopupSettings, component: Type<T>): T {
        this.closePopUp();

        const factory = this.factoryResolver.resolveComponentFactory(component);
        this.popupComponent = factory.create(connectedComponent.injector);
        this.popupStateService.openPopup$.next(connectedComponent);

        const popup = this.popupComponent.instance.popup;

        popup.settings = popupSettings;
        popup.parent = this.popupComponent.instance;
        popup.visibility = 'hidden';

        popup.connectedElement = connectedComponent.element.nativeElement;

        if (this.isModal(popupSettings)) {
            this.maskService.showMask(this.maskId, {
                color: popupSettings.overlayColor,
                zIndex: '100'
            } as CSSStyleDeclaration);
        }
        if (popupSettings.appendAsChild) {
            this.appendComponentAsChild(this.popupComponent, connectedComponent);
        } else if (popupSettings.appendInChildSelector) {
            this.appendInChildSelector(this.popupComponent, popupSettings.appendInChildSelector);
        } else {
            this.appendComponentToBody(this.popupComponent);
        }

        return this.popupComponent.instance;
    }

    public closePopUp(instantMaskRemoval?: boolean) {
        if (this.isPopupOpen()) {
            const popupComponent: PopupComponent = this.popupComponent!.instance.popup;
            popupComponent.settings.onCloseFunction?.();
            this._renderer.removeClass(popupComponent.elementRef.nativeElement, 'popup-full-screen');
            this._renderer.removeClass(popupComponent.elementRef.nativeElement, 'popup-window');
            this._renderer.removeClass(popupComponent.elementRef.nativeElement, 'popup-popout');
            this._renderer.removeClass(popupComponent.elementRef.nativeElement, 'popup-rollup');
            this._renderer.removeClass(popupComponent.elementRef.nativeElement, 'popup-rolldown');

            this.enableScroll();

            this.maskService.removeMask(this.maskId, instantMaskRemoval);
            this.popupComponent!.destroy();
            this.popupComponent = null;
            this.popupStateService.openPopup$.next(null);
        }
    }

    public enableScroll() {
        clearAllBodyScrollLocks();

        const menu = document.querySelector('dt-menu');
        if (menu) {
            this._renderer.setStyle(menu, 'top', '0px');
        }
    }

    public disableScroll(excludedElement: HTMLElement | Element) {
        disableBodyScroll(excludedElement, {
            allowTouchMove: () => true
        });
        if (document.querySelector('dt-menu')) {
            this._renderer.setStyle(document.querySelector('dt-menu'), 'top', '0px');
        }
    }

    public isPopupOpenFor(connectedComponent: ViewContainerRef): boolean {
        return !!this.popupComponent && this.popupComponent.instance.popup.connectedElement === connectedComponent.element.nativeElement;
    }

    public isPopupOpen(): boolean {
        return !!this.popupComponent;
    }

    public isModal(popupSettings: PopupSettings) {
        let appearance: Appearance;
        if (this.device.isDesktop()) {
            appearance = popupSettings.appearance.desktop;
        } else if (this.device.isTablet()) {
            appearance = popupSettings.appearance.tablet;
        } else if (this.device.isTabletPortrait()) {
            appearance = popupSettings.appearance.tabletportrait;
        } else {
            appearance = popupSettings.appearance.mobile;
        }

        switch (appearance) {
            case Appearance.Fullscreen:
            case Appearance.Popout:
                return false;
        }
        return true;
    }

    private appendComponentAsChild(componentRef: any, connectedComponent: ViewContainerRef) {
        // Attach component to the appRef so that it's inside the ng component tree
        this.appRef.attachView(componentRef.hostView);
        // Get DOM element from component
        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

        this._renderer.setStyle(domElem, 'display', 'contents');
        this._renderer.appendChild(connectedComponent.element.nativeElement, domElem);
    }

    private appendInChildSelector(componentRef: any, selector: string) {
        // Attach component to the appRef so that it's inside the ng component tree
        this.appRef.attachView(componentRef.hostView);

        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
        // Append DOM element
        this._renderer.appendChild(document.querySelector(selector), domElem);
    }

    private appendComponentToBody(componentRef: any) {
        // Attach component to the appRef so that it's inside the ng component tree
        this.appRef.attachView(componentRef.hostView);

        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
        // Append DOM element
        this._renderer.appendChild(document.body, domElem);
    }

    private get maskId(): string {
        return this.popupComponent ? `mask-${this.popupComponent.componentType.name.toLowerCase()}` : 'popup-mask';
    }
}
