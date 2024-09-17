import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { GeldendResultaatFieldsFragment, GemistResultaat, MentorDashboardVakPeriodeResultaten, VakToetsTrend } from '@docent/codegen';
import { PopupService } from '../../../../core/popup/popup.service';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { CommaResultPipe } from '../../../../shared/pipes/comma-result.pipe';
import { MentordashboardGemisteToetsenPopupComponent } from '../../../mentordashboard-gemiste-toetsen-popup/mentordashboard-gemiste-toetsen-popup.component';
import { MentordashboardRapportCijferPopupComponent } from '../../../mentordashboard-rapportcijfer-popup/mentordashboard-rapportcijfer-popup.component';
import { MentordashboardResultaatTrendInfoTileComponent } from '../../../mentordashboard-resultaat-trend-info-tile/mentordashboard-resultaat-trend-info-tile.component';
import { MentordashboardSidebarInfoTileComponent } from '../../../mentordashboard-sidebar-info-tile/mentordashboard-sidebar-info-tile.component';

@Component({
    selector: 'dt-leerlingoverzicht-vak-samenvatting-resultaten',
    standalone: true,
    imports: [MentordashboardSidebarInfoTileComponent, MentordashboardResultaatTrendInfoTileComponent, CommaResultPipe],
    templateUrl: './leerlingoverzicht-vak-samenvatting-resultaten.component.html',
    styleUrls: ['./leerlingoverzicht-vak-samenvatting-resultaten.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtVakSamenvattingResultatenComponent {
    private popupService = inject(PopupService);

    @ViewChild('gemisteToetsenTile', { read: ViewContainerRef }) gemisteToetsenTile: ViewContainerRef;
    @ViewChild('rapportCijferTile', { read: ViewContainerRef }) rapportCijferTile: ViewContainerRef;

    @Input({ required: true }) trend: Optional<VakToetsTrend>;
    @Input({ required: true }) gemisteToetsen: GemistResultaat[];
    @Input({ required: true }) resultaten: Optional<MentorDashboardVakPeriodeResultaten>;
    @Input({ required: true }) gemiddeldeSe: Optional<number>;
    @Input({ required: true }) seResultaten: Optional<GeldendResultaatFieldsFragment[]>;
    @Input({ required: true }) isExamen: boolean;

    showAlleResultaten = output<void>();

    readonly gemisteToetsenInfoTooltip = 'Aantal gemiste toetsen binnen het huidige schooljaar.';

    openGemisteToetsenPopup() {
        const popup = this.popupService.popup(
            this.gemisteToetsenTile,
            MentordashboardGemisteToetsenPopupComponent.popupSettings,
            MentordashboardGemisteToetsenPopupComponent
        );
        popup.gemisteToetsen = this.gemisteToetsen;
    }

    openRapportCijferPopup() {
        if (this.resultaten) {
            const popup = this.popupService.popup(
                this.rapportCijferTile,
                MentordashboardRapportCijferPopupComponent.popupSettings,
                MentordashboardRapportCijferPopupComponent
            );
            popup.resultaten = this.resultaten;
        }
    }
}
