import { Component, ElementRef, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { IconLink, IconUploaden, provideIcons } from 'harmony-icons';
import { BijlageFieldsFragment } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { UrlToevoegenPopupComponent } from '../../bijlage/url-toevoegen-popup/url-toevoegen-popup.component';
import { PopupButtonComponent } from '../../popup-button/popup-button.component';

@Component({
    selector: 'dt-selecteer-bijlage-popup',
    templateUrl: './selecteer-bijlage-popup.component.html',
    styleUrls: ['./selecteer-bijlage-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, PopupButtonComponent],
    providers: [provideIcons(IconUploaden, IconLink)]
})
export class SelecteerBijlagePopupComponent implements OnInit, Popup {
    public viewContainerRef = inject(ViewContainerRef);
    private popupService = inject(PopupService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('fileInput', { read: ElementRef, static: true }) fileInput: ElementRef;
    uploadFormGroup: UntypedFormGroup;
    saveUrl: (bijlage: BijlageFieldsFragment) => void;
    selectFiles: (files: FileList) => void;

    ngOnInit() {
        this.uploadFormGroup = new UntypedFormGroup({
            files: new UntypedFormControl()
        });
    }

    mayClose(): boolean {
        return true;
    }

    upload() {
        this.fileInput.nativeElement.click();
    }

    link() {
        const popupSettings = new PopupSettings();

        popupSettings.headerIcon = 'link';
        popupSettings.title = 'Link toevoegen';
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tablet: Appearance.Window,
            tabletportrait: Appearance.Window,
            desktop: Appearance.Window
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, UrlToevoegenPopupComponent);
        popup.saveUrl = (bijlage) => this.saveUrl(bijlage);
    }

    onFilesAdded(filesEvent: Event) {
        this.popup.onClose('handled');
        const files = (filesEvent.target as HTMLInputElement).files;
        if (files) {
            this.selectFiles?.(files);
        }
    }
}
