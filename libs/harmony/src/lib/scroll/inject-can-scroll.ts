import { ElementRef, Injector, Signal, inject, signal } from '@angular/core';
import { injectScroll } from 'ngxtension/gestures';

export function injectCanScrollHorizontal(injector?: Injector): [Signal<boolean>, Signal<boolean>] {
    const elementRef = injector ? injector.get(ElementRef) : inject(ElementRef);

    const canScroll = elementRef.nativeElement.scrollWidth > elementRef.nativeElement.clientWidth;
    const canScrollLeft = canScroll && elementRef.nativeElement.scrollLeft > 0;
    const canScrollRight =
        canScroll && elementRef.nativeElement.scrollLeft < elementRef.nativeElement.scrollWidth - elementRef.nativeElement.clientWidth;

    const canScrollLeftSignal = signal(canScrollLeft);
    const canScrollRightSignal = signal(canScrollRight);

    injectScroll(
        ({ xy: [x] }) => {
            canScrollLeftSignal.set(x > 0);
            canScrollRightSignal.set(x < elementRef.nativeElement.scrollWidth - elementRef.nativeElement.clientWidth);
        },
        { zoneless: true, injector }
    );

    return [canScrollLeftSignal.asReadonly(), canScrollRightSignal.asReadonly()];
}
