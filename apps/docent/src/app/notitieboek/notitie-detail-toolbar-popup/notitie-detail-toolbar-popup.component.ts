import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AfspraakParticipant, NotitieFieldsFragment } from '@docent/codegen';
import { collapseOnLeaveAnimation, expandOnEnterAnimation } from 'angular-animations';
import { IconBericht, IconGepland, IconKalenderToevoegen, IconToevoegen, provideIcons } from 'harmony-icons';
import { match } from 'ts-pattern';
import { UriService } from '../../auth/uri-service';
import { Appearance, HorizontalOffset, PopupDirection, PopupSettings, VerticalOffset } from '../../core/popup/popup.settings';
import { SidebarService } from '../../core/services/sidebar.service';
import { AfspraakSidebarComponent, NieuweAfspraak } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';
import { SwitchComponent } from '../../shared/components/switch/switch.component';

export enum ContactmomentenRecht {
    LEERLING_INDIVIDUEEL = 'heeftContactmomentenBewerkenLeerlingRecht',
    LEERLING_COLLECTIEF = 'heeftContactmomentenBewerkenCollectiefRecht',
    LESGROEP = 'heeftContactmomentenBewerkenLesgroepRecht',
    STAMGROEP = 'heeftContactmomentenBewerkenStamgroepRecht'
}

@Component({
    selector: 'dt-notitie-detail-toolbar-popup',
    standalone: true,
    imports: [PopupButtonComponent, RouterModule, PopupComponent, SwitchComponent, HeeftRechtDirective],
    templateUrl: './notitie-detail-toolbar-popup.component.html',
    styleUrls: ['./notitie-detail-toolbar-popup.component.scss'],
    animations: [collapseOnLeaveAnimation(), expandOnEnterAnimation()],
    providers: [provideIcons(IconBericht, IconKalenderToevoegen, IconGepland, IconToevoegen)]
})
export class NotitieDetailToolbarPopupComponent implements OnInit, Popup {
    private uriService = inject(UriService);
    public sidebarService = inject(SidebarService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() notitie: NotitieFieldsFragment;
    @Input() showBerichtNaarAanmaker = false;
    leerlingBetrokkenenIds: string;
    contactmomentenRecht: ContactmomentenRecht;

    ngOnInit(): void {
        if (this.notitie.leerlingBetrokkenen) {
            this.leerlingBetrokkenenIds = JSON.stringify(this.notitie.leerlingBetrokkenen.map((b) => b.id));
        }
        this.setContactmomentRechten();
    }

    mayClose(): boolean {
        return true;
    }

    addAfspraak(): void {
        const participanten: AfspraakParticipant[] = [
            ...this.notitie.leerlingBetrokkenen.map((l) => ({
                leerling: l.leerling,
                stamgroep: null,
                lesgroep: null,
                medewerker: null
            })),
            ...this.notitie.lesgroepBetrokkenen.map((l) => ({
                lesgroep: l.lesgroep,
                stamgroep: null,
                leerling: null,
                medewerker: null
            })),
            ...this.notitie.stamgroepBetrokkenen.map((l) => ({
                stamgroep: l.stamgroep,
                leerling: null,
                lesgroep: null,
                medewerker: null
            }))
        ] as AfspraakParticipant[];

        const afspraak: NieuweAfspraak = {
            begin: new Date(),
            participantenEigenAfspraak: participanten,
            bijlagen: []
        };
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak, bewerkenState: true });
        this.popup.onClose();
    }

    onBerichtNaarLeerling(): void {
        const leerlingenString = this.notitie.leerlingBetrokkenen.map((l) => l.leerling.id).join(',');
        const stamGroepenString = this.notitie.stamgroepBetrokkenen.map((l) => l.stamgroep.id).join(',');
        const lesgroepenString = this.notitie.lesgroepBetrokkenen.map((l) => l.lesgroep.id).join(',');

        const deeplinkUrl = this.uriService.getDeepLinkUrl(
            `/berichten/nieuw?${leerlingenString ? `leerlingen=${leerlingenString}` : ''}${
                stamGroepenString ? `&stamgroepen=${stamGroepenString}` : ''
            }${lesgroepenString ? `&lesgroepen=${lesgroepenString}` : ''}`
        );

        this.deeplinkToUrl(deeplinkUrl);
    }

    onBerichtNaarAanmaker(): void {
        const deeplinkUrl = this.uriService.getDeepLinkUrl(`/berichten/nieuw?personeelsnummer=${this.notitie.auteur.nummer}`);
        this.deeplinkToUrl(deeplinkUrl);
    }

    onContactmoment(): void {
        const deeplinkUrl = match(this.contactmomentenRecht)
            .with(ContactmomentenRecht.LEERLING_COLLECTIEF, () => this.uriService.getDeepLinkUrl(`/leerlingen/contactmomenten/aanmaken`))
            .with(ContactmomentenRecht.LEERLING_INDIVIDUEEL, () =>
                this.uriService.getDeepLinkUrl(
                    `/leerling/contactmomenten?leerlingnummer=${this.notitie.leerlingBetrokkenen[0].leerling.leerlingnummer}`
                )
            )
            .with(ContactmomentenRecht.LESGROEP, () =>
                this.uriService.getDeepLinkUrl(`/lesgroep/contactmomenten?lesgroep=${this.notitie.lesgroepBetrokkenen[0].lesgroep.id}`)
            )
            .with(ContactmomentenRecht.STAMGROEP, () =>
                this.uriService.getDeepLinkUrl(`/stamgroep/contactmomenten?stamgroep=${this.notitie.stamgroepBetrokkenen[0].stamgroep.id}`)
            )
            .exhaustive();
        if (deeplinkUrl) {
            this.deeplinkToUrl(deeplinkUrl);
        }
    }

    deeplinkToUrl(deeplink: string) {
        window.location.assign(deeplink);
    }

    setContactmomentRechten(): void {
        const hasMeerdereBetrokkenen =
            this.notitie.leerlingBetrokkenen.length + this.notitie.lesgroepBetrokkenen.length + this.notitie.stamgroepBetrokkenen.length >
            1;
        const hasLeerlingBetrokken = this.notitie.leerlingBetrokkenen.length === 1;
        const hasLesgroepBetrokken = this.notitie.lesgroepBetrokkenen.length === 1;
        const hasStamgroepBetrokken = this.notitie.stamgroepBetrokkenen.length === 1;
        if (hasMeerdereBetrokkenen) {
            this.contactmomentenRecht = ContactmomentenRecht.LEERLING_COLLECTIEF;
        } else if (hasLeerlingBetrokken) {
            this.contactmomentenRecht = ContactmomentenRecht.LEERLING_INDIVIDUEEL;
        } else if (hasLesgroepBetrokken) {
            this.contactmomentenRecht = ContactmomentenRecht.LESGROEP;
        } else if (hasStamgroepBetrokken) {
            this.contactmomentenRecht = ContactmomentenRecht.STAMGROEP;
        }
    }

    public static get defaultPopupsettings(): PopupSettings {
        return {
            ...PopupComponent.defaultPopupsettings,
            appearance: {
                desktop: Appearance.Popout,
                tablet: Appearance.Popout,
                tabletportrait: Appearance.Popout,
                mobile: Appearance.Rollup
            },
            horizontalOffset: HorizontalOffset.Right,
            verticalOffset: VerticalOffset.Top,
            preferedDirection: [PopupDirection.Top],
            horizontalEdgeOffset: -200,
            offsetToConnectedElementVertical: 16,
            width: 290
        };
    }
}
