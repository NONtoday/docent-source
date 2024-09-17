import { Pipe, PipeTransform } from '@angular/core';
import { DifferentiatiegroepKleur } from '@docent/codegen';
import { PillTagColor } from 'harmony';

const kleurToTagColorConverter: Record<DifferentiatiegroepKleur, PillTagColor> = {
    BLAUW: 'primary',
    GEEL: 'accent',
    GRIJS: 'neutral',
    GROEN: 'positive',
    ORANJE: 'warning',
    PAARS: 'alternative',
    ROOD: 'negative'
};

@Pipe({
    name: 'kleurToTagColor',
    standalone: true
})
export class KleurToTagColorPipe implements PipeTransform {
    transform(color: DifferentiatiegroepKleur): PillTagColor {
        return kleurToTagColorConverter[color];
    }
}
