import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, ViewContainerRef, inject } from '@angular/core';
import {
    BevrorenStatus,
    MatrixResultaatkolomFieldsFragment,
    RapportCijferkolom,
    Resultaat,
    ResultaatkolomType,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '@docent/codegen';
import { slideInRightOnEnterAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { IconDirective } from 'harmony';
import {
    IconKlok,
    IconLetOp,
    IconPersoon,
    IconReactieToevoegen,
    IconReacties,
    IconSlot,
    IconSlotOpen,
    IconWaarschuwing,
    provideIcons
} from 'harmony-icons';
import { isEmpty, memoize } from 'lodash-es';
import { map, switchMap, take } from 'rxjs';
import { PopupService } from '../../core/popup/popup.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { equalsId } from '../../rooster-shared/utils/utils';
import { CijferhistoriePopupComponent } from '../cijferhistorie-popup/cijferhistorie-popup.component';
import { OpmerkingPopupComponent } from '../opmerking-popup/opmerking-popup.component';
import { getResultaatKey } from '../pipes/resultaat-key.pipe';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatBerekeningResultMetIcon, ResultaatService } from '../resultaat.service';
import { BasisResultaat, getGecombineerdeTooltip, isKolomOfType, isOverschrevenRapportCijfer } from '../resultaten.utils';

@Component({
    selector: 'dt-toetskolom-icons',
    templateUrl: './toetskolom-icons.component.html',
    styleUrls: ['./toetskolom-icons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInRightOnEnterAnimation({ duration: 200 })],
    standalone: true,
    imports: [TooltipDirective, AsyncPipe, IconDirective],
    providers: [
        provideIcons(IconSlot, IconSlotOpen, IconReacties, IconPersoon, IconLetOp, IconKlok, IconReactieToevoegen, IconWaarschuwing)
    ]
})
export class ToetskolomIconsComponent implements OnChanges {
    public resultaatService = inject(ResultaatService);
    private resultaatDataService = inject(ResultaatDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private medewerkerDataService = inject(MedewerkerDataService);
    @HostBinding('class.active') @Input() isActiveCell: boolean;

    @Input() basisResultaat: BasisResultaat;
    @Input() leerling: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'][number];
    @Input() matrixKolom: MatrixResultaatkolomFieldsFragment;
    @Input() lesgroepId: string;
    @Input() alternatiefNiveau: boolean;
    @Input() magResultatenInvoeren: boolean;
    @Input() magOpmerkingToevoegen: boolean;

    public cellId: string;
    public toetskolomGesloten: boolean;
    public bekoeldEnBewerkbaar: boolean;
    public heeftBestaandeOpmerking: boolean;
    public heeftZichtbaarStatusIcon: boolean;
    public toetsNietGemaakt: boolean;
    public cijferhistorieTonen: boolean;
    public overschrevenRapportcijfer: boolean;
    public vastgezet = false;

    public getCellTooltipFn = memoize(getGecombineerdeTooltip, (...args) => JSON.stringify(args));

    ngOnChanges() {
        this.cellId = getResultaatKey(this.matrixKolom.id, this.leerling.uuid, this.matrixKolom.herkansingsNummer);

        const resultaatkolom = this.matrixKolom.resultaatkolom;
        this.toetskolomGesloten =
            resultaatkolom.bevrorenStatus !== BevrorenStatus.Ontdooid ||
            resultaatkolom.type === ResultaatkolomType.RAPPORT_TOETS ||
            !!this.matrixKolom.resultaatAnderVakKolom;
        this.bekoeldEnBewerkbaar = resultaatkolom.bevrorenStatus === BevrorenStatus.Bekoeld && this.magResultatenInvoeren;
        this.heeftBestaandeOpmerking = !isEmpty(this.basisResultaat.resultaat?.opmerkingen);
        this.toetsNietGemaakt =
            this.basisResultaat.missendeToets &&
            isKolomOfType(resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS, ResultaatkolomType.RAPPORT_CIJFER);
        this.cijferhistorieTonen = !isKolomOfType(resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS);
        this.vastgezet = (<RapportCijferkolom>resultaatkolom).vastgezet;
        this.overschrevenRapportcijfer = isOverschrevenRapportCijfer(resultaatkolom, this.basisResultaat.resultaat, this.alternatiefNiveau);

        this.heeftZichtbaarStatusIcon =
            !this.isActiveCell &&
            (this.toetskolomGesloten ||
                this.bekoeldEnBewerkbaar ||
                this.toetsNietGemaakt ||
                this.vastgezet ||
                this.overschrevenRapportcijfer ||
                this.heeftBestaandeOpmerking);
    }

    getErrorVanCell = (cellen: ResultaatBerekeningResultMetIcon[]): ResultaatBerekeningResultMetIcon =>
        cellen.find(
            (cell) =>
                getResultaatKey(cell.resultaatKey.resultaatkolomId, cell.resultaatKey.leerlingUUID, cell.resultaatKey.herkansingsNummer) ===
                this.cellId
        )!;

    createOrEditOpmerking() {
        const schooljaar = getYear(getSchooljaar(new Date()).start);

        this.medewerkerDataService
            .getLesgroepenVanSchooljaar(schooljaar)
            .pipe(
                map((lesgroepen) => lesgroepen.find(equalsId(this.lesgroepId))),
                switchMap((lesgroep) => this.medewerkerDataService.resultaatOpmerkingTonenInELOToegestaan(lesgroep?.vestigingId)),
                take(1)
            )
            .subscribe((opmerkingToegestaan) => {
                const resultaat: Resultaat = this.basisResultaat.resultaat ?? {
                    cellId: this.cellId,
                    leerlingUUID: this.leerling.uuid,
                    rapportCijferEnOverschreven: false,
                    rapportCijferEnOverschrevenAfwijkendNiveau: false,
                    toonOpmerkingInELO: false,
                    opmerkingen: null
                };
                const settings = OpmerkingPopupComponent.defaultPopupsettings;
                settings.onCloseFunction = () => this.resultaatService.activeCell$.next(null);
                const popup = this.popupService.popup(this.viewContainerRef, settings, OpmerkingPopupComponent);
                popup.isZichtbaar = resultaat.toonOpmerkingInELO;
                popup.opmerkingen = resultaat.opmerkingen;
                popup.opmerkingInELOTonenToegestaan = opmerkingToegestaan;
                popup.onBewerken = (opmerkingen: string, isZichtbaar: boolean) => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroepId,
                        resultaat.cellId,
                        opmerkingen,
                        isZichtbaar
                    );
                    this.popupService.closePopUp();
                };
                popup.onVerwijderen = () => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroepId,
                        this.cellId,
                        null,
                        false
                    );
                    popup.popup.onClose();
                };
            });
    }

    openCijferhistorie() {
        const popupSettings = CijferhistoriePopupComponent.defaultPopupsettings;

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, CijferhistoriePopupComponent);
        popup.cellId = this.cellId;
        popup.alternatiefNiveau = this.alternatiefNiveau;
    }
}
