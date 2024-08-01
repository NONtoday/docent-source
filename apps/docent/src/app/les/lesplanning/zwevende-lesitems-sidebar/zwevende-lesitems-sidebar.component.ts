import { KeyValue, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewContainerRef, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, combineLatest } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { SpinnerComponent } from 'harmony';
import { IconZwevendItem, provideIcons } from 'harmony-icons';
import { AfspraakQuery, DagToekenning, Toekenning, ZwevendeLesitemsQuery } from '../../../../generated/_types';
import { startLoading, stopLoading } from '../../../core/operators/loading.operators';
import { mapToSelectedAfspraakId } from '../../../core/operators/mapToSelectedAfspraakId.operator';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../core/popup/popup.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { formatDateNL } from '../../../rooster-shared/utils/date.utils';
import { isPresent, loadingState } from '../../../rooster-shared/utils/utils';
import { SelectableItemComponent } from '../../../shared-studiewijzer-les/selectable-item/selectable-item.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { getToekenningDatum } from '../../../shared/utils/toekenning.utils';
import { BulkactiesComponent } from '../../../studiewijzers/bulkacties/bulkacties.component';
import { LesDataService } from '../../les-data.service';
import { LesplanningDataService } from '../lesplanning-data.service';

@Component({
    selector: 'dt-zwevende-lesitems-sidebar',
    templateUrl: './zwevende-lesitems-sidebar.component.html',
    styleUrls: ['./zwevende-lesitems-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        SpinnerComponent,
        FormsModule,
        ReactiveFormsModule,
        SelectableItemComponent,
        ButtonComponent,
        BulkactiesComponent,
        KeyValuePipe
    ],
    providers: [provideIcons(IconZwevendItem)]
})
export class ZwevendeLesitemsSidebarComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private lesplanningDataService = inject(LesplanningDataService);
    private lesDataService = inject(LesDataService);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    public zwevendeLesitems: Map<string, ZwevendeLesitemsQuery['zwevendeLesitems']>;
    public zwevendeItemsFormGroup: UntypedFormGroup;
    public amountSelected = 0;
    public loadingState = loadingState();

    moetLesgroepTonen = false;
    inBulkMode = false;
    afspraak$: Observable<AfspraakQuery['afspraak']>;

    private afspraak: AfspraakQuery['afspraak'];
    private destroy$: Subject<boolean> = new Subject<boolean>();
    private toekenningen: ZwevendeLesitemsQuery['zwevendeLesitems'];

    ngOnInit() {
        this.zwevendeItemsFormGroup = new UntypedFormGroup({});

        const params$ = this.route.parent!.paramMap;
        const queryParams$ = this.route.queryParamMap;
        this.afspraak$ = combineLatest([params$, queryParams$]).pipe(
            startLoading(this.loadingState, 0),
            tap(() => setTimeout(() => this.changeDetector.detectChanges(), 0)), // hack, omdat er geen async pipe de cd afhandelt,
            // moeten we het handmatig doen. En omdat de loading indicator via een timeout wordt gezet, moet ook de cd via een timeout.
            mapToSelectedAfspraakId(),
            switchMap((selectedAfspraakId) => this.lesDataService.getAfspraak(selectedAfspraakId)),
            shareReplayLastValue()
        );

        this.afspraak$.pipe(takeUntil(this.destroy$)).subscribe((afspraak) => (this.afspraak = afspraak));

        this.afspraak$
            .pipe(
                switchMap((afspraak) => this.lesplanningDataService.getZwevendeItems(afspraak.id)),
                tap((toekenningen) => {
                    toekenningen.forEach((toekenning) =>
                        this.zwevendeItemsFormGroup.addControl(toekenning.id, new UntypedFormControl(false))
                    );
                }),
                tap((toekennningen) => (this.toekenningen = toekennningen)),
                map((toekenningen) => this.addDateHeaders(toekenningen)),
                stopLoading(this.loadingState),
                takeUntil(this.destroy$)
            )
            .subscribe((data) => {
                this.zwevendeLesitems = data;
                this.changeDetector.markForCheck();
            });

        this.zwevendeItemsFormGroup.valueChanges.pipe(debounceTime(20), takeUntil(this.destroy$)).subscribe(() => {
            this.calculateSelectedAmount();
        });
    }

    addDateHeaders(toekenningen: ZwevendeLesitemsQuery['zwevendeLesitems']): Map<string, ZwevendeLesitemsQuery['zwevendeLesitems']> {
        const headerMap = new Map<string, ZwevendeLesitemsQuery['zwevendeLesitems']>();

        toekenningen.forEach((toekenning) => {
            const datum = formatDateNL(getToekenningDatum(toekenning)!, 'dag_kort_dagnummer_maand_kort');
            if (headerMap.has(datum)) {
                headerMap.get(datum)!.push(toekenning);
            } else {
                headerMap.set(datum, [toekenning]);
            }
        });

        return headerMap;
    }

    /**
     * Returns true if all toekenningen belonging to date are selected
     */
    allItemsSelectedOnDay(date: { [key: string]: Toekenning[] }) {
        return date.value.every((toekenning) => {
            if (this.zwevendeItemsFormGroup.controls[toekenning.id]) {
                return this.zwevendeItemsFormGroup.controls[toekenning.id].value;
            }
            return false;
        });
    }

    selectAll(selectedDay: { [key: string]: Toekenning[] }, event: Event) {
        if ((<HTMLInputElement>event.target).className === 'checkmark') {
            event.preventDefault();
        }

        let selectAll = true;
        if (this.allItemsSelectedOnDay(selectedDay)) {
            selectAll = false;
        }
        selectedDay.value.forEach((toekenning) => {
            this.zwevendeItemsFormGroup.patchValue({ [toekenning.id]: selectAll });
        });
    }

    deselectAll() {
        this.zwevendeItemsFormGroup.reset(false);
    }

    toekenningenInplannen() {
        const selectedToekenningIds = this.getSelectedToekenningIds();
        const toekenningenIds = this.toekenningen
            .filter((toekenning) => selectedToekenningIds.includes(toekenning.id))
            .map((toekenning) => toekenning.id);

        this.lesplanningDataService.herplanAfspraakToekenningen$(toekenningenIds, this.afspraak).subscribe(() => {
            this.closeSidebar();
        });
    }

    getSelectedToekenningIds() {
        const keys = Object.keys(this.zwevendeItemsFormGroup.value);
        return keys.filter((key) => this.zwevendeItemsFormGroup.value[key]);
    }

    calculateSelectedAmount() {
        this.amountSelected = this.getSelectedToekenningIds().length;
        this.changeDetector.markForCheck();
    }

    public closeSidebar() {
        this.router.navigate([], {
            queryParams: {
                zwevendSidebar: null
            },
            queryParamsHandling: 'merge'
        });
    }

    sortByDateDesc = (item: KeyValue<string, Array<DagToekenning>>, compareTo: KeyValue<string, Array<DagToekenning>>): number =>
        item.value[0].datum > compareTo.value[0].datum ? -1 : compareTo.value[0].datum > item.value[0].datum ? 1 : 0;

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public get inBulkModus() {
        return this.amountSelected > 0 || this.inBulkMode;
    }

    bulkVerwijderen() {
        const selectedToekenningIds = this.getSelectedToekenningIds();
        const selectedToekenningen = this.toekenningen.filter((toekenning) => selectedToekenningIds.includes(toekenning.id));
        if (selectedToekenningen.some((toekenning) => toekenning.synchroniseertMet)) {
            this.openVerwijderGuard();
        } else {
            this.verwijderSelectedItems(false);
        }
    }

    verwijderSelectedItems(verwijderUitSjabloon: boolean) {
        const selectedStudiewijzeritemIds = this.getSelectedToekenningIds()
            .map((id) => this.toekenningen.find((toekenning) => toekenning.id === id))
            .filter(isPresent)
            .map((toekenning) => toekenning.studiewijzeritem.id);
        this.lesplanningDataService.verwijderZwevendeItems(selectedStudiewijzeritemIds, verwijderUitSjabloon);
        this.closeSidebar();
    }

    openVerwijderGuard() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        popup.title = 'Let op, lesitem synchroniseert met sjabloon';
        popup.message =
            'Een lesitem synchroniseert met een sjabloon. Wil je het lesitem alleen voor deze lesgroep of ook uit het sjabloon verwijderen?';
        popup.actionLabel = 'Verwijder voor lesgroep';
        popup.cancelLabel = 'Verwijder uit sjabloon';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'negative';
        popup.cancelGtmTag = 'verwijder-zwevend-item-uit-sjabloon';
        popup.confirmGtmTag = 'verwijder-zwevend-item-voor-lesgroep';
        popup.onConfirmFn = () => {
            this.verwijderSelectedItems(false);
            return true;
        };
        popup.onCancelFn = () => {
            this.verwijderSelectedItems(true);
        };
    }

    closeBulkacties() {
        this.deselectAll();
        this.inBulkMode = false;
    }
}
