import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AfspraakQuery, Lesgroep, Maybe, Toekenning } from '@docent/codegen';
import { getDate, getMonth, getYear } from 'date-fns';
import { IconDifferentiatie, IconRooster, provideIcons } from 'harmony-icons';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { allowChildAnimations } from '../core/core-animations';
import { Differentiatie } from '../core/models/studiewijzers/shared.model';
import { shareReplayLastValue } from '../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../core/popup/popup.service';
import { ComponentUploadService } from '../core/services/component-upload.service';
import { MaskService } from '../core/services/mask.service';
import { MedewerkerDataService } from '../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../core/services/sidebar.service';
import { UploadDataService } from '../core/services/upload-data.service';
import { HeaderComponent } from '../layout/header/header.component';
import { ActueleNotitiesSidebarComponent } from '../notitieboek/actuele-notities-sidebar/actuele-notities-sidebar.component';
import { differentiatiegroepen } from '../rooster-shared/components/actions-popup/actions-popup.component';
import { sidebarMaskId } from '../rooster-shared/components/sidebar/sidebar.component';
import { WerkdrukSidebarComponent } from '../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { differentiatiegroepenBevatLeerling } from '../rooster-shared/utils/utils';
import { RoosterDataService } from '../rooster/rooster-data.service';
import { DifferentiatieToekennenSidebarComponent } from '../shared/components/differentiatie-toekennen-sidebar/differentiatie-toekennen-sidebar.component';
import { DifferentiatieSidebarComponent } from '../shared/components/differentiatie/differentiatie-sidebar/differentiatie-sidebar.component';
import { isAfspraakToekenning, isDagToekenning, isWeekToekenning } from '../shared/utils/toekenning.utils';
import { GroepNavigatieComponent } from './groep-navigatie/groep-navigatie.component';
import { LesDataService } from './les-data.service';
import { LesService } from './les.service';
import { LesgroepDeeplinkPopupComponent } from './lesgroep-deeplink-popup/lesgroep-deeplink-popup.component';
import { LesmomentHeaderNavigatieComponent } from './lesmoment-header-navigatie/lesmoment-header-navigatie.component';
import { InleveropdrachtenOverzichtSidebarComponent } from './lesplanning/inleveropdrachten-overzicht-sidebar/inleveropdrachten-overzicht-sidebar.component';
import { LesplanningDataService } from './lesplanning/lesplanning-data.service';

interface LesNavigatie {
    afspraak: AfspraakQuery['afspraak'];
    prevId: string;
    nextId: string;
    toegangTotDifferentiatie: boolean;
}

@Component({
    templateUrl: './les.component.html',
    styleUrls: ['./les.component.scss'],
    providers: [ComponentUploadService, LesService, UploadDataService, provideIcons(IconRooster, IconDifferentiatie)],
    animations: [allowChildAnimations],
    standalone: true,
    imports: [
        HeaderComponent,
        LesmomentHeaderNavigatieComponent,
        GroepNavigatieComponent,
        RouterOutlet,
        InleveropdrachtenOverzichtSidebarComponent,
        WerkdrukSidebarComponent,
        DifferentiatieSidebarComponent,
        DifferentiatieToekennenSidebarComponent,
        ActueleNotitiesSidebarComponent,
        AsyncPipe
    ]
})
export class LesComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private lesDataService = inject(LesDataService);
    private roosterDataService = inject(RoosterDataService);
    private router = inject(Router);
    private sidebarService = inject(SidebarService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private maskService = inject(MaskService);
    private lesplanningDataService = inject(LesplanningDataService);
    private popupService = inject(PopupService);
    public afspraak$: Observable<AfspraakQuery['afspraak']>;
    public prevId$: Observable<string>;
    public nextId$: Observable<string>;
    public showInleveropdrachten$: Observable<boolean>;
    public heeftToegangTotDifferentiatie$: Observable<boolean>;

    public werkdrukSidebar$: SidebarInputs<WerkdrukSidebarComponent>;
    public differentiatieSidebar$: SidebarInputs<DifferentiatieSidebarComponent>;
    public inleveropdrachtenOverzichtSidebar$: SidebarInputs<InleveropdrachtenOverzichtSidebarComponent>;
    public differentiatieToekennenSidebar$: SidebarInputs<DifferentiatieToekennenSidebarComponent>;
    public actueleNotitiesSidebar$: SidebarInputs<ActueleNotitiesSidebarComponent>;

    public navigatie$: Observable<LesNavigatie>;

    private onDestroy$: Subject<void> = new Subject<void>();

    ngOnInit() {
        this.afspraak$ = this.route.paramMap.pipe(
            switchMap((params) => this.lesDataService.getAfspraak(params.get('id')!)),
            shareReplayLastValue()
        );

        this.heeftToegangTotDifferentiatie$ = this.afspraak$.pipe(
            switchMap((afspraak) => this.medewerkerDataService.differentiatieToegestaanVoorVestiging(afspraak.vestigingId))
        );

        const afsprakenIds$ = this.afspraak$.pipe(
            switchMap((afspraak) => this.roosterDataService.getRoosterAfsprakenVanDag(afspraak.begin)),
            map((afspraken) => afspraken.map((afspraak) => afspraak.id)),
            shareReplayLastValue()
        );

        this.navigatie$ = afsprakenIds$.pipe(
            withLatestFrom(this.afspraak$, this.heeftToegangTotDifferentiatie$),
            map(([ids, afspraak, toegangTotDifferentiatie]) => ({
                afspraak,
                prevId: ids[ids.indexOf(afspraak.id) - 1],
                nextId: ids[ids.indexOf(afspraak.id) + 1],
                toegangTotDifferentiatie
            }))
        );

        this.showInleveropdrachten$ = combineLatest([this.afspraak$, this.medewerkerDataService.heeftToegangTotEloEnSw()]).pipe(
            map(
                ([afspraak, toegangTotEloEnSw]) =>
                    afspraak.isRoosterAfspraak && !afspraak.isKwt && afspraak.heeftLesgroepen && toegangTotEloEnSw
            )
        );

        this.inleveropdrachtenOverzichtSidebar$ = this.sidebarService.watchFor(InleveropdrachtenOverzichtSidebarComponent);
        this.differentiatieToekennenSidebar$ = this.sidebarService.watchFor(DifferentiatieToekennenSidebarComponent);
        this.werkdrukSidebar$ = this.sidebarService.watchFor(WerkdrukSidebarComponent);
        this.differentiatieSidebar$ = this.sidebarService.watchFor(DifferentiatieSidebarComponent);
        this.actueleNotitiesSidebar$ = this.sidebarService.watchFor(ActueleNotitiesSidebarComponent);
    }

    onMeerOptiesClick(moreOptionsRef: ViewContainerRef, afspraak: AfspraakQuery['afspraak'], toegangTotDifferentiatie: boolean) {
        if (afspraak.lesgroepen.length > 0) {
            const popup = this.popupService.popup(
                moreOptionsRef,
                LesgroepDeeplinkPopupComponent.defaultPopupsettings,
                LesgroepDeeplinkPopupComponent
            );

            if (toegangTotDifferentiatie) {
                popup.customButtons = [
                    differentiatiegroepen((lesgroep: Lesgroep) => {
                        this.sidebarService.openSidebar(DifferentiatieSidebarComponent, { lesgroep });
                        this.popupService.closePopUp();
                    }, 'lesplanning-differentiatiegroepen')
                ];
                popup.toonCustomButtons = true;
                popup.showDividerLine = false;
            }
            popup.lesgroepen = afspraak.lesgroepen;
            popup.metStudiewijzerLink = true;
            popup.toonNieuweNotitie = true;
        }
    }

    onInleveropdrachtenClick() {
        this.sidebarService.openSidebar(InleveropdrachtenOverzichtSidebarComponent);
    }

    public navigeerNaarRooster(afspraak: Maybe<AfspraakQuery['afspraak']>) {
        if (afspraak) {
            const date = afspraak.begin;
            this.router.navigate(['/rooster', getYear(date), getMonth(date) + 1, getDate(date)]);
        } else {
            this.router.navigate(['/rooster']);
        }
    }

    ngOnDestroy() {
        this.lesDataService.removeRegistratieAndLesplanningFromCache();

        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onDifferentiatieToekennenClick(toekenning: Toekenning) {
        this.maskService.removeMask(sidebarMaskId, true);
        this.sidebarService.closeSidebar();
        setTimeout(() => {
            this.sidebarService.openSidebar(DifferentiatieToekennenSidebarComponent, {
                lesgroep: toekenning.lesgroep,
                toekenning,
                disableSidebarAnimation: true
            });
        });
    }

    onDifferentiatieToekennen(event: { differentiatie: Differentiatie; toekenning: Toekenning }, afspraak: AfspraakQuery['afspraak']) {
        const toekenning = event.toekenning;
        const filteredLeerlingen = event.differentiatie.differentiatieleerlingen.filter(
            (leerling) => !differentiatiegroepenBevatLeerling(toekenning.differentiatiegroepen, leerling.id)
        );
        const updatedToekenning = {
            ...toekenning,
            differentiatiegroepen: [...toekenning.differentiatiegroepen, ...event.differentiatie.differentiatiegroepen],
            differentiatieleerlingen: [...toekenning.differentiatieleerlingen, ...filteredLeerlingen]
        } as Toekenning;

        const baseAfspraakId = this.route.snapshot.parent!.paramMap.get('id')!;

        if (isDagToekenning(updatedToekenning)) {
            this.lesplanningDataService.saveDagToekenning$([updatedToekenning], afspraak, baseAfspraakId).subscribe();
        } else if (isAfspraakToekenning(updatedToekenning)) {
            this.lesplanningDataService.saveAfspraakToekenning([updatedToekenning]);
        } else if (isWeekToekenning(updatedToekenning)) {
            this.lesplanningDataService.saveWeekToekenning([updatedToekenning], afspraak, getYear(afspraak.begin));
        }

        if (updatedToekenning.studiewijzeritem.inleverperiode) {
            this.sidebarService.closeSidebar();
            this.maskService.removeMask(sidebarMaskId, true);
            setTimeout(() => {
                this.sidebarService.openSidebar(InleveropdrachtenOverzichtSidebarComponent, {
                    openToekenning: updatedToekenning,
                    disableSidebarAnimation: true
                });
            });
        }
    }

    // Levert '/lesplanning' of '/registratie' op
    private getLesplanningOfLeerlingregistratieUrlPostfix() {
        const url = this.router.url;
        const lastIndexSlash = url.lastIndexOf('/');
        let lastIndexOfQuestionmark = url.lastIndexOf('?');
        if (lastIndexOfQuestionmark === -1) {
            lastIndexOfQuestionmark = url.length;
        }
        return url.substring(lastIndexSlash, lastIndexOfQuestionmark);
    }

    public toPrevious(prevId: string) {
        this.router.navigate([`rooster/les/${prevId}${this.getLesplanningOfLeerlingregistratieUrlPostfix()}`]);
    }

    public toNext(nextId: string) {
        this.router.navigate([`rooster/les/${nextId}${this.getLesplanningOfLeerlingregistratieUrlPostfix()}`]);
    }
}
