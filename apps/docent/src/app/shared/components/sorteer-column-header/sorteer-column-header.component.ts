import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';

import { IconDirective } from 'harmony';
import { IconAZ, IconPijlKleinOnder, IconZA, provideIcons } from 'harmony-icons';
import { NgStringPipesModule } from 'ngx-pipes';
import { SorteerOrder } from '../../../core/models/inleveropdrachten/inleveropdrachten.model';

@Component({
    selector: 'dt-sorteer-column-header',
    templateUrl: './sorteer-column-header.component.html',
    styleUrls: ['./sorteer-column-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgStringPipesModule, IconDirective],
    providers: [provideIcons(IconAZ, IconZA, IconPijlKleinOnder)]
})
export class SorteerColumnHeaderComponent implements OnChanges {
    @HostBinding('class.active') isActive: boolean;

    @Input() label: string;
    @Input() activeSortHeader: string;
    @Input() activeOrder: SorteerOrder;

    ngOnChanges(): void {
        this.isActive = this.label === this.activeSortHeader;
    }
}
