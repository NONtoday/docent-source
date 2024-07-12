import { Injectable } from '@angular/core';
import { IndividualConfig } from 'ngx-toastr';
import { Subject } from 'rxjs';

import { Toast, ToastType } from '../models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
    subject = new Subject<Toast>();

    success(message: string, settingsOverride?: Partial<IndividualConfig>) {
        this.toast(message, ToastType.Success, settingsOverride);
    }

    error(message: string, settingsOverride?: Partial<IndividualConfig>) {
        this.toast(message, ToastType.Error, settingsOverride);
    }

    info(message: string, settingsOverride?: Partial<IndividualConfig>) {
        this.toast(message, ToastType.Info, settingsOverride);
    }

    warning(message: string, settingsOverride?: Partial<IndividualConfig>) {
        this.toast(message, ToastType.Warning, settingsOverride);
    }

    toast(message: string, toastType: ToastType, settingsOverride?: Partial<IndividualConfig>) {
        const toast = new Toast(message, toastType, settingsOverride);
        this.subject.next(toast);
    }
}
