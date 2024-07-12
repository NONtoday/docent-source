import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconChevronBoven, IconChevronLinks, IconChevronOnder, IconChevronRechts, IconName, provideIcons } from 'harmony-icons';
import { match } from 'ts-pattern';
import { IconDirective } from '../../icon/icon.directive';

@Component({
    selector: 'hmy-floating-scroll-button',
    standalone: true,
    imports: [CommonModule, IconDirective],
    templateUrl: './floating-scroll-button.component.html',
    styleUrl: './floating-scroll-button.component.scss',
    providers: [provideIcons(IconChevronRechts, IconChevronLinks, IconChevronBoven, IconChevronOnder)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingScrollButtonComponent {
    richting = input.required<'links' | 'rechts' | 'boven' | 'onder'>();
    icon = computed(() =>
        match(this.richting())
            .returnType<IconName>()
            .with('links', () => 'chevronLinks')
            .with('rechts', () => 'chevronRechts')
            .with('boven', () => 'chevronBoven')
            .with('onder', () => 'chevronOnder')
            .exhaustive()
    );
}
