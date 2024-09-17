import { inject, Injectable } from '@angular/core';
import { Maybe, MentorleerlingenQuery, StamgroepFieldsFragment } from '@docent/codegen';
import { BehaviorSubject, distinctUntilChanged, filter, Observable } from 'rxjs';
import { TableService } from '../core/services/table.service';
import { MessageSoort } from '../rooster-shared/components/message/message.component';
import { isPresent, Optional } from '../rooster-shared/utils/utils';
import { FloatingAction } from '../shared/components/floating-action-bar/floating-action-bar.component';
import { VakHeaderNavigatie } from './leerlingregistraties-table/leerlingregistraties-table.component';
import { NavigatieItem } from './mentordashboard-navigatie/mentordashboard-navigatie-item/mentordashboard-navigatie-item.component';
import { MentorLeerlingStamgroep } from './mentordashboard-navigatie/mentordashboard-navigatie.component';

export interface MentordashboardMessage {
    soort: MessageSoort;
    text: string;
    duration: number;
    closable: boolean;
}

export type MentorLeerling = MentorleerlingenQuery['mentorleerlingen']['individueleMentorleerlingen'][number]['leerling'];

@Injectable({
    providedIn: 'root'
})
export class MentordashboardService {
    private tableService = inject(TableService);
    private _huidigeLeerling$ = new BehaviorSubject<Maybe<MentorLeerling>>(null);
    private _huidigeStamgroep$ = new BehaviorSubject<Maybe<StamgroepFieldsFragment>>(null);

    private _floatingActions$ = new BehaviorSubject<FloatingAction[]>([]);
    floatingActions$: Observable<FloatingAction[]>;

    private _message$ = new BehaviorSubject<Optional<MentordashboardMessage>>(null);
    message$: Observable<Optional<MentordashboardMessage>>;

    public periodeGeopend$ = new BehaviorSubject<Record<number, boolean>>({});

    private _vakNavigatie$ = new BehaviorSubject<Maybe<VakHeaderNavigatie>>(null);

    private _currentNavItem$ = new BehaviorSubject<Maybe<NavigatieItem>>(null);

    constructor() {
        this.floatingActions$ = this._floatingActions$.pipe(distinctUntilChanged());
        this.message$ = this._message$.pipe(distinctUntilChanged());
    }

    setActions = (actions: FloatingAction[]) => this._floatingActions$.next(actions ?? []);
    reset = () => this._floatingActions$.next([]);
    displayMessage = (text: string, duration = 3000, soort: MessageSoort = 'ok', closable = true) =>
        this._message$.next({ soort, text, duration, closable });
    closeMessage = () => this._message$.next(null);

    /**
     * @returns Een true of false wanneer deze open of dicht is geklapt. Een undefined wanneer deze nog niet is aangeraakt
     */
    isPeriodeOpen = (nummer: number): boolean | undefined => this.periodeGeopend$.value[nummer];
    togglePeriode = (nummer: number) =>
        this.periodeGeopend$.next({ ...this.periodeGeopend$.value, [nummer]: !this.periodeGeopend$.value[nummer] });
    setPeriodeGeopend = (periodeGeopend: Record<number, boolean>) => this.periodeGeopend$.next(periodeGeopend);

    setHuidigeLeerling(leerling: MentorLeerling) {
        this._huidigeLeerling$.next(leerling);
    }

    setHuidigeStamgroep(stamgroep: StamgroepFieldsFragment) {
        this._huidigeStamgroep$.next(stamgroep);
    }

    resetVakNavigatie() {
        this.setVakNavigatie(null);
        this.tableService.showAllMenus();
    }

    get huidigeLeerling() {
        return this._huidigeLeerling$.value;
    }

    get huidigeStamgroep() {
        return this._huidigeStamgroep$.value;
    }

    get huidigeLeerling$(): Observable<MentorLeerlingStamgroep> {
        return this._huidigeLeerling$.pipe(filter(isPresent));
    }

    get huidigeStamgroep$(): Observable<StamgroepFieldsFragment> {
        return this._huidigeStamgroep$.pipe(filter(isPresent));
    }

    setVakNavigatie(vakNavigatie: Maybe<VakHeaderNavigatie>) {
        this._vakNavigatie$.next(vakNavigatie);
    }

    get vakNavigatie$(): Observable<Maybe<VakHeaderNavigatie>> {
        return this._vakNavigatie$;
    }

    setCurrentNavItem(navItem: NavigatieItem) {
        this._currentNavItem$.next(navItem);
    }

    get currentNavItem$(): Observable<Maybe<NavigatieItem>> {
        return this._currentNavItem$;
    }
}
