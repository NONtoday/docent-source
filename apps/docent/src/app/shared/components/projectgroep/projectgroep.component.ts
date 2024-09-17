import { CdkDrag, CdkDragHandle, CdkDragPlaceholder } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { Leerling, ProjectgroepFieldsFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconDraggable, IconToevoegen, provideIcons } from 'harmony-icons';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { notEqualsId } from '../../../rooster-shared/utils/utils';
import { LeerlingGroepComponent } from '../leerling-groep/leerling-groep.component';
import { ProjectgroepHeaderComponent } from '../projectgroep-header/projectgroep-header.component';

@Component({
    selector: 'dt-projectgroep',
    templateUrl: './projectgroep.component.html',
    styleUrls: ['./projectgroep.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        ProjectgroepHeaderComponent,
        LeerlingGroepComponent,
        CdkDrag,
        CdkDragPlaceholder,
        IconComponent,
        CdkDragHandle,
        IconDirective
    ],
    providers: [provideIcons(IconToevoegen, IconDraggable)]
})
export class ProjectgroepComponent {
    @Input() projectgroep: ProjectgroepFieldsFragment;
    @Input() toonToevoegenKnop: boolean;

    saveProjectgroep = output<ProjectgroepFieldsFragment>();
    openLeerlingSelectie = output<void>();
    deleteProjectgroep = output<ProjectgroepFieldsFragment>();

    addLeerlingen() {
        this.openLeerlingSelectie.emit();
    }

    removeLeerling(leerling: Partial<Leerling>) {
        this.saveProjectgroep.emit({
            ...this.projectgroep,
            leerlingen: this.projectgroep.leerlingen.filter(notEqualsId(leerling.id!))
        });
    }

    trackById(index: number, item: ProjectgroepFieldsFragment['leerlingen'][number]) {
        return item.id;
    }
}
