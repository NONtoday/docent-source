import { Component, HostBinding, HostListener, Input, OnInit, inject, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconBewerken, IconPijlBoven, provideIcons } from 'harmony-icons';
import { DeviceService } from '../../../core/services/device.service';

@Component({
    selector: 'dt-back-to-top',
    templateUrl: './back-to-top.component.html',
    styleUrls: ['./back-to-top.component.scss'],
    standalone: true,
    imports: [IconDirective],
    providers: [provideIcons(IconBewerken, IconPijlBoven)]
})
export class BackToTopComponent implements OnInit {
    private deviceService = inject(DeviceService);
    @HostBinding('class.shown') public isShown: boolean;
    @HostBinding('style.bottom') @Input() public paddingBottom = '10px';
    @HostBinding('class.met-edit-state') @Input() public metEditState: boolean;
    @HostBinding('class.verberg-back-to-top') public verbergBackToTop = true;

    @Input() public showAfter: number;

    editClicked = output<void>();

    ngOnInit() {
        this.onWindowScroll();
    }

    @HostListener('window:scroll', []) onWindowScroll() {
        const currentScroll = window.pageYOffset;
        if (this.metEditState) {
            this.verbergBackToTop = currentScroll < this.showAfter;
        } else {
            this.verbergBackToTop = false;
            this.isShown = !this.deviceService.isDesktop() && currentScroll > this.showAfter;
        }
    }

    @HostListener('click', []) onClick() {
        window.scrollBy({ left: 0, top: -window.pageYOffset, behavior: 'smooth' });
        return false;
    }

    onEditClick() {
        this.editClicked.emit();
    }
}
