import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MaatregelenQuery, Maybe, PartialLeerlingFragment, StamgroepFieldsFragment } from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconGroep, IconGroepAlt, IconNotitieboek, provideIcons } from 'harmony-icons';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { allowChildAnimations } from '../../core/core-animations';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { TableService } from '../../core/services/table.service';
import { UploadDataService } from '../../core/services/upload-data.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { MentorleerlingenPopupComponent } from '../../layout/menu/mentorleerlingen-popup/mentorleerlingen-popup.component';
import { NotitiesSidebarComponent } from '../../notitieboek/notities-sidebar/notities-sidebar.component';
import { AfspraakSidebarComponent } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { WerkdrukSidebarComponent } from '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { FloatingAction, FloatingActionBarComponent } from '../../shared/components/floating-action-bar/floating-action-bar.component';
import {
    GroepLeerlingHeaderNavigatieComponent,
    GroepLeerlingHeaderNavigatieItem
} from '../../shared/components/groep-leerling-header-navigatie/groep-leerling-header-navigatie.component';
import { GroepsoverzichtRegistratieSidebarComponent } from '../groepsoverzicht/groepsoverzicht-registratie-sidebar/groepsoverzicht-registratie-sidebar.component';
import { GroepsoverzichtResultatenSidebarComponent } from '../groepsoverzicht/groepsoverzicht-resultaten-sidebar/groepsoverzicht-resultaten-sidebar.component';
import { localstorageResultatenTabKeyGroepsoverzicht } from '../groepsoverzicht/groepsoverzicht-resultaten/groepsoverzicht-resultaten.component';
import { IndicatiesSidebarComponent } from '../indicaties-sidebar/indicaties-sidebar.component';
import { LeerlingoverzichtGemisteToetsenSidebarComponent } from '../leerlingoverzicht/leerlingoverzicht-gemiste-toetsen-sidebar/leerlingoverzicht-gemiste-toetsen-sidebar.component';
import { LeerlingoverzichtLaatsteResultatenSidebarComponent } from '../leerlingoverzicht/leerlingoverzicht-laatste-resultaten-sidebar/leerlingoverzicht-laatste-resultaten-sidebar.component';
import { LeerlingoverzichtRegistratieSidebarComponent } from '../leerlingoverzicht/leerlingoverzicht-registratie-sidebar/leerlingoverzicht-registratie-sidebar.component';
import { LeerlingoverzichtVakSamenvattingSidebarComponent } from '../leerlingoverzicht/leerlingoverzicht-vak-samenvatting-sidebar/leerlingoverzicht-vak-samenvatting-sidebar.component';
import { LeerlingregistratiesSidebarComponent } from '../leerlingregistraties-sidebar/leerlingregistraties-sidebar.component';
import { VakHeaderNavigatie } from '../leerlingregistraties-table/leerlingregistraties-table.component';
import { LeerlingregistratiesTotaalSidebarComponent } from '../leerlingregistraties-totaal-sidebar/leerlingregistraties-totaal-sidebar.component';
import { MaatregelenBewerkenSidebarComponent } from '../maatregelen-bewerken-sidebar/maatregelen-bewerken-sidebar.component';
import { MaatregelenSidebarComponent } from '../maatregelen-sidebar/maatregelen-sidebar.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardNavigatieComponent } from '../mentordashboard-navigatie/mentordashboard-navigatie.component';
import { MentordashboardPopupComponent } from '../mentordashboard-popup/mentordashboard-popup.component';
import { MentordashboardResultatenCeSidebarComponent } from '../mentordashboard-resultaten-ce-sidebar/mentordashboard-resultaten-ce-sidebar.component';
import { MentordashboardResultatenSeSidebarComponent } from '../mentordashboard-resultaten-se-sidebar/mentordashboard-resultaten-se-sidebar.component';
import { MentordashboardResultatenSidebarComponent } from '../mentordashboard-resultaten-sidebar/mentordashboard-resultaten-sidebar.component';
import { MentordashboardMessage, MentordashboardService } from '../mentordashboard.service';
import { alleMentorLeerlingenMetStamgroep } from '../mentordashboard.utils';
import { VakNavigatieHeaderComponent } from '../vak-navigatie-header/vak-navigatie-header.component';

@Component({
    selector: 'dt-mentordashboard',
    templateUrl: './mentordashboard.component.html',
    styleUrls: ['./mentordashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 }), allowChildAnimations],
    standalone: true,
    imports: [
        HeaderComponent,
        VakNavigatieHeaderComponent,
        GroepLeerlingHeaderNavigatieComponent,
        MentordashboardNavigatieComponent,
        RouterOutlet,
        MessageComponent,
        AfspraakSidebarComponent,
        WerkdrukSidebarComponent,
        MaatregelenSidebarComponent,
        MaatregelenBewerkenSidebarComponent,
        LeerlingregistratiesTotaalSidebarComponent,
        LeerlingregistratiesSidebarComponent,
        MentordashboardResultatenSidebarComponent,
        MentordashboardResultatenSeSidebarComponent,
        MentordashboardResultatenCeSidebarComponent,
        NotitiesSidebarComponent,
        FloatingActionBarComponent,
        AsyncPipe,
        GroepsoverzichtRegistratieSidebarComponent,
        GroepsoverzichtResultatenSidebarComponent,
        IndicatiesSidebarComponent,
        LeerlingoverzichtRegistratieSidebarComponent,
        LeerlingoverzichtGemisteToetsenSidebarComponent,
        LeerlingoverzichtLaatsteResultatenSidebarComponent,
        LeerlingoverzichtVakSamenvattingSidebarComponent
    ],
    providers: [provideIcons(IconGroepAlt, IconNotitieboek, IconGroep), UploadDataService]
})
export class MentordashboardComponent implements OnInit, OnDestroy {
    public mentordashboardService = inject(MentordashboardService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private activatedRoute = inject(ActivatedRoute);
    private deviceService = inject(DeviceService);
    public tableService = inject(TableService);
    private mentordashboardDataService = inject(MentordashboardDataService);
    private router = inject(Router);
    private changeDetectorRef = inject(ChangeDetectorRef);
    public afspraakSidebar$: SidebarInputs<AfspraakSidebarComponent>;
    public werkdrukSidebar$: SidebarInputs<WerkdrukSidebarComponent>;
    public maatregelenSidebar$: SidebarInputs<MaatregelenSidebarComponent>;
    public maatregelenBewerkenSidebar$: SidebarInputs<
        MaatregelenBewerkenSidebarComponent & { maatregelen$: Observable<MaatregelenQuery['maatregelen']> }
    >;
    public leerlingregistratiesTotaalSidebar$: SidebarInputs<LeerlingregistratiesTotaalSidebarComponent>;
    public leerlingRegistratiesSidebar$: SidebarInputs<LeerlingregistratiesSidebarComponent>;
    public mentordashboardResultatenSidebar$: SidebarInputs<MentordashboardResultatenSidebarComponent>;
    public mentordashboardResultatenSeSidebar$: SidebarInputs<MentordashboardResultatenSeSidebarComponent>;
    public mentordashboardResultatenCeSidebar$: SidebarInputs<MentordashboardResultatenCeSidebarComponent>;
    public notitieSidebar$: SidebarInputs<NotitiesSidebarComponent>;
    public groepsoverzichtRegistratieSidebar$: SidebarInputs<GroepsoverzichtRegistratieSidebarComponent>;
    public groepsoverzichtResultatenSidebar$: SidebarInputs<GroepsoverzichtResultatenSidebarComponent>;
    public indicatiesSidebar$: SidebarInputs<IndicatiesSidebarComponent>;
    public leerlingoverzichtRegistratieSidebar$: SidebarInputs<LeerlingoverzichtRegistratieSidebarComponent>;
    public leerlingoverzichtGemisteToetsenSidebar$: SidebarInputs<LeerlingoverzichtGemisteToetsenSidebarComponent>;
    public leerlingoverzichtLaatsteResultatenSidebar$: SidebarInputs<LeerlingoverzichtLaatsteResultatenSidebarComponent>;
    public leerlingoverzichtVakSamenvattingSidebar$: SidebarInputs<LeerlingoverzichtVakSamenvattingSidebarComponent>;

    public floatingActions$: Observable<FloatingAction[]>;
    public message$: Observable<Optional<MentordashboardMessage>>;
    public navigatie$: Observable<MentordashboardGroepLeerlingHeaderNavigatieItem>;
    public vakNavigatie$: Observable<Maybe<VakHeaderNavigatie>>;
    public showFloatingActions$: Observable<boolean>;
    public isGroepsoverzicht$: Observable<boolean>;

    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.message$ = this.mentordashboardService.message$;
        this.vakNavigatie$ = this.mentordashboardService.vakNavigatie$;

        const mentorleerlingen$ = this.medewerkerDataService
            .getMentorleerlingen()
            .pipe(map(alleMentorLeerlingenMetStamgroep), takeUntil(this.destroy$));

        const heeftToegangTotMentordashboardCompleet$ = this.medewerkerDataService.heeftToegangTotMentordashboardCompleet();

        this.isGroepsoverzicht$ = this.activatedRoute.url.pipe(map((url) => url[0].path === 'stamgroep'));

        this.navigatie$ = combineLatest([
            this.activatedRoute.params.pipe(map((params): string => params.id)),
            mentorleerlingen$,
            heeftToegangTotMentordashboardCompleet$
        ]).pipe(
            map(([selectedId, leerlingenMetStamgroep, toegangDashboardCompleet]) => {
                const currentLeerling = leerlingenMetStamgroep.find((ls) => ls.leerling.id === selectedId);
                const isIndividueleLeerling = currentLeerling?.isIndividueel || false;
                const isGezamenlijkOverzicht = this.router.url.includes('gezamenlijk-overzicht') || isIndividueleLeerling;
                const currentStamgroep = leerlingenMetStamgroep.find((ls) => ls.stamgroep?.id === selectedId)?.stamgroep;
                const groep = currentLeerling ? (isGezamenlijkOverzicht ? null : currentLeerling.stamgroep) : currentStamgroep;

                if (!currentLeerling && !currentStamgroep && !isGezamenlijkOverzicht) {
                    // zou niet voor moeten komen, behalve in mock
                    return null;
                }

                const filteredLeerlingIds = isGezamenlijkOverzicht
                    ? leerlingenMetStamgroep.filter((l) => l.isIndividueel).map((l) => l.leerling.id)
                    : leerlingenMetStamgroep.filter((l) => !l.isIndividueel && l.stamgroep?.id === groep?.id).map((l) => l.leerling.id);

                const kanNavigerenNaarGroep =
                    ((!!groep && !currentLeerling?.isIndividueel) || isGezamenlijkOverzicht) && toegangDashboardCompleet;
                return {
                    groep,
                    kanNavigerenNaarGroep: kanNavigerenNaarGroep,
                    leerling: currentLeerling ? currentLeerling.leerling : null,
                    prevId: currentLeerling && filteredLeerlingIds[Number(filteredLeerlingIds.indexOf(selectedId)) - 1],
                    nextId: currentLeerling && filteredLeerlingIds[Number(filteredLeerlingIds.indexOf(selectedId)) + 1],
                    isGezamenlijkOverzicht
                };
            }),
            filter(isPresent),
            tap((navigatie) => {
                if (navigatie.leerling) this.mentordashboardService.setHuidigeLeerling(navigatie.leerling);
                if (navigatie.groep) this.mentordashboardService.setHuidigeStamgroep(navigatie.groep);
            })
        );

        this.afspraakSidebar$ = this.sidebarService.watchFor(AfspraakSidebarComponent);
        this.werkdrukSidebar$ = this.sidebarService.watchFor(WerkdrukSidebarComponent);
        this.maatregelenSidebar$ = this.sidebarService.watchFor(MaatregelenSidebarComponent);
        this.maatregelenBewerkenSidebar$ = this.sidebarService.watchFor(MaatregelenBewerkenSidebarComponent);
        this.leerlingregistratiesTotaalSidebar$ = this.sidebarService.watchFor(LeerlingregistratiesTotaalSidebarComponent);
        this.leerlingRegistratiesSidebar$ = this.sidebarService.watchFor(LeerlingregistratiesSidebarComponent);
        this.mentordashboardResultatenSidebar$ = this.sidebarService.watchFor(MentordashboardResultatenSidebarComponent);
        this.mentordashboardResultatenSeSidebar$ = this.sidebarService.watchFor(MentordashboardResultatenSeSidebarComponent);
        this.mentordashboardResultatenCeSidebar$ = this.sidebarService.watchFor(MentordashboardResultatenCeSidebarComponent);
        this.notitieSidebar$ = this.sidebarService.watchFor(NotitiesSidebarComponent);
        this.groepsoverzichtRegistratieSidebar$ = this.sidebarService.watchFor(GroepsoverzichtRegistratieSidebarComponent);
        this.groepsoverzichtResultatenSidebar$ = this.sidebarService.watchFor(GroepsoverzichtResultatenSidebarComponent);
        this.indicatiesSidebar$ = this.sidebarService.watchFor(IndicatiesSidebarComponent);
        this.leerlingoverzichtRegistratieSidebar$ = this.sidebarService.watchFor(LeerlingoverzichtRegistratieSidebarComponent);
        this.leerlingoverzichtGemisteToetsenSidebar$ = this.sidebarService.watchFor(LeerlingoverzichtGemisteToetsenSidebarComponent);
        this.leerlingoverzichtLaatsteResultatenSidebar$ = this.sidebarService.watchFor(LeerlingoverzichtLaatsteResultatenSidebarComponent);
        this.leerlingoverzichtVakSamenvattingSidebar$ = this.sidebarService.watchFor(LeerlingoverzichtVakSamenvattingSidebarComponent);

        this.floatingActions$ = this.mentordashboardService.floatingActions$;
        this.showFloatingActions$ = this.mentordashboardService.currentNavItem$.pipe(map((item) => item?.titel === 'Registraties'));
    }

    ngOnDestroy() {
        localStorage.removeItem(localstorageResultatenTabKeyGroepsoverzicht);
        this.mentordashboardDataService.removeRegistratieTabelAndDetailsFromCache();
        this.destroy$.next();
        this.destroy$.complete();
    }

    navigeerNaarGroep(isGezamenlijkOverzicht: boolean, id: Optional<string>) {
        if (isGezamenlijkOverzicht) {
            this.router.navigate(['/mentordashboard/gezamenlijk-overzicht']);
            return;
        }

        const route = ['/mentordashboard/stamgroep/', id];
        if (this.router.url.includes('notitieboek')) {
            route.push('notitieboek');
        }

        if (id) {
            this.router.navigate(route);
        }
    }

    navigeerNaarId(newId: Optional<string>) {
        if (!newId) return;
        // Strip queryparams van huidige url
        let currentUrlWithoutParams = this.router.url;
        if (currentUrlWithoutParams.indexOf('?') >= 0) {
            currentUrlWithoutParams = currentUrlWithoutParams.split('?')[0];
        }
        this.router.navigate([currentUrlWithoutParams.replace(this.activatedRoute.snapshot.params.id, newId)]);
    }

    meerOptiesClick(meerOptiesRef: ViewContainerRef, leerling: PartialLeerlingFragment) {
        const settings = MentordashboardPopupComponent.defaultPopupsettings;
        settings.width = this.deviceService.isPhoneOrTablet() ? 312 : 266;

        const popup = this.popupService.popup(meerOptiesRef, settings, MentordashboardPopupComponent);
        popup.leerling = leerling;
    }

    onLeerlingClick(avatarRef: ViewContainerRef, isGezamenlijkOverzicht: boolean, contextGroepId?: string) {
        const settings = MentorleerlingenPopupComponent.defaultPopupSettings;
        settings.preferedDirection = [PopupDirection.Bottom];
        settings.offsets.bottom = {
            top: 8,
            left: 65
        };
        settings.onCloseFunction = () => this.changeDetectorRef.detectChanges();

        const popup = this.popupService.popup(avatarRef, settings, MentorleerlingenPopupComponent);
        popup.headerContext = true;
        popup.headerContextGroepId = isGezamenlijkOverzicht ? 'gezamenlijk-overzicht' : contextGroepId;
    }

    showAfspraakSuccesMessage(message: string) {
        this.mentordashboardService.displayMessage(message);
    }

    closeMessage() {
        this.mentordashboardService.closeMessage();
    }

    get vakLeerlingGroepHeaderMenuEnabled() {
        return this.tableService.isMenuEnabled('mentordashboard-vak-groep-leerling-navigatie');
    }

    get mentordashboardNavigatieHeaderMenuEnabled() {
        return this.tableService.isMenuEnabled('mentordashboard-navigatie');
    }
}

//specifieker type voor mentordashboard navigatie, omdat we weten dat de groep een stamgroep is of dat het hier gaat om een gezamenlijk overzicht
type MentordashboardGroepLeerlingHeaderNavigatieItem = Omit<GroepLeerlingHeaderNavigatieItem, 'groep'> & {
    groep: Optional<StamgroepFieldsFragment>;
    kanNavigerenNaarGroep: boolean;
    isGezamenlijkOverzicht: boolean;
};
