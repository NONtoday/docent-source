import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-avatar-naam',
    template: ` <dt-avatar [src]="avatarUrl" [initialen]="initialen" [size]="32" [fontsize]="12"></dt-avatar>
        <span class="naam text-content-semi text-moderate">{{ naam }}</span>`,
    styleUrls: ['./avatar-naam.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent]
})
export class AvatarNaamComponent {
    @Input() naam: string;
    @Input() avatarUrl: Optional<string>;
    @Input() initialen: string;
}
