import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    inject,
    output
} from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ButtonComponent, IconDirective } from 'harmony';
import { IconLink, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Bijlage } from '../../../../generated/_types';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Optional } from '../../../rooster-shared/utils/utils';
import { BijlageService } from '../../../shared/components/bijlage/bijlage.service';
import { ZichtbaarheidstoggleComponent } from '../../../shared/components/zichtbaarheidstoggle/zichtbaarheidstoggle.component';

@Component({
    selector: 'dt-url-toevoegen-formulier',
    templateUrl: './url-toevoegen-formulier.component.html',
    styleUrls: ['./url-toevoegen-formulier.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, ZichtbaarheidstoggleComponent, OutlineButtonComponent, ButtonComponent, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconLink)]
})
export class UrlToevoegenFormulierComponent implements OnInit, OnDestroy {
    private formbuilder = inject(UntypedFormBuilder);
    private bijlageService = inject(BijlageService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() bijlage: Optional<Bijlage>;

    onAnnuleren = output<void>();
    onSubmit = output<Bijlage>();

    @ViewChild('titel', { read: ElementRef, static: true }) titelRef: ElementRef;
    @ViewChild('url', { read: ElementRef, static: true }) urlRef: ElementRef;

    urlToevoegenForm: UntypedFormGroup;
    naamControl: AbstractControl;
    linkControl: AbstractControl;
    displayUrlError: boolean;
    disableForm: boolean;

    zichtbaarheid = true;

    private onDestroy$ = new Subject<void>();

    ngOnInit() {
        this.urlToevoegenForm = this.formbuilder.group({
            naam: ['', [Validators.required, Validators.maxLength(255)]],
            link: ['', [Validators.required]]
        });

        this.naamControl = this.urlToevoegenForm.controls['naam'];
        this.linkControl = this.urlToevoegenForm.controls['link'];

        this.linkControl.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
            this.displayUrlError = false;
        });

        if (this.bijlage && this.bijlage.id) {
            this.naamControl.setValue(this.bijlage.titel);
            this.linkControl.setValue(this.bijlage.url);
            this.zichtbaarheid = this.bijlage.zichtbaarVoorLeerling;
        }

        this.titelRef.nativeElement.focus();
    }

    async submit() {
        this.urlToevoegenForm.markAsDirty();
        if (!this.urlToevoegenForm.valid) {
            return;
        }

        this.naamControl.disable();
        this.linkControl.disable();
        this.disableForm = true;
        const validationResult = await this.bijlageService.isUrlValid(this.linkControl);
        if (!validationResult.isValid) {
            this.linkControl.enable();
            this.naamControl.enable();
            this.displayUrlError = true;
            this.disableForm = false;
            this.changeDetector.detectChanges();
            return;
        }

        const url = { ...this.bijlage } as Bijlage;
        if (!url.id) {
            url.contentType = validationResult.contentType;
        }
        url.titel = this.naamControl.value;
        url.url = this.linkControl.value?.trim();
        url.zichtbaarVoorLeerling = this.zichtbaarheid;
        url.differentiatiegroepen = [];
        url.differentiatieleerlingen = [];

        this.onSubmit.emit(url);
    }

    onCancelClick() {
        this.onAnnuleren.emit();
    }
    toggleZichtbaarheid() {
        this.zichtbaarheid = !this.zichtbaarheid;
    }

    preventSubmitOnEnter(event: any) {
        event.preventDefault();
        this.titelRef.nativeElement.blur();
        this.urlRef.nativeElement.blur();
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
