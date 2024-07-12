import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild, ViewContainerRef, inject, input, output } from '@angular/core';
import { IconCheck, IconName, provideIcons } from 'harmony-icons';
import { AddAttributeDirective } from '../directives/add-attribute.directive';
import { IconDirective } from '../icon/icon.directive';
import { createModalSettings } from '../overlay/modal/component/modal.settings';
import { OverlayService } from '../overlay/overlay.service';
import { createPopupSettings } from '../overlay/popup/settings/popup-settings';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
    selector: 'hmy-setting-button',
    standalone: true,
    imports: [CommonModule, IconDirective, SpinnerComponent, AddAttributeDirective],
    templateUrl: './setting-button.component.html',
    styleUrl: './setting-button.component.scss',
    providers: [provideIcons(IconCheck)],
    host: {
        '(click)': 'openOverlay()',
        '[class.is-loading]': 'showLoader()',
        '[class.has-selection]': 'selected()',
        '[class.hide-label]': 'hideLabel()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingButtonComponent<T> {
    private readonly overlayService = inject(OverlayService);
    private readonly viewContainerRef = inject(ViewContainerRef);

    @ViewChild('button', { read: ViewContainerRef }) button: ViewContainerRef;
    @ViewChild('buttons') buttons: TemplateRef<string>;

    icon = input.required<IconName>();
    label = input.required<string>();
    opties = input.required<T[]>();
    selected = input.required<T | undefined>();
    showLoader = input.required<boolean>();
    popupWidth = input<number>(225);
    verwijderLabel = input<string>();
    hideLabel = input<boolean>(false);
    titel = input.required<string | undefined>();
    additionalAttributes = input<AdditionalAttribute[]>([]);

    initieleSelectie: T | undefined;

    selection = output<T | undefined>();

    openOverlay() {
        this.initieleSelectie = this.selected();
        this.overlayService.popupOrModal(
            this.buttons,
            this.viewContainerRef,
            undefined,
            createPopupSettings({ animation: 'slide', width: `${this.popupWidth()}px` }),
            createModalSettings({ title: this.titel() })
        );
    }

    select(optie: T | undefined) {
        this.selection.emit(optie);
        this.overlayService.close(this.viewContainerRef);
    }

    additionalAttribute = (index: number): AdditionalAttribute | undefined => this.additionalAttributes()[index];
}

type AdditionalAttribute = { attribute: string; value: string };
