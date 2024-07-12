import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconInformatie, IconOnderwijs, IconWaarschuwing, provideIcons } from 'harmony-icons';

@Component({
    selector: 'dt-notitie-detail-label',
    standalone: true,
    imports: [IconDirective],
    templateUrl: './notitie-detail-label.component.html',
    styleUrls: ['./notitie-detail-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconOnderwijs, IconInformatie, IconWaarschuwing)]
})
export class NotitieDetailLabelComponent {
    @Input() text: string;
    @Input() withMentorIcon = false;
    @Input() @HostBinding('class.belangrijk') isBelangrijk = false;
    @Input() @HostBinding('class.privacygevoelig') isPrivacygevoelig = false;
    @Input() @HostBinding('class.vak') isVak = false;
    @Input() @HostBinding('class.disabled') disabled = false;
}
