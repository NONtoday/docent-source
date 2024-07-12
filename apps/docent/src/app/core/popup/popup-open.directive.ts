import { ChangeDetectorRef, Directive, inject, Input, OnDestroy, OnInit, Renderer2, ViewContainerRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PopupStateService } from '../services/popup-state.service';

@Directive({
    selector: '[dtPopupOpen]',
    standalone: true
})
export class PopupOpenDirective implements OnInit, OnDestroy {
    private popupStateService = inject(PopupStateService);
    private changeDetectorRef = inject(ChangeDetectorRef);
    private renderer2 = inject(Renderer2);
    private viewContainerRef = inject(ViewContainerRef);

    @Input() dtPopupOpen: ViewContainerRef[];
    @Input() popupOpenClass = 'popup-open';

    public onDestroy$ = new Subject<void>();

    public ngOnInit(): void {
        this.popupStateService.openPopup$.pipe(takeUntil(this.onDestroy$)).subscribe((openPopup) => {
            if (!!openPopup && this.dtPopupOpen.includes(openPopup)) {
                this.renderer2.addClass(this.viewContainerRef.element.nativeElement, this.popupOpenClass);
            } else {
                this.renderer2.removeClass(this.viewContainerRef.element.nativeElement, this.popupOpenClass);
            }
            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
