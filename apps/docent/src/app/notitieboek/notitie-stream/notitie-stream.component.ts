import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnInit, computed, inject, input, model, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotitiestreamQuery } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { endOfMonth, startOfMonth } from 'date-fns';
import {
    DropdownComponent,
    IconDirective,
    SettingButtonComponent,
    SpinnerComponent,
    TabInput,
    TabRowComponent,
    TooltipDirective
} from 'harmony';
import { IconChevronOnder, IconFilter, IconToevoegen, IconZoeken, provideIcons } from 'harmony-icons';
import { isEqual } from 'lodash-es';
import { derivedAsync } from 'ngxtension/derived-async';
import { BehaviorSubject, Observable, combineLatest, filter, map, pairwise, startWith, tap } from 'rxjs';
import { match } from 'ts-pattern';
import { NotitieLeerlingTotalen, NotitiePeriodeQuery, NotitiePeriodesQuery, NotitieboekContext } from '../../core/models/notitieboek.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { NotitieKaartComponent } from '../notitie-kaart/notitie-kaart.component';
import { NotitieFilter, NotitieboekFilterComponent } from '../notitieboek-filter/notitieboek-filter.component';
import { NotitieStreamTijdlijnComponent } from './notitie-stream-tijdlijn/notitie-stream-tijdlijn.component';
import { NotitieStreamTotalenComponent } from './notitie-stream-totalen/notitie-stream-totalen.component';

@Component({
    selector: 'dt-notitie-stream',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DtDatePipe,
        BackgroundIconComponent,
        SpinnerComponent,
        RouterModule,
        NotitieKaartComponent,
        OutlineButtonComponent,
        IconDirective,
        SettingButtonComponent,
        TooltipDirective,
        DropdownComponent,
        NotitieStreamTijdlijnComponent,
        NotitieStreamTotalenComponent,
        TabRowComponent,
        NotitieboekFilterComponent
    ],
    templateUrl: './notitie-stream.component.html',
    styleUrls: ['./notitie-stream.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconFilter, IconChevronOnder, IconZoeken, IconToevoegen)]
})
export class NotitieStreamComponent implements OnInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    private destroyRef = inject(DestroyRef);

    private filterOptie$ = new BehaviorSubject<NotitieFilter | undefined>(undefined);
    private searchValue$ = new BehaviorSubject<string>('');

    @Input() public notitieStream$: Observable<NotitiestreamQuery['notitiestream']>;
    public context = input.required<NotitieboekContext>();
    private context$ = toObservable(this.context);
    public filterOptie = model.required<NotitieFilter | undefined>();
    public huidigeSchooljaarSelected = input.required<boolean>();
    public schooljaar = model.required<number | undefined>();
    public searchValue = model.required<string>();
    public selectedLeerlingTotalen = model.required<NotitieLeerlingTotalen | undefined>();
    public tab = model.required<NotitieboekTab>();
    public tabs = model<TabInput[]>(Tabs);
    public displayTijdlijn = computed(() => this.tab() === 'Tijdlijn' || this.context().leerling);
    public displayTotalen = computed(() => this.tab() === 'Totalen per leerling' && !this.context().leerling);
    public filteredStream = output<NotitiePeriodesQuery>();
    public filteredStream$: Observable<NotitiePeriodesQuery>;
    public noNotities$: Observable<boolean>;
    public noTotalen$: Observable<boolean>;
    public showTabs = computed(() => !this.context().leerling);
    public totalenStream$: Observable<NotitieLeerlingTotalen[]>;
    public schooljaarOpties = derivedAsync(() => this.getNotitieStreamSchooljaarStartOpties());
    public heeftMeerdereSchooljaren = computed(() => (this.schooljaarOpties()?.length ?? 0) > 1);

    private filterNotities(stream: NotitiePeriodesQuery, filterOptie: Optional<NotitieFilter>, search: string) {
        return stream.map((periode) => ({
            ...periode,
            notities: periode.notities
                .filter((notitie: NotitieQuery) =>
                    match(filterOptie)
                        .with('Mijn notities', () => notitie.auteur.id === this.medewerkerDataService.medewerkerId)
                        .with('Docenten', () => notitie.gedeeldVoorDocenten)
                        .with('Groepsnotities', () => {
                            const context = this.context();
                            if (context.lesgroep) {
                                return notitie.lesgroepBetrokkenen.some((betrokkene) => betrokkene.lesgroep.id === context.lesgroep?.id);
                            }
                            if (context.stamgroep) {
                                return notitie.stamgroepBetrokkenen.some((betrokkene) => betrokkene.stamgroep.id === context.stamgroep?.id);
                            }
                            // Fallback - this should not actually happen.
                            return true;
                        })
                        .with('Mentor', () => notitie.gedeeldVoorMentoren)
                        .with('Belangrijk', () => notitie.belangrijk)
                        .with('Vastgeprikt', () => notitie.vastgeprikt)
                        .with('Gemarkeerd', () => notitie.bookmarked)
                        .with(null, undefined, () => true)
                        .exhaustive()
                )
                .filter((notitie: NotitieQuery) => (search.trim().length > 0 ? this.filterNotitieSearch(notitie, search) : true))
        }));
    }

    private filterNotitieSearch(notitie: NotitieQuery, search: string): boolean {
        const searchTexts = [
            getVolledigeNaam(notitie.auteur).toLowerCase(),
            notitie.inhoud.toLowerCase(),
            notitie.titel.toLowerCase(),
            ...notitie.leerlingBetrokkenen.map((betrokkene) => getVolledigeNaam(betrokkene.leerling).toLowerCase()),
            ...notitie.stamgroepBetrokkenen.map((b) => `${b.stamgroep.naam.toLowerCase()}`),
            ...notitie.lesgroepBetrokkenen.map((b) => `${b.lesgroep.naam.toLowerCase()}`)
        ];

        const searchLower = search.toLowerCase();
        return searchTexts.some((searchText) => searchText.includes(searchLower));
    }

    /**
     *
     * Verzamelt de totalen van notities per leerling.
     *
     * @param stream De stream met notities om totalen uit te berekenen.
     * @returns De notities per periode gegroepeerd per leerling met totale aantallen notities, belangrijke notities en gemarkeerde notities.
     */
    private aggregateNotitieTotalenLeerling(stream: NotitiePeriodesQuery) {
        const result: NotitieLeerlingTotalen[] = [];
        const totalenMap = new Map<string, NotitieLeerlingTotalen>();
        const periodeMap = new Map<string, Map<number, NotitiePeriodeQuery>>();

        stream.forEach((periode) =>
            periode.notities.forEach((notitie) => {
                const betrokkenenIds = new Set<string>();
                notitie.leerlingBetrokkenen.forEach((betrokkene) => {
                    const id = betrokkene.leerling.id;

                    // Prevent notes from being added twice.
                    if (betrokkenenIds.has(id)) return;
                    betrokkenenIds.add(id);

                    let totalen: NotitieLeerlingTotalen;
                    if (totalenMap.has(id)) {
                        totalen = totalenMap.get(id)!;
                    } else {
                        totalen = {
                            leerlingBetrokkene: betrokkene,
                            periodes: [],
                            notitiesCount: 0,
                            gemarkeerdCount: 0,
                            vastgepriktCount: 0,
                            belangrijkCount: 0,
                            heeftOngelezenNotities: false
                        };
                        totalenMap.set(id, totalen);
                        result.push(totalen);
                    }

                    let periodeMonthMap: Map<number, NotitiePeriodeQuery>;
                    if (periodeMap.has(id)) {
                        periodeMonthMap = periodeMap.get(id)!;
                    } else {
                        periodeMonthMap = new Map();
                        periodeMap.set(id, periodeMonthMap);
                    }
                    const month = notitie.createdAt.getMonth();
                    let resultPeriode: NotitiePeriodeQuery;
                    if (periodeMonthMap.has(month)) {
                        resultPeriode = periodeMonthMap.get(month)!;
                    } else {
                        resultPeriode = { start: startOfMonth(notitie.createdAt), eind: endOfMonth(notitie.createdAt), notities: [] };
                        periodeMonthMap.set(month, resultPeriode);
                        totalen.periodes.push(resultPeriode);
                    }

                    resultPeriode.notities.push(notitie);
                    totalen.notitiesCount++;
                    totalen.gemarkeerdCount += notitie.bookmarked ? 1 : 0;
                    totalen.vastgepriktCount += notitie.vastgeprikt ? 1 : 0;
                    totalen.belangrijkCount += notitie.belangrijk ? 1 : 0;
                    if (!notitie.gelezenOp && !totalen.heeftOngelezenNotities) {
                        totalen.heeftOngelezenNotities = true;
                    }
                });
            })
        );
        return result;
    }

    /**
     *
     * Sorteert notitietotalen.
     *
     * Sorteert eerst op aantal belangrijke notities, dan op aantal gemarkeerde notities, dan op het aantal vastgeprikte notities en tot slot op alfabetische volgorde van voornaam.
     *
     * @param a De eerste notitie om te vergelijken.
     * @param b De tweede notitie om te vergelijken.
     * @returns 1 als b voor a hoort te staan, 0 als a en b op dezelfde positie kunnen staan, -1 als a voor b hoort te staan.
     */
    private sortNotitieTotalenLeerling(a: NotitieLeerlingTotalen, b: NotitieLeerlingTotalen) {
        // First, sort by number of important notes.
        if (a.belangrijkCount < b.belangrijkCount) return 1;
        if (a.belangrijkCount > b.belangrijkCount) return -1;
        // Then sort by number of bookmarked notes.
        if (a.gemarkeerdCount < b.gemarkeerdCount) return 1;
        if (a.gemarkeerdCount > b.gemarkeerdCount) return -1;
        // Then sort by number of pinned notes.
        if (a.vastgepriktCount < b.vastgepriktCount) return 1;
        if (a.vastgepriktCount > b.vastgepriktCount) return -1;
        // Then sort by total number of notes.
        if (a.notitiesCount < b.notitiesCount) return 1;
        if (a.notitiesCount > b.notitiesCount) return -1;
        // Then sort alphabetically by first name.
        const aNameLower = a.leerlingBetrokkene.leerling.voornaam.toLowerCase();
        const bNameLower = b.leerlingBetrokkene.leerling.voornaam.toLowerCase();
        if (aNameLower > bNameLower) return 1;
        if (aNameLower < bNameLower) return -1;
        // Finally, sort alphabetically by last name.
        const aLastNameLower = a.leerlingBetrokkene.leerling.achternaam.toLowerCase();
        const bLastNameLower = b.leerlingBetrokkene.leerling.achternaam.toLowerCase();
        if (aLastNameLower > bLastNameLower) return 1;
        if (aLastNameLower < bLastNameLower) return -1;
        return 0;
    }

    public ngOnInit() {
        this.filterOptie.subscribe((value) => this.filterOptie$.next(value));
        this.searchValue.subscribe((value) => this.searchValue$.next(value));

        this.filteredStream$ = combineLatest([this.notitieStream$, this.filterOptie$, this.searchValue$]).pipe(
            map(([stream, filterOptie, search]) => this.filterNotities(stream.notitiePeriodes, filterOptie, search)),
            shareReplayLastValue()
        );
        this.filteredStream$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stream) => this.filteredStream.emit(stream));
        this.noNotities$ = this.filteredStream$.pipe(map((stream) => stream.flatMap((periode) => periode.notities).length === 0));

        this.totalenStream$ = this.filteredStream$.pipe(
            map((stream) => this.aggregateNotitieTotalenLeerling(stream)),
            map((stream) => stream.sort(this.sortNotitieTotalenLeerling)),
            shareReplayLastValue()
        );
        this.noTotalen$ = this.totalenStream$.pipe(map((stream) => stream.length === 0));

        this.schooljaar.subscribe((selectedSchooljaar) => {
            const first = this.schooljaarOpties()?.[0];
            if (first) {
                if (selectedSchooljaar === first) {
                    this.setTijdlijnTabDisabled(false);
                } else {
                    this.setTijdlijnTabDisabled(true);
                    if (!this.context().leerling) {
                        this.tab.set('Totalen per leerling');
                    }
                }
            }
        });
    }

    public onTabSelected(tab: string) {
        if (this.tab() === tab) return;
        this.tab.set(tab as NotitieboekTab);
    }

    /**
     * Voor het tonen van de schooljaar opties moeten we rekening houden met zowel de context als de stream data.
     * Het kan zijn dat je binnen dezelfde context een nieuw schooljaar selecteert, op dat moment willen we niet opnieuw
     * de opties genereren, want dan verlies je de selectie.
     * Tegelijkertijd kunnen verschillende contexten (bijv. lesgroep en stamgroep) dezelfde schooljaren hebben, bijv.
     * wanneer 1 leerling in beide groepen voorkomt.
     */
    private getNotitieStreamSchooljaarStartOpties(): Observable<number[]> {
        return combineLatest({
            context: this.context$,
            schooljaren: this.notitieStream$.pipe(map((stream) => stream.schooljaren))
        }).pipe(
            // nodig voor werken met pairwise()
            startWith(undefined),
            pairwise(),
            // enkel doorgaan als de context óf schooljaren zijn veranderd
            filter(([previous, current]) => !isEqual(previous, current)),
            map(([, current]) => current?.schooljaren),
            map((schooljaren) => {
                if (schooljaren?.length) {
                    return schooljaren.map((schooljaar) => schooljaar.vanafDatum.getFullYear());
                }
                return [new Date().getFullYear()];
            }),
            tap((schooljaren) => {
                // beschikbare schooljaren zijn veranderd: reset state
                this.setTijdlijnTabDisabled(false);
                this.schooljaar.set(schooljaren[0]);
            })
        );
    }

    private setTijdlijnTabDisabled(disabled: boolean) {
        this.tabs.set(
            [...Tabs].map((tab): TabInput => {
                if (tab.label === 'Tijdlijn') return { ...tab, disabled };
                return { ...tab };
            })
        );
    }
}

const Tabs = [
    { label: 'Tijdlijn', additionalAttributes: { 'data-gtm': 'notitieboek-tabs-navigeer-naar-tijdlijn' } },
    { label: 'Totalen per leerling', additionalAttributes: { 'data-gtm': 'notitieboek-tabs-navigeer-naar-totalen' } }
] as const satisfies TabInput[];

export type NotitieboekTab = (typeof Tabs)[number]['label'];
type NotitieQuery = NotitiePeriodeQuery['notities'][number];
