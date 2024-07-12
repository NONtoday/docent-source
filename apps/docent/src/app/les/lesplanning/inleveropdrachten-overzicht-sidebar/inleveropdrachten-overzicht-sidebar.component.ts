import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { isBefore, parseISO } from 'date-fns';
import { SpinnerComponent } from 'harmony';
import { IconBewerken, IconInleveropdracht, IconPijlLinks, IconToevoegen, provideIcons } from 'harmony-icons';
import { differenceBy, negate } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { filter, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import {
    AfspraakQuery,
    DagToekenning,
    StudiewijzeritemQuery,
    Toekenning,
    ToekenningFieldsFragment,
    namedOperations
} from '../../../../generated/_types';
import { SaveToekenningContainer } from '../../../core/models';
import { IdObject } from '../../../core/models/shared.model';
import { startLoading, stopLoading } from '../../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../core/popup/popup.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { ProjectgroepenDataService } from '../../../core/services/projectgroepen-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { VerwijderButtonComponent } from '../../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional, loadingState, notEqualsId, sortLocaleNested } from '../../../rooster-shared/utils/utils';
import { inleveropdrachtVerwijderenGuardProperties } from '../../../shared-studiewijzer-les/utils/inleveropdrachten-verwijderen.utils';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ProjectgroepenComponent } from '../../../shared/components/projectgroepen-toevoegen/projectgroepen.component';
import { StudiewijzeritemInhoudComponent } from '../../../shared/components/studiewijzeritem-inhoud/studiewijzeritem-inhoud.component';
import { InleveropdrachtInhoudComponent } from '../../../shared/components/studiewijzeritem-sidebar/inleveropdracht-inhoud/inleveropdracht-inhoud.component';
import { ToekenningFormulierComponent } from '../../../shared/components/studiewijzeritem-sidebar/toekenning-formulier/toekenning-formulier.component';
import { SynchroniseerItemMetSjabloonComponent } from '../../../shared/components/synchroniseer-item-met-sjabloon/synchroniseer-item-met-sjabloon.component';
import { PLACEHOLDER_SORTERING, createInleveropdrachtToekenning } from '../../../shared/utils/toekenning.utils';
import { StudiewijzerDataService } from '../../../studiewijzers/studiewijzer-data.service';
import { LesDataService } from '../../les-data.service';
import { LesplanningDataService } from '../lesplanning-data.service';
import { InleveropdrachtOverzichtItemComponent } from './inleveropdracht-overzicht-item/inleveropdracht-overzicht-item.component';

interface ToekenningenSidebarView {
    toekomend: DagToekenning[];
    verlopen: DagToekenning[];
}

@Component({
    selector: 'dt-inleveropdrachten-overzicht-sidebar',
    templateUrl: './inleveropdrachten-overzicht-sidebar.component.html',
    styleUrls: ['./inleveropdrachten-overzicht-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        ToekenningFormulierComponent,
        ProjectgroepenComponent,
        InleveropdrachtInhoudComponent,
        SynchroniseerItemMetSjabloonComponent,
        StudiewijzeritemInhoudComponent,
        VerwijderButtonComponent,
        OutlineButtonComponent,
        InleveropdrachtOverzichtItemComponent,
        TooltipDirective,
        SpinnerComponent,
        AsyncPipe
    ],
    providers: [provideIcons(IconPijlLinks, IconInleveropdracht, IconBewerken, IconToevoegen)]
})
export class InleveropdrachtenOverzichtSidebarComponent extends BaseSidebar implements OnInit, OnDestroy {
    private viewContainerRef = inject(ViewContainerRef);
    public sidebarService = inject(SidebarService);
    private lesDataService = inject(LesDataService);
    private projectDataService = inject(ProjectgroepenDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private lesplanningDataService = inject(LesplanningDataService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    @ViewChild(ToekenningFormulierComponent) toekenningformulierComponent: ToekenningFormulierComponent;
    @ViewChild(ProjectgroepenComponent) projectgroepenToevoegenComponent: ProjectgroepenComponent;
    @ViewChild(SidebarComponent, { read: ElementRef }) sidebarComponent: ElementRef;

    @HostBinding('class.geen-items') geenItems = false;
    @Input() afspraak: AfspraakQuery['afspraak'];
    @Input() openToekenning: Optional<Toekenning>;
    @Input() disableSidebarAnimation = false;

    onDifferentiatieToekenning = output<Toekenning>();

    inleveropdrachten$: Observable<ToekenningenSidebarView>;
    detailToekenning$ = new BehaviorSubject<Optional<Toekenning>>(null);
    editToekenning$ = new BehaviorSubject<Optional<Toekenning>>(null);
    toonProjectgroepen$ = new BehaviorSubject<boolean>(false);
    studiewijzeritem$: Observable<StudiewijzeritemQuery['studiewijzeritem'] | null> = of(null);
    nietGekoppeldeLesgroepNamen$: Observable<string | null>;
    sidebarTitle$: Observable<string>;
    heeftToegangTotElo$: Observable<boolean>;
    heeftToegangTotSw$: Observable<boolean>;
    loadingState = loadingState();
    differentiatieToegestaan$: Observable<boolean>;

    private unsubscribe$ = new Subject<void>();

    ngOnInit() {
        const isToekomend = (toekenning: ToekenningFieldsFragment) => {
            const eind = toekenning.studiewijzeritem.inleverperiode?.eind;
            return eind ? isBefore(new Date(), parseISO(eind.toISOString())) : false;
        };
        const isVerlopen = negate(isToekomend);

        this.detailToekenning$.next(this.openToekenning);
        this.inleveropdrachten$ = this.lesDataService.getInleveropdrachten(this.lesgroepIds).pipe(
            tap((toekenningen: ToekenningFieldsFragment[]) => {
                // View ook updaten in viewmodus als deze openstaat.
                const detailToekenning = this.detailToekenning$.getValue();
                if (detailToekenning) {
                    const updatedToekenning = toekenningen.find((toekenning) => toekenning.id === detailToekenning.id) ?? null;
                    this.detailToekenning$.next(updatedToekenning as DagToekenning);
                }
            }),
            map((toekenningen: ToekenningFieldsFragment[]) => ({
                toekomend: sortLocaleNested(
                    toekenningen.filter(isToekomend) as DagToekenning[],
                    (toekenning) => toekenning.studiewijzeritem.inleverperiode,
                    ['eind'],
                    ['asc']
                ),
                verlopen: sortLocaleNested(
                    toekenningen.filter(isVerlopen) as DagToekenning[],
                    (toekenning) => toekenning.studiewijzeritem.inleverperiode,
                    ['eind'],
                    ['desc']
                )
            })),
            tap((view: ToekenningenSidebarView) => {
                this.geenItems = view.toekomend.length === 0 && view.verlopen.length === 0;
            })
        );

        this.studiewijzeritem$ = this.detailToekenning$.pipe(
            startLoading(this.loadingState),
            switchMap((toekenning) =>
                toekenning ? this.projectDataService.getCachedStudiewijzeritem(toekenning.studiewijzeritem.id) : of(null)
            ),
            stopLoading(this.loadingState)
        );

        this.nietGekoppeldeLesgroepNamen$ = this.medewerkerDataService.getLesgroepenVanDocent().pipe(
            map((lesgroepenVanDocent) =>
                differenceBy(this.afspraak.lesgroepen, lesgroepenVanDocent, 'id')
                    .map((nietGekoppeldeLesgroep) => nietGekoppeldeLesgroep.naam)
                    .join(', ')
            ),
            startWith(null),
            shareReplayLastValue()
        );

        this.sidebarTitle$ = combineLatest([this.detailToekenning$, this.toonProjectgroepen$]).pipe(
            map(([inDetail, toonProjectgroepen]) => {
                if (inDetail) {
                    return toonProjectgroepen ? 'Projectgroepen' : 'Inleveropdracht bekijken';
                }
                return 'Inleveropdrachten';
            })
        );

        const medewerker$ = this.medewerkerDataService.getMedewerker().pipe(shareReplayLastValue());
        this.heeftToegangTotElo$ = medewerker$.pipe(map((medewerker) => medewerker.settings.vestigingRechten[0].heeftToegangTotElo));
        this.heeftToegangTotSw$ = medewerker$.pipe(
            map((medewerker) => medewerker.settings.vestigingRechten[0].heeftToegangTotStudiewijzer)
        );

        this.differentiatieToegestaan$ = this.medewerkerDataService.differentiatieToegestaanVoorVestiging(this.afspraak.vestigingId);
    }

    onInleveropdrachtToevoegenClick() {
        // click alleen mogelijk wanneer er geen lesgroepenen aan de afspraak hangen,
        // die niet aan de docent zijn gekoppeld
        this.nietGekoppeldeLesgroepNamen$
            .pipe(
                filter((namen) => namen === ''),
                take(1)
            )
            .subscribe(() => {
                this.editToekenning$.next(createInleveropdrachtToekenning(this.afspraak.begin, PLACEHOLDER_SORTERING));
            });
    }

    onEditClick(toekenning: Toekenning) {
        this.editToekenning$.next(toekenning as DagToekenning);
        this.detailToekenning$.next(null);
    }

    onDeleteClick(toekenning: Toekenning) {
        if (toekenning.studiewijzeritem.inleverperiode!.inleveringenAantal > 0) {
            this.showBevestigVerwijderPopup(toekenning);
        } else {
            this.verwijderToekenning(toekenning);
        }
    }

    openProjectgroepen() {
        this.toonProjectgroepen$.next(true);
    }

    closeProjectgroepen() {
        this.toonProjectgroepen$.next(false);
    }

    toonDetailInleveropdracht(dagToekenning: Toekenning) {
        this.detailToekenning$.next(dagToekenning);
        this.editToekenning$.next(null);
    }

    onSaveToekenning(saveToekenningContainer: SaveToekenningContainer) {
        const lesgroepen = this.editToekenning$.value?.id ? [this.editToekenning$.value.lesgroep] : this.afspraak.lesgroepen;
        const toSaveToekenningen = lesgroepen.map(
            (lesgroep) =>
                ({
                    ...(<DagToekenning>saveToekenningContainer.toekenningen[0]),
                    lesgroep
                }) as DagToekenning
        );

        this.saveToekenningen(toSaveToekenningen);
    }

    verwijderAlleDiffLeerlingen() {
        const detailToekenning = this.detailToekenning$.getValue();
        if (detailToekenning) {
            const toekenning: Toekenning = { ...detailToekenning, differentiatieleerlingen: [] };
            this.detailToekenning$.next(toekenning);
            this.saveToekenningen([toekenning]);
        }
    }

    verwijderDiffLeerling(leerlingId: string) {
        const detailToekenning = this.detailToekenning$.getValue();
        if (detailToekenning) {
            const toekenning = {
                ...detailToekenning,
                differentiatieleerlingen: [...detailToekenning.differentiatieleerlingen].filter(notEqualsId(leerlingId))
            };
            this.detailToekenning$.next(toekenning);
            this.saveToekenningen([toekenning]);
        }
    }

    verwijderDiffGroep(groepId: string) {
        const detailToekenning = this.detailToekenning$.getValue();
        if (detailToekenning) {
            const toekenning = {
                ...detailToekenning,
                differentiatiegroepen: [...detailToekenning.differentiatiegroepen].filter(notEqualsId(groepId))
            };
            this.detailToekenning$.next(toekenning);
            this.saveToekenningen([toekenning]);
        }
    }

    onTerugClick() {
        if (this.toonProjectgroepen$.value) {
            this.toonProjectgroepen$.next(false);
        } else {
            this.detailToekenning$.next(null);
        }
    }

    closeSidebar() {
        if (this.toekenningformulierComponent?.isUploading) {
            this.openUploadGuard();
        } else if (this.editToekenning$.value && this.toekenningformulierComponent.heeftTekstueleOfDifferentiatieWijzigingen()) {
            this.openEditToekenningGuard();
        } else {
            this.sidebarService.closeSidebar();
        }
    }

    toggleZichtbaarheid(toekenning: Toekenning) {
        this.lesDataService.updateToekenningZichtbaarheid(
            this.afspraak.lesgroepen.map((lesgroep) => lesgroep.id),
            toekenning,
            !toekenning.studiewijzeritem.zichtbaarVoorLeerling
        );
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    trackById(index: number, item: IdObject) {
        return item.id;
    }

    showBevestigVerwijderPopup(toekenning: Toekenning) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        Object.assign(popup, inleveropdrachtVerwijderenGuardProperties);
        popup.onConfirmFn = () => {
            this.verwijderToekenning(toekenning);
            return true;
        };
    }

    unlinkToekenning(toekenningId: string) {
        this.studiewijzerDataService.ontkoppelToekenning(toekenningId, [namedOperations.Query.inleveropdrachten]).subscribe();
    }

    scrollSidebarToBottom() {
        this.sidebarComponent.nativeElement.scrollTo({
            top: this.sidebarComponent.nativeElement.scrollHeight,
            behavior: 'smooth'
        });
    }

    private verwijderToekenning(toekenning: Toekenning) {
        this.lesDataService.verwijderToekenning(
            this.afspraak.lesgroepen.map((lesgroep) => lesgroep.id),
            toekenning as DagToekenning,
            false
        );
        this.editToekenning$.next(null);
        this.detailToekenning$.next(null);
    }

    private openEditToekenningGuard() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, wijzigingen zijn niet opgeslagen';
        popup.message = `Weet je zeker dat je wilt stoppen met bewerken van deze inleveropdracht? Wijzigingen worden niet opgeslagen.`;
        popup.actionLabel = 'Stoppen met bewerken';
        popup.cancelLabel = 'Annuleren';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'accent_negative_1';

        popup.onConfirmFn = () => {
            this.sidebarService.closeSidebar();
            return true;
        };
    }

    private openUploadGuard() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, er zijn nog bestanden aan het uploaden';
        popup.message = 'Als je het overzicht sluit worden de uploads afgebroken. Weet je zeker dat je het overzicht wilt sluiten?';
        popup.actionLabel = 'Ja, sluit overzicht';
        popup.cancelLabel = 'Terug naar overzicht';

        popup.onConfirmFn = () => {
            // De uploads kunnen klaar zijn op het moment als deze subscription uitgevoerd wordt.
            if (this.toekenningformulierComponent.isUploading) {
                this.toekenningformulierComponent.omschrijvingEnBijlage.uploadLijst.cancelAllUploads();
            }
            this.sidebarService.closeSidebar();
            return true;
        };
    }

    saveToekenningen(toekenningen: Toekenning[]) {
        this.lesplanningDataService
            .saveDagToekenning$(toekenningen as DagToekenning[], this.afspraak)
            .pipe(map((result) => result.data?.saveDagToekenning.toekenningen))
            .subscribe((toekenningen) => {
                if (toekenningen) {
                    this.detailToekenning$.next(toekenningen[0] as DagToekenning);
                    this.editToekenning$.next(null);
                }
            });
    }

    private get lesgroepIds(): string[] {
        return this.afspraak.lesgroepen.map((lesgroep) => lesgroep.id);
    }
}
