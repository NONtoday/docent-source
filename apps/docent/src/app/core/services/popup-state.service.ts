import { Injectable, ViewContainerRef } from '@angular/core';
import { Maybe } from '@docent/codegen';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PopupStateService {
    public openPopup$ = new BehaviorSubject<Maybe<ViewContainerRef>>(null);
}
