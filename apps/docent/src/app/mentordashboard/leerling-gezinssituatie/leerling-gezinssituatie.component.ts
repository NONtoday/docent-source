import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';

@Component({
    selector: 'dt-leerling-gezinssituatie',
    templateUrl: './leerling-gezinssituatie.component.html',
    styleUrls: ['./leerling-gezinssituatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AccordionComponent]
})
export class LeerlingGezinssituatieComponent {
    @Input() opmerking: string;
}
