import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { IconDirective, PillComponent } from 'harmony';
import { IconBericht, IconChevronOnder, IconDupliceren, IconInterventies, IconReacties, IconTelefoon, provideIcons } from 'harmony-icons';
import { LeerlingkaartQuery } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { PopupService } from '../../core/popup/popup.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { AdresPipe } from '../../shared/pipes/adres.pipe';
import { IndicatiesSidebarComponent } from '../indicaties-sidebar/indicaties-sidebar.component';
import { addNummerIfDefined } from '../leerling-contactpersonen/leerling-contactpersonen.component';
import { MentordashboardService } from '../mentordashboard.service';
import { Telefoonnummer, TelefoonnummersPopupComponent } from '../telefoonnummers-popup/telefoonnummers-popup.component';

@Component({
    selector: 'dt-leerling-personalia',
    templateUrl: './leerling-personalia.component.html',
    styleUrls: ['./leerling-personalia.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, VolledigeNaamPipe, DtDatePipe, AdresPipe, IconDirective, PillComponent],
    providers: [provideIcons(IconChevronOnder, IconBericht, IconTelefoon, IconInterventies, IconReacties, IconDupliceren)]
})
export class LeerlingPersonaliaComponent implements OnChanges {
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private uriService = inject(UriService);
    private mentordashboardService = inject(MentordashboardService);
    @ViewChild('telefoonButton', { read: ViewContainerRef }) telefoonButtonRef: ViewContainerRef;
    @ViewChild('berichtButton', { read: ViewContainerRef }) berichtButtonRef: ViewContainerRef;
    @ViewChild('indicaties', { read: ViewContainerRef }) indicatiesRef: ViewContainerRef;

    @Input() leerling: LeerlingkaartQuery['leerlingkaart']['leerling'];
    @Input() stamgroep: LeerlingkaartQuery['leerlingkaart']['stamgroep'];
    @Input() opleidingnaam: LeerlingkaartQuery['leerlingkaart']['opleidingnaam'];
    @Input() heeftLeerlingPlaatsingenRegistratiesInzienRecht: Optional<boolean>;
    @Input() indicatiesCounter: number;
    @Input() beperkingen: LeerlingkaartQuery['leerlingkaart']['beperkingen'];
    @Input() interventies: LeerlingkaartQuery['leerlingkaart']['interventies'];
    @Input() hulpmiddelen: LeerlingkaartQuery['leerlingkaart']['hulpmiddelen'];
    @Input() heeftBerichtenRecht: Optional<boolean>;

    telefoonnummers: Telefoonnummer[] = [];
    labels: { label: string; deeplink: string; heeftRecht: boolean; gtmTag: string }[];
    telefoonnummerPopupOpen = false;
    berichtPopupOpen = false;

    ngOnChanges() {
        const telefoonnummers: Telefoonnummer[] = [];
        addNummerIfDefined(telefoonnummers, 'Mobiel', this.leerling.mobielNummer);
        addNummerIfDefined(telefoonnummers, 'Thuis', this.leerling.adres?.telefoonnummer);
        this.telefoonnummers = telefoonnummers;

        this.labels = [
            {
                label: this.stamgroep?.naam ?? '',
                deeplink: this.uriService.getDeepLinkUrl(this.samenstellingUrl),
                heeftRecht: true,
                gtmTag: 'leerlingkaart-samenstellingen'
            },
            {
                label: this.opleidingnaam ?? '',
                deeplink: this.uriService.getDeepLinkUrl(this.plaatsingenUrl),
                heeftRecht: this.heeftLeerlingPlaatsingenRegistratiesInzienRecht ?? false,
                gtmTag: 'leerlingkaart-plaatsingen'
            }
        ];
    }

    openIndicaties() {
        this.sidebarService.openSidebar(IndicatiesSidebarComponent, {
            leerlingId: this.leerling.id,
            beperkingen: this.beperkingen,
            hulpmiddelen: this.hulpmiddelen,
            interventies: this.interventies
        });
    }

    onPhoneNumberClick() {
        const settings = TelefoonnummersPopupComponent.defaultPopupSettings;
        settings.onCloseFunction = () => {
            this.telefoonnummerPopupOpen = false;
            this.changeDetector.detectChanges();
        };
        const popup = this.popupService.popup(this.telefoonButtonRef, settings, TelefoonnummersPopupComponent);

        popup.telefoonnummers = this.telefoonnummers;

        this.telefoonnummerPopupOpen = true;
        this.changeDetector.detectChanges();
    }

    onBerichtClick() {
        let buttons: ActionButton[] = [];

        if (this.heeftBerichtenRecht) {
            buttons.push({
                icon: 'reacties',
                iconcolor: 'primary_1',
                text: 'Bericht via Somtoday',
                onClickFn: () => window.location.assign(this.uriService.getLeerlingNieuwBerichtLink(this.leerling.leerlingnummer)),
                gtmTag: 'leerlingpersonalia-bericht-leerling'
            });
        }

        const email = this.leerling.email;
        if (email) {
            buttons = [
                ...buttons,
                {
                    icon: 'bericht',
                    iconcolor: 'primary_1',
                    text: email,
                    onClickFn: () => window.open(`mailto:${email}`, '_blank'),
                    gtmTag: 'leerlingpersonalia-mail-leerling'
                },
                {
                    icon: 'dupliceren',
                    iconcolor: 'primary_1',
                    text: 'Kopieer e-mailadres',
                    onClickFn: () => {
                        navigator.clipboard.writeText(email);
                        this.mentordashboardService.displayMessage('E-mailadres gekopieerd');
                        this.popupService.closePopUp();
                    },
                    gtmTag: 'leerlingpersonalia-kopieer-mail-leerling'
                }
            ];
        }

        const settings = ActionsPopupComponent.defaultPopupsettings;

        settings.onCloseFunction = () => {
            this.berichtPopupOpen = false;
            this.changeDetector.detectChanges();
        };
        settings.width = 224;

        const popup = this.popupService.popup(this.berichtButtonRef, settings, ActionsPopupComponent);
        popup.customButtons = buttons;

        this.berichtPopupOpen = true;
        this.changeDetector.detectChanges();
    }

    onLabelClick(deeplink: string, heeftRecht: boolean) {
        if (heeftRecht) {
            this.deeplink(deeplink);
        }
    }

    deeplink(deeplink: string) {
        window.location.assign(deeplink);
    }

    get plaatsingenUrl(): string {
        return `/leerling/${this.leerling.leerlingnummer}/plaatsingen`;
    }

    get samenstellingUrl(): string {
        return `/stamgroep/${this.stamgroep?.id}/samenstelling`;
    }
}
