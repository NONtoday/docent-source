import { ChangeDetectionStrategy, Component, HostBinding, Input, OnDestroy, OnInit, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInformatie, IconNoRadio, IconSluiten, IconSynchroniseren, IconWaarschuwing, IconYesRadio, provideIcons } from 'harmony-icons';
import { Optional } from '../../utils/utils';
import { ButtonComponent } from '../button/button.component';

export type MessageSoort = 'waarschuwing' | 'info' | 'error' | 'ok' | 'confirm';

@Component({
    selector: 'dt-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ButtonComponent, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconInformatie, IconNoRadio, IconYesRadio, IconSynchroniseren, IconSluiten)]
})
export class MessageComponent implements OnInit, OnDestroy {
    @Input() @HostBinding('attr.soort') soort: MessageSoort = 'info';
    @Input() @HostBinding('class.is-toast') isToast = false;
    @Input() text: Optional<string>;
    @Input() duration: number;
    @Input() closable = true;
    @Input() buttonText: string;
    @Input() gtmTag: string;

    onClose = output<void>();
    onButtonClick = output<void>();

    private isDestroyed = false;

    ngOnInit() {
        if (this.duration) {
            setTimeout(() => !this.isDestroyed && this.onClose.emit(), this.duration);
        }
    }

    ngOnDestroy(): void {
        this.isDestroyed = true;
    }
}
