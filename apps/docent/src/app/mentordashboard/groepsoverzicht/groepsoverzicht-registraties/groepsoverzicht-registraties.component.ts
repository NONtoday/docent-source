import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    inject,
    input,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroepsoverzichtWeergaveInstelling, LeerlingAfwezigheidsKolom, MentordashboardOverzichtPeriode } from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { DropdownComponent, DropdownItem, IconDirective, SpinnerComponent } from 'harmony';
import { IconBlokken, IconChevronOnder, IconFilter, IconSettings, IconWeergave, provideIcons } from 'harmony-icons';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';
import { match } from 'ts-pattern';
import {
    GroepoverzichtRegistratieWithContent,
    MentordashboardOverzichtTijdspanOptie,
    overzichtTijdspanOpties,
    overzichtTijdspanOptiesIndividueel
} from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { DeviceService } from '../../../core/services/device.service';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { registratieContent } from '../../leerlingoverzicht/leerlingoverzicht.model';
import { MentordashboardDataService } from '../../mentordashboard-data.service';
import { isKolomCategorie, periodeText } from '../../mentordashboard.utils';
import { GroepsoverzichtCategorieBoxComponent } from '../groepsoverzicht-categorie-box/groepsoverzicht-categorie-box.component';
import { GroepsoverzichtRegistratieSidebarComponent } from '../groepsoverzicht-registratie-sidebar/groepsoverzicht-registratie-sidebar.component';
import { GroepsoverzichtWeergavePopupComponent } from '../groepsoverzicht-weergave-popup/groepsoverzicht-weergave-popup.component';

@Component({
    selector: 'dt-groepsoverzicht-registraties',
    standalone: true,
    imports: [
        OutlineButtonComponent,
        MessageComponent,
        GroepsoverzichtCategorieBoxComponent,
        LinkComponent,
        SpinnerComponent,
        GroepsoverzichtRegistratieSidebarComponent,
        OutlineButtonComponent,
        LinkComponent,
        SpinnerComponent,
        MessageComponent,
        IconDirective,
        AsyncPipe,
        DropdownComponent
    ],
    templateUrl: './groepsoverzicht-registraties.component.html',
    styleUrls: ['./groepsoverzicht-registraties.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronOnder, IconBlokken, IconSettings, IconFilter, IconWeergave)]
})
export class GroepsoverzichtRegistratiesComponent implements OnInit {
    @ViewChild('filter', { read: ViewContainerRef }) filterRef: ViewContainerRef;
    @ViewChild('weergave', { read: ViewContainerRef }) weergaveRef: ViewContainerRef;

    isGezamenlijkOverzicht = input<boolean>(false);

    groepsoverzichtView$: Observable<GroepsoverzichtView>;
    showLoader$ = new BehaviorSubject<boolean>(true);
    showWeergaveOpgeslagenMessage = false;
    tijdspanOptiesDropdown = computed(() => (this.isGezamenlijkOverzicht() ? overzichtTijdspanOptiesIndividueel : overzichtTijdspanOpties));

    private showEmptyCategoriesSubject = new BehaviorSubject<boolean>(false);
    private popupService = inject(PopupService);
    private mentorDashboardDataService = inject(MentordashboardDataService);
    private activatedRoute = inject(ActivatedRoute);
    private deviceService = inject(DeviceService);
    private changedetectorRef = inject(ChangeDetectorRef);

    ngOnInit(): void {
        const showEmptyCategories$ = combineLatest({
            isTabletOrDesktop: this.deviceService.isTabletOrDesktop$,
            showEmptyCategories: this.showEmptyCategoriesSubject
        }).pipe(map(({ isTabletOrDesktop, showEmptyCategories }) => isTabletOrDesktop || showEmptyCategories));

        const instellingen$ = this.mentorDashboardDataService
            .groepsoverzichtInstellingen(this.isGezamenlijkOverzicht() ? null : this.activatedRoute.snapshot.params.id)
            .pipe(map((i) => i.registraties));
        this.groepsoverzichtView$ = combineLatest([instellingen$, this.activatedRoute.params, showEmptyCategories$]).pipe(
            tap(() => this.showLoader$.next(true)),
            switchMap(([instellingen, params, showEmptyCategories]) => {
                const tijdspanInstellingen = instellingen.tijdspan as MentordashboardOverzichtTijdspanOptie;
                const selectedTijdspan = this.tijdspanOptiesDropdown().find((optie) => optie.data === tijdspanInstellingen)!;
                const periode = match(tijdspanInstellingen)
                    .with('Laatste 7 dagen', () => MentordashboardOverzichtPeriode.ZEVEN_DAGEN)
                    .with('Laatste 30 dagen', () => MentordashboardOverzichtPeriode.DERTIG_DAGEN)
                    .with('Deze periode', () => MentordashboardOverzichtPeriode.CIJFERPERIODE)
                    .with('Huidig schooljaar', () => MentordashboardOverzichtPeriode.SCHOOLJAAR)
                    .exhaustive();
                const groepsoverzichtRegistraties = this.isGezamenlijkOverzicht()
                    ? this.mentorDashboardDataService.getGroepsoverzichtRegistratiesIndividueel(periode)
                    : this.mentorDashboardDataService.getGroepsoverzichtRegistraties(params.id, periode);
                return groepsoverzichtRegistraties.pipe(
                    map((result) => {
                        const { weergaves } = instellingen;
                        const visibleCategorieIds = weergaves.map((w) => w.categorie);

                        const registratiesMetContent = result.registraties.map((registratieCategorie) => ({
                            ...registratieCategorie,
                            categorieContent: isKolomCategorie(registratieCategorie.categorie)
                                ? registratieContent[registratieCategorie.categorie.kolom]
                                : registratieContent[LeerlingAfwezigheidsKolom.VRIJ_VELD]
                        }));

                        const filteredRegistraties = registratiesMetContent
                            .filter((rcat) => showEmptyCategories || rcat.leerlingRegistratieTellingen.length > 0)
                            .map((rcat) => {
                                const weergave = weergaves.find((weergave) => weergave.categorie === rcat.categorie.id);
                                if (!weergave) {
                                    return rcat;
                                }
                                return {
                                    ...rcat,
                                    leerlingRegistratieTellingen: rcat.leerlingRegistratieTellingen.filter(
                                        (telling) => telling.aantalRegistraties >= weergave.grenswaarde
                                    )
                                };
                            })
                            .filter((rcat) => visibleCategorieIds.includes(rcat.categorie.id));

                        return {
                            registraties: registratiesMetContent,
                            filteredRegistraties,
                            tijdspan: selectedTijdspan,
                            showEmptyCategories,
                            // lege categorieën toggle enkel tonen als er ook daadwerkelijk lege categorieën zijn
                            showEmptyCategoriesToggle: result.registraties.some((r) => r.leerlingRegistratieTellingen.length === 0),
                            weergaves,
                            geenCijferperiode: periode === MentordashboardOverzichtPeriode.CIJFERPERIODE && !result.cijferperiode,
                            periodeText: periodeText(periode, result.vanafDatum, result.totDatum, result.cijferperiode)
                        };
                    }),
                    tap(() => this.showLoader$.next(false))
                );
            })
        );
    }

    openWeergavePopup(regCategorieen: GroepoverzichtRegistratieWithContent[], weergaves: GroepsoverzichtWeergaveInstelling[]) {
        if (this.popupService.isPopupOpenFor(this.weergaveRef)) {
            this.popupService.closePopUp();
            return;
        }
        const popup = this.popupService.popup(
            this.weergaveRef,
            GroepsoverzichtWeergavePopupComponent.popupSettings,
            GroepsoverzichtWeergavePopupComponent
        );
        popup.weergaves = weergaves;
        popup.categorieen = regCategorieen;
        popup.onOpslaan = (opgeslagenWeergaves) => {
            this.mentorDashboardDataService.setGroepsoverzichtWeergaveInstellingen(
                this.activatedRoute.snapshot.params.id,
                opgeslagenWeergaves
            );
            this.showWeergaveOpgeslagenMessage = true;
            this.changedetectorRef.detectChanges();
        };
        this.changedetectorRef.detectChanges();
    }

    selectTijdspanOptie(optie: MentordashboardOverzichtTijdspanOptie) {
        this.mentorDashboardDataService.setGroepsoverzichtTijdspanSelectie(optie, this.activatedRoute.snapshot.params.id);
    }

    toggleEmptyCategories() {
        this.showEmptyCategoriesSubject.next(!this.showEmptyCategoriesSubject.value);
    }

    trackById(_index: number, item: GroepoverzichtRegistratieWithContent) {
        return item.categorie.id;
    }
}

interface GroepsoverzichtView {
    registraties: GroepoverzichtRegistratieWithContent[];
    /* De gefilterde registraties zijn gebaseerd op de weergave instellingen,
    bijvoorbeeld op een bepaalde grenswaarde vanaf wanneer een registratie getoond wordt. (zie ook de OnInit) */
    filteredRegistraties: GroepoverzichtRegistratieWithContent[];
    tijdspan: DropdownItem<MentordashboardOverzichtTijdspanOptie>;
    showEmptyCategories: boolean;
    showEmptyCategoriesToggle: boolean;
    weergaves: GroepsoverzichtWeergaveInstelling[];
    periodeText: string;
    geenCijferperiode: boolean;
}
