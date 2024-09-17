import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { Differentiatiegroep, Leerling } from '@docent/codegen';
import { IconGroep, provideIcons } from 'harmony-icons';
import { equalsId } from '../../../../rooster-shared/utils/utils';
import { DifferentiatiegroepComponent } from '../differentiatiegroep/differentiatiegroep.component';

export interface DifferentiatieLeerlingDropData {
    leerling: Leerling;
    van: Differentiatiegroep;
    naar: Differentiatiegroep;
}

@Component({
    selector: 'dt-differentiatiegroepen',
    templateUrl: './differentiatiegroepen.component.html',
    styleUrls: ['./differentiatiegroepen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CdkDropListGroup, DifferentiatiegroepComponent, CdkDropList],
    providers: [provideIcons(IconGroep)]
})
export class DifferentiatiegroepenComponent {
    @Input() differentiatiegroepen: Differentiatiegroep[];

    saveDifferentiatiegroep = output<Differentiatiegroep>();
    deleteDifferentiatiegroep = output<Differentiatiegroep>();
    onLeerlingenToevoegen = output<Differentiatiegroep>();
    onLeerlingVerplaatst = output<DifferentiatieLeerlingDropData>();
    onVerwijderLeerling = output<{
        leerling: Leerling;
        differentiatiegroep: Differentiatiegroep;
    }>();

    trackById(index: number, item: Differentiatiegroep) {
        return item.id;
    }

    leerlingVerplaatst(dragDropData: any) {
        const van = dragDropData.previousContainer.data;
        const naar = dragDropData.container.data;
        if (van.id !== naar.id) {
            this.onLeerlingVerplaatst.emit({
                leerling: dragDropData.item.data,
                van,
                naar
            });
        }
    }

    bevatLeerlingNiet = (item: CdkDrag<Leerling>, drop: CdkDropList<Differentiatiegroep>) => {
        const leerlingen = drop.data.leerlingen ?? [];
        return !leerlingen.some(equalsId(item.data.id));
    };
}
