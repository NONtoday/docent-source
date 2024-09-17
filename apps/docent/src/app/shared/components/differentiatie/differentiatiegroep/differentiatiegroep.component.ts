import { CdkDrag, CdkDragHandle, CdkDragPlaceholder } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { Differentiatiegroep, Leerling } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconDraggable, IconToevoegen, provideIcons } from 'harmony-icons';
import { IconComponent } from '../../../../rooster-shared/components/icon/icon.component';
import { LeerlingGroepComponent } from '../../leerling-groep/leerling-groep.component';
import { DifferentiatiegroepHeaderComponent } from '../differentiatiegroep-header/differentiatiegroep-header.component';

@Component({
    selector: 'dt-differentiatiegroep',
    templateUrl: './differentiatiegroep.component.html',
    styleUrls: ['./differentiatiegroep.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        DifferentiatiegroepHeaderComponent,
        LeerlingGroepComponent,
        CdkDrag,
        CdkDragPlaceholder,
        IconComponent,
        CdkDragHandle,
        IconDirective
    ],
    providers: [provideIcons(IconToevoegen, IconDraggable)]
})
export class DifferentiatiegroepComponent {
    @Input() differentiatiegroep: Differentiatiegroep;
    onLeerlingenToevoegen = output<void>();
    saveDifferentiatiegroep = output<Differentiatiegroep>();
    deleteDifferentiatiegroep = output<Differentiatiegroep>();
    onVerwijderLeerling = output<Leerling>();
}
