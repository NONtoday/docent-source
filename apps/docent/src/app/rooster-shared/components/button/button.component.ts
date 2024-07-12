import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, ViewChild, ViewContainerRef, output } from '@angular/core';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconChevronOnder, provideIcons } from 'harmony-icons';
import { Optional } from '../../utils/utils';

type ButtonType = 'positive' | 'primary';

@Component({
    selector: 'dt-button, button',
    template: `
        <span class="text text-content-semi">
            @if (showLoaderOnClick && buttonClicked) {
                <hmy-spinner [isWhite]="true" />
            }
            @if (!buttonClicked || !showLoaderOnClick) {
                <ng-content></ng-content>
            }
        </span>
        @if (showAddButton) {
            <div class="add-button" (click)="onAddClick($event)">
                <i #addIcon hmyIcon="chevronOnder" size="small"></i>
            </div>
        }
    `,
    styleUrls: ['./button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SpinnerComponent, IconDirective],
    providers: [provideIcons(IconChevronOnder)]
})
export class ButtonComponent {
    @ViewChild('addIcon', { read: ViewContainerRef }) addIcon: ViewContainerRef;
    @Input() @HostBinding('attr.soort') buttonType: ButtonType = 'positive';
    @Input() @HostBinding('class.disabled') disabled: Optional<boolean>;
    @Input() @HostBinding('class.icon-only') iconOnly: Optional<boolean>;
    @Input() @HostBinding('class.with-add-button') showAddButton: Optional<boolean> = false;
    @Input() showLoaderOnClick = false;
    @Input() buttonClicked = false;
    addClick = output<ViewContainerRef>();

    @HostListener('click')
    public onClick() {
        if (!this.disabled) {
            this.buttonClicked = true;
        }
    }

    onAddClick(event: Event) {
        event.preventDefault();
        this.addClick.emit(this.addIcon);
    }
}
