import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, output } from '@angular/core';
import { match } from 'ts-pattern';
import { NotificationCounterComponent } from '../notification/notification-counter/notification-counter.component';
import { NotificationColor } from '../notification/notification.model';
import { PillTagColor, PillTagType } from '../pill-tag/pill-tag.model';
import { InternalTagComponent } from './internal-tag/internal-tag.component';
import { TagIcon } from './tag.component';

// TODO: Dit component is nog niet af. Het is een voorbeeld van hoe het internal tag component herbruikt zou kunnen worden.
@Component({
    selector: 'hmy-counter-tag',
    standalone: true,
    imports: [CommonModule, InternalTagComponent, NotificationCounterComponent],
    template: `<hmy-internal-tag [type]="type" [color]="color" [size]="size" [label]="label" [icon]="icon" (iconClick)="iconClick.emit()"
        ><hmy-notification-counter [color]="counterColor" [count]="count" [size]="16"
    /></hmy-internal-tag>`,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterTagComponent implements OnChanges {
    @Input({ required: true }) public label: string;
    @Input() public type: PillTagType = 'light';
    @Input() public color: PillTagColor = 'primary';
    @Input() public size: 'big' | 'small' = 'small';
    @Input() public count = 0;
    @Input() public icon: TagIcon = 'none';

    counterColor: NotificationColor;

    public iconClick = output<void>();

    public ngOnChanges(): void {
        this.counterColor = match(this.color)
            .returnType<NotificationColor>()
            .with('primary-strong', () => 'primary')
            .with('disabled', () => 'primary')
            .otherwise((mode) => mode);
    }
}
