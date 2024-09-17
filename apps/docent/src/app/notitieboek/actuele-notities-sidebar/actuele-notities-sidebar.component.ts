import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { ActueleNotitiesQuery, NotitieFieldsFragment } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { SpinnerComponent } from 'harmony';
import {
    IconBewerken,
    IconKalenderDag,
    IconLijst,
    IconNaarNotitieboek,
    IconPijlLinks,
    IconPinned,
    IconReactieToevoegen,
    IconToevoegen,
    provideIcons
} from 'harmony-icons';
import { first, sortBy } from 'lodash-es';
import { BehaviorSubject, Observable, filter, map, startWith, take } from 'rxjs';
import { P, match } from 'ts-pattern';
import { NotitiePeriodeQuery, NotitieboekContext } from '../../core/models/notitieboek.model';
import { IdObject } from '../../core/models/shared.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AantalNotitiesCounterPipe } from '../../les/registratie/notitie-accordion/aantal-notities-counter.pipe';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { NotitieEditComponent } from '../notitie-edit/notitie-edit.component';
import { NotitieKaartComponent } from '../notitie-kaart/notitie-kaart.component';
import { defaultNieuweNotitie, isHuidigeWeek as utilIsHuidigeWeek } from '../notitieboek.util';

type ActieveNotitieContext = 'vastgeprikt' | 'ongelezen';

interface ActieveNotitie {
    context: ActieveNotitieContext;
    id: string;
}

const ModeTitle = {
    lijst: 'Actuele notities',
    toevoegen: 'Notitie toevoegen',
    bewerken: 'Notitie bewerken'
};

type Mode = keyof typeof ModeTitle;

@Component({
    selector: 'dt-actuele-notities-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        SidebarComponent,
        AccordionComponent,
        DtDatePipe,
        OutlineButtonComponent,
        NotitieKaartComponent,
        AantalNotitiesCounterPipe,
        NotitieEditComponent,
        SpinnerComponent
    ],
    templateUrl: './actuele-notities-sidebar.component.html',
    styleUrls: ['./actuele-notities-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        provideIcons(
            IconLijst,
            IconReactieToevoegen,
            IconPijlLinks,
            IconPinned,
            IconKalenderDag,
            IconToevoegen,
            IconNaarNotitieboek,
            IconBewerken
        )
    ]
})
export class ActueleNotitiesSidebarComponent extends BaseSidebar implements OnChanges, OnInit {
    private notitieboekDataService = inject(NotitieboekDataService);
    public sidebarService = inject(SidebarService);
    private router = inject(Router);
    @Input() context: NotitieboekContext;
    @Input() nieuwOnEnter: boolean;

    // vanuit de lesregistratie kan een afspraakId meegegeven worden om het vak op te halen.
    // Deze wordt meegegeven via de context aan het notitie-edit component
    @Input() afspraakId: Optional<string>;

    actueleNotities$: Observable<ActueleNotitiesQuery['actueleNotities']>;
    aantalOngelezenNotities$: Observable<number>;
    activeNotitie$ = new BehaviorSubject<Optional<ActieveNotitie>>(null);
    mode$ = new BehaviorSubject<Mode>('lijst');
    teBewerkenNotitie?: NotitieFieldsFragment;

    readonly ModeTitle = ModeTitle;
    readonly NieuweNotitieInput = defaultNieuweNotitie;

    ngOnInit(): void {
        if (this.context.leerling && this.afspraakId) {
            this.notitieboekDataService
                .getLeerlingAfspraakVakken(this.context.leerling.id, this.afspraakId)
                .pipe(
                    take(1),
                    map((vakken) => first(sortBy(vakken, 'naam')))
                )
                .subscribe((vak) => {
                    this.context = { ...this.context, vak };
                });
        }
        if (this.nieuwOnEnter) {
            this.mode$.next('toevoegen');
        }
    }

    ngOnChanges(): void {
        this.actueleNotities$ = this.notitieboekDataService
            .getActueleNotities(this.context.context, this.context.id)
            .pipe(shareReplayLastValue());
        this.aantalOngelezenNotities$ = this.actueleNotities$.pipe(
            map(
                (actueleNotities) =>
                    actueleNotities?.vandaagOfOngelezenNotitiestream.flatMap((ongelezen) => ongelezen.notities).flatMap((x) => x).length
            ),
            filter(Boolean),
            startWith(0)
        );
    }

    isHuidigeWeek(week: NotitiePeriodeQuery): boolean {
        return utilIsHuidigeWeek(week);
    }

    trackById(_: number, item: IdObject) {
        return item.id;
    }

    get titel(): string {
        const naam = match(this.context)
            .with({ leerling: P.any }, (context) => (context.leerling ? getVolledigeNaam(context.leerling) : null))
            .with({ lesgroep: P.any }, (context) => context.lesgroep?.naam)
            .with({ stamgroep: P.any }, (context) => context.stamgroep?.naam)
            .otherwise(() => null);
        return `Notities${naam ? ` • ${naam}` : ''}`;
    }

    onNotitieToevoegen() {
        this.mode$.next('toevoegen');
    }

    onSavedNotitie(notitieId: string) {
        if (this.teBewerkenNotitie) {
            this.teBewerkenNotitie = undefined;
        }

        this.activeNotitie$.next({
            context: 'ongelezen',
            id: notitieId
        });
        this.mode$.next('lijst');
    }

    onAnnuleerNotitie() {
        if (this.teBewerkenNotitie) {
            this.teBewerkenNotitie = undefined;
        }

        if (this.nieuwOnEnter) {
            this.sidebarService.closeSidebar();
        } else {
            this.mode$.next('lijst');
        }
    }

    onNavigeerNaarNotitieboek() {
        const queryParams: Params = {};
        queryParams[this.context.context.toLowerCase()] = this.context.id;
        this.router.navigate(['/notitieboek'], {
            queryParams
        });
    }

    onNotitieClick(context: ActieveNotitieContext, notitie: NotitieFieldsFragment) {
        const currentContext = this.activeNotitie$.value;
        const newContext: Optional<ActieveNotitie> =
            context === currentContext?.context && notitie.id === currentContext?.id ? null : { context, id: notitie.id };
        this.activeNotitie$.next(newContext);
        this.notitieboekDataService.markeerGelezen(notitie, this.context);
    }

    onNotitieBewerken(notitie: NotitieFieldsFragment) {
        this.teBewerkenNotitie = notitie;
        this.mode$.next('bewerken');
    }

    openInNotitieboek(notitieId: string) {
        this.router.navigate(['/notitieboek'], {
            queryParams: {
                [this.context.context.toLowerCase()]: this.context.id,
                notitie: notitieId
            }
        });
    }
}
