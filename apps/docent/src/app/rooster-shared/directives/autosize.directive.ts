import { AfterViewInit, Directive, DoCheck, ElementRef, HostBinding, HostListener, Input, Renderer2, inject } from '@angular/core';
/**
 * https://github.com/evseevdev/ngx-textarea-autosize/blob/master/lib/src/autosize.directive.ts
 *
 * gekopieerd omdat de package niet geupdate werd van view engine naar ivy. View engine librarys werken niet meer vanaf v16
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: 'textarea[autosize]',
    standalone: true
})
export class AutosizeDirective implements AfterViewInit, DoCheck {
    private elem = inject(ElementRef);
    private renderer = inject(Renderer2);
    @HostBinding('style.overflow')
    public overflow = 'hidden';

    @Input()
    @HostBinding('rows')
    public rows = 1;

    public ngAfterViewInit() {
        this.resize();
    }

    public ngDoCheck() {
        this.resize();
    }

    @HostListener('input')
    private resize() {
        const textarea = this.elem.nativeElement as HTMLTextAreaElement;
        // Calculate border height which is not included in scrollHeight
        const borderHeight = textarea.offsetHeight - textarea.clientHeight;
        // Reset textarea height to auto that correctly calculate the new height
        this.setHeight('auto');
        // Set new height
        this.setHeight(`${textarea.scrollHeight + borderHeight}px`);
    }

    private setHeight(value: string) {
        this.renderer.setStyle(this.elem.nativeElement, 'height', value);
    }
}
