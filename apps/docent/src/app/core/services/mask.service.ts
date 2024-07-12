import { ElementRef, Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MaskService {
    public onClick$: Observable<string>;

    private renderer: Renderer2;
    private clickSubject = new Subject<string>();

    private fadeDuration = 300;
    private readonly class = 'mask-overlay';

    constructor() {
        const rendererFactory = inject(RendererFactory2);

        this.renderer = rendererFactory.createRenderer(null, null);
        this.onClick$ = this.clickSubject.asObservable();
    }

    public showMask(maskId: string, styles?: CSSStyleDeclaration, parent?: ElementRef) {
        if (!document.getElementById(maskId)) {
            const maskElement = this.renderer.createElement('div');
            this.renderer.addClass(maskElement, this.class);
            this.renderer.setAttribute(maskElement, 'id', maskId);

            this.setDefaultStyles(maskElement);
            if (styles) {
                this.setCustomStyles(maskElement, styles);
            }

            this.renderer.listen(maskElement, 'click', () => this.clickSubject.next(maskId));

            this.renderer.appendChild(parent ? parent.nativeElement : document.body, maskElement);

            setTimeout(() => {
                this.fadeIn(maskElement, styles?.opacity);
            }, 0);
        }
    }

    public removeMask(maskId: string, instantRemoval?: boolean) {
        const maskElement = document.getElementById(maskId);
        if (maskElement) {
            if (instantRemoval) {
                this.renderer.removeChild(document.body, maskElement);
                return;
            }

            this.fadeOut(maskElement);
            setTimeout(() => {
                this.renderer.removeChild(document.body, maskElement);
            }, this.fadeDuration);
        }
    }

    private fadeIn(maskElement: HTMLElement, opacity = '100') {
        this.renderer.setStyle(maskElement, 'opacity', opacity);
    }

    private fadeOut(maskElement: HTMLElement) {
        this.renderer.setStyle(maskElement, 'opacity', '0');
    }

    private setDefaultStyles(maskElement: HTMLElement) {
        this.renderer.setStyle(maskElement, 'opacity', '0');
        this.renderer.setStyle(maskElement, 'transition', `opacity ${this.fadeDuration}ms`);
        this.renderer.setStyle(maskElement, 'top', '0');
        this.renderer.setStyle(maskElement, 'bottom', '0');
        this.renderer.setStyle(maskElement, 'left', '0');
        this.renderer.setStyle(maskElement, 'right', '0');
        this.renderer.setStyle(maskElement, 'position', 'fixed');
        this.renderer.setStyle(maskElement, 'zIndex', '97');
        this.renderer.setStyle(maskElement, 'backgroundColor', 'var(--bg-mask-normal)');
    }

    private setCustomStyles(maskElement: HTMLElement, styles: CSSStyleDeclaration) {
        if (styles) {
            Object.keys(styles).forEach((key) => this.renderer.setStyle(maskElement, key, styles[key as keyof typeof styles]));
        }
    }
}
