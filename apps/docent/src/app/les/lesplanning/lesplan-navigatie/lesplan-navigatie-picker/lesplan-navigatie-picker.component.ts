import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconChevronOnder, provideIcons } from 'harmony-icons';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { concatMap, find, map, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { LesplanNavigatieWeekQuery } from '../../../../../generated/_types';
import { mapToSelectedAfspraakId } from '../../../../core/operators/mapToSelectedAfspraakId.operator';
import { shareReplayLastValue } from '../../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../../../core/popup/popup.settings';
import { LesuurComponent } from '../../../../rooster-shared/components/lesuur/lesuur.component';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../../../rooster-shared/pipes/roostertoets.pipe';
import { Optional, formatNL } from '../../../../rooster-shared/utils/utils';
import { LesDataService } from '../../../les-data.service';
import { LesplanNavigatiePopupComponent } from '../lesplan-navigatie-popup/lesplan-navigatie-popup.component';

@Component({
    selector: 'dt-lesplan-navigatie-picker',
    templateUrl: './lesplan-navigatie-picker.component.html',
    styleUrls: ['./lesplan-navigatie-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LesuurComponent, TooltipDirective, AsyncPipe, RoosterToetsPipe, DtDatePipe, IconDirective],
    providers: [provideIcons(IconChevronOnder)]
})
export class LesplanNavigatiePickerComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private lesDataService = inject(LesDataService);
    public navigatiekeuze$: Observable<Optional<LesplanNavigatieWeekQuery['lesplanNavigatieWeek'][number]>>;
    public weekitemsSelected$: Observable<boolean>;
    public jaarweek$: Observable<Optional<{ jaar: number; week: number }>>;

    private destroy$ = new Subject<void>();

    ngOnInit() {
        const params$ = this.route.parent!.paramMap;
        const queryParams$ = this.route.queryParamMap;

        const afspraak$ = combineLatest([params$, queryParams$]).pipe(
            mapToSelectedAfspraakId(),
            switchMap((selectedAfspraakId) => this.lesDataService.getAfspraak(selectedAfspraakId))
        );

        this.jaarweek$ = afspraak$.pipe(
            withLatestFrom(queryParams$),
            switchMap(([afspraak, queryParams]) =>
                of({
                    jaar: queryParams.get('jaar') ? +(+queryParams.get('jaar')!) : afspraak.jaar,
                    week: queryParams.get('week') ? +(+queryParams.get('week')!) : afspraak.week
                })
            ),
            shareReplayLastValue(),
            takeUntil(this.destroy$)
        );

        this.navigatiekeuze$ = combineLatest([afspraak$, this.jaarweek$, queryParams$]).pipe(
            switchMap(([afspraak, params, queryParams]) => {
                const baseAfspraakId = this.route.parent!.snapshot.paramMap.get('id')!;
                const lesgroepen = afspraak.lesgroepen.map((lesgroep) => lesgroep.id);
                const selectedDag = queryParams.get('dag');
                const selectedAfspraakId = queryParams.get('selectedAfspraak');

                return this.lesDataService.getLesplanNavigatieWeek(baseAfspraakId, lesgroepen, params!.jaar, params!.week).pipe(
                    concatMap((keuzes) => keuzes),
                    find((keuze) => {
                        if (selectedDag && !keuze.afspraak) {
                            const keuzeDag = formatNL(keuze.datum, 'yyyy-M-d');
                            return keuzeDag === selectedDag;
                        }

                        if (!selectedDag && keuze.afspraak) {
                            const keuzeAfspraakId = keuze.afspraak.id;

                            return selectedAfspraakId ? selectedAfspraakId === keuzeAfspraakId : baseAfspraakId === keuzeAfspraakId;
                        }
                        return false;
                    })
                );
            })
        );

        this.weekitemsSelected$ = this.jaarweek$.pipe(
            withLatestFrom(queryParams$),
            map(([jaarweek, queryParams]) =>
                Boolean(queryParams.get('selectedWeek') && +queryParams.get('selectedWeek')! === jaarweek!.week)
            )
        );
    }

    openNavigatiekeuzesPopup() {
        const popupSettings = new PopupSettings();

        popupSettings.appearance.mobile = Appearance.Rollup;
        popupSettings.appearance.tabletportrait = Appearance.Rollup;
        popupSettings.showHeader = false;
        popupSettings.closeOnNavigationStart = false;
        popupSettings.height = 320;

        this.popupService.popup(this.viewContainerRef, popupSettings, LesplanNavigatiePopupComponent);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
