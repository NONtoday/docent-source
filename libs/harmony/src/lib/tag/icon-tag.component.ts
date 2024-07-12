import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { IconName } from 'harmony-icons';
import { IconDirective } from '../icon/icon.directive';
import { PillTagColor, PillTagType } from '../pill-tag/pill-tag.model';
import { InternalTagComponent } from './internal-tag/internal-tag.component';
import { TagIcon } from './tag.component';

@Component({
    selector: 'hmy-icon-tag',
    standalone: true,
    imports: [CommonModule, InternalTagComponent, IconDirective],
    template: `<hmy-internal-tag
        [type]="type"
        [color]="color"
        [size]="size"
        [label]="label"
        [icon]="actionIcon"
        (iconClick)="iconClick.emit()"
        ><i class="icon" [hmyIcon]="icon" size="smallest"></i>
    </hmy-internal-tag>`,
    styleUrls: ['../pill-tag/pill-tag-mode.scss'],
    styles: [
        `
            .icon {
                fill: var(--icon-color);
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconTagComponent {
    @Input({ required: true }) public label: string;
    @Input({ required: true }) public icon: IconName;
    @Input() public type: PillTagType = 'light';
    @Input() public color: PillTagColor = 'primary';
    @Input() public size: 'big' | 'small' = 'small';
    @Input() public actionIcon: TagIcon = 'none';

    public iconClick = output<void>();
}
