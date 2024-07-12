import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconBookmark, provideIcons } from 'harmony-icons';

@Component({
    selector: 'dt-bookmark-button',
    standalone: true,
    imports: [IconDirective],
    template: `<i [sizes]="iconSizes" hmyIcon="bookmark"></i>`,
    styleUrls: ['./bookmark-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconBookmark)]
})
export class BookmarkButtonComponent implements OnChanges {
    private elementRef = inject(ElementRef);

    @HostBinding('class.is-active') @Input() active = false;
    @Input() iconSizes: IconSize[] = ['small'];
    @Input() size: string;

    ngOnChanges() {
        if (this.size) {
            this.elementRef.nativeElement.style.setProperty('--size', this.size + 'px');
        }
    }
}
