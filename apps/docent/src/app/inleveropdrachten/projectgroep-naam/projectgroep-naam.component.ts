import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Projectgroep } from '@docent/codegen';
import { ColorToken, CssVarPipe } from 'harmony';

@Component({
    selector: 'dt-projectgroep-naam',
    templateUrl: './projectgroep-naam.component.html',
    styleUrls: ['./projectgroep-naam.component.scss'],
    imports: [CssVarPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class ProjectgroepNaamComponent {
    @HostBinding('class.actief') @Input() actief: boolean;
    @HostBinding('class.read-only') @Input() readOnly: boolean;

    @Input() projectgroep: Projectgroep;
    @Input() color: ColorToken = 'text-strong';
}
