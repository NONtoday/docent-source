import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnInit,
    ViewChild,
    forwardRef,
    inject
} from '@angular/core';
import {
    ControlContainer,
    ControlValueAccessor,
    FormControl,
    FormGroupDirective,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LesgroepFieldsFragment, Maybe, PartialLeerlingFragment, StamgroepFieldsFragment, ZoekBetrokkenenQuery } from '@docent/codegen';
import { AvatarComponent, AvatarTagComponent, IconDirective, IconTagComponent, PillComponent } from 'harmony';
import { IconGroep, IconToevoegen, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { isEmpty } from 'lodash-es';
import { NgClickOutsideDelayOutsideDirective, NgClickOutsideDirective, NgClickOutsideExcludeDirective } from 'ng-click-outside2';
import {
    BehaviorSubject,
    Observable,
    Subject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    fromEvent,
    map,
    merge,
    startWith,
    switchMap,
    tap
} from 'rxjs';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { DeviceService, desktopQuery } from '../../core/services/device.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional, notEqualsId, toId } from '../../rooster-shared/utils/utils';
import { BetrokkeneSelectieMobileComponent } from '../betrokkene-selectie-mobile/betrokkene-selectie-mobile.component';
import { betrokkeneToTag } from '../notitieboek.util';

export type Betrokkene = LesgroepFieldsFragment | StamgroepFieldsFragment | PartialLeerlingFragment;

export interface BetrokkeneTag {
    id: string;
    naam: string;
    type: 'groep' | 'leerling';
    pasfoto?: Optional<string>;
    initialen?: Optional<string>;
}

@Component({
    selector: 'dt-betrokkene-selectie',
    standalone: true,
    imports: [
        CommonModule,
        ScrollingModule,
        NgClickOutsideDirective,
        NgClickOutsideExcludeDirective,
        NgClickOutsideDelayOutsideDirective,
        BetrokkeneSelectieMobileComponent,
        BackgroundIconComponent,
        IconTagComponent,
        IconDirective,
        ReactiveFormsModule,
        AvatarComponent,
        AvatarTagComponent,
        VolledigeNaamPipe,
        PillComponent
    ],
    templateUrl: './betrokkene-selectie.component.html',
    styleUrls: ['./betrokkene-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [
        {
            provide: ControlContainer,
            useExisting: FormGroupDirective
        }
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BetrokkeneSelectieComponent),
            multi: true
        },
        provideIcons(IconToevoegen, IconGroep, IconWaarschuwing)
    ]
})
export class BetrokkeneSelectieComponent implements OnInit, AfterViewInit, ControlValueAccessor {
    private deviceService = inject(DeviceService);
    private notitieDataService = inject(NotitieboekDataService);
    private route = inject(ActivatedRoute);
    private changedetectorRef = inject(ChangeDetectorRef);
    @ViewChild('textInput', { read: ElementRef }) textInput: ElementRef;
    @ViewChild('tagsRef', { read: ElementRef }) tags: ElementRef;
    @ViewChild(CdkVirtualScrollViewport) viewport: Maybe<CdkVirtualScrollViewport>;
    @HostBinding('class.geen-resultaten') geenResultaten = true;

    @Input() contextId: string;
    @Input() betrokkenenAltijdVerwijderbaar = false;

    public betrokkenen: Betrokkene[] = [];
    public betrokkenenView: Array<BetrokkeneTag> = [];
    public placeholder = 'Leerling of groep toevoegen';

    public showDropdown$: Observable<boolean>;
    public itemSize$: Observable<number>;
    public searchResults$: Observable<ZoekBetrokkenenQuery['zoekBetrokkenen']>;
    public tagsContainerHeight$: Observable<number>;

    public searchState$ = new BehaviorSubject<'open' | 'closed'>('closed');
    public onChange$ = new Subject<void>();
    public calculateHeight$ = new Subject<void>();

    public search = new FormControl('', { nonNullable: true });

    ngOnInit() {
        this.itemSize$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => (state.breakpoints[desktopQuery] ? 40 : 48)),
            startWith(this.deviceService.isDesktop() ? 40 : 48),
            distinctUntilChanged()
        );

        this.placeholder = this.hasSelection ? '' : 'Leerling of groep toevoegen';
        const searchquery$ = this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), startWith(''));

        this.tagsContainerHeight$ = merge(this.calculateHeight$, this.onChange$, fromEvent(window, 'resize')).pipe(
            map(() => this.tags.nativeElement.getBoundingClientRect().height - 1),
            distinctUntilChanged()
        );

        const contextLesgroepId = this.route.snapshot.queryParams.lesgroep;
        const contextStamgroepId = this.route.snapshot.queryParams.stamgroep;

        this.searchResults$ = searchquery$.pipe(
            switchMap((query) =>
                combineLatest([
                    this.onChange$.pipe(startWith(null)), // Bij het verwijderen of toevoegen moeten de zoekresultaten opnieuw gefiltert worden
                    this.notitieDataService.zoekBetrokkenen(query.trim(), contextStamgroepId, contextLesgroepId)
                ]).pipe(map(([, result]) => result))
            ),
            map((results) => ({
                leerlingen: results.leerlingen.filter((l) => !this.betrokkenen.map(toId).includes(l.leerling.id)),
                stamgroepen: results.stamgroepen.filter((s) => !this.betrokkenen.map(toId).includes(s.id)),
                lesgroepen: results.lesgroepen.filter((l) => !this.betrokkenen.map(toId).includes(l.id))
            })),
            tap(
                (results) =>
                    (this.geenResultaten =
                        results.leerlingen.length === 0 && results.stamgroepen.length === 0 && results.lesgroepen.length === 0)
            ),
            tap(() => this.viewport?.scrollTo({ top: 0 })), // bij nieuwe zoekresultaten de scroll resetten
            shareReplayLastValue()
        );

        this.showDropdown$ = this.searchState$.pipe(
            map((state) => state === 'open'),
            distinctUntilChanged()
        );
        this.onChange$.next();
    }

    ngAfterViewInit(): void {
        // zodat de hoogte van het veld dat open gaat berekend wordt. Deze hoogte is afhankelijk van hoe groot het input veld is,
        // wat weer afhankelijk is van het aantal tags dat er in staat.
        setTimeout(() => this.calculateHeight$.next(), 0);
    }

    selectBetrokkene(betrokkene: Betrokkene) {
        this.writeValue([...this.betrokkenen, betrokkene]);
        this.search.setValue('');
    }

    verwijderBetrokkene(id: string) {
        this.value = this.betrokkenen.filter(notEqualsId(id));
        this.search.setValue('');
    }

    addMobileBetrokkenen(betrokkenen: Betrokkene[]) {
        this.writeValue([...this.betrokkenen, ...betrokkenen]);
    }

    get value() {
        return this.betrokkenen;
    }

    set value(betrokkenen: Betrokkene[]) {
        this.betrokkenen = betrokkenen;
        this.betrokkenenView = this.betrokkenen.map(betrokkeneToTag);
        this.placeholder = this.hasSelection ? '' : 'Leerling of groep toevoegen';
        this.searchState$.next('closed');
        this.onChange$.next();
        this.onChange(betrokkenen);
        this.changedetectorRef.detectChanges();
    }

    get hasSelection() {
        return !isEmpty(this.betrokkenen);
    }

    isBetrokkeneVerwijderbaar(tag: BetrokkeneTag): boolean {
        return this.betrokkenenAltijdVerwijderbaar || tag.type !== 'leerling' || tag.id !== this.contextId;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onChange = (betrokkenen: Betrokkene[]) => {};

    open() {
        if (this.searchState$.value === 'closed') {
            this.searchState$.next('open');
            this.textInput?.nativeElement.focus();
            this.onTouched();
        }

        // na het klikken wordt de input breder zodat er getypt kan worden. Hierdoor valt de input soms op de volgdende regel
        // om ervoor te zorgen dat de input nog zichtbaar is, berekenen we opnieuw de hoogte nadat de input breder is geworden
        setTimeout(() => this.calculateHeight$.next(), 0);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onTouched = () => {};

    closeSearch() {
        this.searchState$.next('closed');
        this.search.setValue('');
    }

    writeValue(obj: Betrokkene[]): void {
        if (obj) {
            this.value = obj;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    trackById = (index: number, item: BetrokkeneTag) => item.id;
}
