import { Component, OnInit, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Toast, ToastType } from '../models';
import { ToastService } from './toast.service';

@Component({
    selector: 'dt-toast',
    template: '',
    standalone: true
})
export class ToastComponent implements OnInit {
    private toastService = inject(ToastService);
    private toastr = inject(ToastrService);

    public ngOnInit(): void {
        this.toastService.subject.subscribe((toast) => {
            this.addToast(toast);
        });
    }

    private addToast(toast: Toast) {
        switch (toast.type) {
            case ToastType.Info:
                this.toastr.info(toast.message, '', toast.settingsOverride);
                break;
            case ToastType.Success:
                this.toastr.success(toast.message, 'Gelukt!', toast.settingsOverride);
                break;
            case ToastType.Error:
                this.toastr.error(toast.message, '', toast.settingsOverride);
                break;
            case ToastType.Warning:
                this.toastr.warning(toast.message, '', toast.settingsOverride);
                break;
        }
    }
}
