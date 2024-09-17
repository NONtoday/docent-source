import { Component, Input, ViewChild, inject } from '@angular/core';
import { MentordashboardResultatenInstellingen } from '@docent/codegen';
import { CssVarPipe, NotificationCounterComponent } from 'harmony';
import { LeerlingCijferOverzicht } from '../../../core/models/mentordashboard.model';
import { Appearance } from '../../../core/popup/popup.settings';
import { SidebarService } from '../../../core/services/sidebar.service';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Resultatensoort } from '../../mentordashboard.utils';
import { GroepsoverzichtLeerlingCijferKaartComponent } from '../groepsoverzicht-leerling-cijfer-kaart/groepsoverzicht-leerling-cijfer-kaart.component';
import { GroepsoverzichtResultatenKolom } from '../groepsoverzicht-resultaten-kolom/groepsoverzicht-resultaten-kolom.component';
import { GroepsoverzichtResultatenSidebarComponent } from '../groepsoverzicht-resultaten-sidebar/groepsoverzicht-resultaten-sidebar.component';

@Component({
    selector: 'dt-groepsoverzicht-resultaten-kolom-popup',
    standalone: true,
    imports: [PopupComponent, GroepsoverzichtLeerlingCijferKaartComponent, CssVarPipe, TooltipDirective, NotificationCounterComponent],
    templateUrl: './groepsoverzicht-resultaten-kolom-popup.component.html',
    styleUrls: ['./groepsoverzicht-resultaten-kolom-popup.component.scss']
})
export class GroepsoverzichtResultatenKolomPopupComponent implements Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input({ required: true }) kolom: GroepsoverzichtResultatenKolom;
    @Input({ required: true }) leerlingenCijferOverzichtKolom: LeerlingCijferOverzicht[];
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) tab: Resultatensoort;

    private sidebarService = inject(SidebarService);

    mayClose(): boolean {
        return true;
    }

    trackByLeerlingId(_: number, item: LeerlingCijferOverzicht) {
        return item.leerling.id;
    }

    onLeerlingClick(overzicht: LeerlingCijferOverzicht) {
        this.popup.onClose();
        this.sidebarService.openSidebar(GroepsoverzichtResultatenSidebarComponent, {
            leerlingCijferoverzicht: overzicht,
            resultatenSoort: this.tab
        });
    }

    public static get filterPopupsettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Rollup,
            desktop: Appearance.Rollup
        };

        return popupSettings;
    }
}
