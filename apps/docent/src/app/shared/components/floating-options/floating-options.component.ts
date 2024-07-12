import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, ViewContainerRef, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconChevronBoven, IconChevronOnder, IconName, provideIcons } from 'harmony-icons';
import { BehaviorSubject } from 'rxjs';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupDirection } from '../../../core/popup/popup.settings';
import {
    ActionButton,
    ActionsPopupComponent,
    primaryButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { Optional, callIfFunction } from '../../../rooster-shared/utils/utils';

export type FloatingOption = Omit<ActionButton, 'iconcolor' | 'icon' | 'onClickFn'> & {
    active: boolean | (() => boolean);
    icon?: IconName;
    onClickFn: (...args: unknown[]) => Promise<void> | void;
};

@Component({
    selector: 'dt-floating-options',
    templateUrl: './floating-options.component.html',
    styleUrls: ['./floating-options.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AsyncPipe, IconDirective],
    providers: [provideIcons(IconChevronBoven, IconChevronOnder)]
})
export class FloatingOptionsComponent implements OnChanges {
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    @Input() options: FloatingOption[];

    public activeOption: Optional<FloatingOption>;
    public isPopupOpen$ = new BehaviorSubject<boolean>(false);

    ngOnChanges() {
        this.activeOption = this.findActiveOption(this.options);
    }

    findActiveOption = (options: FloatingOption[] = []) => options.find((option) => callIfFunction(option.active));

    @HostListener('click')
    openPopup() {
        if (this.popupService.isPopupOpenFor(this.viewContainerRef)) {
            return;
        }

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 194;
        popupSettings.preferedDirection = [PopupDirection.Top];
        popupSettings.onCloseFunction = () => {
            this.isPopupOpen$.next(false);
        };

        this.isPopupOpen$.next(true);

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ActionsPopupComponent);
        popup.customButtons = this.options.map((option) => {
            const button = primaryButton(
                option.icon,
                option.text,
                () => {
                    Promise.resolve(option.onClickFn()).then(() => {
                        this.activeOption = this.findActiveOption(this.options);
                    });
                },
                option.gtmTag
            );
            if (callIfFunction(option.active)) {
                button.textcolor = 'typography_1';
            }
            return button;
        });
    }
}
