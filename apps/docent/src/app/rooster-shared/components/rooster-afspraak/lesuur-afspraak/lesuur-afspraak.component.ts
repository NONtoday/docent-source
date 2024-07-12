import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { Router } from '@angular/router';
import { TooltipDirective } from 'harmony';
import { IconHuiswerk, IconLesstof, IconToets, IconToetsGroot, IconZwevendItem, provideIcons } from 'harmony-icons';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { HuiswerkType } from '../../../../../generated/_types';
import { RoosterItem, isAfspraak } from '../../../../core/models';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { DeviceService } from '../../../../core/services/device.service';
import { RoosterService } from '../../../../rooster/rooster.service';
import { AfspraakTitelPipe } from '../../../pipes/afspraak-titel.pipe';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../../pipes/roostertoets.pipe';
import { IconComponent } from '../../icon/icon.component';
import { LesuurComponent } from '../../lesuur/lesuur.component';
import { LesplanningPreviewPopupComponent } from '../lesplanning-preview-popup/lesplanning-preview-popup.component';
import { RoosterItemBaseDirective } from '../rooster-item';

@Component({
    selector: 'dt-lesuur-afspraak',
    templateUrl: './lesuur-afspraak.component.html',
    styleUrls: ['./../rooster-item.scss', './lesuur-afspraak.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LesuurComponent, DtDatePipe, IconComponent, AfspraakTitelPipe, RoosterToetsPipe, TooltipDirective],
    providers: [provideIcons(IconLesstof, IconToets, IconToetsGroot, IconHuiswerk, IconZwevendItem)]
})
export class LesuurAfspraakComponent extends RoosterItemBaseDirective implements AfterViewInit, OnChanges, OnDestroy {
    public roosterService = inject(RoosterService);
    private popupService = inject(PopupService);
    private router = inject(Router);
    private deviceService = inject(DeviceService);
    @HostBinding('class.huidige') huidigeAfspraak: boolean;
    @Input() @HostBinding('class.laatste-afspraak') last: boolean;
    @HostBinding('class.borderless') borderless = false;

    @ViewChild('iconToets', { read: ViewContainerRef, static: false }) iconToetsRef: ViewContainerRef;
    @ViewChild('iconHuiswerk', { read: ViewContainerRef, static: false }) iconHuiswerkRef: ViewContainerRef;
    @ViewChild('iconGroteToets', { read: ViewContainerRef, static: false }) iconGroteToetsRef: ViewContainerRef;
    @ViewChild('iconLesstof', { read: ViewContainerRef, static: false }) iconLesstofRef: ViewContainerRef;

    @Input() toonVrijUren: boolean;
    @Input() volgendeRoosterItem: RoosterItem;

    huiswerkType = HuiswerkType;

    private mouseLeaveSubject = new Subject<void>();

    @HostListener('click', ['$event']) onClick(event: MouseEvent) {
        if (!(event.target as Element).classList.contains('zwevend-item-icon')) {
            this.router.navigate(['/rooster/les/' + this.afspraak.id + '/registratie']);
        }
    }

    ngOnChanges(): void {
        this.huidigeAfspraak = this.afspraak?.isNu ?? false;
        this.borderless = this.toonVrijUren && this.volgendeRoosterItem && !isAfspraak(this.volgendeRoosterItem);
    }

    ngAfterViewInit(): void {
        if (this.deviceService.isDesktop()) {
            if (this.iconHuiswerkRef) {
                this.initHover(this.iconHuiswerkRef, HuiswerkType.HUISWERK);
            }

            if (this.iconGroteToetsRef) {
                this.initHover(this.iconGroteToetsRef, HuiswerkType.GROTE_TOETS);
            }

            if (this.iconToetsRef) {
                this.initHover(this.iconToetsRef, HuiswerkType.TOETS);
            }

            if (this.iconLesstofRef) {
                this.initHover(this.iconLesstofRef, HuiswerkType.LESSTOF);
            }
        }
    }

    ngOnDestroy() {
        this.mouseLeaveSubject.next();
        this.mouseLeaveSubject.complete();
    }

    initHover(viewContainerRef: ViewContainerRef, huiswerkType: HuiswerkType) {
        // Eerst subscriben op het mouseleave event zodat de popup sluit wanneer er buiten het icoon wordt gehoverd
        this.cancelHover(viewContainerRef, huiswerkType);

        fromEvent(viewContainerRef.element.nativeElement, 'mouseenter')
            .pipe(debounceTime(300), takeUntil(fromEvent(viewContainerRef.element.nativeElement, 'mouseleave')))
            .subscribe(() => {
                if (this.geenAnderePopupOpen) {
                    this.openPreviewPopup(viewContainerRef, huiswerkType);
                }
            });
    }

    cancelHover(viewContainerRef: ViewContainerRef, huiswerkType: HuiswerkType) {
        fromEvent(viewContainerRef.element.nativeElement, 'mouseleave')
            .pipe(take(1))
            .subscribe((event: MouseEvent) => {
                if (this.popupService.isPopupOpenFor(viewContainerRef)) {
                    const popup = document.getElementsByClassName('popup-content')[0];

                    const viewRect = viewContainerRef.element.nativeElement.getBoundingClientRect();
                    if (popup && viewRect) {
                        this.mouseCloserToPopupHandler(popup, viewContainerRef, event);
                    } else {
                        this.popupService.closePopUp();
                    }
                }

                // Wanneer de popup is gesloten weer een nieuwe subscription starten op de mouseenter,
                // zodat de popup weer geopend wordt wanneer er weer opnieuw gehoverd wordt over het icoon
                this.initHover(viewContainerRef, huiswerkType);
            });
    }

    private mouseCloserToPopupHandler(popup: Element, viewContainerRef: ViewContainerRef, event: MouseEvent) {
        const popupRect = popup.getBoundingClientRect();
        if (this.isCloser(viewContainerRef, popupRect, event)) {
            fromEvent(document, 'mousemove')
                .pipe(takeUntil(this.mouseLeaveSubject))
                .subscribe((e: MouseEvent) => {
                    if (!this.isCloser(viewContainerRef, popupRect, e)) {
                        this.popupService.closePopUp();
                        this.mouseLeaveSubject.next();
                    }
                });
        } else {
            this.popupService.closePopUp();
        }
    }

    private isCloser(viewContainerRef: ViewContainerRef, popupRect: ClientRect, event: MouseEvent): boolean {
        const viewRect = viewContainerRef.element.nativeElement.getBoundingClientRect();
        if (!popupRect) {
            return false;
        }

        if (event.clientY < popupRect.top || event.clientY > popupRect.bottom) {
            return false;
        }

        // Popup links van het element
        if (popupRect.left < viewRect.left) {
            if (event.clientX <= popupRect.right) {
                this.mouseLeaveSubject.next();
                return true;
            }
            return event.clientX <= viewRect.right && event.clientX > popupRect.right;
        } /* Popup rechts van het element */ else {
            if (event.clientX >= popupRect.left) {
                this.mouseLeaveSubject.next();
                return true;
            }
            return event.clientX >= viewRect.left && event.clientX < popupRect.left;
        }
    }

    onZwevendeLesitemsClick(event: any) {
        this.router.navigate(['/rooster/les/' + this.afspraak.id + '/lesplanning'], {
            queryParams: {
                jaar: this.afspraak.jaar,
                week: this.afspraak.week
            }
        });
        this.stopPropagation(event);
    }

    onIconClick(event: any, huiswerkType: HuiswerkType) {
        if (!this.deviceService.isDesktop()) {
            let viewContainerRef: ViewContainerRef;

            if (huiswerkType === HuiswerkType.HUISWERK) {
                viewContainerRef = this.iconHuiswerkRef;
            } else if (huiswerkType === HuiswerkType.GROTE_TOETS) {
                viewContainerRef = this.iconGroteToetsRef;
            } else if (huiswerkType === HuiswerkType.TOETS) {
                viewContainerRef = this.iconToetsRef;
            } else {
                viewContainerRef = this.iconLesstofRef;
            }

            this.openPreviewPopup(viewContainerRef, huiswerkType);
            this.stopPropagation(event);
        } else {
            this.popupService.closePopUp();
            event.stopPropagation();
            this.router.navigate(['/rooster/les/' + this.afspraak.id + '/lesplanning']);
        }
    }

    openPreviewPopup(viewContainerRef: ViewContainerRef, huiswerkType: HuiswerkType) {
        const popupSettings = new PopupSettings();
        popupSettings.width = 240;
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Right, PopupDirection.Left];
        const popup = this.popupService.popup(viewContainerRef, popupSettings, LesplanningPreviewPopupComponent);
        popup.afspraak = this.afspraak;
        popup.huiswerkType = huiswerkType;
    }

    stopPropagation(event: any) {
        if (event) {
            event.stopPropagation();
        }
    }

    get geenAnderePopupOpen(): boolean {
        if (this.popupService.isPopupOpen()) {
            if (this.iconHuiswerkRef) {
                return this.popupService.isPopupOpenFor(this.iconHuiswerkRef);
            }

            if (this.iconGroteToetsRef) {
                return this.popupService.isPopupOpenFor(this.iconGroteToetsRef);
            }

            if (this.iconToetsRef) {
                return this.popupService.isPopupOpenFor(this.iconToetsRef);
            }

            return false;
        }

        return true;
    }
}
