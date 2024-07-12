import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';

import { IconDirective } from 'harmony';
import { IconName } from 'harmony-icons';
import { DifferentiatiegroepKleur } from '../../../../generated/_types';
import { differentieKleurConverter, HarmonyColor } from '../../colors';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-kleur-keuze',
    templateUrl: './kleur-keuze.component.html',
    styleUrls: ['./kleur-keuze.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective]
})
export class KleurKeuzeComponent implements OnChanges {
    @HostBinding('style.width.px') width: number;
    @HostBinding('style.height.px') height: number;

    @Input() kleur: DifferentiatiegroepKleur;
    @Input() icon: IconName;
    @Input() content: Optional<string | number>;
    @Input() size: Optional<number>;

    backgroundColor: HarmonyColor;

    ngOnChanges() {
        this.width = this.height = this.size ?? 24;
        this.backgroundColor = differentieKleurConverter[this.kleur].counter;
    }
}
