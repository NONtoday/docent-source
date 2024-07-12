import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconChevronBoven, IconChevronOnder, provideIcons } from 'harmony-icons';
import { Differentiatiegroep } from '../../../../../generated/_types';
import { FormCheckboxComponent } from '../../../../rooster-shared/components/form-checkbox/form-checkbox.component';
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
        FormCheckboxComponent,
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
