import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ComponentUploadService {
    private _uploading = false;
    public uploading$ = new BehaviorSubject<boolean>(false);

    get uploadInProgress() {
        return this._uploading;
    }
    set uploadInProgress(uploadInProgress: boolean) {
        this._uploading = uploadInProgress;
        this.uploading$.next(uploadInProgress);
    }
}
