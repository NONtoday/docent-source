import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { TransloaditParamsMutation } from '@docent/codegen';
import { IconVideo, provideIcons } from 'harmony-icons';
import without from 'lodash-es/without';
import { Subject } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { ComponentUploadService } from '../../../../core/services/component-upload.service';
import { UploadDataService } from '../../../../core/services/upload-data.service';
import { ENVIRONMENT_CONFIG } from '../../../../environment.config';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { BijlageUploadComponent } from '../bijlage-upload/bijlage-upload.component';

export class UploadFile {
    file: File;
    progress: Optional<Subject<number>>;
    request: any;
    error: Optional<string>;
    retry: boolean;
    uploadContextId: Optional<string>;
}

@Component({
    selector: 'dt-bijlage-upload-lijst',
    templateUrl: './bijlage-upload-lijst.component.html',
    styleUrls: ['./bijlage-upload-lijst.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BijlageUploadComponent],
    providers: [provideIcons(IconVideo)]
})
export class BijlageUploadLijstComponent implements OnInit, OnDestroy {
    private httpClient = inject(HttpClient);
    private uploadDataService = inject(UploadDataService);
    private changeDetector = inject(ChangeDetectorRef);
    private uploadService = inject(ComponentUploadService);
    @Input() uploadingFiles: Subject<FileList>;
    fileUploaded = output<{
        uploadContextId: Optional<string>;
        file: File;
    }>();
    fileUploadCancelled = output<UploadFile>();

    files = new Array<UploadFile>();
    private _destroyed$ = new Subject<void>();
    private environment = inject(ENVIRONMENT_CONFIG);

    ngOnInit() {
        this.uploadingFiles.pipe(takeUntil(this._destroyed$)).subscribe((files) => {
            const newFiles = Array.from(files).map(
                (file): UploadFile => ({
                    file,
                    progress: undefined,
                    error: undefined,
                    retry: false,
                    request: undefined,
                    uploadContextId: undefined
                })
            );
            this.files.push(...newFiles);
            this.validateFiles(newFiles);
            this.uploadFiles(newFiles);
        });
        this.uploadDataService.cancelAllUploads$.pipe(takeUntil(this._destroyed$)).subscribe(() => {
            this.cancelAllUploads();
        });
    }

    private addUploadContextToRequest(uploadContext: TransloaditParamsMutation['transloaditParams'], uploadFile: UploadFile) {
        const formData: FormData = new FormData();
        formData.append(uploadFile.file.name, uploadFile.file, uploadFile.file.name);
        formData.append('params', uploadContext.params);
        formData.append('signature', uploadContext.signature);

        const req = new HttpRequest('POST', this.environment.transloaditUrl, formData, {
            reportProgress: true
        });
        uploadFile.progress = new Subject<number>();
        uploadFile.progress.next(0);
        uploadFile.request = new Subject();
        uploadFile.uploadContextId = uploadContext.uploadContextId.toString();
        return this.httpClient.request(req).pipe(takeUntil(uploadFile.request));
    }

    private createUploadContextAndUpload(uploadFile: UploadFile) {
        return this.uploadDataService
            .getTransloaditParams()
            .pipe(mergeMap((uploadContext) => this.addUploadContextToRequest(uploadContext, uploadFile)));
    }

    private upload(uploadFile: UploadFile) {
        this.uploadService.uploadInProgress = true;
        uploadFile.retry = false;

        this.createUploadContextAndUpload(uploadFile)
            .pipe(takeUntil(this._destroyed$))
            .subscribe((event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const percentDone = Math.round((100 * event.loaded) / event.total!);
                    uploadFile.progress?.next(percentDone);
                } else if (event.type === HttpEventType.Response && event['status'] === 200) {
                    this.files = without(this.files, uploadFile);
                    this.updateUploadStatus();
                    this.fileUploaded.emit({ uploadContextId: uploadFile.uploadContextId, file: uploadFile.file });
                    uploadFile.progress?.complete();
                } else if (
                    (event.type === HttpEventType.Response || event.type === HttpEventType.ResponseHeader) &&
                    event['status'] !== 200
                ) {
                    uploadFile.error = 'Er is helaas iets fout gegaan tijdens het uploaden.';
                    uploadFile.retry = true;
                    uploadFile.progress?.complete();
                    this.updateUploadStatus();
                }

                this.changeDetector.markForCheck();
            });
    }

    private updateUploadStatus() {
        if (this.files.filter((file) => !file.error).length === 0) {
            this.uploadService.uploadInProgress = false;
        }
    }

    cancelAllUploads() {
        this.files.forEach((file) => this.haltBijlageUpload(file));
        this.uploadService.uploadInProgress = false;
    }

    validateFiles(files: Array<UploadFile>) {
        files.forEach((uploadFile) => {
            if ('exe'.includes(uploadFile.file.name.split('.').pop() ?? '')) {
                uploadFile.error = 'Bestanden met de extensie .exe zijn niet toegestaan.';
            } else if (uploadFile.file.type.includes('image')) {
                if (uploadFile.file.size / 1e6 > 5) {
                    uploadFile.error = 'De maximale bestandsgrootte voor afbeeldingen is 5MB.';
                }
            } else if (uploadFile.file.type.includes('video')) {
                if (uploadFile.file.size / 1e6 > 250) {
                    uploadFile.error = "De maximale bestandsgrootte voor video's is 250MB.";
                }
            } else if (uploadFile.file.type.includes('audio')) {
                if (uploadFile.file.size / 1e6 > 50) {
                    uploadFile.error = 'De maximale bestandsgrootte voor audio is 50MB.';
                }
            } else if (uploadFile.file.size / 1e6 > 150) {
                uploadFile.error = 'De maximale bestandsgrootte is 150MB.';
            }
        });
        this.changeDetector.markForCheck();
    }

    uploadFiles(files: Array<UploadFile>) {
        if (files) {
            const validUploads = files.filter((uploadFile) => !uploadFile.error);
            if (validUploads) {
                validUploads.forEach((file) => this.upload(file));
            }
            this.changeDetector.markForCheck();
        }
    }

    haltBijlageUpload(uploadFile: UploadFile, keepFile = false) {
        if (uploadFile.request) {
            uploadFile.request.next();
            uploadFile.request.complete();
            uploadFile.request = undefined;
        }
        if (uploadFile.progress) {
            uploadFile.progress.complete();
            uploadFile.progress = undefined;
        }
        if (!keepFile) {
            this.files = without(this.files, uploadFile);
        }
        if (this.files.length === 0) {
            this.uploadService.uploadInProgress = false;
        }

        this.fileUploadCancelled.emit(uploadFile);
        this.changeDetector.markForCheck();
    }

    retryBijlageUpload(uploadFile: UploadFile) {
        uploadFile.error = undefined;
        this.haltBijlageUpload(uploadFile, true);
        this.upload(uploadFile);
    }

    public ngOnDestroy(): void {
        this.cancelAllUploads();
        this._destroyed$.next();
        this._destroyed$.complete();
    }
}
