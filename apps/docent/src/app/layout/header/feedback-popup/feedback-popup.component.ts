import { NgClass } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent, IconDirective } from 'harmony';
import { IconRadio, IconRadioSelect, provideIcons } from 'harmony-icons';
import { match } from 'ts-pattern';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { FeedbackDataService } from './feedback-data.service';

enum Indruk {
    HEEL_SLECHT = '1',
    SLECHT = '2',
    MATIG = '3',
    GOED = '4',
    HEEL_GOED = '5',
    NIET_INGEVULD = ''
}
@Component({
    selector: 'dt-feedback-popup',
    templateUrl: './feedback-popup.component.html',
    styleUrls: ['./feedback-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, FormsModule, ReactiveFormsModule, NgClass, ButtonComponent, IconDirective],
    providers: [provideIcons(IconRadioSelect, IconRadio)]
})
export class FeedbackPopupComponent implements OnInit, Popup {
    private formbuilder = inject(UntypedFormBuilder);
    private _feedbackService = inject(FeedbackDataService);
    private router = inject(Router);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public feedbackForm: UntypedFormGroup;
    public submitted = false;
    indruk: Indruk;

    ngOnInit() {
        this.feedbackForm = this.formbuilder.group({
            indruk: ['', Validators.required],
            opmerking: ['']
        });

        this.feedbackForm.get('indruk')!.valueChanges.subscribe((value) => {
            match(value)
                .with(Indruk.HEEL_SLECHT, () => (this.indruk = Indruk.HEEL_SLECHT))
                .with(Indruk.SLECHT, () => (this.indruk = Indruk.SLECHT))
                .with(Indruk.MATIG, () => (this.indruk = Indruk.MATIG))
                .with(Indruk.GOED, () => (this.indruk = Indruk.GOED))
                .with(Indruk.HEEL_GOED, () => (this.indruk = Indruk.HEEL_GOED))
                .otherwise(() => (this.indruk = Indruk.NIET_INGEVULD));
        });
    }

    cancel(event: Event) {
        this.popup.onClose();
        event.stopPropagation();
    }

    onFormSubmit(event: Event) {
        const indruk = parseInt(this.feedbackForm.get('indruk')!.value, 10);
        const opmerking = this.feedbackForm.get('opmerking')!.value;
        const deviceInfo = navigator.userAgent;
        const huidigeUrl = this.router.url;
        const schermresolutie = String(window.innerWidth) + 'x' + String(window.innerHeight);
        if (this.feedbackForm.valid) {
            this._feedbackService.sendFeedback(indruk, opmerking, deviceInfo, huidigeUrl, schermresolutie);
            this.submitted = true;
        }

        event.stopPropagation();
    }

    mayClose(): boolean {
        return true;
    }
}
