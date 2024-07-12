import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconDirective } from 'harmony';
import {
    IconBewerken,
    IconChevronRechts,
    IconKalender,
    IconKalenderDag,
    IconNormaleToets,
    IconResultaten,
    IconSamengesteldeToets,
    IconToets,
    IconToevoegen,
    IconVerversen,
    IconWeging,
    provideIcons
} from 'harmony-icons';
import { join } from 'lodash-es';
import {
    BevrorenStatus,
    Deeltoetskolom,
    KolomActie,
    MatrixResultaatkolomFieldsFragment,
    ResultaatkolomType,
    SamengesteldeToetskolom,
    Toetskolom
} from '../../../generated/_types';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional, notEmpty } from '../../rooster-shared/utils/utils';
import { DeeltoetsComponent } from '../deeltoets/deeltoets.component';
import { GeslotenStatusComponent } from '../gesloten-status/gesloten-status.component';
import { HerkansingNaamPipe } from '../pipes/herkansing-naam.pipe';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatService } from '../resultaat.service';
import { isKolomOfType } from '../resultaten.utils';

@Component({
    selector: 'dt-toetskolom-detail',
    templateUrl: './toetskolom-detail.component.html',
    styleUrls: ['./toetskolom-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        GeslotenStatusComponent,
        BackgroundIconComponent,
        DeeltoetsComponent,
        VerwijderButtonComponent,
        OutlineButtonComponent,
        DtDatePipe,
        HerkansingNaamPipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconSamengesteldeToets,
            IconNormaleToets,
            IconChevronRechts,
            IconKalender,
            IconToets,
            IconVerversen,
            IconResultaten,
            IconWeging,
            IconKalenderDag,
            IconToevoegen,
            IconBewerken
        )
    ]
})
export class ToetskolomDetailComponent implements OnChanges {
    private resultaatService = inject(ResultaatService);
    private resultaatDataService = inject(ResultaatDataService);
    private route = inject(ActivatedRoute);
    @Input() matrixKolom: MatrixResultaatkolomFieldsFragment;
    @Input() toonDomeinvelden: boolean;
    @Input() isGeimporteerd: boolean;

    onBewerkenClick = output<void>();
    onVerwijderenClick = output<void>();
    onLesgroepOmschrijvingWijzigenClick = output<void>();
    onDeeltoetsToevoegenClick = output<void>();
    onSwitchDetail = output<any>();
    onDeeltoetsVerwijderen = output<Deeltoetskolom>();

    kolom: Toetskolom;
    isSamengesteldeToets: boolean;
    isDeeltoets: boolean;
    magBewerken: boolean;
    magVerwijderen: boolean;
    magLesgroepOmschrijvingWijzigen: boolean;
    magDeeltoetsToevoegen: boolean;

    heeftDomeinvelden: boolean;
    domeinomschrijving: string;
    heeftDomeinomschrijving: boolean;

    samengesteldeToets: Optional<MatrixResultaatkolomFieldsFragment>;
    deeltoetsen: Optional<MatrixResultaatkolomFieldsFragment[]>;

    geslotenKolom: boolean;

    ngOnChanges() {
        this.kolom = <Toetskolom>this.matrixKolom.resultaatkolom;
        this.setToetstype(this.kolom.type);
        this.magBewerken = this.matrixKolom.toegestaneKolomActies.includes(KolomActie.StructuurWijzigen);
        this.magLesgroepOmschrijvingWijzigen = this.matrixKolom.toegestaneKolomActies.includes(KolomActie.LesgroepOmschrijvingWijzigen);
        this.magDeeltoetsToevoegen = this.matrixKolom.toegestaneKolomActies.includes(KolomActie.DeeltoetsToevoegen);

        if (isKolomOfType<SamengesteldeToetskolom>(this.kolom, ResultaatkolomType.SAMENGESTELDE_TOETS)) {
            this.deeltoetsen = this.resultaatDataService.getDeeltoetskolommen(
                this.lesgroepId!,
                this.resultaatService.voortgangsdossierId,
                this.kolom.id
            );
            this.samengesteldeToets = null;
        } else if (isKolomOfType<Deeltoetskolom>(this.kolom, ResultaatkolomType.DEELTOETS)) {
            this.samengesteldeToets = this.resultaatDataService.getResultaatkolom(
                this.lesgroepId!,
                this.resultaatService.voortgangsdossierId,
                this.kolom.samengesteldeToetskolom.id,
                this.kolom.samengesteldeToetskolom.herkansingsNummer
            );
            this.deeltoetsen = null;
        }

        this.magVerwijderen =
            this.magBewerken &&
            !(this.deeltoetsen && this.deeltoetsen.length > 0) &&
            !this.matrixKolom.resultaten.some(
                (resultaat) =>
                    resultaat.formattedResultaat ||
                    resultaat.formattedResultaatAfwijkendNiveau ||
                    resultaat.resultaatLabel ||
                    resultaat.resultaatLabelAfwijkendNiveau
            );

        this.geslotenKolom = this.kolom.bevrorenStatus !== BevrorenStatus.Ontdooid || this.isGeimporteerd;
        this.heeftDomeinvelden =
            notEmpty(this.kolom.domeincode) ||
            notEmpty(this.kolom.domeinomschrijving) ||
            Boolean(this.kolom.toetsduur) ||
            Boolean(this.kolom.toetsvorm) ||
            Boolean(this.kolom.afnamevorm);
        this.domeinomschrijving = join([this.kolom.domeincode, this.kolom.domeinomschrijving].filter(notEmpty), ' - ');
        this.heeftDomeinomschrijving = notEmpty(this.domeinomschrijving);
    }

    verwijderDeeltoets(deeltoets: Deeltoetskolom) {
        this.onDeeltoetsVerwijderen.emit(deeltoets);
        this.deeltoetsen = this.deeltoetsen?.filter((matrix) => matrix.resultaatkolom.id !== deeltoets.id);
    }

    private setToetstype(type: ResultaatkolomType) {
        this.isSamengesteldeToets = type === ResultaatkolomType.SAMENGESTELDE_TOETS;
        this.isDeeltoets = type === ResultaatkolomType.DEELTOETS;
    }

    private get lesgroepId() {
        return this.route.snapshot.paramMap.get('id');
    }
}
