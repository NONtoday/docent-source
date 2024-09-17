import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    MentordashboardOverzichtPeriode,
    MentordashboardOverzichtPeriodeOptie,
    MentordashboardOverzichtPeriodeOpties,
    MentordashboardOverzichtRegistratieVrijVeldCategorie,
    PeriodeRegistratieDetails,
    Registratie
} from '@docent/codegen';
import {
    BrowseComponent,
    HeatmapComponent,
    HorizontalScrollButtonsDirective,
    IconDirective,
    NotificationSolidComponent,
    SpinnerComponent
} from 'harmony';
import { IconChevronRechts, provideIcons } from 'harmony-icons';
import { orderBy } from 'lodash-es';
import { Observable, Subject, combineLatest, map, switchMap, tap } from 'rxjs';
import { match } from 'ts-pattern';
import { MentordashboardOverzichtLeerlingRegistratieWithContent } from '../../core/models/mentordashboard.model';
import { SidebarService } from '../../core/services/sidebar.service';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { RegistratiesVerloopGrafiekComponent } from '../../shared/components/registraties-verloop-grafiek/registraties-verloop-grafiek.component';
import { UrenDurationPipe } from '../../shared/pipes/uren-duration.pipe';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardSidebarInfoTileComponent } from '../mentordashboard-sidebar-info-tile/mentordashboard-sidebar-info-tile.component';
import { registratieHeatmapTooltip } from '../mentordashboard.utils';
import { FormatPercentageRegistratiesPipe } from '../pipes/format-percentage.pipe';
import { MentordashboardRegistratieTrendTooltipPipe } from '../pipes/mentordashboard-registratie-trend-tooltip.pipe';
import { MentordashboardOverzichtSidebarVakRegistratieComponent } from './mentordashboard-overzicht-sidebar-vak-registratie/mentordashboard-overzicht-sidebar-vak-registratie.component';

@Component({
    selector: 'dt-mentordashboard-overzicht-sidebar-registratiedetails',
    standalone: true,
    imports: [
        MentordashboardSidebarInfoTileComponent,
        UrenDurationPipe,
        SpinnerComponent,
        MentordashboardOverzichtSidebarVakRegistratieComponent,
        MentordashboardRegistratieTrendTooltipPipe,
        IconDirective,
        NotificationSolidComponent,
        BrowseComponent,
        FormatPercentageRegistratiesPipe,
        HeatmapComponent,
        RegistratiesVerloopGrafiekComponent,
        HorizontalScrollButtonsDirective,
        AsyncPipe
    ],
    templateUrl: './mentordashboard-overzicht-sidebar-registratiedetails.component.html',
    styleUrls: ['./mentordashboard-overzicht-sidebar-registratiedetails.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronRechts)]
})
export class MentordashboardOverzichtSidebarRegistratiedetailsComponent implements OnInit {
    @Input({ required: true }) leerlingRegistratie: MentordashboardOverzichtLeerlingRegistratieWithContent;
    @Input() showLinkLeerlingoverzicht = true;
    @Input() titelLinkRegistratiesPerVak: Optional<string>;

    public groepsoverzichtSidebarRegistratiedetailsView$: Observable<MentordashboardOverzichtSidebarRegistratiedetailsView>;
    public selectedPeriodeOptie$ = new Subject<MentordashboardOverzichtPeriodeOptie>();
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private mdService = inject(MentordashboardDataService);
    private tijdspanOpties: MentordashboardOverzichtPeriodeOptie[];
    private sidebarService = inject(SidebarService);

    heatmapTooltipFn = registratieHeatmapTooltip;

    ngOnInit(): void {
        const tijdvakOpties$ = match(this.activatedRoute.snapshot.url[0].path as SubRoute)
            .with('gezamenlijk-overzicht', () => this.mdService.getGroepsoverzichtRegistratieTijdvakOptiesIndividueel())
            .with('stamgroep', () => this.mdService.getGroepsoverzichtRegistratieTijdvakOpties(this.activatedRoute.snapshot.params['id']))
            .with('leerling', () => this.mdService.getLeerlingoverzichtRegistratieTijdvakOpties(this.activatedRoute.snapshot.params['id']))
            .exhaustive();

        const registratieTijdvakOpties$ = tijdvakOpties$.pipe(
            tap((opties) => {
                this.tijdspanOpties = match(this.leerlingRegistratie.tijdspan)
                    .with('Laatste 7 dagen', () => opties.zevenDagenOpties)
                    .with('Laatste 30 dagen', () => opties.dertigDagenOpties)
                    .with('Deze periode', () => opties.cijferPeriodeOpties)
                    .with('Huidig schooljaar', () => [opties.schooljaarOptie])
                    .exhaustive();
                const laatstePeriode = this.tijdspanOpties.at(-1);
                if (laatstePeriode) {
                    this.selectedPeriodeOptie$.next(laatstePeriode);
                }
            })
        );

        const periodeRegistraties$ = this.selectedPeriodeOptie$.pipe(
            switchMap((periode) =>
                match(this.leerlingRegistratie.categorie)
                    .with({ __typename: 'MentordashboardOverzichtRegistratieVrijVeldCategorie' }, (categorie) =>
                        this.mdService.getGroepsoverzichtPeriodeRegistratiesVrijVeld(
                            this.leerlingRegistratie.leerlingId,
                            categorie.vrijVeld.id,
                            periode.vanafDatum,
                            periode.totDatum,
                            categorie.keuzelijstWaarde?.id
                        )
                    )
                    .with({ __typename: 'MentordashboardOverzichtRegistratieKolomCategorie' }, (categorie) =>
                        this.mdService.getGroepsoverzichtPeriodeRegistratiesAfwezig(
                            this.leerlingRegistratie.leerlingId,
                            categorie.kolom,
                            periode.vanafDatum,
                            periode.totDatum
                        )
                    )
                    .exhaustive()
            ),
            map((registraties) => {
                return {
                    ...registraties,
                    vakRegistraties: orderBy(registraties.vakRegistraties, (vakRegistratie) => vakRegistratie.registraties.length, 'desc')
                };
            })
        );

        this.groepsoverzichtSidebarRegistratiedetailsView$ = combineLatest({
            periodeOpties: registratieTijdvakOpties$,
            selectedPeriode: this.selectedPeriodeOptie$,
            periodeRegistraties: periodeRegistraties$
        }).pipe(
            map(({ periodeOpties, selectedPeriode, periodeRegistraties }) => ({
                leerlingRegistratie: this.leerlingRegistratie,
                periodeOpties: periodeOpties,
                tijdspanOpties: this.tijdspanOpties,
                selectedPeriode: selectedPeriode,
                hasNext: this.hasNextItem(this.tijdspanOpties, selectedPeriode),
                hasPrevious: this.hasPreviousItem(this.tijdspanOpties, selectedPeriode),
                headerTitle: match(this.leerlingRegistratie.categorie)
                    .with({ __typename: 'MentordashboardOverzichtRegistratieVrijVeldCategorie' }, (categorie) => categorie.vrijVeld.naam)
                    .with(
                        { __typename: 'MentordashboardOverzichtRegistratieKolomCategorie' },
                        () => this.leerlingRegistratie.categorieContent?.naam
                    )
                    .exhaustive(),
                headerSubtitle: match(this.leerlingRegistratie.tijdspan)
                    .with('Laatste 7 dagen', () => this.generateDateRangePeriodeNaam(selectedPeriode))
                    .with('Laatste 30 dagen', () => this.generateDateRangePeriodeNaam(selectedPeriode))
                    .with('Deze periode', () => this.getPeriodeNaam(selectedPeriode))
                    .with('Huidig schooljaar', () => this.getPeriodeNaam(selectedPeriode))
                    .exhaustive(),
                keuzelijstWaardeText:
                    (<MentordashboardOverzichtRegistratieVrijVeldCategorie>this.leerlingRegistratie.categorie).keuzelijstWaarde?.waarde ??
                    '',
                periodeRegistraties: periodeRegistraties,
                grafiekRegistraties: periodeRegistraties.vakRegistraties.flatMap((v) => v.registraties),
                toonHeatmapTooltip: this.leerlingRegistratie.categorie.__typename === 'MentordashboardOverzichtRegistratieKolomCategorie',
                isAfwezigheidsCategorie:
                    this.leerlingRegistratie.categorieContent.naam === 'Geoorloofd afwezig' ||
                    this.leerlingRegistratie.categorieContent.naam === 'Ongeoorloofd afwezig',
                showPeriodeNavigation: selectedPeriode.periode !== MentordashboardOverzichtPeriode.SCHOOLJAAR,
                huidigePeriodeText:
                    selectedPeriode.isHuidig && selectedPeriode.periode !== MentordashboardOverzichtPeriode.SCHOOLJAAR
                        ? 'huidig'
                        : undefined,
                backTooltip: match(this.leerlingRegistratie.tijdspan)
                    .with('Laatste 7 dagen', () => 'Vorige 7 dagen')
                    .with('Laatste 30 dagen', () => 'Vorige 30 dagen')
                    .with('Deze periode', () => 'Vorige periode')
                    .with('Huidig schooljaar', () => '-')
                    .exhaustive(),
                nextTooltip: match(this.leerlingRegistratie.tijdspan)
                    .with('Laatste 7 dagen', () => 'Volgende 7 dagen')
                    .with('Laatste 30 dagen', () => 'Volgende 30 dagen')
                    .with('Deze periode', () => 'Volgende periode')
                    .with('Huidig schooljaar', () => '-')
                    .exhaustive()
            }))
        );
    }

    private getPeriodeNaam(periode: MentordashboardOverzichtPeriodeOptie): string {
        return periode.naam || this.generateDateRangePeriodeNaam(periode);
    }

    private generateDateRangePeriodeNaam(periode: MentordashboardOverzichtPeriodeOptie): string {
        return `${formatDateNL(periode.vanafDatum, 'dagnummer_maand_kort')} - ${formatDateNL(periode.totDatum, 'dagnummer_maand_kort')}`;
    }

    onBackClick(tijdspanOpties: MentordashboardOverzichtPeriodeOptie[], selectedOptie: MentordashboardOverzichtPeriodeOptie): void {
        const selectedIndex = selectedOptie ? tijdspanOpties.indexOf(selectedOptie) : -1;
        if (selectedIndex > 0) {
            const previousItem = tijdspanOpties[selectedIndex - 1];
            this.selectedPeriodeOptie$.next(previousItem);
        }
    }

    onNextClick(tijdspanOpties: MentordashboardOverzichtPeriodeOptie[], selectedOptie: MentordashboardOverzichtPeriodeOptie): void {
        const selectedIndex = selectedOptie ? tijdspanOpties.indexOf(selectedOptie) : -1;
        if (selectedIndex < tijdspanOpties.length - 1) {
            const nextItem = tijdspanOpties[selectedIndex + 1];
            this.selectedPeriodeOptie$.next(nextItem);
        }
    }

    navigateToLeerlingVakregistraties(): void {
        this.sidebarService.closeSidebar();
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingRegistratie.leerlingId}/registraties/vakken`);
    }

    navigateToLeerlingoverzicht(): void {
        this.sidebarService.closeSidebar();
        this.router.navigateByUrl(`/mentordashboard/leerling/${this.leerlingRegistratie.leerlingId}/overzicht`);
    }

    private hasNextItem(
        tijdspanOpties: MentordashboardOverzichtPeriodeOptie[],
        selectedPeriodeOptie: MentordashboardOverzichtPeriodeOptie
    ): boolean {
        const selectedIndex = tijdspanOpties.indexOf(selectedPeriodeOptie);
        return selectedIndex < tijdspanOpties.length - 1;
    }

    private hasPreviousItem(
        tijdspanOpties: MentordashboardOverzichtPeriodeOptie[],
        selectedPeriodeOptie: MentordashboardOverzichtPeriodeOptie
    ): boolean {
        const selectedIndex = tijdspanOpties.indexOf(selectedPeriodeOptie);
        return selectedIndex > 0;
    }
}

interface MentordashboardOverzichtSidebarRegistratiedetailsView {
    leerlingRegistratie: MentordashboardOverzichtLeerlingRegistratieWithContent;
    periodeRegistraties: PeriodeRegistratieDetails;
    periodeOpties: MentordashboardOverzichtPeriodeOpties;
    tijdspanOpties: MentordashboardOverzichtPeriodeOptie[];
    selectedPeriode: MentordashboardOverzichtPeriodeOptie;
    grafiekRegistraties: Registratie[];
    toonHeatmapTooltip: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    isAfwezigheidsCategorie: boolean;
    headerTitle: string;
    headerSubtitle: string;
    keuzelijstWaardeText?: string;
    showPeriodeNavigation: boolean;
    huidigePeriodeText?: string;
    backTooltip: string;
    nextTooltip: string;
}

type SubRoute = 'gezamenlijk-overzicht' | 'leerling' | 'stamgroep';
