import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconBericht, IconBijlageToevoegen, IconPijlLinks, provideIcons } from 'harmony-icons';
import { ContentChange } from 'ngx-quill';
import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, takeUntil } from 'rxjs/operators';
import { BijlageFieldsFragment, BijlageType, InleveringenConversatieQuery } from '../../../generated/_types';
import { PopupService } from '../../core/popup/popup.service';
import { ComponentUploadService } from '../../core/services/component-upload.service';
import { DeviceService, phoneQuery, tabletPortraitQuery } from '../../core/services/device.service';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { BijlageUploadLijstComponent } from '../../shared/components/bijlage/bijlage-upload-lijst/bijlage-upload-lijst.component';
import { BijlageComponent } from '../../shared/components/bijlage/bijlage/bijlage.component';
import { BoodschapComponent } from '../../shared/components/boodschap/boodschap.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EditorFormControlComponent } from '../../shared/components/editor-form-control/editor-form-control.component';
import { InleveringenOverzichtService } from '../inleveringen-overzicht/inleveringen-overzicht.service';

interface ReactieOpstellenState {
    message: string;
    bijlagen: BijlageFieldsFragment[];
}

@Component({
    selector: 'dt-inlevering-conversatie',
    templateUrl: './inlevering-conversatie.component.html',
    styleUrls: ['./../../rooster-shared/scss/bullet.list.view.scss', './inlevering-conversatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentUploadService, provideIcons(IconPijlLinks, IconBericht, IconBijlageToevoegen)],
    standalone: true,
    imports: [
        OutlineButtonComponent,
        ButtonComponent,
        BoodschapComponent,
        EditorFormControlComponent,
        FormsModule,
        ReactiveFormsModule,
        BijlageComponent,
        BijlageUploadLijstComponent,
        AsyncPipe,
        IconDirective
    ]
})
export class InleveringConversatieComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    private service = inject(InleveringenOverzichtService);
    private deviceService = inject(DeviceService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild('editorContainer', { read: ElementRef, static: false }) editorContainer: ElementRef;
    @ViewChild(EditorFormControlComponent) editorComponent: EditorFormControlComponent;
    @ViewChild('fileInput', { read: ElementRef, static: true }) fileInput: ElementRef;
    @ViewChild(BijlageUploadLijstComponent) uploadLijst: BijlageUploadLijstComponent;

    @Input() @HostBinding('class.nieuw-bericht-mobile') berichtOpstellen: boolean;
    @Input() conversatie: InleveringenConversatieQuery['inleveringenConversatie'];
    @Input() heeftBerichtenWijzigenRecht: boolean;

    onBerichtOpstellen = output<boolean>();

    public submitButtonDisabled$: Observable<boolean>;
    public isPhoneOrTabletPortrait$: Observable<boolean>;

    uploadingFiles = new BehaviorSubject<FileList>({} as FileList);
    bijlagen: BijlageFieldsFragment[] = [];

    berichtForm = new UntypedFormGroup({
        bericht: new UntypedFormControl('')
    });

    private bijlagenChange$ = new ReplaySubject<void>();
    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.deviceService.onDeviceChange$
            .pipe(
                map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery]),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe((phoneOrTabletPortrait) => {
                if (this.berichtOpstellen && !phoneOrTabletPortrait) {
                    this.onBerichtOpstellen.emit(false);
                }
            });

        this.isPhoneOrTabletPortrait$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery]),
            takeUntil(this.destroy$)
        );

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationStart),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.uploadLijst.cancelAllUploads();
                this.saveStateToSessionStorage();
                this.clearState();
            });

        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(() => {
            const state = this.retrieveStateFromSessionStorage();
            if (state.message) {
                this.berichtForm.controls.bericht.setValue(state.message);
            }
            this.bijlagen = state.bijlagen ?? [];
        });
    }

    ngOnChanges() {
        if (this.berichtOpstellen) {
            setTimeout(() => {
                this.editorContainer.nativeElement.focus();
                this.editorComponent?.editor.quillEditor?.focus();
            });
        }
    }

    ngAfterViewInit() {
        const onEditorChanged$ = this.editorComponent.editor.onContentChanged.pipe(startWith({}));

        this.submitButtonDisabled$ = combineLatest([onEditorChanged$, this.bijlagenChange$, this.uploadingFiles]).pipe(
            map(
                ([contentChange]) =>
                    (this.bijlagen.length === 0 &&
                        (!(<ContentChange>contentChange).text || (<ContentChange>contentChange).text.length < 2)) ||
                    this.uploadLijst.files?.length > 0
            ),
            startWith(true)
        );

        this.bijlagenChange$.next();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public openBerichtAnnulerenGuard() {
        if (this.berichtForm.controls.bericht.dirty && this.berichtForm.controls.bericht.value.length > 2) {
            const popup = this.popupService.popup(
                this.viewContainerRef,
                ConfirmationDialogComponent.defaultPopupSettings,
                ConfirmationDialogComponent
            );

            popup.title = 'Let op, het bericht is nog niet verzonden';
            popup.message = 'Weet je zeker dat je wilt stoppen met bewerken van dit bericht? Wijzigingen worden niet opgeslagen.';
            popup.cancelLabel = 'Annuleren';
            popup.actionLabel = 'Stoppen met bewerken';
            popup.outlineConfirmKnop = true;
            popup.buttonColor = 'accent_negative_1';

            popup.onConfirmFn = () => {
                this.closeBerichtOpstellen();

                return true;
            };
        } else {
            this.closeBerichtOpstellen();
        }
    }

    submitMessage() {
        const editorFilled = this.berichtForm.dirty && !!this.berichtForm.controls.bericht.value;

        if (this.bijlagen || editorFilled) {
            this.service.message({
                inhoud: this.berichtForm.controls.bericht.value,
                bijlagen: this.bijlagen
            });

            if (this.deviceService.isPhoneOrTabletPortrait()) {
                this.closeBerichtOpstellen();
            }

            this.removeStateFromSessionStorages();
            this.clearState();
        }
    }

    openBerichtOpstellen() {
        this.onBerichtOpstellen.emit(true);
    }

    closeBerichtOpstellen() {
        this.clearState();
        this.onBerichtOpstellen.emit(false);
    }

    clearState() {
        this.editorComponent?.editor.writeValue(null);
        this.berichtForm.controls.bericht.setValue(null);
        this.bijlagen = [];
        this.uploadLijst.cancelAllUploads();
        this.bijlagenChange$.next();
    }

    private saveStateToSessionStorage() {
        const state = JSON.stringify({
            message: this.berichtForm.controls.bericht.value ?? '',
            bijlagen: this.bijlagen ?? []
        });
        sessionStorage.setItem(this.messageStorageId, state);
    }

    private retrieveStateFromSessionStorage(): ReactieOpstellenState {
        const state = JSON.parse(sessionStorage.getItem(this.messageStorageId)!);
        return (
            state ?? {
                message: undefined,
                bijlagen: []
            }
        );
    }

    private removeStateFromSessionStorages() {
        sessionStorage.removeItem(this.messageStorageId);
    }

    private get inleveropdrachtId(): string {
        return this.route.snapshot.paramMap.get('id')!;
    }

    private get inleveraarId(): string {
        return this.route.snapshot.queryParamMap.get('detail')!;
    }

    private get messageStorageId() {
        return `${this.inleveropdrachtId}:${this.inleveraarId}`;
    }

    openBijlagePicker() {
        this.fileInput.nativeElement.click();
    }

    onFilesSelected(event: Event) {
        this.uploadingFiles.next((<HTMLInputElement>event.target).files!);
        this.fileInput.nativeElement.value = '';
    }

    fileUploaded(uploadContextId: string, file: File) {
        if (file) {
            this.bijlagen.push({
                uploadContextId,
                type: BijlageType.BESTAND,
                titel: file.name,
                url: null,
                zichtbaarVoorLeerling: true,
                sortering: 0
            } as BijlageFieldsFragment);
            this.bijlagenChange$.next();
        }
    }

    cancelUpload() {
        this.uploadingFiles.next({} as FileList);
    }

    removeBijlage(bijlageToRemove: BijlageFieldsFragment) {
        this.bijlagen = this.bijlagen.filter(
            (bijlage) => bijlage.uploadContextId !== bijlageToRemove.uploadContextId && bijlage.titel !== bijlageToRemove.titel
        );
        this.bijlagenChange$.next();
    }

    trackByBijlageId(index: number, item: BijlageFieldsFragment) {
        return item.id;
    }
}
