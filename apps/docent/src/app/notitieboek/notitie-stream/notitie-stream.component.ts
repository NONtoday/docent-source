import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Input,
    OnInit,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    computed,
    inject,
    input,
    output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    DeviceService,
    DropdownComponent,
    DropdownItem,
    IconDirective,
    SettingButtonComponent,
    SpinnerComponent,
    TooltipDirective
} from 'harmony';
import { IconChevronOnder, IconFilter, IconToevoegen, IconZoeken, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map } from 'rxjs';
import { debounceTime, delay, filter, startWith, tap } from 'rxjs/operators';
import { match } from 'ts-pattern';
import { NotitieFieldsFragment, NotitiestreamQuery } from '../../../generated/_types';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { IdObject } from '../../core/models/shared.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { getVolledigeNaam } from '../../shared/utils/leerling.utils';
import { NotitieKaartComponent } from '../notitie-kaart/notitie-kaart.component';
import { isHuidigeWeek as utilIsHuidigeWeek } from '../notitieboek.util';

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
        DropdownComponent
    ],
    templateUrl: './notitie-stream.component.html',
    styleUrls: ['./notitie-stream.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconFilter, IconChevronOnder, IconZoeken, IconToevoegen)]
})
export class NotitieStreamComponent implements OnInit, AfterViewInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    public deviceService = inject(DeviceService);
    @ViewChild('filter', { read: ViewContainerRef }) filterRef: ViewContainerRef;
    @ViewChildren(NotitieKaartComponent) kaarten: QueryList<NotitieKaartComponent>;

    @Input() notitiestream$: Observable<NotitiestreamQuery['notitiestream']>;
    context = input.required<NotitieboekContext>();
    public huidigeSchooljaarSelected = input.required<boolean>();

    filteredStream$: Observable<NotitiestreamQuery['notitiestream']>;
    noNotities$: Observable<boolean>;
    filterOptie$ = new BehaviorSubject<Optional<NotitieFilter>>(null);
    readonly filterOpties: NotitieFilter[] = ['Mijn notities', 'Docenten', 'Mentor', 'Belangrijk', 'Vastgeprikt', 'Gemarkeerd'];
    schooljaarOpties: () => DropdownItem<number>[] = computed(
        () =>
            this.context().leerling?.schooljaren?.map((sj) => {
                return {
                    label: `${sj}/${sj + 1}`,
                    data: sj
                };
            }) || []
    );
    selectedSchooljaar = computed(() => this.schooljaarOpties().find((sj) => sj.data === getSchooljaar(new Date()).start.getFullYear()));

    searchControl = new FormControl('', { nonNullable: true });

    private destroyRef = inject(DestroyRef);
    private renderer = inject(Renderer2);

    onSchooljaarSelected = output<number>();

    ngOnInit() {
        const search$ = this.searchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(100),
            distinctUntilChanged(),
            map((text) => text.toLowerCase())
        );
        this.filteredStream$ = combineLatest([this.notitiestream$, this.filterOptie$, search$]).pipe(
            map(([stream, filterOptie, search]) =>
                stream
                    .map((week) => ({
                        ...week,
                        notities: week.notities
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
                            .filter((notitie: QueriedNotitie) =>
                                search.trim().length > 0 ? this.filterNotitieSearch(notitie, search) : true
                            )
                    }))
                    .filter((week) => week.notities.length > 0)
            ),
            shareReplayLastValue()
        );
        this.noNotities$ = this.filteredStream$.pipe(map((stream) => stream.flatMap((week) => week.notities).length === 0));
    }

    ngAfterViewInit(): void {
        this.kaarten.changes
            .pipe(
                map(() => this.kaarten.find((kaart) => kaart.notitie.id === this.activatedRoute.snapshot.queryParams.scrollto)),
                filter(isPresent),
                tap((scrollToKaart) => {
                    scrollToKaart.elementRef.nativeElement.scrollIntoView(true);
                    this.renderer.addClass(scrollToKaart.elementRef.nativeElement, 'highlight');
                }),
                delay(2000),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((scrollToKaart) => {
                this.renderer.removeClass(scrollToKaart.elementRef.nativeElement, 'highlight');
            });
    }

    trackById(_: number, item: IdObject) {
        return item.id;
    }

    filterNotitieSearch(notitie: QueriedNotitie, search: string): boolean {
        const searchTexts = [
            getVolledigeNaam(notitie.auteur).toLowerCase(),
            notitie.inhoud.toLowerCase(),
            notitie.titel.toLowerCase(),
            ...notitie.leerlingBetrokkenen.map((betrokkene) => getVolledigeNaam(betrokkene.leerling).toLowerCase()),
            ...notitie.stamgroepBetrokkenen.map((b) => `${b.stamgroep.naam.toLowerCase()}`),
            ...notitie.lesgroepBetrokkenen.map((b) => `${b.lesgroep.naam.toLowerCase()}`)
        ];

        return searchTexts.some((searchText) => searchText.includes(search));
    }

    isHuidigeWeek(week: NotitiestreamQuery['notitiestream'][number]): boolean {
        return utilIsHuidigeWeek(week);
    }

    notitieBewerken(notitie: NotitieFieldsFragment) {
        const queryIndex = this.router.url.indexOf('?');
        const redirectUrl = this.router.url.substring(0, queryIndex === -1 ? undefined : queryIndex);
        this.router.navigate([redirectUrl], {
            queryParams: {
                ...this.activatedRoute.snapshot.queryParams,
                [this.context().context.toLowerCase()]: this.context().id,
                notitie: notitie.id,
                edit: 'true'
            }
        });
    }

    selectSchooljaar(schooljaar: number | undefined) {
        if (!schooljaar) return;
        this.onSchooljaarSelected.emit(schooljaar);
    }
}

export type NotitieFilter = 'Mijn notities' | 'Docenten' | 'Mentor' | 'Belangrijk' | 'Vastgeprikt' | 'Gemarkeerd';
type QueriedNotitie = NotitiestreamQuery['notitiestream'][number]['notities'][number];
