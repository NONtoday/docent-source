import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    QueryList,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { IconDirective } from 'harmony';
import { IconBericht, IconChevronOnder, IconDupliceren, IconReacties, IconTelefoon, provideIcons } from 'harmony-icons';
import { Geslacht, LeerlingkaartQuery, Maybe, RelatieSoort } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { PopupService } from '../../core/popup/popup.service';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { MentordashboardService } from '../mentordashboard.service';
import { RelatieGeslachtSoortPipePipe } from '../pipes/relatie-geslacht-soort-pipe.pipe';
import { Telefoonnummer, TelefoonnummersPopupComponent } from '../telefoonnummers-popup/telefoonnummers-popup.component';

type ContactPersoonType = 'BroerOfZus' | 'Verzorger';

export interface Contactpersoon {
    type: ContactPersoonType;
    id?: string;
    leerlingnummer?: number;
    initialen: string;
    voornaam?: string;
    tussenvoegsels?: Maybe<string>;
    achternaam?: string;
    voorletters?: Maybe<string>;
    relatieSoort: RelatieSoort;
    geslacht?: Maybe<Geslacht>;
    mobielNummer?: Maybe<string>;
    mobielWerkNummer?: Maybe<string>;
    telefoonnummer?: Maybe<string>;
    email?: Maybe<string>;
    pasfoto?: Maybe<string>;
}

type Relaties = LeerlingkaartQuery['leerlingkaart']['relaties'];
type BroersEnZussen = LeerlingkaartQuery['leerlingkaart']['broersEnZussen'];

export const addNummerIfDefined = (array: Telefoonnummer[], naam: string, nummer: Maybe<string> | undefined) =>
    nummer ? array.push({ naam, nummer }) : void 0;

@Component({
    selector: 'dt-leerling-contactpersonen',
    templateUrl: './leerling-contactpersonen.component.html',
    styleUrls: ['./leerling-contactpersonen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, VolledigeNaamPipe, RelatieGeslachtSoortPipePipe, IconDirective],
    providers: [provideIcons(IconBericht, IconChevronOnder, IconTelefoon, IconReacties, IconDupliceren)]
})
export class LeerlingContactpersonenComponent implements OnChanges {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private uriService = inject(UriService);
    private mentordashboardService = inject(MentordashboardService);
    @ViewChildren('telefoon', { read: ViewContainerRef }) telefoonButtonRefs: QueryList<ViewContainerRef>;
    @ViewChildren('bericht', { read: ViewContainerRef }) berichtButtonRefs: QueryList<ViewContainerRef>;

    @Input() leerlingnummer: number;
    @Input() relaties: Relaties = [];
    @Input() broersEnZussen: BroersEnZussen = [];
    @Input() heeftBerichtenRecht: Optional<boolean>;

    contactpersonen: Contactpersoon[];
    openPopupRefId: string | null;

    private broerOfZusRelatiesoort: Readonly<RelatieSoort> = {
        naam: 'Broer of zus',
        mannelijkeNaam: 'Broer',
        vrouwelijkeNaam: 'Zus'
    };

    ngOnChanges(): void {
        this.contactpersonen = [
            ...this.relaties.map((relatie) => ({
                type: 'Verzorger' as const,
                id: relatie.verzorger!.id,
                initialen: relatie.verzorger!.initialen,
                relatieSoort: relatie.relatieSoort,
                geslacht: relatie.verzorger!.geslacht,
                mobielNummer: relatie.verzorger!.mobielNummer,
                mobielWerkNummer: relatie.verzorger!.mobielWerkNummer,
                telefoonnummer: relatie.verzorger!.adres?.telefoonnummer,
                email: relatie.verzorger!.email,
                voorletters: relatie.verzorger!.voorletters,
                achternaam: relatie.verzorger!.achternaam
            })),
            ...this.broersEnZussen.map((broerOfZus) => ({
                type: 'BroerOfZus' as const,
                leerlingnummer: broerOfZus.leerlingnummer,
                id: broerOfZus.id,
                initialen: broerOfZus.initialen,
                relatieSoort: this.broerOfZusRelatiesoort,
                geslacht: broerOfZus.geslacht,
                mobielNummer: broerOfZus.mobielNummer,
                email: broerOfZus.email,
                pasfoto: broerOfZus.pasfoto,
                voornaam: broerOfZus.voornaam,
                tussenvoegsels: broerOfZus.tussenvoegsels,
                achternaam: broerOfZus.achternaam
            }))
        ];
    }

    onPhoneNumberClick(index: number, contactpersoon: Contactpersoon) {
        const buttonId = `telefoon-${index}`;
        const telefoonButtonRef = this.telefoonButtonRefs.find((ref) => ref.element.nativeElement.id === `telefoon-${index}`);
        if (!telefoonButtonRef) {
            return;
        }

        const settings = TelefoonnummersPopupComponent.defaultPopupSettings;
        settings.onCloseFunction = () => {
            this.openPopupRefId = null;
            this.changeDetector.detectChanges();
        };
        const popup = this.popupService.popup(telefoonButtonRef, settings, TelefoonnummersPopupComponent);
        const telefoonnummers: Telefoonnummer[] = [];
        addNummerIfDefined(telefoonnummers, 'Mobiel', contactpersoon.mobielNummer);
        addNummerIfDefined(telefoonnummers, 'Werk', contactpersoon.mobielWerkNummer);
        addNummerIfDefined(telefoonnummers, 'Thuis', contactpersoon.telefoonnummer);
        popup.telefoonnummers = telefoonnummers;

        this.openPopupRefId = buttonId;
        this.changeDetector.detectChanges();
    }

    onBerichtClick(index: number, contactpersoon: Contactpersoon) {
        const buttonId = `bericht-${index}`;
        const berichtButtonRef = this.berichtButtonRefs.find((ref) => ref.element.nativeElement.id === `bericht-${index}`);
        if (!berichtButtonRef) {
            return;
        }
        const settings = ActionsPopupComponent.defaultPopupsettings;

        settings.onCloseFunction = () => {
            this.openPopupRefId = null;
            this.changeDetector.detectChanges();
        };
        settings.width = 224;

        const popup = this.popupService.popup(berichtButtonRef, settings, ActionsPopupComponent);
        popup.customButtons = [];

        if (this.heeftBerichtenRecht) {
            popup.customButtons.push({
                icon: 'reacties',
                color: 'primary',
                text: 'Bericht via Somtoday',
                gtmTag: 'leerling-contactpersoon-bericht-somtoday',
                onClickFn: () => {
                    const url =
                        contactpersoon.type === 'Verzorger'
                            ? this.uriService.getVerzorgerNieuwBerichtLink(contactpersoon.id!)
                            : this.uriService.getLeerlingNieuwBerichtLink(contactpersoon.leerlingnummer!);
                    window.location.assign(url);
                }
            });
        }

        const contactpersoonEmail = contactpersoon.email;
        if (contactpersoonEmail) {
            popup.customButtons.push(
                ...[
                    {
                        icon: 'bericht',
                        color: 'primary',
                        text: contactpersoonEmail,
                        gtmTag: 'leerling-contactpersoon-mail',
                        onClickFn: () => (window.location.href = `mailto:${contactpersoonEmail}`)
                    } as ActionButton,
                    {
                        icon: 'dupliceren',
                        color: 'primary',
                        text: 'Kopieer e-mailadres',
                        gtmTag: 'leerling-contactpersoon-kopieer-mail',
                        onClickFn: () => {
                            navigator.clipboard.writeText(contactpersoonEmail);
                            this.mentordashboardService.displayMessage('E-mailadres gekopieerd');
                            this.popupService.closePopUp();
                        }
                    } as ActionButton
                ]
            );
        }

        this.openPopupRefId = buttonId;
        this.changeDetector.detectChanges();
    }
}
