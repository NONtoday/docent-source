import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconDirective } from '../icon/icon.directive';
import { PillTagColor, PillTagType } from '../pill-tag/pill-tag.model';
import { InternalTagComponent } from './internal-tag/internal-tag.component';
import { TagIcon } from './tag.component';

@Component({
    selector: 'hmy-avatar-tag',
    standalone: true,
    imports: [AvatarComponent, CommonModule, InternalTagComponent, IconDirective],
    template: `<hmy-internal-tag
        [type]="type"
        [color]="color"
        [size]="size"
        [label]="label"
        [icon]="actionIcon"
        (iconClick)="iconClick.emit()"
        ><hmy-avatar [src]="src" [naam]="naam" [initialen]="initialen" [lazyLoading]="lazyLoading" />
    </hmy-internal-tag>`,
    // TODO: mooier zou nog zijn om de initials-kleuren afhankelijk te maken van de tag input color. Dit werkt nu alleen goed voor color=primary.
    // Misschien in de toekomst een avatar-tag specifieke variant van de mixins in pill-tag-mode.scss optuigen.
    styles: [
        `
            hmy-avatar {
                --size: 24px;
                --border-radius: 50%;
                --initials-font: var(--body-content-smallest-bold);
                --initials-color: var(--fg-on-primary-normal);
                --initials-background-color: var(--bg-primary-normal);
            }
        `
    ],
    styleUrls: ['../pill-tag/pill-tag-mode.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarTagComponent {
    @Input({ required: true }) public label: string;
    @Input() public type: PillTagType = 'light';
    @Input() public color: PillTagColor = 'primary';
    @Input() public size: 'big' | 'small' = 'small';
    @Input() public actionIcon: TagIcon = 'none';

    @Input() public src: string | null | undefined;
    @Input() public naam: string | undefined;
    @Input() public initialen: string | undefined;
    @Input() public lazyLoading = false;

    public iconClick = output<void>();
}
