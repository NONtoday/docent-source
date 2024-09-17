import { Pipe, PipeTransform } from '@angular/core';
import { HuiswerkType, Studiewijzeritem } from '@docent/codegen';

@Pipe({
    name: 'omschrijvingPlaceholder',
    standalone: true
})
export class OmschrijvingPlaceholderPipe implements PipeTransform {
    transform(studiewijzeritem: Studiewijzeritem): string {
        const huiswerkType = studiewijzeritem.huiswerkType;
        if (studiewijzeritem.conceptInleveropdracht || studiewijzeritem.inleverperiode) {
            return 'Wat ga je behandelen in deze opdracht?';
        } else if (huiswerkType === HuiswerkType.HUISWERK) {
            return 'Welk huiswerk geef je op?';
        } else if (huiswerkType === HuiswerkType.TOETS || huiswerkType === HuiswerkType.GROTE_TOETS) {
            return 'Wat ga je behandelen deze toets?';
        }

        return 'Wat ga je behandelen deze les?';
    }
}
