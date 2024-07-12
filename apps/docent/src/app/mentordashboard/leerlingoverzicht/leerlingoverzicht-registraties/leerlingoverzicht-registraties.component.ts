import { ChangeDetectionStrategy, Component, Signal, ViewChild, ViewContainerRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconDirective, NotificationCounterComponent, SpinnerComponent, StackitemComponent, StackitemGroupComponent } from 'harmony';
import { IconBlokken, IconChevronOnder, IconPinned, IconSettings, IconZorgindicaties, provideIcons } from 'harmony-icons';
import { sortBy } from 'lodash-es';
import { derivedFrom } from 'ngxtension/derived-from';
import { ObservedValueOf, filter, map, of, switchMap, tap } from 'rxjs';
import { match } from 'ts-pattern';
import {
    LeerlingAfwezigheidsKolom,
    LeerlingkaartQuery,
    LeerlingoverzichtInstellingenQuery,
    LeerlingoverzichtRegistratiesQuery,
    MentordashboardOverzichtPeriode,
    NotitieContext,
    VastgeprikteNotitiesQuery
} from '../../../../generated/_types';
import {
    MentordashboardOverzichtLeerlingRegistratieWithContent,
    MentordashboardOverzichtTijdspanOptie,
    overzichtTijdspanOpties
} from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupSettings } from '../../../core/popup/popup.settings';
import { MaatregelToekenningDataService, MaatregelToekenningenMetStatus } from '../../../core/services/maatregeltoekenning-data.service';
import { NotitieboekDataService } from '../../../core/services/notitieboek-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { NotitiesSidebarComponent } from '../../../notitieboek/notities-sidebar/notities-sidebar.component';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { HeeftVestigingsRechtDirective } from '../../../rooster-shared/directives/heeft-vestigings-recht.directive';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { isPresent } from '../../../rooster-shared/utils/utils';
import { FilterPopupComponent } from '../../../shared/components/filter-popup/filter-popup.component';
import { DocentQuery, docentPendingQuery } from '../../../shared/utils/apollo.utils';
import { IndicatiesSidebarComponent } from '../../indicaties-sidebar/indicaties-sidebar.component';
import { LeerlingregistratieCategorieComponent } from '../../leerlingregistratie-categorie/leerlingregistratie-categorie.component';
import { LeerlingregistratiesWeergavePopupComponent } from '../../leerlingregistraties-weergave-popup/leerlingregistraties-weergave-popup.component';
import { MaatregelenSidebarComponent } from '../../maatregelen-sidebar/maatregelen-sidebar.component';
import { MentordashboardDataService } from '../../mentordashboard-data.service';
import { MentordashboardService } from '../../mentordashboard.service';
import {
    isKolomCategorie,
    mentordashboardOverzichtRegistratieCategorieId,
    mentordashboardOverzichtRegistratieCategorieNaam,
    periodeText
} from '../../mentordashboard.utils';
import { RegistratieCategorieKolomPipe } from '../../pipes/registratie-categorie-kolom.pipe';
import { RegistratieCategorieNaamPipe } from '../../pipes/registratie-categorie-naam.pipe';
import { LeerlingoverzichtDataService, leerlingRegistratiesDefault } from '../leerlingoverzicht-data.service';
import { LeerlingoverzichtRegistratieSidebarComponent } from '../leerlingoverzicht-registratie-sidebar/leerlingoverzicht-registratie-sidebar.component';
import { RegistratieTotaalContent, registratieContent } from '../leerlingoverzicht.model';

@Component({
    selector: 'dt-leerlingoverzicht-registraties',
    standalone: true,
    imports: [
        OutlineButtonComponent,
        LinkComponent,
        MessageComponent,
        LeerlingregistratieCategorieComponent,
        RegistratieCategorieNaamPipe,
        RegistratieCategorieKolomPipe,
        IconDirective,
        StackitemComponent,
        NotificationCounterComponent,
        HeeftVestigingsRechtDirective,
        StackitemGroupComponent,
        SpinnerComponent
    ],
    templateUrl: './leerlingoverzicht-registraties.component.html',
    styleUrls: ['./leerlingoverzicht-registraties.component.scss'],
    providers: [provideIcons(IconBlokken, IconChevronOnder, IconSettings, IconZorgindicaties, IconPinned)],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtRegistratiesComponent {
    @ViewChild('tijdspan', { read: ViewContainerRef }) tijdspanRef: ViewContainerRef;
    @ViewChild('weergave', { read: ViewContainerRef }) weergaveRef: ViewContainerRef;

    private leerlingoverzichtDataService = inject(LeerlingoverzichtDataService);
    private maatregelDataService = inject(MaatregelToekenningDataService);
    private activeRoute = inject(ActivatedRoute);
    private popupService = inject(PopupService);
    private mentordashboardService = inject(MentordashboardService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private sidebarService = inject(SidebarService);
    private notitieDataService = inject(NotitieboekDataService);
    private router = inject(Router);

    public showWeergaveOpgeslagenMessage = signal(false);
    public instellingenLoaded = signal(false);
    public vestigingId = toSignal(
        this.mentordashboardService.huidigeLeerling$.pipe(
            map((leerling) => leerling.vestigingId),
            filter(isPresent)
        ),
        { initialValue: null }
    );
    public indicaties: Signal<Indicaties>;
    public maatregelen: Signal<MaatregelToekenningenMetStatus>;
    public instellingen: Signal<ObservedValueOf<ReturnType<LeerlingoverzichtDataService['leerlingoverzichtInstellingen']>>>;
    public registratieCategorieen: Signal<RegistratieCategorie[]>;
    public filteredRegistratieCategorieen: Signal<RegistratieCategorie[]>;
    public periodeText: Signal<string>;
    public geenCijferperiode: Signal<boolean>;
    public vastgeprikteNotities: Signal<VastgeprikteNotitiesQuery['vastgeprikteNotities']>;
    public registratieResponse: Signal<DocentQuery<LeerlingoverzichtRegistratiesQuery['leerlingoverzichtRegistraties']>>;
    public aantalVastgeprikteNotities = computed(() => this.vastgeprikteNotities().length);

    constructor() {
        const leerlingId$ = of(this.activeRoute.parent).pipe(
            filter(isPresent),
            switchMap((route) => route.params),
            map((params) => params.id)
        );

        this.indicaties = toSignal(
            leerlingId$.pipe(
                switchMap((leerlingId) => this.mentordashboardDataService.getLeerlingkaart(leerlingId)),
                map(({ beperkingen, hulpmiddelen, interventies }) => ({
                    beperkingen,
                    hulpmiddelen,
                    interventies,
                    aantal: beperkingen.length + hulpmiddelen.length + interventies.length
                }))
            ),
            { initialValue: { beperkingen: [], hulpmiddelen: [], interventies: [], aantal: 0 } }
        );

        this.maatregelen = toSignal(
            leerlingId$.pipe(switchMap((leerlingId) => this.maatregelDataService.getMaatregeltoekenningenMetStatus(leerlingId))),
            { initialValue: { actief: [], afgehandeld: [] } }
        );

        this.vastgeprikteNotities = toSignal(
            leerlingId$.pipe(switchMap((leerlingId) => this.notitieDataService.getVastgeprikteNotities(leerlingId))),
            { initialValue: [] }
        );

        this.instellingen = toSignal(
            leerlingId$.pipe(
                switchMap((leerlingId) => this.leerlingoverzichtDataService.leerlingoverzichtInstellingen(leerlingId)),
                tap(() => this.instellingenLoaded.set(true))
            ),
            { initialValue: { weergaves: [], tijdspan: 'Laatste 7 dagen' as const } }
        );

        const periode = computed(() =>
            match(this.instellingen().tijdspan)
                .with('Laatste 7 dagen', () => MentordashboardOverzichtPeriode.ZEVEN_DAGEN)
                .with('Laatste 30 dagen', () => MentordashboardOverzichtPeriode.DERTIG_DAGEN)
                .with('Deze periode', () => MentordashboardOverzichtPeriode.CIJFERPERIODE)
                .with('Huidig schooljaar', () => MentordashboardOverzichtPeriode.SCHOOLJAAR)
                .exhaustive()
        );

        this.registratieResponse = derivedFrom(
            [leerlingId$, periode],
            switchMap(([leerlingId, periode]) => this.leerlingoverzichtDataService.leerlingoverzichtRegistraties(leerlingId, periode)),
            { initialValue: docentPendingQuery(leerlingRegistratiesDefault) }
        );

        this.registratieCategorieen = computed(() =>
            this.registratieResponse().data.registraties.map((registratieCategorie) => ({
                ...registratieCategorie,
                categorieContent: isKolomCategorie(registratieCategorie.categorie)
                    ? registratieContent[registratieCategorie.categorie.kolom]
                    : registratieContent[LeerlingAfwezigheidsKolom.VRIJ_VELD]
            }))
        );

        this.filteredRegistratieCategorieen = computed(() =>
            sortBy(
                this.registratieCategorieen().filter((registratieCategorie) =>
                    this.instellingen().weergaves.includes(mentordashboardOverzichtRegistratieCategorieId(registratieCategorie.categorie))
                ),
                [(regCat) => regCat.categorieContent.sorteringsNummer, 'categorie.vrijveld.naam']
            )
        );

        this.periodeText = computed(() =>
            periodeText(
                periode(),
                this.registratieResponse().data.vanafDatum,
                this.registratieResponse().data.totDatum,
                this.registratieResponse().data.cijferperiode
            )
        );

        this.geenCijferperiode = computed(
            () => this.instellingen().tijdspan === 'Deze periode' && !this.registratieResponse().data.cijferperiode
        );
    }

    openTijdspanPopup(selected: MentordashboardOverzichtTijdspanOptie) {
        if (this.popupService.isPopupOpenFor(this.tijdspanRef)) {
            this.popupService.closePopUp();
            return;
        }
        const settings: PopupSettings = {
            ...FilterPopupComponent.filterPopupsettings,
            width: 188,
            horizontalEdgeOffset: 92
        };
        const popup = this.popupService.popup(this.tijdspanRef, settings, FilterPopupComponent);
        popup.filterOpties = overzichtTijdspanOpties;
        popup.selected = selected;
        popup.onSelection = (optie: MentordashboardOverzichtTijdspanOptie) => {
            this.selectTijdspanOptie(optie);
        };
    }

    openWeergavePopup(registraties: LeerlingoverzichtRegistratiesView['registratieCategorieen'], zichtbareCategorieen: string[]) {
        const popup = this.popupService.popup(
            this.weergaveRef,
            LeerlingregistratiesWeergavePopupComponent.defaultPopupSettings,
            LeerlingregistratiesWeergavePopupComponent
        );

        popup.columns = registraties.map((registratie) => {
            const display = mentordashboardOverzichtRegistratieCategorieNaam(registratie.categorie);
            const id = mentordashboardOverzichtRegistratieCategorieId(registratie.categorie);

            return {
                id: id,
                display: display,
                selected: zichtbareCategorieen.includes(id)
            };
        });
        popup.leerlingId = this.getLeerlingIdFromRoute();
        popup.afterOpslaan = () => this.showWeergaveOpgeslagenMessage.set(true);
    }

    openMaatregelenSidebar() {
        const huidigeLeerling = this.mentordashboardService.huidigeLeerling;
        const vestigingId = this.vestigingId();
        if (!huidigeLeerling || !vestigingId) return;

        this.sidebarService.openSidebar(MaatregelenSidebarComponent, {
            leerlingId: huidigeLeerling.id,
            vestigingId
        });
    }

    openNotitiesSidebar() {
        const leerlingId: string = this.activeRoute.parent?.snapshot.params.id;
        const { start, eind } = getSchooljaar(new Date());
        this.sidebarService.openSidebar(NotitiesSidebarComponent, {
            titel: `Vastgeprikte notities ${start.getFullYear()}/${eind.getFullYear()}`,
            context: {
                id: leerlingId,
                context: NotitieContext.LEERLING
            },
            notities$: this.notitieDataService.getVastgeprikteNotities(leerlingId),
            openInNotitieboekCallback: (notitieId) => {
                this.sidebarService.closeSidebar();

                this.router.navigate([`/mentordashboard/leerling/${leerlingId}/notitieboek`], {
                    queryParams: { notitie: notitieId }
                });
            },
            onNotitieToevoegenClick: () => {
                this.sidebarService.closeSidebar();

                this.router.navigate([`/mentordashboard/leerling/${leerlingId}/notitieboek`], {
                    queryParams: { notitie: 'nieuw', edit: true }
                });
            },
            onNavigeerNotitieboekClick: () => {
                this.sidebarService.closeSidebar();
                this.router.navigate([`/mentordashboard/leerling/${leerlingId}/notitieboek`]);
            }
        });
    }

    openIndicatiesSidebar(indicaties: Indicaties) {
        this.sidebarService.openSidebar(IndicatiesSidebarComponent, {
            leerlingId: this.activeRoute.parent?.snapshot.params.id,
            beperkingen: indicaties.beperkingen,
            hulpmiddelen: indicaties.hulpmiddelen,
            interventies: indicaties.interventies
        });
    }

    selectTijdspanOptie(optie: MentordashboardOverzichtTijdspanOptie) {
        this.leerlingoverzichtDataService.setLeerlingoverzichtTijdspanSelectie(optie, this.getLeerlingIdFromRoute());
    }

    openRegistratieSidebar(regCategorie: RegistratieCategorie) {
        const leerlingRegistratie: MentordashboardOverzichtLeerlingRegistratieWithContent = {
            leerlingId: this.getLeerlingIdFromRoute(),
            aantalRegistraties: regCategorie.details.aantalRegistraties,
            categorie: regCategorie.categorie,
            categorieContent: regCategorie.categorieContent,
            tijdspan: this.instellingen().tijdspan,
            trend: regCategorie.trend
        };

        this.sidebarService.openSidebar(LeerlingoverzichtRegistratieSidebarComponent, { leerlingRegistratie });
    }

    private getLeerlingIdFromRoute(): string {
        return this.activeRoute.parent?.snapshot.params.id;
    }
}

type RegistratieCategorie = LeerlingoverzichtRegistratiesQuery['leerlingoverzichtRegistraties']['registraties'][number] & {
    categorieContent: RegistratieTotaalContent;
};

interface LeerlingoverzichtRegistratiesView {
    filteredRegistratieCategorieen: RegistratieCategorie[];
    registratieCategorieen: RegistratieCategorie[];
    instellingen: LeerlingoverzichtInstellingenQuery['leerlingoverzichtInstellingen'] & { tijdspan: MentordashboardOverzichtTijdspanOptie };
    periodeText: string;
    geenCijferperiode: boolean;
}

type Indicaties = Pick<LeerlingkaartQuery['leerlingkaart'], 'beperkingen' | 'hulpmiddelen' | 'interventies'> & { aantal: number };
