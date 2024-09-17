import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { Differentiatiegroep } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconChevronBoven, IconChevronOnder, provideIcons } from 'harmony-icons';
import { KleurKeuzeComponent } from '../../../../rooster-shared/components/kleur-keuze/kleur-keuze.component';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';
import { AvatarNaamComponent } from '../../avatar-naam/avatar-naam.component';

@Component({
    selector: 'dt-differentiatiegroep-form-control',
    templateUrl: './differentiatiegroep-form-control.component.html',
    styleUrls: ['./differentiatiegroep-form-control.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CheckboxComponent,
        KleurKeuzeComponent,
        AvatarNaamComponent,
        VolledigeNaamPipe,
        IconDirective
    ],
    providers: [provideIcons(IconChevronBoven, IconChevronOnder)]
})
export class DifferentiatiegroepFormControlComponent {
    @Input() differentiatiegroep: Differentiatiegroep;
    @Input() controlName: string;
    @Input() formGroup: UntypedFormGroup;

    isOpen = false;
}
