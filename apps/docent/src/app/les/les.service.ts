import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class LesService {
    private _loadingSubject = new BehaviorSubject<boolean>(false);

    get loading$(): Observable<boolean> {
        return this._loadingSubject.pipe(debounceTime(1000));
    }

    startLoading() {
        this._loadingSubject.next(true);
    }

    stopLoading() {
        this._loadingSubject.next(false);
    }
}
