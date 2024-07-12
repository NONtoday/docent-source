import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { format } from 'date-fns';
import { IconDirective, TagComponent } from 'harmony';
import { IconBericht, IconBijlageToevoegen, provideIcons } from 'harmony-icons';
import { ContentChange } from 'ngx-quill';
import { BehaviorSubject, Observable, ReplaySubject, Subject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { BijlageFieldsFragment, BijlageType, Leerling, Medewerker, Projectgroep, Toekenning } from '../../../generated/_types';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { ComponentUploadService } from '../../core/services/component-upload.service';
import { DeviceService, phoneQuery, tabletPortraitQuery } from '../../core/services/device.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { StudiewijzeritemTitelPipe } from '../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';
import { notEqualsId } from '../../rooster-shared/utils/utils';
import { BijlageUploadLijstComponent } from '../../shared/components/bijlage/bijlage-upload-lijst/bijlage-upload-lijst.component';
import { BijlageComponent } from '../../shared/components/bijlage/bijlage/bijlage.component';
import { EditorFormControlComponent } from '../../shared/components/editor-form-control/editor-form-control.component';
import { InleveringenOverzichtService } from '../inleveringen-overzicht/inleveringen-overzicht.service';

@Component({
    selector: 'dt-bulk-berichten-versturen-popup',
    templateUrl: './bulk-berichten-versturen-popup.component.html',
    styleUrls: ['./bulk-berichten-versturen-popup.component.scss'],
    providers: [ComponentUploadService, StudiewijzeritemTitelPipe, provideIcons(IconBijlageToevoegen, IconBericht)],
    standalone: true,
    imports: [
        PopupComponent,
        TagComponent,
        AvatarComponent,
        EditorFormControlComponent,
        FormsModule,
        ReactiveFormsModule,
        BijlageComponent,
        BijlageUploadLijstComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe,
        VolledigeNaamPipe,
        IconDirective
    ]
})
export class BulkBerichtenVersturenPopupComponent implements OnInit, OnDestroy, Popup {
    private studiewijzeritemTitelPipe = inject(StudiewijzeritemTitelPipe);
    private overzichtComponentService = inject(InleveringenOverzichtService);
    private deviceService = inject(DeviceService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild(EditorFormControlComponent) editorComponent: EditorFormControlComponent;
    @ViewChild('fileInput', { read: ElementRef, static: true }) fileInput: ElementRef;
    @ViewChild(BijlageUploadLijstComponent) uploadLijst: BijlageUploadLijstComponent;

    herinnering: boolean;
    toekenning: Toekenning;
    geadresseerden: (Leerling | Projectgroep)[];
    ingelogdeMedewerker$: Observable<Medewerker>;
    verzendenDisabled$: Observable<boolean>;
    bijlagenChange$ = new ReplaySubject<void>();
    isPhoneOrTabletPortrait$: Observable<boolean>;
    uploadingFiles = new BehaviorSubject<FileList>({} as FileList);
    bijlagen: BijlageFieldsFragment[] = [];

    berichtForm = new UntypedFormGroup({
        bericht: new UntypedFormControl('')
    });

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        let herinneringContent: string;

        if (this.herinnering) {
            const studiewijzeritem = this.toekenning.studiewijzeritem;

            const vak = this.toekenning.lesgroep?.vak ? `van ${this.toekenning.lesgroep.vak.naam}` : '';
            herinneringContent = `
                    <p>De inleverperiode ${this.studiewijzeritemTitelPipe.transform(studiewijzeritem)} ${vak} loopt
                    bijna af, je hebt nog tot ${formatDateNL(studiewijzeritem.inleverperiode!.eind, 'dag_kort_dagnummer_maand_kort')}
                    om ${format(studiewijzeritem.inleverperiode!.eind, 'HH:mm')} uur om het in te leveren.</p>
                `;

            this.berichtForm.controls.bericht.setValue(herinneringContent);
        }

        setTimeout(() => {
            const onContentChanged$ = this.editorComponent?.editor.onContentChanged.pipe(
                startWith({ text: this.herinnering ? herinneringContent : null })
            );
            this.bijlagenChange$.next();

            this.verzendenDisabled$ = combineLatest([onContentChanged$, this.bijlagenChange$, this.uploadingFiles]).pipe(
                map(
                    ([contentChange]) =>
                        !(<ContentChange>contentChange).text ||
                        (<ContentChange>contentChange).text.length < 2 ||
                        this.uploadLijst.files?.length > 0
                ),
                startWith(true)
            );
        });

        this.isPhoneOrTabletPortrait$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery]),
            takeUntil(this.destroy$)
        );
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    mayClose(): boolean {
        return true;
    }

    verwijderGeadresseerde(id: string) {
        this.geadresseerden = this.geadresseerden.filter(notEqualsId(id));

        if (this.geadresseerden.length === 0) {
            this.popup.onClose();
        }
    }

    onBerichtVersturenClick() {
        this.overzichtComponentService.messageAll({
            ontvangerIds: this.geadresseerden.map((geadresseerde) => geadresseerde.id),
            inhoud: this.berichtForm.controls.bericht.value,
            bijlagen: this.bijlagen
        });

        this.popup.onClose();
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
        }
        this.bijlagenChange$.next();
    }

    cancelUpload() {
        this.uploadingFiles.next({} as FileList);
        this.bijlagenChange$.next();
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

    get leerlingen(): Leerling[] {
        if (!(<Projectgroep>this.geadresseerden[0])?.leerlingen) {
            return this.geadresseerden as Leerling[];
        }

        return [];
    }

    get projectgroepen(): Projectgroep[] {
        if ((<Projectgroep>this.geadresseerden[0])?.leerlingen) {
            return this.geadresseerden as Projectgroep[];
        }

        return [];
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.title = 'Bericht sturen';
        popupSettings.headerIcon = 'bericht';
        popupSettings.clickOutSideToClose = false;
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tabletportrait: Appearance.Fullscreen,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        return popupSettings;
    }
}
