import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { BijlageFieldsFragment, BijlageType } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconLink, IconNietZichtbaarCheckbox, IconWaarschuwing, IconZichtbaarCheckbox, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { BijlageService } from '../bijlage.service';

@Component({
    selector: 'dt-url-toevoegen-popup',
    templateUrl: './url-toevoegen-popup.component.html',
    styleUrls: ['./url-toevoegen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, NgClass, OutlineButtonComponent, ButtonComponent, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconZichtbaarCheckbox, IconNietZichtbaarCheckbox, IconLink)]
})
export class UrlToevoegenPopupComponent implements OnInit, OnDestroy, Popup {
    private formBuilder = inject(UntypedFormBuilder);
    public bijlageService = inject(BijlageService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    url: BijlageFieldsFragment;
    previousUrl: BijlageFieldsFragment;
    saveUrl: (bijlage: BijlageFieldsFragment, previousUrl?: BijlageFieldsFragment) => void;

    public addUrlForm: UntypedFormGroup;
    public titel: AbstractControl;
    public link: AbstractControl;
    public zichtbaarheid: boolean;
    public validationResult: Optional<{
        isValid: boolean;
        contentType: string;
    }>;
    public submitted: boolean;
    private unsubscribe: Subject<void> = new Subject<void>();

    ngOnInit() {
        if (this.url) {
            this.previousUrl = { ...this.url };
        }

        this.zichtbaarheid = true;
        this.addUrlForm = this.formBuilder.group({
            titel: ['', [Validators.required, Validators.maxLength(255)]],
            link: ['', [Validators.required]]
        });

        this.titel = this.addUrlForm.controls['titel'];
        this.link = this.addUrlForm.controls['link'];

        if (this.url?.titel) {
            this.titel.setValue(this.url.titel);
        }

        if (this.url?.url) {
            this.link.setValue(this.url.url);
        }

        if (this.url?.zichtbaarVoorLeerling !== undefined) {
            this.zichtbaarheid = this.url.zichtbaarVoorLeerling;
        }

        this.addUrlForm.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
            if (this.submitted) {
                this.submitted = false;
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    async onSubmit() {
        this.titel.markAsDirty();
        this.link.markAsDirty();

        if (this.addUrlForm.valid) {
            this.addUrlForm.disable();

            const lowerCaseUrl = this.link.value.toLowerCase();
            if (!lowerCaseUrl.startsWith('https://') && !lowerCaseUrl.startsWith('http://')) {
                this.link.setValue('http://' + String(this.link.value));
            }

            this.validationResult = await this.bijlageService.isUrlValid(this.link);

            if (this.validationResult.isValid) {
                this.popup.settings.height = undefined;
                this.saveUrl(
                    {
                        type: BijlageType.URL,
                        titel: this.titel.value,
                        url: this.link.value?.trim(),
                        contentType: this.validationResult.contentType,
                        zichtbaarVoorLeerling: this.zichtbaarheid,
                        extensie: 'URL',
                        sortering: 0
                    } as BijlageFieldsFragment,
                    this.previousUrl
                );
                this.popup.onClose('submit');
            } else {
                this.addUrlForm.enable();
                this.submitted = true;
            }
        } else {
            this.addUrlForm.enable();
            this.popup.renderPopup();
            this.submitted = true;
        }
    }

    cancel() {
        this.popup.onClose('cancel');
    }

    toggleZichtbaarheid(event: Event) {
        event.stopPropagation();
        this.zichtbaarheid = !this.zichtbaarheid;
    }

    mayClose(): boolean {
        return true;
    }
}
