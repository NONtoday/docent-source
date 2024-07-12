import { Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';

@Directive({
    selector: '[dtTimeInputHelper]',
    standalone: true
})
export class TimeInputHelperDirective implements OnInit {
    private el = inject(ElementRef);

    @HostListener('paste') disallowPaste(e: KeyboardEvent) {
        e.preventDefault();
    }

    ngOnInit() {
        if (this.el.nativeElement.type !== 'time') {
            this.el.nativeElement.onkeypress = (event: KeyboardEvent) => {
                const inputValue: string = this.el.nativeElement.value;

                // Moet een numerieke toets zijn
                if (event.which < 48 || event.which > 57 || inputValue.length > 4) {
                    event.preventDefault();
                }

                // Eerste getal tussen de 0 en de 2
                if (inputValue.length === 0 && (event.which < 48 || event.which > 50)) {
                    event.preventDefault();
                }

                // Wanneer eerste getal een 2 is moet de tweede tussen de 0 en 3 liggen
                if (inputValue.length === 1 && inputValue === '2' && (event.which < 48 || event.which > 51)) {
                    event.preventDefault();
                }

                // Na twee getallen moet er een dubbele punt geplaatst worden
                if (inputValue.length === 2) {
                    this.el.nativeElement.value = `${inputValue}:`;
                }

                // Na drie getallen moet het derde getal tussen de 0 en 5 liggen
                if (inputValue.length === 3 && (event.which < 48 || event.which > 53)) {
                    event.preventDefault();
                }
            };
        }
    }
}
