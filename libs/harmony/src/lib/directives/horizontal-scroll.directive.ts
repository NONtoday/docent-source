import { AfterViewInit, Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Directive({
    selector: '[hmyHorizontalScroll]',
    standalone: true
})
export class HorizontalScrollDirective implements AfterViewInit {
    @Input() hideScrollbar = false;
    @Input() allowNormalHorizontalScroll = false;

    private elementRef = inject(ElementRef);
    private touchStartX: number;
    private touchStartY: number;
    private touchMoveX: number;
    private touchMoveY: number;

    constructor() {
        inject(NgZone).runOutsideAngular(() => {
            const element = this.elementRef.nativeElement;
            fromEvent(element, 'wheel')
                .pipe(takeUntilDestroyed())
                .subscribe((event: WheelEvent) => {
                    if (event.deltaX === 0) {
                        event.preventDefault();
                        element.scrollBy({
                            top: 0,
                            left: +event.deltaY,
                            behavior: 'smooth'
                        });
                    }
                    // normale horizontale scroll
                    if (event.deltaY === 0 && this.allowNormalHorizontalScroll) {
                        event.preventDefault();
                        element.scrollBy({
                            top: 0,
                            left: +event.deltaX,
                            behavior: 'smooth'
                        });
                    }
                });

            fromEvent(element, 'touchmove')
                .pipe(takeUntilDestroyed())
                .subscribe((event: TouchEvent) => {
                    this.touchMoveX = event.touches[0].clientX;
                    this.touchMoveY = event.touches[0].clientY;
                    const dx = this.touchStartX - this.touchMoveX;
                    const dy = this.touchStartY - this.touchMoveY;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        event.preventDefault();
                        element.scrollLeft += dx;
                    }
                    this.touchStartX = this.touchMoveX;
                    this.touchStartY = this.touchMoveY;
                });

            fromEvent(element, 'touchstart')
                .pipe(takeUntilDestroyed())
                .subscribe((event: TouchEvent) => {
                    this.touchStartX = event.touches[0].clientX;
                    this.touchStartY = event.touches[0].clientY;
                });
        });
    }

    ngAfterViewInit() {
        if (this.hideScrollbar) {
            this.elementRef.nativeElement.style.overflow = 'hidden';
            // Firefox
            this.elementRef.nativeElement.style.scrollbarWidth = 'none';
            // Chrome, Safari en Opera
            this.elementRef.nativeElement.style['&::-webkit-scrollbar'] = 'display: none';
            // IE en Edge
            this.elementRef.nativeElement.style.msOverflowStyle = 'none';
        }
    }
}
