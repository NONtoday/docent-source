import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { localOrCookieStorage } from '../auth/storage-config';
import { DeviceService } from '../core/services/device.service';

@Injectable({ providedIn: 'root' })
export class RoosterService {
    private deviceService = inject(DeviceService);
    private showWeekendSubject = new BehaviorSubject<boolean>(localOrCookieStorage.getItem('showWeekend') === 'true' ? true : false);
    private dayViewModeSubject = new BehaviorSubject<boolean>(localOrCookieStorage.getItem('dayViewMode') === 'true' ? true : false);
    private vrijeUrenTonenSubject = new BehaviorSubject<boolean>(localOrCookieStorage.getItem('vrijeUrenTonen') === 'true' ? true : false);

    public showWeekend$ = this.showWeekendSubject.asObservable();
    public dayViewMode$ = this.dayViewModeSubject.asObservable();
    public vrijeUrenTonen$ = this.vrijeUrenTonenSubject.asObservable();

    public toggleWeekend() {
        this.showWeekend = !this.showWeekend;
    }

    public toggleVrijeUren() {
        this.vrijeUrenTonen = !this.vrijeUrenTonen;
    }

    get showWeekend() {
        return this.showWeekendSubject.value;
    }
    set showWeekend(show: boolean) {
        this.showWeekendSubject.next(show);
        localOrCookieStorage.setItem('showWeekend', show.toString());
    }

    set dayViewMode(dayViewMode: boolean) {
        this.dayViewModeSubject.next(dayViewMode);
        localOrCookieStorage.setItem('dayViewMode', dayViewMode.toString());
    }

    get dayViewMode() {
        return this.deviceService.isDesktop() && this.dayViewModeSubject.value;
    }

    get vrijeUrenTonen() {
        return this.vrijeUrenTonenSubject.value;
    }
    set vrijeUrenTonen(show: boolean) {
        this.vrijeUrenTonenSubject.next(show);
        localOrCookieStorage.setItem('vrijeUrenTonen', show.toString());
    }
}
