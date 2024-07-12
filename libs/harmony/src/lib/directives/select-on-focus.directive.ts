import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { DeviceService } from '../services/device.service';

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: 'input[selectOnFocus]',
    standalone: true
})
export class SelectOnFocusDirective implements OnInit, OnDestroy {
    private deviceService = inject(DeviceService);
    private elementRef: ElementRef<HTMLInputElement> = inject(ElementRef);
    private listener?: () => void;

    ngOnInit(): void {
        // only select input content on desktop
        if (this.deviceService.isDesktop()) {
            this.listener = () => this.elementRef.nativeElement.select();
            this.elementRef.nativeElement.addEventListener('focus', this.listener);
        }
    }

    ngOnDestroy(): void {
        if (this.listener) {
            this.elementRef.nativeElement.removeEventListener('focus', this.listener);
        }
    }
}
