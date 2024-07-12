import { Directive, ElementRef, OnInit, Renderer2, inject, input } from '@angular/core';

@Directive({
    selector: '[hmyAddAttribute]',
    standalone: true
})
export class AddAttributeDirective implements OnInit {
    elementRef = inject(ElementRef);
    renderer = inject(Renderer2);

    hmyAddAttribute = input.required<string | undefined>();
    attributeValue = input.required<string | undefined>();

    ngOnInit(): void {
        const attribute = this.hmyAddAttribute();
        const value = this.attributeValue();
        if (attribute && value) {
            this.renderer.setAttribute(this.elementRef.nativeElement, attribute, value);
        }
    }
}
