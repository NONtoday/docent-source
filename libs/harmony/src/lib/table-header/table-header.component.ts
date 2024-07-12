import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, computed, signal } from '@angular/core';
import { IconAZ, IconName, IconPijlKleinBoven, IconPijlKleinOnder, IconZA, provideIcons } from 'harmony-icons';
import { match } from 'ts-pattern';
import { IconDirective } from '../icon/icon.directive';

type SortOrder = 'asc' | 'desc';
type SortIcon = 'none' | 'arrow' | 'arrow-az';

@Component({
    selector: 'hmy-table-header',
    standalone: true,
    imports: [CommonModule, IconDirective],
    template: `
        <span class="label">{{ label }} </span>
        <i class="sort-icon" *ngIf="icon() as icon" [hmyIcon]="icon" size="smallest"></i>
    `,
    styleUrls: ['./table-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconPijlKleinBoven, IconPijlKleinOnder, IconAZ, IconZA)]
})
export class TableHeaderComponent {
    @Input({ required: true }) label: string;
    @Input({ required: true }) @HostBinding('class.is-active') isActive: boolean;
    _sortDirection = signal<SortOrder>('asc');

    /**
     *  Elevated is wanneer het element in de ui hoger staat, bv in een sidebar of popup.
     *  in de praktijk vertaalt dit zich naar een andere background-color.
     *  De reden dat het via een input wordt gedaan ipv een css var, is omdat dit component
     *  gebruikt wordt via content projection, waardoor de styling niet kan worden toegepast (zonder ::ng-deep)
     */
    @Input() @HostBinding('class.is-elevated') elevated = false;

    @Input() set sortDirection(sortDirection: SortOrder) {
        this._sortDirection.set(sortDirection);
    }

    _sortIcon = signal<SortIcon>('none');
    @Input() set sortIcon(sortIcon: SortIcon) {
        this._sortIcon.set(sortIcon);
    }

    icon = computed(() =>
        match(this._sortIcon())
            .returnType<IconName | null>()
            .with('none', () => null)
            .with('arrow', () => (this._sortDirection() === 'asc' ? 'pijlKleinBoven' : 'pijlKleinOnder'))
            .with('arrow-az', () => (this._sortDirection() === 'asc' ? 'aZ' : 'zA'))
            .exhaustive()
    );
}
