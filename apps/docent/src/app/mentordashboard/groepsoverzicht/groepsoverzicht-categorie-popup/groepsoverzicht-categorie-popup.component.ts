import { Component, Input, ViewChild, inject } from '@angular/core';
import { MentordashboardOverzichtRegistratieVrijVeldCategorie } from '@docent/codegen';
import { collapseOnLeaveAnimation, expandOnEnterAnimation } from 'angular-animations';
import { NotificationSolidComponent } from 'harmony';
import {
    GroepoverzichtRegistratieWithContent,
    GroepsoverzichtRegistratieTellingen,
    MentordashboardOverzichtLeerlingRegistratieWithContent,
    MentordashboardOverzichtTijdspanOptie
} from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance } from '../../../core/popup/popup.settings';
import { SidebarService } from '../../../core/services/sidebar.service';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { isVrijveldCategorie } from '../../mentordashboard.utils';
import { GroepsoverzichtLeerlingComponent } from '../groepsoverzicht-leerling/groepsoverzicht-leerling.component';
import { GroepsoverzichtRegistratieSidebarComponent } from '../groepsoverzicht-registratie-sidebar/groepsoverzicht-registratie-sidebar.component';

@Component({
    selector: 'dt-groepsoverzicht-categorie-popup',
    standalone: true,
    imports: [PopupComponent, GroepsoverzichtLeerlingComponent, NotificationSolidComponent],
    templateUrl: './groepsoverzicht-categorie-popup.component.html',
    styleUrls: ['./groepsoverzicht-categorie-popup.component.scss'],
    animations: [collapseOnLeaveAnimation(), expandOnEnterAnimation()]
})
export class GroepsoverzichtCategoriePopupComponent implements Popup {
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input({ required: true }) registratie: GroepoverzichtRegistratieWithContent;
    @Input({ required: true }) tijdspan: MentordashboardOverzichtTijdspanOptie;

    mayClose(): boolean {
        return true;
    }

    public static get categoriePopupsettings() {
        const popupSettings = PopupComponent.defaultPopupsettings;

        popupSettings.height = 460;
        popupSettings.scrollable = true;

        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        return popupSettings;
    }

    get keuzeLijstWaarde() {
        return (<MentordashboardOverzichtRegistratieVrijVeldCategorie>this.registratie.categorie).keuzelijstWaarde?.waarde;
    }

    get registratieNaam() {
        return isVrijveldCategorie(this.registratie.categorie)
            ? this.registratie.categorie.vrijVeld.naam
            : this.registratie.categorieContent.naam;
    }

    onLeerlingClick(leerling: GroepsoverzichtRegistratieTellingen) {
        const leerlingWithContent: MentordashboardOverzichtLeerlingRegistratieWithContent = {
            leerling: leerling.leerling,
            leerlingId: leerling.leerling.id,
            aantalRegistraties: leerling.aantalRegistraties,
            categorie: this.registratie.categorie,
            categorieContent: this.registratie.categorieContent,
            tijdspan: this.tijdspan,
            trend: leerling.trend
        };
        this.sidebarService.openSidebar(GroepsoverzichtRegistratieSidebarComponent, { leerlingRegistratie: leerlingWithContent });
        this.popupService.closePopUp();
    }
}
