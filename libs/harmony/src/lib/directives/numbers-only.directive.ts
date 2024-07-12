import { Directive, HostListener, Input } from '@angular/core';

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: 'input[numbersOnly]',
    standalone: true
})
export class NumbersOnlyDirective {
    @Input() additionalAllowedKeys: string[] = [];
    @HostListener('keydown', ['$event'])
    keyDownEvent(e: KeyboardEvent) {
        let allowedKeys = ['Delete', 'Backspace', 'Tab', 'Escape', 'Enter', 'NumLock', 'ArrowLeft', 'ArrowRight', 'End', 'Home'];
        if (this.additionalAllowedKeys.length > 0) {
            allowedKeys = allowedKeys.concat(this.additionalAllowedKeys);
        }
        if (
            allowedKeys.indexOf(e.key) !== -1 ||
            // Allow: Ctrl+A
            (e.key === 'a' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+C
            (e.key === 'c' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+V
            (e.key === 'v' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+X
            (e.key === 'x' && (e.ctrlKey || e.metaKey))
        ) {
            // let it happen, don't do anything
            return;
        }
        if (e.shiftKey || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].indexOf(e.key) === -1) {
            e.preventDefault();
        }
    }
}
