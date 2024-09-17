import { CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    GroepsoverzichtInstellingen,
    GroepsoverzichtResultatenSorteringsContext,
    MentordashboardResultatenInstellingen,
    SorteringOrder
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconDirective, SwitchComponent, SwitchGroupComponent, TooltipDirective, shareReplayLastValue } from 'harmony';
import { IconInformatie, IconResultaten, IconSettings, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { match } from 'ts-pattern';
import { GroepsoverzichtResultaten, GroepsoverzichtResultatenKolomNaam } from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { MentordashboardDataService } from '../../mentordashboard-data.service';
import { Resultatensoort, getBeschikbareTabs, getResultatentab } from '../../mentordashboard.utils';
import { GroepsoverzichtInstellingenResultatenPopupComponent } from '../groepsoverzicht-instellingen-resultaten-popup/groepsoverzicht-instellingen-resultaten-popup.component';
import { GroepsoverzichtResultatenKolomComponent } from './../groepsoverzicht-resultaten-kolom/groepsoverzicht-resultaten-kolom.component';

@Component({
    selector: 'dt-groepsoverzicht-resultaten',
    standalone: true,
    imports: [
        CommonModule,
        GroepsoverzichtResultatenKolomComponent,
        OutlineButtonComponent,
        MessageComponent,
        SwitchGroupComponent,
        SwitchComponent,
        TitleCasePipe,
        IconDirective,
        TooltipDirective
    ],
    templateUrl: './groepsoverzicht-resultaten.component.html',
    styleUrls: ['./groepsoverzicht-resultaten.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconSettings, IconResultaten, IconInformatie)]
})
export class GroepsoverzichtResultatenComponent implements OnInit {
    @ViewChild('instelling', { read: ViewContainerRef }) instellingRef: ViewContainerRef;

    @Input() isGezamenlijkOverzicht = false;

    public showInstellingOpgeslagenMessage = signal(false);

    public groepsoverzichtResultatenView$: Observable<GroepsoverzichtResultatenView>;

    public activeRoute = inject(ActivatedRoute);
    private mdDataService = inject(MentordashboardDataService);
    private medewerkerDataservice = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private router = inject(Router);

    ngOnInit() {
        const instellingen$ = this.activeRoute.params.pipe(
            switchMap((params) => this.mdDataService.groepsoverzichtInstellingen(this.isGezamenlijkOverzicht ? null : params.id)),
            map((instellingen) => instellingen.resultaten),
            shareReplayLastValue()
        );

        const voortgangdossierInzienRecht$ = this.medewerkerDataservice.heeftRecht(['heeftVoortgangsdossierInzienRecht']);
        const examendossierInzienRecht$ = this.medewerkerDataservice.heeftRecht(['heeftExamendossierInzienRecht']);
        const examendossierBeschikbaar$ = examendossierInzienRecht$.pipe(
            switchMap((heeftRecht) => {
                if (!heeftRecht) {
                    return of(false);
                }

                return this.activeRoute.params.pipe(
                    switchMap((params) => this.mdDataService.examenDossierAanwezig(this.isGezamenlijkOverzicht ? null : params.id)),
                    shareReplayLastValue()
                );
            })
        );

        this.groepsoverzichtResultatenView$ = combineLatest([
            voortgangdossierInzienRecht$,
            examendossierBeschikbaar$,
            this.activeRoute.queryParams,
            instellingen$
        ]).pipe(
            map(([voortgangdossierInzienRecht, examendossierBeschikbaar, queryParams, instellingen]) => ({
                instellingen,
                tab: getResultatentab(
                    voortgangdossierInzienRecht,
                    examendossierBeschikbaar,
                    queryParams.resultatentab,
                    'groepsoverzicht-resultatentab'
                ),
                beschikbareTabs: getBeschikbareTabs(voortgangdossierInzienRecht, examendossierBeschikbaar)
            })),
            switchMap((page) => {
                const stamgroepId = this.activeRoute.snapshot.params.id;
                const data$ = match(page.tab)
                    .with('examens', () =>
                        this.isGezamenlijkOverzicht
                            ? this.mdDataService.getGroepsExamenCijferoverzichtIndividueel(page.instellingen)
                            : this.mdDataService.getGroepsExamenCijferoverzicht(stamgroepId, page.instellingen)
                    )
                    .with('resultaten', () =>
                        this.isGezamenlijkOverzicht
                            ? this.mdDataService.getGroepsCijferoverzichtIndividueel(page.instellingen)
                            : this.mdDataService.getGroepsCijferoverzicht(stamgroepId, page.instellingen)
                    )
                    .exhaustive();

                return combineLatest([of(page.instellingen), of(page.tab), of(page.beschikbareTabs), data$]);
            }),
            map(([instellingen, tab, beschikbareTabs, cijferOverzicht]) => ({
                instellingen,
                tab,
                beschikbareTabs,
                cijferOverzicht
            }))
        );
    }

    openInstellingPopup(resultatenInstellingen: MentordashboardResultatenInstellingen) {
        if (this.popupService.isPopupOpenFor(this.instellingRef)) {
            this.popupService.closePopUp();
            return;
        }
        const popup = this.popupService.popup(
            this.instellingRef,
            GroepsoverzichtInstellingenResultatenPopupComponent.instellingenPopupsettings,
            GroepsoverzichtInstellingenResultatenPopupComponent
        );
        popup.instelling = resultatenInstellingen;
        popup.onOpslaan = (opgeslagenWeergaves) => {
            this.mdDataService.setGroepsoverzichtResultatenInstellingen(this.activeRoute.snapshot.params.id, opgeslagenWeergaves);
            this.showInstellingOpgeslagenMessage.set(true);
        };
    }

    selectKolomSorteerRichting(richting: SorteringOrder, kolomNaam: GroepsoverzichtResultatenKolomNaam) {
        this.mdDataService.setGroepsoverzichtResultatenSortering(this.activeRoute.snapshot.params.id, {
            context: GroepsoverzichtResultatenSorteringsContext.GROEPSOVERZICHT,
            [kolomNaam]: richting
        });
    }

    selectTab(tab: Resultatensoort) {
        this.router.navigate([], {
            queryParams: {
                resultatentab: tab
            },
            queryParamsHandling: 'merge',
            relativeTo: this.activeRoute
        });
        localStorage.setItem(localstorageResultatenTabKeyGroepsoverzicht, tab);
    }

    getTabGtm(tab: Resultatensoort): string {
        return tab === 'examens' ? 'groepsoverzicht-examen-tab' : 'groepsoverzicht-resultaten-tab';
    }
}

interface GroepsoverzichtResultatenView {
    instellingen: GroepsoverzichtInstellingen['resultaten'];
    tab: Resultatensoort;
    beschikbareTabs: Resultatensoort[];
    cijferOverzicht: GroepsoverzichtResultaten;
}

export const localstorageResultatenTabKeyGroepsoverzicht = 'groepsoverzicht-resultatentab';
