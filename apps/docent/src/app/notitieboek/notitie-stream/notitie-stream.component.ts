import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, input, model } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { derivedAsync } from 'ngxtension/derived-async';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { match } from 'ts-pattern';
import { NotitiestreamQuery } from '../../../generated/_types';
import { NotitieLeerlingTotalen, NotitieboekContext } from '../../core/models/notitieboek.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { getVolledigeNaam } from '../../shared/utils/leerling.utils';
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

    private filterOptie$ = new BehaviorSubject<NotitieFilter | undefined>(undefined);
    private searchValue$ = new BehaviorSubject<string>('');

    @Input() public notitieStream$: Observable<NotitiestreamQuery['notitiestream']>;
    public context = input.required<NotitieboekContext>();
    public filterOptie = model.required<NotitieFilter | undefined>();
    public huidigeSchooljaarSelected = input.required<boolean>();
    public schooljaar = model.required<number | undefined>();
    public searchValue = model.required<string>();
    public selectedLeerlingTotalen = model.required<NotitieLeerlingTotalen | undefined>();
    public tab = model.required<NotitieboekTab>();

    public readonly tabs: TabInput[] = [
        { label: 'Tijdlijn', additionalAttributes: { 'data-gtm': 'notitieboek-tabs-navigeer-naar-tijdlijn' } },
        { label: 'Totalen per leerling', additionalAttributes: { 'data-gtm': 'notitieboek-tabs-navigeer-naar-totalen' } }
    ];
    public displayTijdlijn = derivedAsync(() => this.tab() === 'Tijdlijn' || this.context().leerling);
    public displayTotalen = derivedAsync(() => this.tab() === 'Totalen per leerling' && !this.context().leerling);
    public filteredStream$: Observable<NotitiestreamQuery['notitiestream']>;
    public noNotities$: Observable<boolean>;
    public noTotalen$: Observable<boolean>;
    public showTabs = derivedAsync(() => !this.context().leerling);
    public totalenStream$: Observable<NotitieLeerlingTotalen[]>;

    private filterNotities(stream: NotitiestreamQuery['notitiestream'], filterOptie: Optional<NotitieFilter>, search: string) {
        return stream.map((periode) => ({
            ...periode,
            notities: periode.notities
                .filter((notitie: QueriedNotitie) =>
                    match(filterOptie)
                        .with('Mijn notities', () => notitie.auteur.id === this.medewerkerDataService.medewerkerId)
                        .with('Docenten', () => notitie.gedeeldVoorDocenten)
                        .with('Mentor', () => notitie.gedeeldVoorMentoren)
                        .with('Belangrijk', () => notitie.belangrijk)
                        .with('Vastgeprikt', () => notitie.vastgeprikt)
                        .with('Gemarkeerd', () => notitie.bookmarked)
                        .with(null, undefined, () => true)
                        .exhaustive()
                )
                .filter((notitie: QueriedNotitie) => (search.trim().length > 0 ? this.filterNotitieSearch(notitie, search) : true))
        }));
    }

    private filterNotitieSearch(notitie: QueriedNotitie, search: string): boolean {
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
    private aggregateNotitieTotalenLeerling(stream: NotitiestreamQuery['notitiestream']) {
        const result: NotitieLeerlingTotalen[] = [];
        const totalenMap = new Map<string, NotitieLeerlingTotalen>();
        const periodeMap = new Map<string, Map<number, NotitiestreamQuery['notitiestream'][number]>>();

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

                    let periodeMonthMap: Map<number, NotitiestreamQuery['notitiestream'][number]>;
                    if (periodeMap.has(id)) {
                        periodeMonthMap = periodeMap.get(id)!;
                    } else {
                        periodeMonthMap = new Map<number, NotitiestreamQuery['notitiestream'][number]>();
                        periodeMap.set(id, periodeMonthMap);
                    }
                    const month = notitie.createdAt.getMonth();
                    let resultPeriode: NotitiestreamQuery['notitiestream'][number];
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
            map(([stream, filterOptie, search]) => this.filterNotities(stream, filterOptie, search)),
            shareReplayLastValue()
        );
        this.noNotities$ = this.filteredStream$.pipe(map((stream) => stream.flatMap((periode) => periode.notities).length === 0));

        this.totalenStream$ = this.filteredStream$.pipe(
            map(this.aggregateNotitieTotalenLeerling),
            map((stream) => stream.sort(this.sortNotitieTotalenLeerling)),
            shareReplayLastValue()
        );
        this.noTotalen$ = this.totalenStream$.pipe(map((stream) => stream.length === 0));
    }

    public onTabSelected(tab: string) {
        if (this.tab() === tab) return;
        this.tab.set(tab as NotitieboekTab);
    }
}

export type NotitieboekTab = 'Tijdlijn' | 'Totalen per leerling';
type QueriedNotitie = NotitiestreamQuery['notitiestream'][number]['notities'][number];
