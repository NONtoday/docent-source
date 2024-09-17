import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { AfspraakParticipant } from '@docent/codegen';
import { IconName, IconZoeken, provideIcons } from 'harmony-icons';
import { map, take } from 'rxjs/operators';
import { UriService } from '../../../auth/uri-service';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeelnemerSelectieComponent } from '../deelnemer-selectie/deelnemer-selectie.component';
import { Popup, PopupComponent } from '../popup/popup.component';

@Component({
    selector: 'dt-zoek-popup',
    templateUrl: './zoek-popup.component.html',
    styleUrls: ['./zoek-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, DeelnemerSelectieComponent, FormsModule, ReactiveFormsModule],
    providers: [provideIcons(IconZoeken)]
})
export class ZoekPopupComponent implements OnInit, Popup {
    private uriService = inject(UriService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    deelnemerSelectie = new UntypedFormControl();
    iconZoeken: IconName = 'zoeken';

    ngOnInit(): void {
        this.deelnemerSelectie.valueChanges
            .pipe(
                map((afspraakParticipanten: AfspraakParticipant[]) => afspraakParticipanten[0]),
                take(1)
            )
            .subscribe((afspraakParticipant: AfspraakParticipant) => {
                let deeplink: string;

                if (afspraakParticipant.leerling) {
                    deeplink = this.uriService.getDeepLinkUrl(`/leerling/${afspraakParticipant.leerling.leerlingnummer}/kaart`);
                } else if (afspraakParticipant.lesgroep) {
                    deeplink = this.uriService.getDeepLinkUrl(`/lesgroep/${afspraakParticipant.lesgroep.id}/samenstelling`);
                } else if (afspraakParticipant.medewerker) {
                    deeplink = this.uriService.getDeepLinkUrl(`/personeel/${afspraakParticipant.medewerker.nummer}/kaart`);
                } else if (afspraakParticipant.stamgroep) {
                    deeplink = this.uriService.getDeepLinkUrl(`/stamgroep/${afspraakParticipant.stamgroep.id}/samenstelling`);
                }

                this.deeplinkToUrl(deeplink!);
                this.popup.onClose();
            });
    }

    mayClose(): boolean {
        return true;
    }

    deeplinkToUrl(deeplink: string) {
        window.location.assign(deeplink);
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Rolldown,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 350;
        popupSettings.height = 100;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.scrollable = true;

        return popupSettings;
    }
}
