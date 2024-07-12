import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TableService implements OnDestroy {
    // Wanneer er een menu boven een tabel staat kan deze worden verborgen met behulp van deze subject
    private _hiddenMenus$ = new BehaviorSubject<string[]>([]);

    private _destroy$ = new Subject<void>();

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
    }

    hideMenus(menusToHide: string[]) {
        this._hiddenMenus$.next([...new Set([...this._hiddenMenus$.value, ...menusToHide])]);
    }

    showMenus(menusToShow: string[]) {
        this._hiddenMenus$.next(this._hiddenMenus$.value.filter((hiddenMenu) => !menusToShow.includes(hiddenMenu)));
    }

    showAllMenus() {
        this._hiddenMenus$.next([]);
    }

    get hiddenMenus$(): Observable<string[]> {
        return this._hiddenMenus$;
    }

    isMenuEnabled(menuName: string) {
        return !this._hiddenMenus$.value.includes(menuName);
    }
}
