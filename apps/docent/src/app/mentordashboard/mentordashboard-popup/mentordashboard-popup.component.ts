import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { AfspraakParticipant, Leerling, MentorleerlingenQuery, PartialLeerlingFragment } from '@docent/codegen';
import { addHours, getISOWeek, startOfHour } from 'date-fns';
import { IconBericht, IconKalenderToevoegen, IconWerkdruk, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { UriService } from '../../auth/uri-service';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { AfspraakSidebarComponent, NieuweAfspraak } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { WerkdrukSidebarComponent } from '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-mentordashboard-popup',
    templateUrl: './mentordashboard-popup.component.html',
    styleUrls: ['./mentordashboard-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, PopupButtonComponent, AsyncPipe],
    providers: [provideIcons(IconBericht, IconWerkdruk, IconKalenderToevoegen)]
})
export class MentordashboardPopupComponent implements OnInit, Popup {
    private uriService = inject(UriService);
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    leerling: PartialLeerlingFragment;
    mentorleerlingen$: Observable<MentorleerlingenQuery['mentorleerlingen']>;

    ngOnInit() {
        this.mentorleerlingen$ = this.medewerkerDataService.getMentorleerlingen();
    }

    onBerichtSturen() {
        window.location.assign(this.uriService.getLeerlingNieuwBerichtLink(this.leerling.leerlingnummer));
    }

    onWerkdruk(mentorLeerlingen: MentorleerlingenQuery['mentorleerlingen']) {
        const schooljaar = getSchooljaar(new Date());
        this.sidebarService.openSidebar(WerkdrukSidebarComponent, {
            initielePeildatum: new Date(),
            initieleLeerlingenContext: [this.leerling],
            eersteWeek: getISOWeek(schooljaar.start) + 1,
            laatsteWeek: getISOWeek(schooljaar.eind),
            mentorLeerlingen
        });
        this.popup.onClose();
    }

    onAfspraakMaken() {
        const begin = addHours(startOfHour(new Date()), 1);
        const afspraak: NieuweAfspraak = {
            begin,
            eind: addHours(begin, 1),
            participantenEigenAfspraak: [
                {
                    leerling: this.leerling as Leerling,
                    medewerker: null,
                    lesgroep: null,
                    stamgroep: null
                } as AfspraakParticipant
            ],
            bijlagen: []
        };
        this.sidebarService.openSidebar(AfspraakSidebarComponent, {
            afspraak,
            bewerkenState: true,
            openDetailBijNieuweAfspraak: true
        });
        this.popupService.closePopUp();
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.appearance.tabletportrait = Appearance.Popout;
        return settings;
    }
}
