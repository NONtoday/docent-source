import { IndividualConfig } from 'ngx-toastr';

export class Toast {
    constructor(
        public message: string,
        public type: ToastType,
        public settingsOverride?: Partial<IndividualConfig>
    ) {}
}

export enum ToastType {
    Success,
    Error,
    Info,
    Warning
}
