import { AfterViewInit, DestroyRef, Directive, Injector, Signal, ViewContainerRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as anime from 'animejs/lib/anime.js';
import { injectHover } from 'ngxtension/gestures';
import { fromEvent, map, merge } from 'rxjs';
import { FloatingScrollButtonComponent } from '../floating-scroll-button/floating-scroll-button.component';
import { injectCanScrollHorizontal } from '../inject-can-scroll';

@Directive({
    selector: '[hmyHorizontalScrollButtons]',
    standalone: true
})
export class HorizontalScrollButtonsDirective implements AfterViewInit {
    private readonly floatingButtonHeight = 24;
    private readonly destroyRef = inject(DestroyRef);
    viewContainerRef = inject(ViewContainerRef);
    injector = inject(Injector);

    paddingLeft = input<number>(16);
    paddingRight = input<number>(16);
    topOffset = input<number>(0);
    zIndex = input<number>(1);
    scrollOffset = input<number>(250);

    canScrollLeft: Signal<boolean> | undefined;
    canScrollRight: Signal<boolean> | undefined;
    isHovering = signal(false);

    ngAfterViewInit(): void {
        [this.canScrollLeft, this.canScrollRight] = injectCanScrollHorizontal(this.injector);

        const links = this.viewContainerRef.createComponent(FloatingScrollButtonComponent);
        const rechts = this.viewContainerRef.createComponent(FloatingScrollButtonComponent);
        links.setInput('richting', 'links');
        rechts.setInput('richting', 'rechts');
        // zodat de IconDirective wordt geinit in FloatingScrollButtonComponent
        rechts.changeDetectorRef.detectChanges();

        const styleLeft = links.location.nativeElement.style;
        const styleRight = rechts.location.nativeElement.style;

        this.viewContainerRef.element.nativeElement.prepend(links.location.nativeElement);
        this.viewContainerRef.element.nativeElement.appendChild(rechts.location.nativeElement);

        this.viewContainerRef.element.nativeElement.style.position = 'relative';
        styleLeft.top = `calc(50% - ${this.floatingButtonHeight / 2 - this.topOffset()}px)`;
        styleRight.top = `calc(50% - ${this.floatingButtonHeight / 2 - this.topOffset()}px)`;
        styleLeft.left = `${this.paddingLeft()}px`;
        styleRight.right = `${this.paddingRight()}px`;
        styleLeft.position = 'sticky';
        styleRight.position = 'sticky';
        styleLeft.zIndex = this.zIndex();
        styleRight.zIndex = this.zIndex();

        effect(
            () => {
                this.isHovering() && this.canScrollLeft?.() ? this.show(styleLeft) : this.hide(styleLeft);
                this.isHovering() && this.canScrollRight?.() ? this.show(styleRight) : this.hide(styleRight);
            },
            { injector: this.injector }
        );

        injectHover(
            ({ hovering }) => {
                this.isHovering.set(!!hovering);
            },
            { injector: this.injector, zoneless: true }
        );

        const scrollLeft$ = fromEvent(links.location.nativeElement, 'click').pipe(
            map(() => [-this.scrollOffset(), links.location.nativeElement])
        );
        const scrollRight$ = fromEvent(rechts.location.nativeElement, 'click').pipe(
            map(() => [this.scrollOffset(), rechts.location.nativeElement])
        );

        merge(scrollLeft$, scrollRight$)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(([scroll, element]) => {
                anime({
                    targets: element,
                    keyframes: [{ translateY: 2 }, { translateY: 0 }],
                    duration: 150,
                    easing: 'linear'
                });
                this.viewContainerRef.element.nativeElement.scrollBy({
                    left: scroll,
                    behavior: 'smooth'
                });
            });
    }

    hide = (style: CSSStyleDeclaration) => {
        style.pointerEvents = 'none';
        style.opacity = '0';
    };

    show = (style: CSSStyleDeclaration) => {
        style.pointerEvents = 'auto';
        style.opacity = '1';
    };
}
