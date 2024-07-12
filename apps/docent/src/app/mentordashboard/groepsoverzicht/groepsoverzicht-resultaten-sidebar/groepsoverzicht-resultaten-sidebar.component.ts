import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    ColorToken,
    CssVarPipe,
    IconDirective,
    SpinnerComponent,
    TabInput,
    TabRowComponent,
    TooltipDirective,
    shareReplayLastValue
} from 'harmony';
import { IconInformatie, IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconResultaten, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, map } from 'rxjs';
import { match } from 'ts-pattern';
import { GemistResultaat, MentordashboardResultatenInstellingen } from '../../../../generated/_types';
import { LeerlingCijferOverzicht } from '../../../core/models/mentordashboard.model';
import { PopupService } from '../../../core/popup/popup.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { commaResult } from '../../../shared/pipes/comma-result.pipe';
import { MentordashboardDataService } from '../../mentordashboard-data.service';
import { MentordashboardGemisteToetsenPopupComponent } from '../../mentordashboard-gemiste-toetsen-popup/mentordashboard-gemiste-toetsen-popup.component';
import {
    MentordashboardLaatsteResultatenListComponent,
    MentordashboardLaatsteResultatenSidebarView
} from '../../mentordashboard-laatste-resultaten-list/mentordashboard-laatste-resultaten-list.component';
import { MentordashboardResultaatTrendInfoTileComponent } from '../../mentordashboard-resultaat-trend-info-tile/mentordashboard-resultaat-trend-info-tile.component';
import { MentordashboardSidebarInfoTileComponent } from '../../mentordashboard-sidebar-info-tile/mentordashboard-sidebar-info-tile.component';
import { MentordashboardToetsResultaatComponent } from '../../mentordashboard-toets-resultaat/mentordashboard-toets-resultaat.component';
import { Resultatensoort } from '../../mentordashboard.utils';
import { MentordashboardResultaatTrendColorPipe } from '../../pipes/mentordashboard-resultaat-trend-color.pipe';
import { MentordashboardResultaatTrendIconPipe } from '../../pipes/mentordashboard-resultaat-trend-icon.pipe';
import { MentordashboardResultaatTrendTextPipe } from '../../pipes/mentordashboard-resultaat-trend-text.pipe';
import { MentordashboardResultaatTrendTooltipPipe } from '../../pipes/mentordashboard-resultaat-trend-tooltip.pipe';
import { GroepsoverzichtExamenResultatenSidebarTableComponent } from './groepsoverzicht-examen-resultaten-sidebar-table/groepsoverzicht-examen-resultaten-sidebar-table.component';
import { GroepsoverzichtResultatenSidebarTableComponent } from './groepsoverzicht-resultaten-sidebar-table/groepsoverzicht-resultaten-sidebar-table.component';

@Component({
    selector: 'dt-groepsoverzicht-resultaten-sidebar',
    standalone: true,
    imports: [
        SidebarComponent,
        VolledigeNaamPipe,
        MentordashboardSidebarInfoTileComponent,
        GroepsoverzichtResultatenSidebarTableComponent,
        GroepsoverzichtExamenResultatenSidebarTableComponent,
        MentordashboardResultaatTrendInfoTileComponent,
        TabRowComponent,
        IconDirective,
        MentordashboardResultaatTrendIconPipe,
        MentordashboardResultaatTrendColorPipe,
        MentordashboardResultaatTrendTooltipPipe,
        MentordashboardResultaatTrendTextPipe,
        CssVarPipe,
        TooltipDirective,
        MentordashboardToetsResultaatComponent,
        SpinnerComponent,
        MentordashboardLaatsteResultatenListComponent,
        AsyncPipe
    ],
    providers: [provideIcons(IconInformatie, IconPijlRechts, IconPijlRechtsBeneden, IconPijlRechtsBoven, IconResultaten)],
    templateUrl: './groepsoverzicht-resultaten-sidebar.component.html',
    styleUrls: ['./groepsoverzicht-resultaten-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroepsoverzichtResultatenSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    @Input({ required: true }) leerlingCijferoverzicht: LeerlingCijferOverzicht;
    @Input({ required: true }) resultatenSoort: Resultatensoort;
    @ViewChild('gemisteToetsen', { read: ViewContainerRef }) gemisteToetsenRef: ViewContainerRef;

    public mdDataService = inject(MentordashboardDataService);
    private activatedRoute = inject(ActivatedRoute);
    private popupService = inject(PopupService);

    public activeTab = signal<GroepsoverzichtResultatenSidebarTab>('Vakgemiddelde');

    public instellingen$: Observable<MentordashboardResultatenInstellingen>;
    public vakgemiddeldeView$: Observable<GroepsoverzichtResultatenVakSidebarView>;
    public laatsteResultatenView$: Observable<MentordashboardLaatsteResultatenSidebarView>;

    tabs: TabInput[];
    laatsteResultatenTabLabel: Exclude<GroepsoverzichtResultatenSidebarTab, 'Vakgemiddelde'> = laatsteResultatenTabLabel;
    showEerdereResultaten = signal(false);
    showEerdereResultatenSpinner = signal(false);

    ngOnInit(): void {
        this.tabs = this.resultatenSoort === 'examens' ? examenTabs : defaultTabs;
        this.laatsteResultatenTabLabel = this.resultatenSoort === 'examens' ? laatsteSeResultatenTabLabel : laatsteResultatenTabLabel;

        const isGezamenlijkOverzicht = this.activatedRoute.snapshot.url[0].path === 'gezamenlijk-overzicht';
        // De instellingen moeten zelf opgehaald worden in de sidebar ipv doorgegeven als input, want
        // instellingen die geupdate worden in de cache, moeten opnieuw binnenkomen
        this.instellingen$ = this.mdDataService
            .groepsoverzichtInstellingen(isGezamenlijkOverzicht ? null : this.activatedRoute.snapshot.params.id)
            .pipe(
                map((i) => i.resultaten),
                shareReplayLastValue()
            );

        const gemisteToetsen$ =
            this.resultatenSoort === 'examens'
                ? this.mdDataService.getLeerlingExamendossierGemisteToetsen(this.leerlingCijferoverzicht.leerling.id)
                : this.mdDataService.getLeerlingVoortgangsdossierGemisteToetsen(this.leerlingCijferoverzicht.leerling.id);
        this.vakgemiddeldeView$ = combineLatest([this.instellingen$, gemisteToetsen$]).pipe(
            map(([instellingen, toetsen]) => ({
                instellingen,
                totaalGemiddeldeWaarde: `~ ${commaResult(this.leerlingCijferoverzicht.totaalgemiddelde ?? 0)}`,
                gemiddeldeColor: this.gemiddeldeColor(instellingen),
                gemisteToetsen: toetsen.data
            }))
        );

        const laatsteResultaten$ = match(this.resultatenSoort)
            .with('resultaten', () =>
                this.mdDataService.getLeerlingVoortgangsdossierLaatsteResultaten(
                    this.leerlingCijferoverzicht.leerling.id,
                    this.leerlingCijferoverzicht.aantalResultatenVoorTrendindicatie
                )
            )
            .with('examens', () =>
                this.mdDataService.getLeerlingExamendossierLaatsteResultaten(
                    this.leerlingCijferoverzicht.leerling.id,
                    this.leerlingCijferoverzicht.aantalResultatenVoorTrendindicatie
                )
            )
            .exhaustive();

        this.laatsteResultatenView$ = combineLatest([this.instellingen$, laatsteResultaten$]).pipe(
            map(([instellingen, resultaten]) => ({
                instellingen,
                laatsteResultaten: resultaten,
                eerdereResultaten: []
            }))
        );
    }

    gemiddeldeColor(instellingen: MentordashboardResultatenInstellingen): ColorToken {
        if (
            !this.leerlingCijferoverzicht.totaalgemiddelde ||
            this.leerlingCijferoverzicht.totaalgemiddelde < instellingen.grenswaardeZwaarOnvoldoende
        ) {
            return 'fg-negative-normal';
        }
        if (this.leerlingCijferoverzicht.totaalgemiddelde < instellingen.grenswaardeOnvoldoende) {
            return 'fg-warning-normal';
        }
        return 'text-strong';
    }

    openGemisteToetsenPopup(toetsen: GemistResultaat[]) {
        const popup = this.popupService.popup(
            this.gemisteToetsenRef,
            MentordashboardGemisteToetsenPopupComponent.popupSettings,
            MentordashboardGemisteToetsenPopupComponent
        );
        popup.gemisteToetsen = toetsen;
    }

    trendInfoClick() {
        this.activeTab.set(this.laatsteResultatenTabLabel);
    }

    onActiveTabChange(tabLabel: GroepsoverzichtResultatenSidebarTab) {
        this.activeTab.set(tabLabel);
    }
}

interface GroepsoverzichtResultatenVakSidebarView {
    instellingen: MentordashboardResultatenInstellingen;
    totaalGemiddeldeWaarde: string;
    gemiddeldeColor: ColorToken;
    gemisteToetsen: GemistResultaat[];
}

const laatsteResultatenTabLabel = 'Laatste resultaten';
const laatsteSeResultatenTabLabel = 'Laatste SE resultaten';
type GroepsoverzichtResultatenSidebarTab = 'Vakgemiddelde' | typeof laatsteResultatenTabLabel | typeof laatsteSeResultatenTabLabel;
const defaultTabs: TabInput[] = [{ label: 'Vakgemiddelde' }, { label: laatsteResultatenTabLabel }];
const examenTabs: TabInput[] = [{ label: 'Vakgemiddelde' }, { label: laatsteSeResultatenTabLabel }];
