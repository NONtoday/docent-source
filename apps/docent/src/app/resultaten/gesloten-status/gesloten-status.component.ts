import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { BevrorenStatus, RapportCijferkolom, Resultaatkolom } from '@docent/codegen';
import { IconDirective, IconPillComponent } from 'harmony';
import { IconName, IconSlot, IconSlotOpen, provideIcons } from 'harmony-icons';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-gesloten-status',
    templateUrl: './gesloten-status.component.html',
    styleUrls: ['./gesloten-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective, IconPillComponent],
    providers: [provideIcons(IconSlot, IconSlotOpen)]
})
export class GeslotenStatusComponent implements OnChanges {
    @Input() kolom: Optional<Resultaatkolom>;
    @Input() magBekoeldeResultatenBewerken: boolean;
    @Input() geimporteerdeToets: boolean;

    icon: IconName;
    geslotenTekst = '';

    ngOnChanges(): void {
        const bekoeldEnBewerkbaar = this.kolom?.bevrorenStatus === BevrorenStatus.Bekoeld && this.magBekoeldeResultatenBewerken;
        const vastgezet = (<RapportCijferkolom>this.kolom)?.vastgezet;
        const bekoeldOfBevroren = this.kolom?.bevrorenStatus !== BevrorenStatus.Ontdooid;

        this.icon = this.geimporteerdeToets || vastgezet || !bekoeldEnBewerkbaar ? 'slot' : 'slotOpen';

        if (this.geimporteerdeToets) {
            this.geslotenTekst = `Geïmporteerde toets`;
        } else if (vastgezet && bekoeldOfBevroren) {
            this.geslotenTekst = `${this.kolom?.bevrorenStatus} en vastgezet`;
        } else if (bekoeldOfBevroren) {
            this.geslotenTekst = `Toetskolom ${this.kolom?.bevrorenStatus.toLowerCase()}`;
        } else if (vastgezet) {
            this.geslotenTekst = `Rapportcijfer is vastgezet`;
        }
    }
}
