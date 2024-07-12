import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { IconDirective, OverlayService, createPopupSettings } from 'harmony';
import { IconOnderwijs, IconTaart, IconVideo, provideIcons } from 'harmony-icons';
import { LazyLoadImageModule, StateChange } from 'ng-lazyload-image';
import { DeviceService } from '../../../core/services/device.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { Optional } from '../../utils/utils';
import { PasfotoPopupComponent } from './pasfoto-popup/pasfoto-popup.component';

@Component({
    selector: 'dt-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgClass, TooltipDirective, LazyLoadImageModule, IconDirective],
    providers: [provideIcons(IconTaart, IconVideo, IconOnderwijs)]
})
export class AvatarComponent implements OnChanges {
    private overlayService = inject(OverlayService);
    private changeDetector = inject(ChangeDetectorRef);
    private deviceService = inject(DeviceService);
    public static readonly defaultsize = 38;
    public static readonly defaultfontsize = 14;
    public static readonly defaultbordersize = 0;

    @HostBinding('class.circle') @Input() circle = true;
    @HostBinding('class.online-les-deelname') @Input() public toonOnlineIcoon = false;

    @Input() public src: string | null | undefined;
    @Input() public initialen: string;
    @Input() public allowPhotoPopup = true;
    @Input() public size: Optional<number> = AvatarComponent.defaultsize;
    @Input() public fontsize: Optional<number> = AvatarComponent.defaultfontsize;
    @Input() public bordersize = AvatarComponent.defaultbordersize;
    @Input() public toonJarigIcoon = false;
    @Input() public toonMentorIcoon = false;
    @Input() public altTag = '';
    @Input() public heeftNotificatie = false;
    @Input() public notificatieTooltip: string;
    @Input() public lazyLoaded = true;
    @Input() public offsetOverlayTop: boolean;

    @ViewChild('foto', { read: ViewContainerRef }) fotoRef: ViewContainerRef;
    @ViewChild('initialsRef', { read: ViewContainerRef }) initialenContainerRef: ViewContainerRef;
    @ViewChild('fotoContainer', { read: ViewContainerRef }) fotoContainerRef: ViewContainerRef;

    public loaded = false;

    doneLoading(event: StateChange) {
        if (event.reason === 'loading-succeeded') {
            this.loaded = true;
            this.changeDetector.detectChanges();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['src']) {
            this.loaded = false;
        }
    }

    get magPopupOpenen(): boolean {
        return this.circle && !!this.src && this.allowPhotoPopup;
    }

    @HostListener('mouseover') onMouseOver() {
        if (this.magPopupOpenen && this.deviceService.isDesktop() && !this.overlayService.isOpen(this.fotoRef)) {
            this.openPopup();
        }
    }

    @HostListener('mouseleave') onMouseLeave() {
        if (this.magPopupOpenen && this.deviceService.isDesktop()) {
            this.overlayService.close(this.fotoRef);
        }
    }

    @HostListener('click', ['$event']) onClick(event: MouseEvent) {
        if (this.magPopupOpenen && !this.deviceService.isDesktop()) {
            event.stopPropagation();
            this.openPopup();
        }
    }

    openPopup() {
        this.overlayService.popupOrModal(
            PasfotoPopupComponent,
            this.fotoRef,
            { src: this.src! },
            createPopupSettings({ animation: 'fade', width: '104px', position: 'right' })
        );
    }
}
