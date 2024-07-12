import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpinnerComponent } from 'harmony';
import {
    IconArchief,
    IconExamendossier,
    IconInleveropdracht,
    IconNotitieboek,
    IconReactieToevoegen,
    IconResultaten,
    IconSmiley,
    IconWerkdruk,
    provideIcons
} from 'harmony-icons';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Leerling } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { Appearance } from '../../core/popup/popup.settings';
import { LeerlingDataService } from '../../core/services/leerling-data.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';

@Component({
    selector: 'dt-leerling-deeplink-popup',
    templateUrl: './leerling-deeplink-popup.component.html',
    styleUrls: ['./leerling-deeplink-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, AsyncPipe, PopupButtonComponent, RouterModule, SpinnerComponent],
    providers: [
        provideIcons(
            IconReactieToevoegen,
            IconNotitieboek,
            IconSmiley,
            IconResultaten,
            IconExamendossier,
            IconArchief,
            IconWerkdruk,
            IconInleveropdracht
        )
    ]
})
export class LeerlingDeeplinkPopupComponent implements Popup, OnInit {
    private leerlingDataService = inject(LeerlingDataService);
    private uriService = inject(UriService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    leerling: Leerling;

    loading = true;
    heeftExamendossier: boolean;
    heeftToegangTotEloEnSw$: Observable<boolean>;
    toonWerkdruk = true;
    notitieboekToegankelijk = false;
    toonNieuweNotitie = false;

    @Input() onWerkdrukClickedCallback: () => void;
    @Input() onNieuweNotitieClickedCallback: () => void;

    ngOnInit() {
        this.leerlingDataService
            .heeftExamendossier(this.leerling.id)
            .pipe(take(1))
            .subscribe((result) => {
                this.heeftExamendossier = result;
                this.loading = false;
            });

        this.heeftToegangTotEloEnSw$ = this.medewerkerDataService.heeftToegangTotEloEnSw();
    }

    private deeplinkToCore(urlSuffix: string) {
        window.location.assign(this.uriService.getLeerlingLink(this.leerling.leerlingnummer, urlSuffix));
    }

    onNieuweNotitie() {
        this.onNieuweNotitieClickedCallback?.();
    }

    onLeerlingkaart() {
        this.deeplinkToCore('kaart');
    }

    onWerkdruk() {
        this.onWerkdrukClickedCallback?.();
    }

    onVoortgangsdossier() {
        this.deeplinkToCore('resultaten');
    }

    onExamendossier() {
        this.deeplinkToCore('examenresultaten');
    }

    onInleveringen() {
        this.deeplinkToCore('inleveringen');
    }

    onZorgvierkant() {
        this.deeplinkToCore('begeleiding');
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 312;
        settings.appearance.tabletportrait = Appearance.Popout;
        return settings;
    }
}
