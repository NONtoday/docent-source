import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LesplanNavigatieWeekQuery, Maybe } from '@docent/codegen';
import {
    addWeeks,
    endOfISOWeek,
    getISOWeek,
    getISOWeekYear,
    getYear,
    isAfter,
    isBefore,
    isEqual,
    setISOWeek,
    setISOWeekYear,
    startOfISOWeek,
    startOfWeek,
    subWeeks
} from 'date-fns';
import { SpinnerComponent } from 'harmony';
import { IconChevronLinks, IconChevronRechts, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, switchMap, tap } from 'rxjs';
import { Schooljaar } from '../../../core/models/schooljaar.model';
import { startLoading, stopLoading } from '../../../core/operators/loading.operators';
import { mapToSelectedAfspraakId } from '../../../core/operators/mapToSelectedAfspraakId.operator';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { formatNL, loadingState, toId } from '../../../rooster-shared/utils/utils';
import { LesDataService } from '../../les-data.service';
import { LesplanNavigatieItemComponent } from './lesplan-navigatie-item/lesplan-navigatie-item.component';

interface JaarWeekParams {
    jaar: Maybe<number>;
    week: Maybe<number>;
}

@Component({
    selector: 'dt-lesplan-navigatie',
    templateUrl: './lesplan-navigatie.component.html',
    styleUrls: ['./lesplan-navigatie.component.scss'],
    standalone: true,
    imports: [BackgroundIconComponent, SpinnerComponent, LesplanNavigatieItemComponent, AsyncPipe],
    providers: [provideIcons(IconChevronLinks, IconChevronRechts)]
})
export class LesplanNavigatieComponent implements OnInit {
    private lesDataService = inject(LesDataService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    navigatiekeuzes$: Observable<LesplanNavigatieWeekQuery['lesplanNavigatieWeek']>;
    loadingState = loadingState();

    schooljaar: Schooljaar;
    huidigeAfspraakJaarWeek: JaarWeekParams;

    onNavigatieItemClick = output<void>();

    ngOnInit() {
        const params$ = this.activatedRoute.parent!.paramMap;
        const queryParams$ = this.activatedRoute.queryParamMap;

        const afspraak$ = combineLatest([params$, queryParams$]).pipe(
            tap(([, queryParams]) => {
                this.huidigeAfspraakJaarWeek = {
                    jaar: queryParams.get('jaar') ? Number(queryParams.get('jaar')) : null,
                    week: queryParams.get('week') ? Number(queryParams.get('week')) : null
                };
            }),
            startLoading(this.loadingState),
            mapToSelectedAfspraakId(),
            switchMap((selectedAfspraakId) => this.lesDataService.getAfspraak(selectedAfspraakId)),
            tap((afspraak) => {
                this.schooljaar = getSchooljaar(afspraak.begin);

                if (!this.huidigeAfspraakJaarWeek.jaar) {
                    this.huidigeAfspraakJaarWeek.jaar = afspraak.jaar;
                }
                if (!this.huidigeAfspraakJaarWeek.week) {
                    this.huidigeAfspraakJaarWeek.week = afspraak.week;
                }
            }),
            shareReplayLastValue()
        );

        this.navigatiekeuzes$ = afspraak$.pipe(
            switchMap((afspraak) =>
                this.lesDataService.getLesplanNavigatieWeek(
                    this.rootAfspraakId,
                    afspraak.lesgroepen.map(toId),
                    this.huidigeAfspraakJaarWeek.jaar!,
                    this.huidigeAfspraakJaarWeek.week!
                )
            ),
            stopLoading(this.loadingState)
        );
    }

    weekTerug(event: Event) {
        event.stopPropagation();
        const vorigeWeek = startOfWeek(subWeeks(setISOWeek(setISOWeekYear(new Date(), this.jaarWeek.jaar!), this.jaarWeek.week!), 1), {
            weekStartsOn: 1
        });
        const vorigeWeekJaar = getISOWeekYear(vorigeWeek);
        const vorigeWeekISOWeek = getISOWeek(vorigeWeek);

        this.navigateToWeekJaar(vorigeWeekJaar, vorigeWeekISOWeek);
    }

    weekVooruit(event: Event) {
        event.stopPropagation();
        const volgendeWeek = startOfWeek(addWeeks(setISOWeek(setISOWeekYear(new Date(), this.jaarWeek.jaar!), this.jaarWeek.week!), 1), {
            weekStartsOn: 1
        });
        const volgendeWeekJaar = getISOWeekYear(volgendeWeek);
        const volgendeWeekISOWeek = getISOWeek(volgendeWeek);

        this.navigateToWeekJaar(volgendeWeekJaar, volgendeWeekISOWeek);
    }

    selecteerWeekitems() {
        this.router.navigate([], {
            queryParams: {
                jaar: this.jaarWeek.jaar,
                week: this.jaarWeek.week,
                dag: null,
                selectedAfspraak: null,
                selectedWeek: this.jaarWeek.week
            },
            queryParamsHandling: 'merge'
        });
        this.onNavigatieItemClick.emit();
    }

    selecteerKeuze(keuze: LesplanNavigatieWeekQuery['lesplanNavigatieWeek'][number]) {
        // wanneer er op een les wordt geklikt
        if (keuze.afspraak) {
            this.router.navigate([], {
                queryParams: {
                    jaar: getYear(keuze.afspraak.begin),
                    week: getISOWeek(keuze.afspraak.begin),
                    dag: null,
                    selectedAfspraak: keuze.afspraak.id,
                    selectedWeek: null
                },
                queryParamsHandling: 'merge'
            });
        } else {
            // wanneer er op een 'dagtoekenning dag' wordt geklikt
            this.router.navigate([], {
                queryParams: {
                    jaar: getYear(keuze.datum),
                    week: getISOWeek(keuze.datum),
                    dag: formatNL(keuze.datum, 'yyyy-M-d'),
                    selectedAfspraak: null,
                    selectedWeek: null
                },
                queryParamsHandling: 'merge'
            });
        }

        this.onNavigatieItemClick.emit();
    }

    get isHuidigeWeek(): boolean {
        return getISOWeek(new Date()) === this.jaarWeek.week && getISOWeekYear(new Date()) === this.jaarWeek.jaar;
    }

    get verbergVorigeWeek(): boolean {
        const beginWeek = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), this.jaarWeek.jaar!), this.jaarWeek.week!));
        return isBefore(beginWeek, this.schooljaar?.start) || isEqual(beginWeek, this.schooljaar?.start);
    }

    get verbergVolgendeWeek(): boolean {
        const eindWeek = endOfISOWeek(setISOWeek(setISOWeekYear(new Date(), this.jaarWeek.jaar!), this.jaarWeek.week!));
        return isAfter(eindWeek, this.schooljaar?.eind) || isEqual(eindWeek, this.schooljaar?.eind);
    }

    get jaarWeek(): JaarWeekParams {
        const params = this.activatedRoute.snapshot.queryParamMap;
        return {
            jaar: params.get('jaar') ? Number(params.get('jaar')) : this.huidigeAfspraakJaarWeek?.jaar,
            week: params.get('week') ? Number(params.get('week')) : this.huidigeAfspraakJaarWeek?.week
        };
    }

    get weekItemsSelected(): boolean {
        const selectedWeek = this.activatedRoute.snapshot.queryParamMap.get('selectedWeek') ?? '0';
        return Number(selectedWeek) === this.jaarWeek.week;
    }

    get rootAfspraakId(): string {
        return this.activatedRoute.parent!.snapshot.paramMap.get('id')!;
    }

    get selectedAfspraakId(): string {
        return this.activatedRoute.snapshot.queryParamMap.get('selectedAfspraak')!;
    }

    get selectedWeek(): string {
        return this.activatedRoute.snapshot.queryParamMap.get('selectedWeek')!;
    }

    get selectedDag(): string {
        return this.activatedRoute.snapshot.queryParamMap.get('dag')!;
    }

    private navigateToWeekJaar(jaar: number, week: number) {
        this.router.navigate([], {
            queryParams: {
                jaar,
                week
            },
            queryParamsHandling: 'merge'
        });
    }

    trackById(index: number, item: LesplanNavigatieWeekQuery['lesplanNavigatieWeek'][number]) {
        return item.id;
    }
}
