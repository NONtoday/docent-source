import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { KeuzelijstWaardeRegistraties, Registratie } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconChevronBoven, provideIcons } from 'harmony-icons';
import { Optional, sortLocale } from '../../rooster-shared/utils/utils';
import { LeerlingregistratiesDetailRegelComponent } from '../leerlingregistraties-detail-regel/leerlingregistraties-detail-regel.component';

@Component({
    selector: 'dt-leerlingregistraties-detail-lijst',
    templateUrl: './leerlingregistraties-detail-lijst.component.html',
    styleUrls: ['./leerlingregistraties-detail-lijst.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [LeerlingregistratiesDetailRegelComponent, IconDirective],
    providers: [provideIcons(IconChevronBoven)]
})
export class LeerlingregistratiesDetailLijstComponent implements OnChanges {
    @Input() registraties: Registratie[];
    @Input() keuzelijstWaardeRegistraties: Optional<KeuzelijstWaardeRegistraties[]>;
    @Input() isAfwezigKolom: boolean;

    ngOnChanges() {
        this.registraties = sortLocale(this.registraties, ['beginDatumTijd'], ['desc']);
    }
}
