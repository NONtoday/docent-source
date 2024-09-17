import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Bijlage, BijlageFieldsFragment, BijlageType } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBijlageToevoegen, IconMethode, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { BijlageUploadLijstComponent } from '../../../shared/components/bijlage/bijlage-upload-lijst/bijlage-upload-lijst.component';
import { BijlageComponent } from '../../../shared/components/bijlage/bijlage/bijlage.component';
import { SelecteerBijlagePopupComponent } from '../../../shared/components/bijlage/selecteer-bijlage-popup/selecteer-bijlage-popup.component';
import { ConferenceDateRange } from '../../../shared/components/editor-form-control/editor-form-control.component';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-omschrijving-en-bijlage',
    templateUrl: './omschrijving-en-bijlage.component.html',
    styleUrls: ['./omschrijving-en-bijlage.component.scss'],
    standalone: true,
    imports: [BijlageComponent, BijlageUploadLijstComponent, FormsModule, ReactiveFormsModule, IconDirective],
    providers: [provideIcons(IconBijlageToevoegen, IconMethode)]
})
export class OmschrijvingEnBijlageComponent implements OnInit, OnDestroy {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('editorContainer', { read: ViewContainerRef, static: true }) editorContainer: ViewContainerRef;
    @ViewChild('uploadIcon', { read: ViewContainerRef }) uploadIcon: ViewContainerRef;
    @ViewChild('fileInput', { read: ElementRef, static: true }) fileInput: ElementRef;
    @ViewChild(BijlageUploadLijstComponent) uploadLijst: BijlageUploadLijstComponent;

    @Input() formGroup: UntypedFormGroup;
    @Input() controlName: string;
    @Input() omschrijvingPlaceholder = 'Omschrijvng';
    @Input() heeftBijlagen: Optional<boolean> = true;
    @Input() conferenceDateRange: ConferenceDateRange;
    @Input() bijlagen: Bijlage[];
    @Input() toonBestandUploaden: Optional<boolean>;
    @Input() toonUitMethode: Optional<boolean>;
    @Input() heeftToegangTotElo: Optional<boolean>;
    @Input() alleenBestanden = false;
    @Input() toonZichtbaarheidToggle = true;
    @Input() showBorder = true;

    verwijderBijlage = output<BijlageFieldsFragment>();
    editUrl = output<BijlageFieldsFragment>();
    fileUploaded = output<BijlageFieldsFragment>();
    openMethodeSelectie = output<void>();
    saveBijlage = output<{
        bijlage: BijlageFieldsFragment;
        index: number;
    }>();
    triggerChangeDetection = output<void>();

    public uploadingFiles = new Subject<FileList>();

    private onDestroy$ = new Subject<void>();

    uploadFormGroup: UntypedFormGroup;

    constructor() {
        this.uploadFormGroup = new UntypedFormGroup({
            files: new UntypedFormControl()
        });
    }

    ngOnInit() {
        // Lazy load het editorFormComponent, zodat die niet mee komt in de main bundle (en dus geen Quill in de main bundle).
        // De comment in de import is om de chunck een duidelijkere naam te geven ipv een auto gegenereerde naam.
        import(
            /* webpackChunkName: 'editorFormComponent' */ '../../../shared/components/editor-form-control/editor-form-control.component'
        ).then(({ EditorFormControlComponent }) => {
            this.editorContainer.clear();

            const editorComponentRef = this.editorContainer.createComponent(EditorFormControlComponent);
            const editor = editorComponentRef.instance;

            editor.formGroup = this.formGroup;
            editor.placeholder = this.omschrijvingPlaceholder;
            editor.inSidebar = true;
            editor.heeftBijlagen = this.heeftBijlagen!;
            editor.conferenceDateRange = this.conferenceDateRange;
            editor.showBorder = this.showBorder;
            editor.controlName = this.controlName ?? 'omschrijving';
            editor.triggerChangeDetection.subscribe(() => this.triggerChangeDetection.emit());

            editorComponentRef.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    parseUpload(uploadContextId: string, file: Optional<File>) {
        if (file) {
            this.fileUploaded.emit({
                uploadContextId,
                type: BijlageType.BESTAND,
                titel: file.name,
                url: null,
                zichtbaarVoorLeerling: true,
                sortering: 0
            } as BijlageFieldsFragment);
        }
    }

    saveUrl(url: BijlageFieldsFragment, previousUrl?: BijlageFieldsFragment) {
        if (previousUrl) {
            const index = this.bijlagen.findIndex((bijlage) => bijlage.url === previousUrl.url && bijlage.titel === previousUrl.titel);
            this.bijlagen[index] = { ...url };
        } else {
            this.bijlagen.push(url);
        }

        this.changeDetector.detectChanges();
    }

    onSaveBijlage(bijlage: BijlageFieldsFragment, index: number) {
        this.saveBijlage.emit({ bijlage, index });
    }

    onBijlageToevoegen() {
        if (this.alleenBestanden) {
            this.fileInput.nativeElement.click();
        } else {
            const popupSettings = new PopupSettings();

            popupSettings.showHeader = false;
            popupSettings.width = 200;
            popupSettings.appearance = {
                mobile: Appearance.Rollup,
                tabletportrait: Appearance.Rollup,
                tablet: Appearance.Popout,
                desktop: Appearance.Popout
            };
            popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top, PopupDirection.Left, PopupDirection.Right];
            const selecteerBijlagePopup = this.popupService.popup(this.uploadIcon, popupSettings, SelecteerBijlagePopupComponent);
            selecteerBijlagePopup.selectFiles = (files: FileList) => this.uploadingFiles.next(files);
            selecteerBijlagePopup.saveUrl = (bijlage) => this.saveUrl(bijlage);
        }
    }

    onFilesAdded(files: Event) {
        this.uploadingFiles.next((files.target as HTMLInputElement).files!);
    }

    trackById(index: number, item: Bijlage) {
        return item.id;
    }

    get isUploading(): boolean {
        return (this.uploadLijst?.files ?? []).length > 0;
    }
}
