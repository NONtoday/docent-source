import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, ViewContainerRef, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { Observable, isObservable, of } from 'rxjs';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { FloatingAction } from '../floating-action-bar.component';

@Component({
    selector: 'dt-floating-action',
    templateUrl: './floating-action.component.html',
    styleUrls: ['./floating-action.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, AsyncPipe, IconDirective]
})
export class FloatingActionComponent implements OnChanges {
    private viewContainerRef = inject(ViewContainerRef);
    @Input() action: FloatingAction;
    isHover = false;

    notificatie$: Observable<boolean>;

    @HostListener('mouseenter') onMouseEnter() {
        this.isHover = true;
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.isHover = false;
    }

    ngOnChanges() {
        const notificatie = this.action.notificatie;
        this.notificatie$ = isObservable(notificatie) ? notificatie : of(notificatie ?? false);
    }

    onOptionClicked() {
        if (!this.action.disabled) {
            this.action.action(this.viewContainerRef);
        }
    }
}
