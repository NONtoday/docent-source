import { ElementRef, Injectable, OnDestroy, QueryList, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconName } from 'harmony-icons';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import {
    catchError,
    debounce,
    delay,
    distinctUntilChanged,
    filter,
    map,
    share,
    skipWhile,
    startWith,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import { Maybe, ResultaatBerekeningResult, ResultaatInputParam, SaveResultatenMutation } from '../../generated/_types';
import { shareReplayLastValue } from '../core/operators/shareReplayLastValue.operator';
import { formatDateNL } from '../rooster-shared/utils/date.utils';
import { Optional, isPresent } from '../rooster-shared/utils/utils';
import { getResultaatKey } from './pipes/resultaat-key.pipe';
import { ResultaatDataService } from './resultaat-data.service';
import { cijferResultaatRegex } from './resultaten.utils';

export type PeriodeStatus = Record<string, boolean>;
export const defaultPeriodeStatus: Readonly<PeriodeStatus> = { '1': false };
export type ResultaatBerekeningResultMetIcon = ResultaatBerekeningResult & { icon?: IconName };
export type SelecteerCellNaOpslaan = 'volgende' | 'vorige' | 'geen';
type FormattedLaatstOpgeslagenOpState = string | null;
type LaatstOpgeslagenOpState = 'saving' | Date | null;

@Injectable()
export class ResultaatService implements OnDestroy {
    private dataService = inject(ResultaatDataService);
    private route = inject(ActivatedRoute);
    private readonly autoSaveId = 'auto-save';
    private _highlightIndexSource = new Subject<Maybe<number>>();
    public highlightIndex$ = this._highlightIndexSource.asObservable().pipe(shareReplayLastValue());

    private _pinnedIndexSource = new BehaviorSubject<Maybe<number>>(null);
    public pinnedIndex$ = this._pinnedIndexSource.asObservable().pipe(shareReplayLastValue());

    private _activeLeerlingUUIDSource = new Subject<Maybe<string>>();
    public activeLeerlingUUID$ = this._activeLeerlingUUIDSource.asObservable().pipe(shareReplayLastValue());

    public activeCell$ = new BehaviorSubject<Maybe<ElementRef>>(null);

    public periodeCollapsedStatus$ = new BehaviorSubject<PeriodeStatus>(defaultPeriodeStatus);
    public laatstOpgeslagenOp$: Observable<FormattedLaatstOpgeslagenOpState>;
    public cellenMetErrors$: Observable<ResultaatBerekeningResultMetIcon[]>;
    public opslaanGefaald$: Observable<boolean>;
    public alternatiefNiveau$: Observable<boolean>;

    private _opslaanGefaald$ = new BehaviorSubject<boolean>(false);
    private _retryableItems$ = new BehaviorSubject<ResultaatInputParam[]>([]);
    private _cellenMetErrors$ = new BehaviorSubject<ResultaatBerekeningResultMetIcon[]>([]);
    private _laatstOpgeslagenOp$ = new BehaviorSubject<Optional<LaatstOpgeslagenOpState>>(null);
    private _toSaveResultaten$ = new BehaviorSubject<ResultaatInputParam[]>([]);
    private _saving$ = new BehaviorSubject<ResultaatInputParam[]>([]);
    private _opslaanResults$: Subject<{ id: string; results: ResultaatBerekeningResultMetIcon[] }> = new Subject();
    private _debounceTime: Readonly<number> = 2000;
    private _debounceTime$ = new BehaviorSubject<number>(this._debounceTime);
    private _saveId$ = new BehaviorSubject<string>(this.autoSaveId);
    private _destroy$ = new Subject<void>();

    private _lesgroepId: string;
    private _voortgangsdossierId: string;
    private _alternatiefNiveau: boolean;

    constructor() {
        this.route.paramMap
            .pipe(
                map((paramMap) => paramMap.get('id')),
                startWith(this.route.snapshot.paramMap.get('id')),
                filter(isPresent),
                takeUntil(this._destroy$)
            )
            .subscribe((lesgroepId) => {
                this._lesgroepId = lesgroepId;
                this.reset();
            });

        this.route.queryParamMap
            .pipe(
                map((queryParamMap) => queryParamMap.get('voortgangsdossier')),
                filter((voortgangsdossierId) => voortgangsdossierId !== this.voortgangsdossierId),
                takeUntil(this._destroy$)
            )
            .subscribe((voortgangsdossierId: string) => {
                this.setVoortgangsdossierId(voortgangsdossierId);
            });

        this.alternatiefNiveau$ = this.route.queryParamMap.pipe(
            map((queryParamMap) => Boolean(queryParamMap.get('alternatiefNiveau'))),
            tap((alternatiefNiveau) => (this._alternatiefNiveau = alternatiefNiveau)),
            startWith(false),
            distinctUntilChanged(),
            takeUntil(this._destroy$)
        );

        this.cellenMetErrors$ = this._cellenMetErrors$.pipe(distinctUntilChanged(), share());

        this.opslaanGefaald$ = this._opslaanGefaald$.pipe(distinctUntilChanged(), share());

        this.laatstOpgeslagenOp$ = this._laatstOpgeslagenOp$.pipe(
            map((opgeslagenOp) => {
                if (opgeslagenOp) {
                    return opgeslagenOp === 'saving'
                        ? 'saving'
                        : `Opgeslagen op ${formatDateNL(opgeslagenOp, 'dag_kort_dagnummer_maand_kort_tijd')}`;
                }

                return null;
            }),
            shareReplayLastValue()
        );

        const customSaveAction$ = this._saveId$.pipe(
            filter((id) => id !== this.autoSaveId),
            startWith(this.autoSaveId) // startWith zodat de combineLatest direct afgaat
        );

        combineLatest([this._saving$, this._toSaveResultaten$, customSaveAction$, this._debounceTime$])
            .pipe(
                debounce(() => of(true).pipe(delay(this._saveId$.value === this.autoSaveId ? this._debounceTime$.value : 0))),
                skipWhile(([saving, resultaten]) => saving.length > 0 || resultaten.length === 0),
                filter(([saving, resultaten]) => saving.length === 0 && resultaten.length > 0),
                tap(([, resultaten]) => this.transferResultaten(resultaten)),
                switchMap(([, resultaten, saveId]) =>
                    this.dataService.saveResultaten(this.voortgangsdossierId, this._lesgroepId, resultaten).pipe(
                        map((results): [SaveResultatenMutation['saveResultaten'], string] => [results.data!.saveResultaten, saveId]),
                        catchError(() => {
                            this.savingCompleted([], saveId, true);
                            return of();
                        })
                    )
                ),
                tap(([saveResultaten, saveId]) => this.savingCompleted(saveResultaten, saveId)),
                takeUntil(this._destroy$)
            )
            .subscribe();
    }

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
    }

    public reset() {
        this.activeCell$.next(null);
        this._opslaanGefaald$.next(false);
        this._retryableItems$.next([]);
        this._cellenMetErrors$.next([]);
        this._laatstOpgeslagenOp$.next(null);
        this._toSaveResultaten$.next([]);
        this._saving$.next([]);
    }

    public get voortgangsdossierId() {
        return this._voortgangsdossierId;
    }

    public setVoortgangsdossierId(voortgangsdossierId: string, withReset = true) {
        if (voortgangsdossierId === '-1') {
            return; // Skip id van default voortgangsdossier
        }

        this._voortgangsdossierId = voortgangsdossierId;
        if (withReset) {
            this.reset();
        }
    }

    public get alternatiefNiveau() {
        return this._alternatiefNiveau;
    }

    public saveOnce(id: string) {
        this._saveId$.next(id);
    }

    public saveResultsFromId$ = (id: string) =>
        this._opslaanResults$.pipe(
            filter((x) => x.id === id),
            map(({ results }) => results),
            take(1)
        );

    public saveAllResultaten() {
        // DebounceTime op 0 zetten zodat resultaten direct worden opgeslagen
        this._debounceTime$.next(0);
    }

    public saveResultaat(resultaat: ResultaatInputParam) {
        this._toSaveResultaten$.next([...this._toSaveResultaten$.value, resultaat]);
    }

    public nextIndexToHighlight(index: Maybe<number>) {
        this._highlightIndexSource.next(index);
    }

    public nextIndexToPin(index: Maybe<number>) {
        this._pinnedIndexSource.next(this._pinnedIndexSource.value === index ? null : index);
    }

    public registreerResultaat(
        ingevoerdResultaat: ResultaatInputParam,
        selecteerCellNaOpslaan: SelecteerCellNaOpslaan,
        cellen: QueryList<ElementRef>,
        oudeResultaat: string
    ) {
        const isNieuwResultaat =
            (!oudeResultaat && ingevoerdResultaat.resultaatInput.length > 0) ||
            ingevoerdResultaat.resultaatInput !== oudeResultaat ||
            this.resultaatHeeftErrors(toCellId(ingevoerdResultaat.resultaatKey));

        if (isNieuwResultaat && (!ingevoerdResultaat.isCijfer || cijferResultaatRegex.test(ingevoerdResultaat.resultaatInput))) {
            this.saveResultaat(ingevoerdResultaat);
        }

        const enabledCells = cellen.filter((cel) => !cel.nativeElement.classList.contains('read-only'));

        if (selecteerCellNaOpslaan === 'volgende' && this.heeftVolgendeCell(enabledCells)) {
            this.selecteerVolgendeCell(enabledCells);
        } else if (selecteerCellNaOpslaan === 'vorige' && this.heeftVorigeCell(enabledCells)) {
            this.selecteerVorigeCell(enabledCells);
        } else {
            this.activeCell$.next(null);
        }
    }

    public retry() {
        this.saveAllResultaten();
        this._toSaveResultaten$.next([...this._toSaveResultaten$.value, ...this._retryableItems$.value]);
        this._retryableItems$.next([]);
    }

    public clearErrorsAndRetrys() {
        this._retryableItems$.next([]);
        this._cellenMetErrors$.next([]);
    }

    public get isAllSaved(): boolean {
        return this._toSaveResultaten$.value.length === 0 && this._saving$.value.length === 0;
    }

    public set laatstOpgeslagen(laatstOpgeslagen: Optional<Date>) {
        this._laatstOpgeslagenOp$.next(laatstOpgeslagen);
    }

    public set activeLeerlingUUID(leerlingUUID: string | null) {
        this._activeLeerlingUUIDSource.next(leerlingUUID);
    }

    private transferResultaten(resultaten: ResultaatInputParam[]) {
        this._opslaanGefaald$.next(false);
        this._laatstOpgeslagenOp$.next('saving');
        this._saving$.next([...this._toSaveResultaten$.value, ...this._retryableItems$.value]);
        this._toSaveResultaten$.next([]);
        this._retryableItems$.next(this._saving$.value);

        const toSaveResultatenKeys = resultaten.map((res) => toCellId(res.resultaatKey));
        this._cellenMetErrors$.next(
            this._cellenMetErrors$.value.filter(
                (cellMetErrors) => !toSaveResultatenKeys.some((key) => key === toCellId(cellMetErrors.resultaatKey))
            )
        );
    }

    private savingCompleted(results: ResultaatBerekeningResultMetIcon[] = [], saveId: string, heeftErrors = false) {
        this._opslaanGefaald$.next(heeftErrors);
        this._laatstOpgeslagenOp$.next(new Date());
        this._debounceTime$.next(this._debounceTime);
        this._saveId$.next(this.autoSaveId);

        if (heeftErrors) {
            this._cellenMetErrors$.next([
                ...this._cellenMetErrors$.value,
                ...this._saving$.value.map(
                    (resultaatInput) =>
                        ({
                            resultaatKey: resultaatInput.resultaatKey,
                            success: false,
                            errorMessage: 'Het automatisch opslaan van het resultaat is niet gelukt.',
                            icon: 'noRadio'
                        }) as ResultaatBerekeningResultMetIcon
                )
            ]);
        } else {
            this._cellenMetErrors$.next([...this._cellenMetErrors$.value, ...results.filter((res) => !res.success)]);
            this._retryableItems$.next([]);
        }

        this._opslaanResults$.next({ id: saveId, results });
        this._saving$.next([]);
    }

    private heeftVolgendeCell(cellenArray: ElementRef[]) {
        const aantalCellen = cellenArray.length;
        const activeIndex = this.getActiveCellIndex(cellenArray);

        return aantalCellen > activeIndex + 1;
    }

    private heeftVorigeCell(cellenArray: ElementRef[]) {
        const activeIndex = this.getActiveCellIndex(cellenArray);

        return activeIndex > 0;
    }

    private selecteerVolgendeCell(cellenArray: ElementRef[]) {
        const aantalCellen = cellenArray.length;
        const activeIndex = this.getActiveCellIndex(cellenArray);

        if (activeIndex + 1 !== aantalCellen) {
            this.activeCell$.next(cellenArray[activeIndex + 1]);
            this.activeCell$.value?.nativeElement.scrollIntoView({ block: 'nearest' });
        }
    }

    private selecteerVorigeCell(cellenArray: ElementRef[]) {
        const activeIndex = this.getActiveCellIndex(cellenArray);

        if (activeIndex > 0) {
            this.activeCell$.next(cellenArray[activeIndex - 1]);
        }
    }

    private getActiveCellIndex(cellenArray: ElementRef[]) {
        return cellenArray.findIndex((cel) => this.activeCellId === cel.nativeElement.id);
    }

    private get activeCellId() {
        return this.activeCell$.value?.nativeElement.id;
    }

    private resultaatHeeftErrors(cellId: string): boolean {
        return this._cellenMetErrors$.value.map((cell) => toCellId(cell.resultaatKey)).some((cellIdMetError) => cellIdMetError === cellId);
    }
}

const toCellId = (entity: { resultaatkolomId: Optional<string>; leerlingUUID: string; herkansingsNummer?: Optional<number> }) =>
    getResultaatKey(entity.resultaatkolomId, entity.leerlingUUID, entity.herkansingsNummer);
