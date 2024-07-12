import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransloaditParamsDocument, TransloaditParamsMutation } from '../../../generated/_types';

@Injectable()
export class UploadDataService {
    private dataClient = inject(Apollo);
    public cancelAllUploads$ = new Subject<void | null>();

    public getTransloaditParams(): Observable<TransloaditParamsMutation['transloaditParams']> {
        return this.dataClient
            .mutate({
                mutation: TransloaditParamsDocument,
                fetchPolicy: 'no-cache'
            })
            .pipe(map((res) => res.data!.transloaditParams));
    }

    public cancelAllUploads() {
        this.cancelAllUploads$.next(null);
    }
}
