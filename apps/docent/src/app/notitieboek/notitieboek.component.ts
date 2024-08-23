import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    computed,
    inject,
    signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconNotitieboek, IconToevoegen, provideIcons } from 'harmony-icons';
import { isEqual } from 'lodash-es';
import { Observable, Subject, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { P, match } from 'ts-pattern';
import {
    LesgroepFieldsFragment,
    Maybe,
    NotitieContext,
    NotitieFieldsFragment,
    NotitieInput,
    NotitieStreamGroepering,
    NotitiestreamQuery,
    StamgroepFieldsFragment
} from '../../generated/_types';
import { UriService } from '../auth/uri-service';
import { allowChildAnimations } from '../core/core-animations';
import { NotitieLeerlingTotalen, NotitieboekContext, NotitieboekDetail, NotitieboekRouteContext } from '../core/models/notitieboek.model';
import { shareReplayLastValue } from '../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../core/popup/popup.service';
import { PopupDirection, defaultPopupOffsets } from '../core/popup/popup.settings';
import { DeviceService } from '../core/services/device.service';
import { LeerlingDataService } from '../core/services/leerling-data.service';
import { LesgroepDataService } from '../core/services/lesgroep-data.service';
import { NotitieboekDataService } from '../core/services/notitieboek-data.service';
import { SharedDataService } from '../core/services/shared-data.service';
import { SidebarInputs, SidebarService } from '../core/services/sidebar.service';
import { TableService } from '../core/services/table.service';
import { UploadDataService } from '../core/services/upload-data.service';
import { HeaderComponent } from '../layout/header/header.component';
import { AfspraakSidebarComponent } from '../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { MessageComponent } from '../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../rooster-shared/components/outline-button/outline-button.component';
import { getSchooljaar } from '../rooster-shared/utils/date.utils';
import { Optional, equalsId } from '../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeactivatableComponentDirective } from '../shared/components/deactivatable.component';
import {
    GroepLeerlingHeaderNavigatieComponent,
    GroepLeerlingHeaderNavigatieItem
} from '../shared/components/groep-leerling-header-navigatie/groep-leerling-header-navigatie.component';
import { NotitieDetailComponent } from './notitie-detail/notitie-detail.component';
import { NotitieEditComponent } from './notitie-edit/notitie-edit.component';
import { NotitieLeerlingTotalenComponent } from './notitie-leerling-totalen/notitie-leerling-totalen.component';
import { NotitieStreamComponent, NotitieboekTab } from './notitie-stream/notitie-stream.component';
import { NotitieFilter } from './notitieboek-filter/notitieboek-filter.component';
import {
    NotitieboekHeaderLeerlingSelectiePopupComponent,
    NotitieboekHeaderLeerlingSelectiePopupInput
} from './notitieboek-header-leerling-selectie-popup/notitieboek-header-leerling-selectie-popup.component';
import { NotitieboekMenuPopupComponent } from './notitieboek-menu-popup/notitieboek-menu-popup.component';
import { defaultNieuweNotitie } from './notitieboek.util';

interface NotitieboekRouteParams {
    leerling?: string;
    lesgroep?: string;
    stamgroep?: string;
    individueel?: boolean;
}

@Component({
    selector: 'dt-notitieboek',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        NotitieStreamComponent,
        NotitieEditComponent,
        NotitieDetailComponent,
        NotitieLeerlingTotalenComponent,
        HeaderComponent,
        GroepLeerlingHeaderNavigatieComponent,
        AfspraakSidebarComponent,
        MessageComponent,
        OutlineButtonComponent
    ],
    templateUrl: './notitieboek.component.html',
    styleUrls: ['./notitieboek.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 }), allowChildAnimations],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconNotitieboek, IconToevoegen), UploadDataService]
})
export class NotitieboekComponent extends DeactivatableComponentDirective implements OnInit, OnDestroy {
    private deviceService = inject(DeviceService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notitieDataService = inject(NotitieboekDataService);
    private viewContainerRef = inject(ViewContainerRef);
    private popupService = inject(PopupService);
    private lesgroepDataService = inject(LesgroepDataService);
    private sharedDataService = inject(SharedDataService);
    private leerlingDataService = inject(LeerlingDataService);
    private changeDetector = inject(ChangeDetectorRef);
    public sidebarService = inject(SidebarService);
    private uriService = inject(UriService);
    private tableService = inject(TableService);

    @ViewChild(NotitieEditComponent) editComponent: NotitieEditComponent;
    public edit$: Observable<Optional<NotitieFieldsFragment> | NotitieInput>;
    public detail$: Observable<Optional<NotitieboekDetail>>;
    public stream$: Observable<NotitiestreamQuery['notitiestream']>;
    public context$: Observable<NotitieboekContext>;
    public navigatie$: Observable<GroepLeerlingHeaderNavigatieItem>;
    public afspraakSidebar$: SidebarInputs<AfspraakSidebarComponent>;
    public showHeaderNavigation$: Observable<boolean>;
    public selectedSchooljaar = signal<number | undefined>(undefined);
    public selectedSchooljaarIsHuidig = computed(() => this.isHuidigSchooljaar(this.selectedSchooljaar()));
    public selectedSchooljaar$ = toObservable(this.selectedSchooljaar);
    public selectedLeerlingTotalen = signal<NotitieLeerlingTotalen | undefined>(undefined);
    public selectedLeerlingTotalen$ = toObservable(this.selectedLeerlingTotalen);
    public filterOptie = signal<NotitieFilter | undefined>(undefined);
    public searchValue = signal<string>('');
    public tab = signal<NotitieboekTab>('Tijdlijn');

    // Wordt ook getoond in mentordashboard
    @HostBinding('class.zonder-header') public zonderHeader = false;

    @HostBinding('class.detail-view') public detailView = true;

    private destroy$ = new Subject<void>();

    showOpgeslagenMessage = false;
    showSuccesMessageAfspraak: boolean;
    succesMessageAfspraak: string;

    private _openEerstOngelezenNotitie = false;

    private notitieboekContextObservable(): Observable<NotitieboekRouteContext> {
        return this.route.queryParams.pipe(
            map((qparams: NotitieboekRouteParams) => ({
                ...match(qparams)
                    .with({ leerling: P.select() }, (id) => ({ context: NotitieContext.LEERLING, id: id! }))
                    .with({ lesgroep: P.select() }, (id) => ({ context: NotitieContext.LESGROEP, id: id! }))
                    .with({ stamgroep: P.select() }, (id) => ({ context: NotitieContext.STAMGROEP, id: id! }))
                    .run(),
                leerling: qparams.leerling,
                lesgroep: qparams.lesgroep,
                stamgroep: qparams.stamgroep,
                individueel: !!qparams.individueel
            })),
            distinctUntilChanged((x, y) => isEqual(x, y)), // uitgeschreven, anders veranderd $ naar een any
            shareReplayLastValue()
        );
    }

    private mentordashboardContextObservable(): Observable<NotitieboekRouteContext> {
        return combineLatest([this.route.parent!.paramMap, this.route.parent!.url]).pipe(
            map(([paramMap, url]) => ({
                context: url[0].path === 'leerling' ? NotitieContext.LEERLING : NotitieContext.STAMGROEP,
                id: paramMap.get('id')!,
                leerling: url[0].path === 'leerling' ? paramMap.get('id')! : undefined,
                lesgroep: undefined,
                stamgroep: url[0].path === 'leerling' ? undefined : paramMap.get('id')!,
                individueel: undefined
            })),
            distinctUntilChanged((x, y) => isEqual(x, y)) // uitgeschreven, anders veranderd $ naar een any
        );
    }

    private getContextObservable(isNotitieboekEntry: boolean): Observable<NotitieboekRouteContext> {
        const observable$ = isNotitieboekEntry ? this.notitieboekContextObservable() : this.mentordashboardContextObservable();
        return observable$.pipe(tap(() => (this._openEerstOngelezenNotitie = true)));
    }

    private isHuidigSchooljaar(selectedSchooljaar: number | undefined) {
        const huidigSchooljaar = getSchooljaar(new Date()).start.getFullYear();
        return selectedSchooljaar === huidigSchooljaar || selectedSchooljaar === undefined;
    }

    ngOnInit() {
        this.afspraakSidebar$ = this.sidebarService.watchFor(AfspraakSidebarComponent);

        // Controleer of de entry notitieboek is, anders wordt deze geopend vanuit het mentordasboard.
        const isNotitieboekEntry = this.uriService.pathWithParameters().startsWith('/notitieboek');
        const routeContext$ = this.getContextObservable(isNotitieboekEntry);
        this.zonderHeader = !isNotitieboekEntry;
        this.detailView = isNotitieboekEntry;

        // aparte observable die alleen wijzigt wanneer je van context switcht (en dus niet wanneer je bv naar edit scherm gaat)
        this.context$ = routeContext$.pipe(
            switchMap((rContext) =>
                combineLatest({
                    context: of(rContext.context),
                    id: of(rContext.id),
                    leerling: rContext.leerling ? this.leerlingDataService.leerlingMetSchooljaren(rContext.leerling) : of(null),
                    lesgroep: rContext.lesgroep ? this.lesgroepDataService.getLesgroep(rContext.lesgroep) : of(null),
                    stamgroep: rContext.stamgroep ? this.sharedDataService.getStamgroep(rContext.stamgroep) : of(null),
                    contextLeerlingen: match(rContext)
                        .with({ leerling: P.string, lesgroep: P.string }, (c) =>
                            this.notitieDataService
                                .notitieboekMenuLesgroepLeerlingen(c.lesgroep)
                                .pipe(map((menugroep) => menugroep.leerlingMenuItems))
                        )
                        .with({ leerling: P.string, stamgroep: P.string }, (c) =>
                            this.notitieDataService
                                .notitieboekMenuStamgroepLeerlingen(c.stamgroep)
                                .pipe(map((menugroep) => menugroep.leerlingMenuItems))
                        )
                        .with({ leerling: P.string, individueel: true }, () =>
                            this.notitieDataService
                                .notitieboekMenuIndividueleMentorLeerlingen()
                                .pipe(map((menugroep) => menugroep.leerlingMenuItems))
                        )
                        .otherwise(() => of([]))
                })
            ),
            tap(() => {
                this.selectedLeerlingTotalen.set(undefined);
                this.tab.set('Tijdlijn');
            }),
            shareReplayLastValue()
        );

        this.navigatie$ = this.context$.pipe(
            map(({ contextLeerlingen, leerling, lesgroep, stamgroep }) => {
                const leerlingIds = contextLeerlingen?.map((leerlingItem) => leerlingItem.leerling.id) ?? [];
                return {
                    groep: lesgroep ?? stamgroep,
                    leerling,
                    prevId: leerling && leerlingIds[Number(leerlingIds.indexOf(leerling.id)) - 1],
                    nextId: leerling && leerlingIds[Number(leerlingIds.indexOf(leerling.id)) + 1],
                    beschrijving:
                        !lesgroep && !stamgroep && leerling
                            ? this.notitieDataService.groepNamenVanLeerling(leerling.id, this.route.snapshot.queryParams.individueel)
                            : null
                };
            })
        );

        this.stream$ = combineLatest([routeContext$, this.selectedSchooljaar$]).pipe(
            switchMap(([context, schooljaar]) =>
                this.notitieDataService.notitiestream(
                    context.context,
                    context.id,
                    schooljaar ?? undefined,
                    this.isHuidigSchooljaar(schooljaar ?? undefined) ? NotitieStreamGroepering.WEEK : NotitieStreamGroepering.MAAND
                )
            ),
            tap((stream) => {
                if (!this._openEerstOngelezenNotitie) {
                    return;
                }

                this._openEerstOngelezenNotitie = false;

                const notitieParam = this.route.snapshot.queryParams.notitie;
                const scrollTo = this.route.snapshot.queryParams.scrollTo;
                if (notitieParam || scrollTo) {
                    return;
                }
                const ongelezenNotitie = stream.flatMap((s) => s.notities).find((notitie) => !notitie.gelezenOp);
                if (ongelezenNotitie) {
                    this.router.navigate([], { queryParams: { notitie: ongelezenNotitie.id }, queryParamsHandling: 'merge' });
                }
            }),
            shareReplayLastValue()
        );

        this.detail$ = combineLatest([this.route.queryParams, this.stream$]).pipe(
            map(([qparams, stream]) => {
                const leerlingTotalen = this.selectedLeerlingTotalen();
                const prevNextStream = (this.tab() === 'Totalen per leerling' ? leerlingTotalen?.periodes : stream) ?? stream;
                if (qparams.notitie && !qparams.edit) {
                    const current = stream.flatMap((s) => s.notities).find(equalsId(qparams.notitie));
                    if (!current) {
                        return null;
                    }
                    return {
                        current,
                        next: prevNextStream.flatMap((s) => s.notities)[
                            prevNextStream.flatMap((s) => s.notities).findIndex(equalsId(qparams.notitie)) + 1
                        ],
                        prev: prevNextStream.flatMap((s) => s.notities)[
                            prevNextStream.flatMap((s) => s.notities).findIndex(equalsId(qparams.notitie)) - 1
                        ]
                    };
                }
                return null;
            })
        );

        this.edit$ = combineLatest([this.route.queryParams, this.stream$]).pipe(
            map(([qparams, stream]) => {
                if (!qparams.notitie || !qparams.edit) {
                    return null;
                } else if (qparams.notitie === 'nieuw') {
                    return defaultNieuweNotitie;
                }
                return stream.flatMap((s) => s.notities).find(equalsId(qparams.notitie));
            })
        );

        this.showHeaderNavigation$ = combineLatest([
            this.deviceService.isPhoneOrTablet$,
            this.deviceService.isTabletOrDesktop$,
            this.detail$,
            this.edit$,
            this.selectedLeerlingTotalen$
        ]).pipe(
            map(([isPhoneOrTablet, isTabletOrDesktop, detail, edit, totalen]) =>
                isPhoneOrTablet && !isTabletOrDesktop ? !detail && !edit && !totalen : true
            ),
            tap((value) => (this.detailView = !value)),
            shareReplayLastValue(),
            takeUntil(this.destroy$)
        );

        // Dit kan niet in een tap van de showHeaderNavigation$ observable, omdat de async pipe achter een ngIf staat en daardoor niet afgaat als je via het mentordashboard binnenkomt.
        // En dat is juist waar onderstaande logica voor het verbergen van de menus nodig is.
        this.showHeaderNavigation$.subscribe((value) => {
            value
                ? this.tableService.showAllMenus()
                : this.tableService.hideMenus(['mentordashboard-vak-groep-leerling-navigatie', 'mentordashboard-navigatie']);
            this.changeDetector.markForCheck();
        });
    }

    navigeerNaarGroep() {
        this.router.navigate([], {
            queryParams: { leerling: null },
            queryParamsHandling: 'merge'
        });
        this.selectedLeerlingTotalen.set(undefined);
    }

    navigeerNaarLeerling(id: Optional<string>) {
        if (id) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { leerling: id, notitie: null },
                queryParamsHandling: 'merge'
            });
            this.selectedLeerlingTotalen.set(undefined);
        }
    }

    onLeerlingClick(popupRef: ViewContainerRef, groep: Optional<StamgroepFieldsFragment | LesgroepFieldsFragment>, heeftContext: boolean) {
        const input: Maybe<NotitieboekHeaderLeerlingSelectiePopupInput> = match({ groep, heeftContext })
            .with({ groep: { __typename: 'Lesgroep' } }, (match) => ({ type: 'Lesgroep' as const, groepId: match.groep.id }))
            .with({ groep: { __typename: 'Stamgroep' } }, (match) => ({ type: 'Stamgroep' as const, groepId: match.groep.id }))
            .with({ groep: P.nullish, heeftContext: true }, () => ({ type: 'Individueel' as const }))
            .otherwise(() => null);

        const settings = NotitieboekMenuPopupComponent.defaultPopupSettings;
        settings.preferedDirection = [PopupDirection.Bottom];
        settings.offsets = { ...defaultPopupOffsets, bottom: { left: 65, top: 10 } };
        if (input) {
            const popup = this.popupService.popup(popupRef, settings, NotitieboekHeaderLeerlingSelectiePopupComponent);
            popup.input = input;
        } else {
            this.popupService.popup(popupRef, settings, NotitieboekMenuPopupComponent);
        }
    }

    canDeactivate(): boolean {
        return !this.editComponent || this.editComponent.canDeactivate();
    }

    isDeactivationAllowed() {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, wijzigingen zijn niet opgeslagen';
        popup.message = 'Weet je zeker dat je wilt stoppen met het bewerken van deze notitie? Wijzigingen worden niet opgeslagen.';
        popup.cancelLabel = 'Annuleren';
        popup.actionLabel = 'Stoppen met bewerken';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'negative';

        popup.onConfirmFn = () => true;
        popup.onCancelFn = () => {
            popup.popup.onClose();
            return true;
        };

        return popup.getResult();
    }

    ngOnDestroy(): void {
        this.tableService.showAllMenus();
        this.destroy$.next();
        this.destroy$.complete();
    }

    verwijderNotitie(notitie: NotitieFieldsFragment) {
        this.notitieDataService.verwijderNotitie(notitie.id);
        this.router.navigate([], { relativeTo: this.route, queryParams: { notitie: null, edit: null }, queryParamsHandling: 'merge' });
    }

    onSavedNotitie(isNieuw: boolean, notitieId: string) {
        if (isNieuw) {
            this.showOpgeslagenMessage = true;
            this.changeDetector.detectChanges();
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { notitie: notitieId, edit: null, leerlingBetrokkenenIds: null },
            queryParamsHandling: 'merge'
        });
    }

    onAnnuleerNotitie() {
        this.router.navigate([], {
            queryParams: {
                edit: null,
                leerlingBetrokkenenIds: null
            },
            queryParamsHandling: 'merge'
        });
    }

    showAfspraakSuccesMessage(message: string) {
        this.succesMessageAfspraak = message;
        this.showSuccesMessageAfspraak = true;
        this.changeDetector.detectChanges();
    }
}
