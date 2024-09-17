import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { Leerling } from '@docent/codegen';
import { differenceInCalendarDays, differenceInYears, isLeapYear } from 'date-fns';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
@Component({
    selector: 'dt-jarige-leerling',
    templateUrl: './jarige-leerling.component.html',
    styleUrls: ['./jarige-leerling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, VolledigeNaamPipe, DtDatePipe]
})
export class JarigeLeerlingComponent implements OnChanges {
    @Input() leerling: Leerling;

    public leeftijd = '';
    public verjaardag: Date | null;

    ngOnChanges() {
        if (this.leerling.geboortedatum) {
            this.verjaardag = this.geboorteDagInHuidigeWeek(this.leerling.geboortedatum);
            const geboorteDagDitJaar = new Date(this.leerling.geboortedatum).setFullYear(new Date().getFullYear());
            const moetNogJarigWorden = geboorteDagDitJaar ? differenceInCalendarDays(geboorteDagDitJaar, new Date()) > 0 : false;
            this.leeftijd = String(differenceInYears(new Date(), this.leerling.geboortedatum) + (moetNogJarigWorden ? 1 : 0));
        }
    }

    public geboorteDagInHuidigeWeek(geboorteDatum: Date) {
        // Wanneer een geboortedatum op 29 feb valt en het dit jaar geen leap year is,
        // renderen de we dagnaam niet, want deze bestaat niet in het huidige jaar
        if (geboorteDatum.getDate() === 29 && geboorteDatum.getMonth() === 1 && !isLeapYear(new Date())) return null;
        const geboorteDatumDitJaar = new Date(geboorteDatum);
        geboorteDatumDitJaar.setFullYear(new Date().getFullYear());
        return geboorteDatumDitJaar;
    }
}
