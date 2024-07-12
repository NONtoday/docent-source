import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Renderer2,
    inject,
    output
} from '@angular/core';
import { slideInRightOnEnterAnimation, slideOutRightOnLeaveAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconName, IconSluiten, provideIcons } from 'harmony-icons';
import { negate } from 'lodash-es';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MaskService } from '../../../core/services/mask.service';
import { Optional } from '../../utils/utils';
import { AvatarComponent } from '../avatar/avatar.component';

export const sidebarMaskId = 'sidebar-mask';
export interface SidebarAvatar {
    url: Optional<string>;
    initialen: string;
}

@Component({
    selector: 'dt-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInRightOnEnterAnimation({ duration: 300, delay: 0 }), slideOutRightOnLeaveAnimation({ duration: 300, delay: 0 })],
    standalone: true,
    imports: [NgClass, AvatarComponent, IconDirective],
    providers: [provideIcons(IconSluiten)]
})
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
    private maskservice = inject(MaskService);
    private renderer = inject(Renderer2);
    @HostBinding('@slideInRightOnEnter') private animationIn: boolean;
    @HostBinding('@slideOutRightOnLeave') private animationOut: boolean;
    @HostBinding('@.disabled') disableAnimation = false;

    // slide de sidebar buiten beeld, bv bij slepen van methodes
    @Input() @HostBinding('class.verborgen') public hideSidebar = false;
    @Input() @HostBinding('class.display') public display = true;
    @Input() public icon: Optional<IconName>;
    @Input() public title: Optional<string>;
    @Input() public maskId: string;
    @Input() public mask = true;
    @Input() public disableScrolling = true;
    @Input() public iconClickable: Optional<boolean> = false;
    @Input() public titleClickable = false;
    @Input() public showHeader = true;
    @Input() public avatar: SidebarAvatar;

    public onMaskClick = output<void>();
    public onCloseClick = output<void>();
    public onIconClick = output<void>();
    public onTitleClick = output<void>();

    public isClosed = false;

    private unsubscribe = new Subject<void>();

    constructor() {
        if (document.querySelectorAll('dt-sidebar').length > 0) {
            this.disableAnimation = true;
        }
    }

    ngOnInit() {
        if (this.disableScrolling) {
            this.renderer.addClass(window.document.body, 'disable-vertical-scrolling');
        }

        if (this.mask) {
            this.maskservice.showMask(sidebarMaskId);
            this.maskservice.onClick$
                .pipe(
                    filter((maskId) => maskId === sidebarMaskId),
                    takeUntil(this.unsubscribe)
                )
                .subscribe(() => {
                    this.onMaskClick.emit();
                });
        }
    }

    ngOnChanges(): void {
        if (this.mask) {
            this.hideSidebar ? this.maskservice.removeMask(sidebarMaskId) : this.maskservice.showMask(sidebarMaskId);
        }
    }

    iconClick() {
        if (this.iconClickable) {
            this.onIconClick.emit();
        }
    }

    titleClick() {
        if (this.titleClickable) {
            this.onTitleClick.emit();
        }
    }

    close() {
        this.onCloseClick.emit();
    }

    isLaatsteSidebar() {
        const sidebars = Array.from(document.querySelectorAll('dt-sidebar'));
        const nietAnimerendeSidebars = sidebars.filter(negate(this.isAnimating));

        return nietAnimerendeSidebars.length < 1;
    }

    ngOnDestroy() {
        if (this.isLaatsteSidebar()) {
            this.renderer.removeClass(window.document.body, 'disable-vertical-scrolling');
            this.maskservice.removeMask(sidebarMaskId, true);
        }

        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    private isAnimating = (sidebar: Element) =>
        sidebar.classList.contains('ng-animate-queued') || sidebar.classList.contains('ng-animating');
}
