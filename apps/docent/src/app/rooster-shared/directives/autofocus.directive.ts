import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
    selector: '[dtAutofocus]',
    standalone: true
})
export class AutofocusDirective implements AfterViewInit {
    private el = inject(ElementRef);
    // Het kan zijn dat je de autofocus via ts uit wil kunnen zetten (denk aan gedeelde componenten).
    // Deze input zorgt ervoor dat dat mogelijk is.
    // Zie inline-edit.component.html voor een voorbeeld.
    @Input() autoFocus = true;

    ngAfterViewInit() {
        if (this.autoFocus) {
            // setTimeout for chrome
            setTimeout(() => {
                this.el.nativeElement.focus();
            }, 50);
        }
    }
}
