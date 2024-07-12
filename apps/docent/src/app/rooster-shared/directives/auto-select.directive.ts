import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
    selector: '[dtAutoSelect]',
    standalone: true
})
export class AutoSelectDirective implements AfterViewInit {
    private el = inject(ElementRef);
    // Het kan zijn dat je de autoSelect via ts uit wil kunnen zetten (denk aan gedeelde componenten).
    // Deze input zorgt ervoor dat dat mogelijk is.
    // Zie inline-edit.component.html voor een voorbeeld.
    @Input() autoSelect = true;

    ngAfterViewInit() {
        if (this.autoSelect) {
            // setTimeout for chrome
            setTimeout(() => {
                this.el.nativeElement.select();
            }, 50);
        }
    }
}
