import { AsyncPipe, NgClass } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { addDays, getISOWeek, getISOWeekYear, getMonth, getYear, isBefore, isSameDay, isSameWeek, setYear, startOfWeek } from 'date-fns';
import { IconForward, IconRooster, provideIcons } from 'harmony-icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { allowChildAnimations } from '../core/core-animations';
import { VRoosterDag } from '../core/models/rooster-dag.model';
import { DeviceService } from '../core/services/device.service';
import { SidebarInputs, SidebarService } from '../core/services/sidebar.service';
import { UploadDataService } from '../core/services/upload-data.service';
import { HeaderComponent } from '../layout/header/header.component';
import { AfspraakSidebarComponent } from '../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { BackToTopComponent } from '../rooster-shared/components/back-to-top/back-to-top.component';
import { FullscreenLoaderComponent } from '../rooster-shared/components/fullscreen-loader/fullscreen-loader.component';
import { MessageComponent } from '../rooster-shared/components/message/message.component';
import { getVandaagOfMaandagInHetWeekend } from '../rooster-shared/utils/date.utils';
import { WerkdrukSidebarComponent } from './../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component';
import { RoosterDagComponent } from './rooster-dag/rooster-dag.component';
import { RoosterDagenBalkComponent } from './rooster-dagen-balk/rooster-dagen-balk.component';
import { RoosterDataService } from './rooster-data.service';
import { RoosterToolbarComponent } from './rooster-toolbar/rooster-toolbar.component';
import { weekAnimatie } from './rooster.animations';
import { RoosterService } from './rooster.service';

type RoosterWeek = VRoosterDag[];
export class RoosterWeekAnimationDirection {
    static readonly forward = 'forward';
    static readonly backward = 'backward';
    static readonly none = 'none';
}

@Component({
    selector: 'dt-rooster',
    templateUrl: './rooster.component.html',
    styleUrls: ['./rooster.component.scss'],
    animations: [
        weekAnimatie,
        slideInUpOnEnterAnimation({ duration: 400 }),
        slideOutDownOnLeaveAnimation({ duration: 200 }),
        allowChildAnimations
    ],
    standalone: true,
    imports: [
        HeaderComponent,
        FullscreenLoaderComponent,
        RoosterToolbarComponent,
        RoosterDagenBalkComponent,
        RoosterDagComponent,
        NgClass,
        AfspraakSidebarComponent,
        MessageComponent,
        BackToTopComponent,
        AsyncPipe
    ],
    providers: [provideIcons(IconRooster, IconForward), UploadDataService]
})
export class RoosterComponent implements OnInit, AfterViewInit, OnDestroy {
    private roosterService = inject(RoosterService);
    private changeDetector = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private roosterDataService = inject(RoosterDataService);
    private deviceService = inject(DeviceService);
    public sidebarService = inject(SidebarService);
    /**
     * De datum die op dit moment actief is.
     */
    datum = new Date();

    /**
     * De huidige week en een eventuele week die weggeanimeerd wordt.
     */
    weken: RoosterWeek[] = [];

    weekAnimationDirection = RoosterWeekAnimationDirection.none;
    showLoader = true;
    loading: boolean;
    initialLoading = true;
    subscription: Subscription;
    toonVrijeUren: boolean;
    nieuweDatum: Date;

    showSuccesMessage: boolean;
    succesMessage: string;

    @HostBinding('class.day-view-mode') dayViewMode = this.inDayViewMode();
    @HostBinding('class.week-view-mode') weekViewMode = !this.inDayViewMode();
    @HostBinding('class.show-weekend') showWeekend: boolean;

    @ViewChildren(RoosterDagComponent) private roosterDagComponents: QueryList<RoosterDagComponent>;
    @ViewChild(RoosterDagenBalkComponent, { static: true }) dagenBalkComponent: RoosterDagenBalkComponent;
    @ViewChild('werkdruksidebarContainer', { read: ViewContainerRef, static: true }) werkdruksidebarContainer: ViewContainerRef;

    public afspraakSidebar$: SidebarInputs<AfspraakSidebarComponent>;
    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        // Lazy load de werkdruksidebar, zodat die niet mee komt in de main bundle
        // De comment in de import is om de chunck een duidelijkere naam te geven ipv een auto gegenereerde naam.
        import(
            /* webpackChunkName: 'WerkdrukSidebar' */ './../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component'
        ).then(({ WerkdrukSidebarComponent }) => {
            this.sidebarService.watchFor(WerkdrukSidebarComponent).subscribe((werkdrukData: WerkdrukSidebarComponent) => {
                this.werkdruksidebarContainer.clear();

                if (werkdrukData) {
                    const werkdrukSidebarRef = this.werkdruksidebarContainer.createComponent(WerkdrukSidebarComponent);
                    const sidebar = werkdrukSidebarRef.instance;
                    sidebar.initieleLesgroepenContext = werkdrukData.initieleLesgroepenContext;
                    sidebar.lesgroepen = werkdrukData.lesgroepen;
                    sidebar.initielePeildatum = werkdrukData.initielePeildatum;
                    sidebar.eersteWeek = werkdrukData.eersteWeek;
                    sidebar.laatsteWeek = werkdrukData.laatsteWeek;
                    sidebar.showRooster = werkdrukData.showRooster;
                    sidebar.showAddItem = werkdrukData.showAddItem;
                }
            });
        });
        this.afspraakSidebar$ = this.sidebarService.watchFor(AfspraakSidebarComponent);

        // Wanneer het weekend wordt in of uitgeklapt, zetten wij hier de
        // lokale @hostbinding variable voor de juiste class in de html
        this.roosterService.showWeekend$.pipe(takeUntil(this.destroy$)).subscribe((show) => {
            this.showWeekend = show;
        });

        // Wanneer er wordt geswitcht tussen dagview en week modus
        // zetten we hier de lokale @hostbinding variables voor de juiste classes in de html
        this.roosterService.dayViewMode$.pipe(takeUntil(this.destroy$)).subscribe((inDayViewMode) => {
            this.dayViewMode = inDayViewMode;
            this.weekViewMode = !inDayViewMode;
        });

        this.roosterService.vrijeUrenTonen$.pipe(takeUntil(this.destroy$)).subscribe((toonVrijeUren) => {
            this.toonVrijeUren = toonVrijeUren;
        });

        this.route.paramMap.pipe(debounceTime(150)).subscribe((params) => {
            this.nieuweDatum = this.getDatum(+params.get('jaar')!, +params.get('maand')!, +params.get('dag')!);
            this.applyDate(this.nieuweDatum);
        });
    }

    ngAfterViewInit(): void {
        this.dagenBalkComponent?.setRoosterComponent(this);
        this.roosterDagComponents.changes.pipe(withLatestFrom(this.route.paramMap), take(1)).subscribe(([, params]) => {
            if (this.deviceService.isPhoneOrTabletPortrait() && !params.has('jaar')) {
                const dagComponent = this.roosterDagComponents.find((component) => isSameDay(component.dag.datum, new Date()));
                if (dagComponent) {
                    dagComponent.scrollTo('auto');
                }
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    inDayViewMode() {
        return this.roosterService.dayViewMode;
    }

    onToggleWeekend() {
        this.roosterService.toggleWeekend();
    }

    onToggleDayViewMode(mode: boolean) {
        this.roosterService.dayViewMode = mode;
    }

    onToggleVrijeUren() {
        this.roosterService.toggleVrijeUren();
    }

    scrollToDatum(datum: Date): void {
        this.applyDate(datum);
    }

    showMessage(message: string) {
        this.succesMessage = message;
        this.showSuccesMessage = true;
        this.changeDetector.detectChanges();
    }

    /**
     * Toont een loader als er nog steeds geladen wordt na 300ms.
     */
    private delayLoader() {
        this.loading = true;
        setTimeout(() => {
            this.showLoader = this.loading;
        }, 1000);
    }

    /**
     * Past de gegeven datum toe op het rooster.
     */
    private applyDate(nieuweDatum: Date) {
        const huidigeDatum = this.datum;
        const isZichtbaar = this.isDateVisible(nieuweDatum);

        if (!this.inDayViewMode() && isZichtbaar && !this.deviceService.isDesktop()) {
            const dagComponent = this.roosterDagComponents.find((component) => isSameDay(component.dag.datum, nieuweDatum));
            if (dagComponent) {
                dagComponent.scrollTo();
            }
        } else if (this.weken.length === 0 || !isSameWeek(nieuweDatum, huidigeDatum)) {
            // Begin inladen van nieuwe week
            this.delayLoader();
            this.weekAnimationDirection = this.getAnimationDirection(huidigeDatum, nieuweDatum);

            if (this.subscription) {
                this.subscription.unsubscribe();
            }

            this.subscription = this.roosterDataService
                .getRoosterDagen(getISOWeekYear(nieuweDatum), getISOWeek(nieuweDatum))
                .subscribe((dagen) => {
                    if (this.datum.getTime() === this.nieuweDatum.getTime()) {
                        this.weekAnimationDirection = RoosterWeekAnimationDirection.none;
                    }
                    this.datum = nieuweDatum;

                    // timeout zodat animatie niet dubbel wordt getoond
                    setTimeout(() => {
                        // Vervang de weken niet als de datum al zichtbaar is om opnieuw aanmaken element te voorkomen
                        if (isZichtbaar) {
                            this.weekAnimationDirection = RoosterWeekAnimationDirection.none;
                            this.weken[0] = dagen;
                        } else {
                            this.weken = [dagen];
                        }
                        this.disableLoaders();
                    });
                });
        } else {
            // Wissel alleen de actieve datum
            this.datum = nieuweDatum;
        }
    }

    private disableLoaders() {
        this.showLoader = false;
        this.loading = false;
        this.initialLoading = false;
    }

    private isDateVisible(datum: Date): boolean {
        return this.weken.length > 0 && this.weken[0].some((dag) => isSameDay(dag.datum, datum));
    }

    /**
     * Bepaalt de datum op basis van het gegeven jaar, maand en dag.
     *
     * Bij een ongeldige waarde wordt het huidige tijdstip teruggegeven.
     *
     * @param jaar: Het jaar voor de datum.
     * @param maand: De maand voor de datum (van 1 voor januari tot 12 voor december).
     * @param dag: De dag van de maand voor de datum (van 1 tot 31).
     */
    private getDatum(jaar: number, maand: number, dag: number): Date {
        if (jaar <= 0 || isNaN(jaar) || maand < 1 || isNaN(maand) || dag <= 0 || isNaN(dag)) {
            // Controleer of het de eerste week van het jaar is en pak de vijfde dag in de betreffende week
            // zodat er altijd een dag uit januari geselecteerd wordt en niet week 1 van het afgelopen jaar getoond wordt
            if (this.isEersteWeekVanJaar && getMonth(new Date()) === 11) {
                return setYear(addDays(startOfWeek(new Date()), 5), getYear(new Date()) + 1);
            }

            return getVandaagOfMaandagInHetWeekend();
        }

        return new Date(jaar, maand - 1, dag);
    }

    /**
     * Bepaalt de animatierichting om van de eerste gegeven datum naar de tweede gegeven datum te gaan.
     */
    private getAnimationDirection(from: Date, to: Date): string {
        if (this.weken.length > 0 && this.deviceService.isDesktop()) {
            return isBefore(from, to) ? RoosterWeekAnimationDirection.forward : RoosterWeekAnimationDirection.backward;
        } else {
            return RoosterWeekAnimationDirection.none;
        }
    }

    get isEersteWeekVanJaar(): boolean {
        return getISOWeek(new Date()) === 1;
    }
}
