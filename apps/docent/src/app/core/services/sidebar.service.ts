import { Injectable, Type } from '@angular/core';
import { last } from 'lodash-es';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BaseSidebar, SidebarOptions, defaultSidebarOptions } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { SidebarPage } from '../models/studiewijzers/studiewijzer.model';
import { sidebarFilter } from '../operators/sidebars.operator';

export interface OpenSidebarArgs<T> {
    filter: T;
    data?: SidebarData<Type<any>>;
    action: SidebarAction;
}
export type SidebarData<T extends Type<BaseSidebar>> = Partial<{ [p in keyof T['prototype']]: T['prototype'][p] }>;
export type SidebarInputs<T> = Observable<Partial<T>>;
export type SidebarAction = 'Open' | 'Close' | 'CloseAll' | 'Data';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private _sidebarSubject = new Subject<OpenSidebarArgs<unknown>>();
    private _currentPage = new BehaviorSubject<Optional<SidebarPage>>(null);

    private pagesStack: SidebarPage[] = [];

    public changePage(newPage: SidebarPage, resetStack = false) {
        if (resetStack) {
            this.pagesStack = [];
        }
        this.pagesStack.push(newPage);
        this._currentPage.next(newPage);
    }

    public previousPage() {
        if (this.pagesStack.length > 0) {
            this.pagesStack.pop();
            this._currentPage.next(last(this.pagesStack));
        }
    }

    public watchFor<T>(sidebar: T) {
        return this._sidebarSubject.pipe(sidebarFilter(sidebar));
    }

    public openSidebar<T extends Type<BaseSidebar>>(filter: T, data?: SidebarData<T>) {
        const dataMetDefaults: SidebarData<T> = {
            ...data,
            sidebar: {
                ...defaultSidebarOptions,
                onMaskClick: () => this.closeSidebar(),
                onCloseClick: () => this.closeSidebar(),
                ...data?.sidebar
            }
        } as any;
        this._sidebarSubject.next({ filter, data: dataMetDefaults, action: 'Open' });
    }

    public updateData<T extends Type<BaseSidebar>>(sidebar: T, data: SidebarData<T>) {
        this._sidebarSubject.next({ filter: sidebar, data, action: 'Data' });
    }

    public updateOptions<T extends Type<BaseSidebar>>(sidebar: T, options: Partial<SidebarOptions>) {
        this.updateData(sidebar, { sidebar: options } as SidebarData<T>);
    }

    public hideSidebar<T extends Type<BaseSidebar>>(sidebar: T) {
        this.updateOptions(sidebar, { display: false });
    }

    public closeSidebar<T>(sidebar?: T) {
        this._currentPage.next(undefined);
        this.pagesStack = [];
        this._sidebarSubject.next({ filter: sidebar, action: sidebar ? 'Close' : 'CloseAll' });
    }

    get currentPage() {
        return this._currentPage.value;
    }

    get currentPage$() {
        return this._currentPage.asObservable();
    }
}
