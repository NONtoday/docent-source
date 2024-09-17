import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';

import { DifferentiatiegroepKleur } from '@docent/codegen';
import { ColorToken, CssVarPipe, IconDirective } from 'harmony';
import { IconName } from 'harmony-icons';
import { differentiatieKleurConverter } from '../../../rooster-shared/utils/color-token-utils';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-kleur-keuze',
    templateUrl: './kleur-keuze.component.html',
    styleUrls: ['./kleur-keuze.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IconDirective, CssVarPipe]
})
export class KleurKeuzeComponent implements OnChanges {
    @HostBinding('style.width.px') width: number;
    @HostBinding('style.height.px') height: number;

    @Input() kleur: DifferentiatiegroepKleur;
    @Input() icon: IconName;
    @Input() content: Optional<string | number>;
    @Input() size: Optional<number>;

    backgroundColor: ColorToken;

    ngOnChanges() {
        this.width = this.height = this.size ?? 24;
        this.backgroundColor = differentiatieKleurConverter[this.kleur].counter;
    }
}
