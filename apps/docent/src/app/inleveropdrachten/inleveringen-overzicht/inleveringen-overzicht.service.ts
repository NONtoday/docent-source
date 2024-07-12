import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Inlevering, InleveringStatus } from '../../../generated/_types';
import { InleveropdrachtBericht } from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { toId } from '../../rooster-shared/utils/utils';

@Injectable()
export class InleveringenOverzichtService implements OnDestroy {
    private _onZipReady$ = new Subject<string>();
    private _onBeoordeling$ = new Subject<InleveringStatus>();
    private _onDownload$ = new Subject<Inlevering>();
    private _onDownloadAlles$ = new Subject<Inlevering[]>();
    private _onMessage$ = new Subject<InleveropdrachtBericht>();
    private _onMessageAll$ = new Subject<InleveropdrachtBericht>();
    private _onDestroy$ = new Subject<void>();

    public onDownload$ = this._onDownload$.asObservable().pipe(takeUntil(this._onDestroy$));
    public onBeoordeling$ = this._onBeoordeling$.asObservable().pipe(takeUntil(this._onDestroy$));
    public onDownloadAlles$ = this._onDownloadAlles$.asObservable().pipe(takeUntil(this._onDestroy$));
    public onMessage$ = this._onMessage$.asObservable().pipe(takeUntil(this._onDestroy$));
    public onMessageAll$ = this._onMessageAll$.asObservable().pipe(takeUntil(this._onDestroy$));

    public download = (inlevering: Inlevering) => this._onDownload$.next(inlevering);
    public downloadAlles = (inleveringen: Inlevering[]) => this._onDownloadAlles$.next(inleveringen);
    public beoordeel = (status: InleveringStatus) => this._onBeoordeling$.next(status);
    public whenZipReady$ = (inleveringen: Inlevering[]) =>
        this._onZipReady$.asObservable().pipe(
            filter((id) => id === inleveringen.map(toId).join('-')),
            take(1)
        );
    public zipReady = (inleveringen: Inlevering[]) => this._onZipReady$.next(inleveringen.map(toId).join('-'));
    public zipError = (error: any) => this._onZipReady$.error(error);
    public message = (boodschapInputContainer: InleveropdrachtBericht) => this._onMessage$.next(boodschapInputContainer);
    public messageAll = (inleveropdrachtBerichtContainer: InleveropdrachtBericht) =>
        this._onMessageAll$.next(inleveropdrachtBerichtContainer);

    ngOnDestroy() {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }
}
