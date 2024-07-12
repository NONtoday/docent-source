import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { NotificationSolidComponent } from 'harmony';
import { MentordashboardOverzichtRegistratieVrijVeldCategorie, PartialLeerlingFragment } from '../../../../generated/_types';
import {
    GroepoverzichtRegistratieWithContent,
    MentordashboardOverzichtLeerlingRegistratieWithContent,
    MentordashboardOverzichtTijdspanOptie
} from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AvatarStackComponent } from '../../../shared/components/avatar-stack/avatar-stack.component';
import { isVrijveldCategorie } from '../../mentordashboard.utils';
import { GroepsoverzichtCategoriePopupComponent } from '../groepsoverzicht-categorie-popup/groepsoverzicht-categorie-popup.component';
import { GroepsoverzichtLeerlingComponent } from '../groepsoverzicht-leerling/groepsoverzicht-leerling.component';
import { GroepsoverzichtRegistratieSidebarComponent } from '../groepsoverzicht-registratie-sidebar/groepsoverzicht-registratie-sidebar.component';

export type LeerlingRegistratie = PartialLeerlingFragment & { aantalRegistraties: number };
@Component({
    selector: 'dt-groepsoverzicht-categorie-box',
    standalone: true,
    templateUrl: './groepsoverzicht-categorie-box.component.html',
    styleUrls: ['./groepsoverzicht-categorie-box.component.scss'],
    imports: [AvatarStackComponent, GroepsoverzichtLeerlingComponent, NotificationSolidComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroepsoverzichtCategorieBoxComponent implements OnChanges {
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    @ViewChild('avatarStack', { read: ViewContainerRef }) avatarStackRef: ViewContainerRef;
    @Input({ required: true }) registratie: GroepoverzichtRegistratieWithContent;
    @Input({ required: true }) tijdspan: MentordashboardOverzichtTijdspanOptie;
    leerlingen: PartialLeerlingFragment[] = [];

    ngOnChanges(): void {
        this.leerlingen = this.registratie.leerlingRegistratieTellingen.map((leerling) => ({
            ...leerling.leerling
        }));
    }

    onLeerlingClick(leerling: GroepoverzichtRegistratieWithContent['leerlingRegistratieTellingen'][number]) {
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
    }

    onAvatarStackClick(registratie: GroepoverzichtRegistratieWithContent) {
        const popup = this.popupService.popup(
            this.avatarStackRef,
            GroepsoverzichtCategoriePopupComponent.categoriePopupsettings,
            GroepsoverzichtCategoriePopupComponent
        );
        popup.registratie = registratie;
        popup.tijdspan = this.tijdspan;
    }

    get keuzeLijstWaarde() {
        return (<MentordashboardOverzichtRegistratieVrijVeldCategorie>this.registratie.categorie).keuzelijstWaarde?.waarde;
    }

    get registratieNaam() {
        return isVrijveldCategorie(this.registratie.categorie)
            ? this.registratie.categorie.vrijVeld.naam
            : this.registratie.categorieContent.naam;
    }
}
