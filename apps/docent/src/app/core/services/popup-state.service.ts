import { Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Maybe } from '../../../generated/_types';

@Injectable({
    providedIn: 'root'
})
export class PopupStateService {
    public openPopup$ = new BehaviorSubject<Maybe<ViewContainerRef>>(null);
}
