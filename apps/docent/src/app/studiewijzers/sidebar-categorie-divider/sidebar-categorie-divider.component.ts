import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'dt-sidebar-categorie-divider',
    template: `<span>{{ naam }}</span>`,
    styleUrls: ['./sidebar-categorie-divider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class SidebarCategorieDividerComponent {
    @Input() naam: string;
}
