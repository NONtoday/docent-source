import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { isWeekend } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconToets, IconToetsGroot, provideIcons } from 'harmony-icons';
import { HuiswerkType, Registratie } from '../../../../../generated/_types';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';

@Component({
    selector: 'dt-registraties-verloop-dag',
    standalone: true,
    imports: [CommonModule, DtDatePipe, IconDirective],
    templateUrl: './registraties-verloop-dag.component.html',
    styleUrl: './registraties-verloop-dag.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconToets, IconToetsGroot)]
})
export class RegistratiesVerloopDagComponent {
    private readonly maxHeight = 88;
    datum = input.required<Date>();
    registraties = input.required<Registratie[]>();

    aantalRegistraties = computed(() => this.registraties().length);
    height = computed(() => (this.aantalRegistraties() > 0 ? Math.min(24 + (this.aantalRegistraties() - 1) * 8, this.maxHeight) : 0));
    isWeekend = computed(() => isWeekend(this.datum()));
    heeftToets = computed(() =>
        this.registraties().some((registratie) => registratie.roosterToets || registratie.toetsmoment === HuiswerkType.TOETS)
    );
    heefGroteToets = computed(() => this.registraties().some((registratie) => registratie.toetsmoment === HuiswerkType.GROTE_TOETS));
}
