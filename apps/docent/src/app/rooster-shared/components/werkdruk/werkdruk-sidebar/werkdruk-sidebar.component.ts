import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import {
    Lesgroep,
    MentorleerlingenQuery,
    PartialLeerlingFragment,
    WerkdrukLesgroep,
    WerkdrukVoorMentorLeerlingenQuery,
    WerkdrukVoorSelectieQuery
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { addDays, addWeeks, getISOWeek, getYear, isSameDay, isSameWeek, startOfWeek, subWeeks } from 'date-fns';
import { IconDirective, TagComponent } from 'harmony';
import { IconChevronLinks, IconChevronRechts, IconFilter, IconPijlKleinOnder, IconWerkdruk, provideIcons } from 'harmony-icons';
import { first, isEmpty, orderBy } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest, of, zip } from 'rxjs';
import { debounceTime, filter, map, scan, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { allowChildAnimations } from '../../../../core/core-animations';
import {
    LesmomentDag,
    QueriedWerkdrukLeerlingen,
    QueriedWerkdrukLesgroepen,
    QueriedWerkdrukStudiewijzerItem,
    WerkdrukMetric,
    WerkdrukMetricSelectie
} from '../../../../core/models/werkdruk.model';
import { shareReplayLastValue } from '../../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../../core/popup/popup.service';
import { DeviceService } from '../../../../core/services/device.service';
import { MaskService } from '../../../../core/services/mask.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { alleMentorLeerlingen } from '../../../../mentordashboard/mentordashboard.utils';
import { RoosterDataService } from '../../../../rooster/rooster-data.service';
import { BaseSidebar } from '../../../directives/base-sidebar.directive';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { getVolledigeNaam } from '../../../pipes/volledige-naam.pipe';
import { getWerkdagenVanWeek } from '../../../utils/date.utils';
import { Optional, equalsId, isPresent, toId } from '../../../utils/utils';
import { defaultWerkdrukGhostBars, werkdrukDagenLabels, werkdrukFilterType } from '../../../utils/werkdruk.utils';
import { BackgroundIconComponent } from '../../background-icon/background-icon.component';
import { MessageComponent } from '../../message/message.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { WerkdrukDataService } from '../werkdruk-data.service';
import { WerkdrukFilterPopupComponent } from '../werkdruk-filter-popup/werkdruk-filter-popup.component';
import { WerkdrukMetricComponent } from '../werkdruk-metric/werkdruk-metric.component';
import { WerkdrukDetailItemComponent } from './../werkdruk-detail-item/werkdruk-detail-item.component';
import { WerkdrukRoosterComponent } from './../werkdruk-rooster/werkdruk-rooster.component';

type WerkdrukData = WerkdrukVoorSelectieQuery['werkdrukVoorSelectie'] | WerkdrukVoorMentorLeerlingenQuery['werkdrukVoorMentorLeerlingen'];

@Component({
    selector: 'dt-werkdruk-sidebar',
    templateUrl: './werkdruk-sidebar.component.html',
    styleUrls: ['./werkdruk-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        SidebarComponent,
        TagComponent,
        BackgroundIconComponent,
        TooltipDirective,
        WerkdrukRoosterComponent,
        WerkdrukMetricComponent,
        IconDirective,
        WerkdrukDetailItemComponent,
        DtDatePipe,
        MessageComponent
    ],
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 }), allowChildAnimations],
    providers: [provideIcons(IconWerkdruk, IconFilter, IconChevronLinks, IconChevronRechts, IconPijlKleinOnder)]
})
export class WerkdrukSidebarComponent extends BaseSidebar implements OnInit, OnChanges, OnDestroy {
    public sidebarService = inject(SidebarService);
    private werkdrukDataService = inject(WerkdrukDataService);
    private roosterDataService = inject(RoosterDataService);
    private popupService = inject(PopupService);
    private deviceService = inject(DeviceService);
    private maskService = inject(MaskService);
    private changeDetector = inject(ChangeDetectorRef);
    @HostBinding('@allowLeaveAnimation') allowLeaveAnimation = true;
    @ViewChild('filter', { read: ViewContainerRef }) filterRef: ViewContainerRef;
    @ViewChild('werkdrukContent', { read: ElementRef }) werkdrukContentRef: ElementRef;

    // vanuit het mentordashboard heb je geen lesgroepen, alleen leerlingen
    @Input() mentorLeerlingen: Optional<MentorleerlingenQuery['mentorleerlingen']>;

    @Input() lesgroepen: Lesgroep[] = [];
    @Input() initieleLesgroepenContext: Lesgroep[] = [];
    @Input() initieleLeerlingenContext: PartialLeerlingFragment[] = [];
    @Input() initielePeildatum: Date;
    @Input() eersteWeek: number;
    @Input() laatsteWeek: number;
    @Input() toegangTotDifferentiatie: boolean;
    @Input() showRooster = false;
    @Input() showUitSjabloonOptie = false;
    @Input() showInleveropdrachtOptie = false;
    @Input() showAddItem = true;
    @Input() showOpgeslagenMessage = false;
    @Input() exacteLesgroepenMatch = true;

    public peildatum$: BehaviorSubject<Date>;
    public weeknummer$: Observable<number>;
    public werkdrukMetrics$: Observable<WerkdrukMetric[]>;
    public isHuidigeWeek$: Observable<boolean>;
    public werkdrukLesgroepen$: Observable<QueriedWerkdrukLesgroepen>;
    public lesgroepen$: Observable<QueriedWerkdrukLesgroepen[number]['lesgroep'][]>;
    public werkdrukLeerlingen$: Observable<QueriedWerkdrukLeerlingen>;
    public selectedMetricItems$: Observable<QueriedWerkdrukStudiewijzerItem[]>;
    public lesgroepTagTekst$: Observable<string>;
    public leerlingTagTekst$: Observable<string>;
    public differentiatiegroepTagTekst$: Observable<string>;
    public lesmomentDagen$: Observable<LesmomentDag[]>;
    public leerlingen$: Observable<QueriedWerkdrukLeerlingen>;

    public filteredLesgroepen$ = new BehaviorSubject<QueriedWerkdrukLesgroepen>([]);
    public filteredLeerlingen$ = new BehaviorSubject<PartialLeerlingFragment[]>([]);
    public selectedMetric$ = new BehaviorSubject<Optional<WerkdrukMetricSelectie>>(null);
    public sidebarTitle = 'Werkdruk';
    public roosterOpen = false;

    private onDestroy$ = new Subject<void>();

    ngOnChanges(): void {
        this.sidebarTitle = this.showRooster ? 'Werkdruk' : `Werkdruk ${this.lesgroepen.map((lesgroep) => lesgroep.naam).join(', ')}`;
    }

    closeOpgeslagenMessage() {
        this.sidebarService.updateData(WerkdrukSidebarComponent, { showOpgeslagenMessage: false });
    }

    ngOnInit() {
        if (this.mentorLeerlingen && !isEmpty(this.lesgroepen)) {
            throw new Error('WerkdrukSidebarComponent: mentorLeerlingen en lesgroepen zijn beide gevuld, dit mag niet');
        }

        this.roosterOpen = this.deviceService.isTabletOrDesktop();
        this.filteredLesgroepen$.next(this.initieleLesgroepenContext.map(this.toWerkdrukLesgroep));
        this.filteredLeerlingen$.next(this.initieleLeerlingenContext);

        this.peildatum$ = new BehaviorSubject<Date>(this.initielePeildatum);
        this.weeknummer$ = this.peildatum$.pipe(
            map((datum) => getISOWeek(datum)),
            shareReplayLastValue()
        );

        this.maskService.onClick$
            .pipe(
                filter((mask) => mask === 'werkdruk-rooster-mask'),
                takeUntil(this.onDestroy$)
            )
            .subscribe(() => {
                this.roosterOpen = false;
                this.maskService.removeMask('werkdruk-rooster-mask');
                this.changeDetector.detectChanges();
            });

        const lesgroepIds$ = this.filteredLesgroepen$.pipe(
            map((filteredLesgroepen) =>
                !this.showRooster && filteredLesgroepen.length === 0
                    ? this.lesgroepen.map(toId)
                    : filteredLesgroepen.map((wlesgroep) => wlesgroep.lesgroep.id)
            ),
            filter((lesgroepen) => lesgroepen.length > 0),
            shareReplayLastValue() // shareReplay, omdat deze $ in twee verschillende andere $ wordt gebruikt
        );

        const debouncedPeildatum$ = this.peildatum$.pipe(debounceTime(150));

        let werkdrukWeek$: Observable<WerkdrukData>;
        if (this.mentorLeerlingen) {
            werkdrukWeek$ = debouncedPeildatum$.pipe(
                switchMap((peildatum) =>
                    this.werkdrukDataService.getWerkdrukWeekVoorMentorLeerlingen(
                        (this.mentorLeerlingen ? alleMentorLeerlingen(this.mentorLeerlingen) : []).map(toId),
                        peildatum
                    )
                ),
                map((result) => result.data?.werkdrukVoorMentorLeerlingen),
                shareReplayLastValue()
            );
        } else {
            werkdrukWeek$ = combineLatest([lesgroepIds$, debouncedPeildatum$]).pipe(
                switchMap(([lesgroepIds, peildatum]) => this.werkdrukDataService.getWerkdrukWeekVoorSelectie(lesgroepIds, peildatum)),
                map((result) => result.data?.werkdrukVoorSelectie),
                shareReplayLastValue()
            );
        }

        this.werkdrukLesgroepen$ = werkdrukWeek$.pipe(
            filter((week) => isPresent(week)),
            map((week) => week.lesgroepen)
        );

        this.lesgroepen$ = this.filteredLesgroepen$.pipe(map((wlesgroep) => wlesgroep.map((wlesgroep) => wlesgroep.lesgroep)));

        const filterLesgroepLeerlingenUuids$ =
            this.filteredLesgroepen$.pipe(
                map((wlesgroep) => wlesgroep.flatMap((wlesgroep) => wlesgroep?.leerlingen).map((leerling) => leerling?.uuid))
            ) ?? of([]);
        const filteredLeerlingenUuids$ =
            this.filteredLeerlingen$.pipe(map((selectedLeerlingen) => selectedLeerlingen.map((leerling) => leerling?.uuid))) ?? of([]);
        const filterUuids$ = zip(filterLesgroepLeerlingenUuids$, filteredLeerlingenUuids$).pipe(
            map(([lesgroepLeerlingenUuids, leerlingUuids]) => [...lesgroepLeerlingenUuids, ...leerlingUuids])
        );

        this.lesgroepTagTekst$ = combineLatest([this.filteredLesgroepen$, this.deviceService.onDeviceChange$]).pipe(
            filter(isPresent),
            map(([lesgroepen]) => {
                if ((!this.showRooster || lesgroepen.length === 1) && (this.deviceService.isDesktop() || lesgroepen.length <= 2)) {
                    return lesgroepen.map((lesgroep) => lesgroep?.lesgroep?.naam).join(', ');
                }

                return `${lesgroepen.length} lesgroepen`;
            })
        );

        this.leerlingTagTekst$ = this.filteredLeerlingen$.pipe(
            filter(isPresent),
            map((leerlingen) => (leerlingen.length === 1 ? getVolledigeNaam(first(leerlingen)!) : `${leerlingen.length} leerlingen`))
        );

        this.werkdrukMetrics$ = combineLatest([werkdrukWeek$, filterUuids$]).pipe(
            map(([werkdrukWeek, filterUuids]) => {
                if (!werkdrukWeek) {
                    return null;
                }

                const itemsVanFilteredLeerlingen = (wswi: QueriedWerkdrukStudiewijzerItem) =>
                    filterUuids.length > 0 ? wswi.leerlingUuids.some((uuid) => filterUuids.includes(uuid)) : true;

                const dagen = werkdrukWeek.dagen.map((dag, i) => ({
                    label: werkdrukDagenLabels[i],
                    datum: addDays(startOfWeek(this.peildatum$.value, { weekStartsOn: 1 }), i),
                    items: dag.items.filter(itemsVanFilteredLeerlingen),
                    loading: false
                }));
                const week = {
                    label: 'Week<br>taken',
                    items: werkdrukWeek.weekItems.filter(itemsVanFilteredLeerlingen)
                };
                return [week, ...dagen];
            }),
            startWith(defaultWerkdrukGhostBars),
            scan(this.setLoading), // zet loading op de oude resultaten, zodat de metrics grijs worden
            shareReplayLastValue()
        );

        this.werkdrukLeerlingen$ = werkdrukWeek$.pipe(
            map((week) => (week ? week.lesgroepen.flatMap((wlesgroep) => wlesgroep.leerlingen) : []))
        );

        this.leerlingen$ = this.mentorLeerlingen ? of(alleMentorLeerlingen(this.mentorLeerlingen)) : this.werkdrukLeerlingen$;

        this.isHuidigeWeek$ = this.peildatum$.pipe(map((datum) => isSameWeek(datum, new Date())));

        this.selectedMetricItems$ = this.selectedMetric$.pipe(
            map((selectie) => (selectie ? selectie.metric.items.filter(werkdrukFilterType(selectie.type)) : [])),
            map((items) => orderBy(items, ['leerlingUuids.length', 'vaknaam'], 'desc')),
            shareReplayLastValue()
        );

        this.lesmomentDagen$ = combineLatest([lesgroepIds$, this.peildatum$]).pipe(
            switchMap(([lesgroepIds, peildatum]) =>
                this.roosterDataService.getLesmomentenVoorWeek(
                    getYear(peildatum),
                    getISOWeek(peildatum),
                    this.exacteLesgroepenMatch,
                    lesgroepIds
                )
            ),
            map((lesmomenten) =>
                getWerkdagenVanWeek(this.peildatum$.value).map((weekdag) => ({
                    datum: weekdag,
                    lesmomenten: lesmomenten.filter((les) => isSameDay(weekdag, les.begin))
                }))
            ),
            startWith(this.defaultLesmomenten()),
            shareReplayLastValue()
        );
    }

    private defaultLesmomenten = () => getWerkdagenVanWeek(this.peildatum$.value).map((datum) => ({ datum, lesmomenten: [] }));

    ngOnDestroy() {
        this.maskService.removeMask('werkdruk-rooster-mask');
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    setLoading = (prevWeek: WerkdrukMetric[], week: WerkdrukMetric[]) =>
        week ? week : prevWeek.map((metric) => ({ ...metric, loading: true }));

    weekTerug = () => {
        this.selectedMetric$.next(null);
        this.peildatum$.next(subWeeks(this.peildatum$.value, 1));
    };
    weekVooruit = () => {
        this.selectedMetric$.next(null);
        this.peildatum$.next(addWeeks(this.peildatum$.value, 1));
    };

    openFilterPopup(werkdrukLesgroepen: QueriedWerkdrukLesgroepen) {
        const popup = this.popupService.popup(
            this.filterRef,
            WerkdrukFilterPopupComponent.defaultPopupSettings,
            WerkdrukFilterPopupComponent
        );

        if (this.showRooster) {
            popup.toonAlleenLesgroepen = true;
            const werkdrukLesgroepen = this.lesgroepen.map(this.toWerkdrukLesgroep);
            popup.lesgroepen = werkdrukLesgroepen;
            popup.onFilterOpslaan = (lesgroepen: string[]) => {
                const selectedLesgroepen = lesgroepen
                    .map((lesgroepId) => werkdrukLesgroepen.find((wl) => wl.lesgroep.id === lesgroepId))
                    .filter(Boolean) as WerkdrukLesgroep[];
                this.filteredLesgroepen$.next(selectedLesgroepen);
                this.filteredLeerlingen$.next([]);
            };
        } else {
            popup.lesgroepen = werkdrukLesgroepen?.map((werkdrukLesgroep) => ({
                ...werkdrukLesgroep,
                differentiatiegroepen: this.toegangTotDifferentiatie
                    ? [...werkdrukLesgroep.differentiatiegroepen].filter((groep) => groep.leerlingen && groep.leerlingen.length > 0)
                    : []
            }));

            if (this.mentorLeerlingen) {
                popup.onFilterOpslaan = (stamgroepen: string[], leerlingen: string[]) => {
                    const alleLeerlingen = this.mentorLeerlingen ? alleMentorLeerlingen(this.mentorLeerlingen) : [];
                    const selectedLeerlingen = alleLeerlingen.filter((leerling) => leerlingen.includes(leerling.id));

                    this.filteredLeerlingen$.next([...selectedLeerlingen]);
                    this.filteredLesgroepen$.next([]);
                };
            } else {
                popup.onFilterOpslaan = (lesgroepen: string[], leerlingen: string[], differentiatiegroepen: string[]) => {
                    const alleLeerlingen = werkdrukLesgroepen.flatMap((wlesgroep) => wlesgroep.leerlingen);
                    const alleDifferentiatiegroepen = werkdrukLesgroepen.flatMap((wlesgroep) => wlesgroep.differentiatiegroepen);
                    const selectedLesgroepen = lesgroepen.map((lesgroepId) =>
                        werkdrukLesgroepen.find((wl) => wl.lesgroep.id === lesgroepId)
                    ) as WerkdrukLesgroep[];
                    const selectedLeerlingen = alleLeerlingen.filter((leerling) => leerlingen.includes(leerling.id));
                    const selectedDifferentiatiegroepenLeerlingen = alleDifferentiatiegroepen
                        .filter((differentiatiegroep) => differentiatiegroepen.includes(differentiatiegroep.id))
                        ?.flatMap((groep) => groep.leerlingen);

                    this.filteredLeerlingen$.next([
                        ...selectedLeerlingen,
                        ...selectedDifferentiatiegroepenLeerlingen
                    ] as PartialLeerlingFragment[]);
                    this.filteredLesgroepen$.next(selectedLesgroepen);
                };
            }
        }

        popup.mentorLeerlingen = this.mentorLeerlingen;
        popup.initialSelectedLesgroepen = this.filteredLesgroepen$.value;
        popup.initialSelectedLeerlingen = this.filteredLeerlingen$.value;
        popup.initialSelectedDifferentiatiegroepen = werkdrukLesgroepen
            ?.flatMap((groep) => groep.differentiatiegroepen)
            .filter((groep) => groep.leerlingen && groep.leerlingen.length > 0)
            .filter((groep) => groep.leerlingen!.every((leerling) => this.filteredLeerlingen$.value.some(equalsId(leerling.id))));
    }

    clearLesgroepFilter() {
        const lesgroepen = this.initieleLesgroepenContext.length > 0 ? [] : this.lesgroepen;
        this.filteredLesgroepen$.next(lesgroepen.map(this.toWerkdrukLesgroep));
        this.filteredLeerlingen$.next(this.filteredLeerlingen$.value);
    }

    clearLeerlingFilter() {
        this.filteredLeerlingen$.next([]);
        this.filteredLesgroepen$.next(this.filteredLesgroepen$.value);
    }

    filterTagTooltipTekst = () => {
        const lesgroepen = this.filteredLesgroepen$.value;
        const leerlingen = this.filteredLeerlingen$.value;

        if (lesgroepen.length > 0) {
            return lesgroepen.map((lesgroep) => lesgroep.lesgroep.naam).join(', ');
        } else if (leerlingen.length > 0) {
            return leerlingen.map(getVolledigeNaam).join(', ');
        }
        return '';
    };

    toggleRooster(isOpen: boolean) {
        if (this.deviceService.isPhone() && !isOpen) {
            this.roosterOpen = true;
            this.maskService.showMask(
                'werkdruk-rooster-mask',
                {
                    zIndex: '98'
                } as CSSStyleDeclaration,
                this.werkdrukContentRef
            );
        } else {
            this.roosterOpen = false;
            this.maskService.removeMask('werkdruk-rooster-mask');
        }
    }

    private toWerkdrukLesgroep = (lesgroep: Lesgroep): QueriedWerkdrukLesgroepen[number] => ({
        lesgroep,
        differentiatiegroepen: [],
        leerlingen: []
    });
}
