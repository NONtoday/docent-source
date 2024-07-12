import { inject } from '@angular/core';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnInit,
    ViewChild,
    forwardRef
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    UntypedFormControl,
    UntypedFormGroup
} from '@angular/forms';
import { IconDirective, TagComponent } from 'harmony';
import { IconName, IconToevoegen, provideIcons } from 'harmony-icons';
import { get, isEqual, pick } from 'lodash-es';
import { NgClickOutsideDelayOutsideDirective, NgClickOutsideDirective } from 'ng-click-outside2';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';
import { AfspraakParticipant } from '../../../../generated/_types';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../../core/services/device.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { RoosterDataService } from '../../../rooster/rooster-data.service';
import { HarmonyColor, accent_positive_1 } from '../../colors';
import { AfspraakParticipantNaamPipe } from '../../pipes/afspraakparticipant-naam.pipe';
import { ParticipantZoekresultaatComponent } from '../participant-zoekresultaat/participant-zoekresultaat.component';

@Component({
    selector: 'dt-deelnemer-selectie',
    templateUrl: './deelnemer-selectie.component.html',
    styleUrls: ['./deelnemer-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DeelnemerSelectieComponent),
            multi: true
        },
        provideIcons(IconToevoegen)
    ],
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        TagComponent,
        ScrollingModule,
        NgClickOutsideDirective,
        ParticipantZoekresultaatComponent,
        AsyncPipe,
        AfspraakParticipantNaamPipe,
        NgClickOutsideDelayOutsideDirective,
        IconDirective
    ]
})
export class DeelnemerSelectieComponent implements OnInit, AfterViewInit, ControlValueAccessor {
    private deviceService = inject(DeviceService);
    private roosterDataService = inject(RoosterDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild('textInput', { read: ElementRef }) textInput: ElementRef;
    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;
    @HostBinding('class.geen-resultaten') geenResultaten = true;

    @Input() public placeholder: string;
    @Input() public afspraakId: string;
    @Input() zoekveldIcon: IconName = 'toevoegen';
    @Input() zoekveldIconColor: HarmonyColor = accent_positive_1;
    @Input() focusOnInit: boolean;

    selectedIndex = 0;
    currentSearchResults: AfspraakParticipant[] = [];

    public deelnemers: AfspraakParticipant[] = [];

    public showDropdown$: Observable<boolean>;
    public itemSize$: Observable<number>;
    public searchResults$: Observable<AfspraakParticipant[]>;

    public searchForm = new UntypedFormGroup({
        search: new UntypedFormControl('')
    });

    ngOnInit() {
        this.itemSize$ = this.deviceService.onDeviceChange$.pipe(
            map((state) =>
                state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery] || state.breakpoints[tabletQuery] ? 48 : 40
            ),
            startWith(this.deviceService.isPhoneOrTablet() ? 48 : 40),
            distinctUntilChanged()
        );

        this.searchResults$ = this.searchField!.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((query) =>
                query.trim().length > 0 ? this.roosterDataService.zoekParticipanten(query.trim(), this.afspraakId) : of([])
            ),
            map(
                (queryResults) =>
                    queryResults.filter(
                        (participant) =>
                            // Filter ingelogde medewerker + al geselecteerde participanten
                            get(participant, 'medewerker.id') !== this.medewerkerDataService.medewerkerId &&
                            !this.deelnemers.some((deelnemer) => {
                                const ids = ['leerling.id', 'lesgroep.id', 'medewerker.id', 'stamgroep.id'];
                                return isEqual(pick(deelnemer, ids), pick(participant, ids));
                            })
                    ) as AfspraakParticipant[]
            ),
            tap((searchResults) => {
                this.currentSearchResults = searchResults;
                this.selectedIndex = 0; // Reset selectedIndex naar 0 wanneer searchResults veranderen
                this.scrollToSelectedIndex(); // lijst ook weer naar boven scrollen
            }),
            shareReplayLastValue()
        );

        this.showDropdown$ = this.searchResults$.pipe(
            tap((results) => (this.geenResultaten = results.length === 0)),
            map((results) => !!results && this.searchField!.value !== ''),
            shareReplayLastValue()
        );
    }

    ngAfterViewInit() {
        if (this.focusOnInit) {
            setTimeout(() => {
                this.textInput.nativeElement.focus();
            });
        }
    }

    selectResult(participant: AfspraakParticipant) {
        this.writeValue([...this.deelnemers, participant]);
        this.searchField!.setValue('');
        this.textInput.nativeElement.focus();
    }

    get searchField() {
        return this.searchForm.get('search');
    }

    get value() {
        return this.deelnemers;
    }

    set value(deelnemers: AfspraakParticipant[]) {
        this.deelnemers = deelnemers;
        this.onChange(deelnemers);
        this.onTouched();
    }

    onChange = (participanten: AfspraakParticipant[]) => {};

    onTouched = () => {};

    closeSearch() {
        this.searchField!.setValue('');
    }

    writeValue(obj: AfspraakParticipant[]): void {
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

    verwijderParticipant(participant: AfspraakParticipant) {
        this.value = this.deelnemers.filter((p) => p !== participant);
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        const searchResults = this.currentSearchResults;

        if (!searchResults || searchResults.length === 0) {
            return;
        }

        //toetsenbordnavigatie voor zoekresultaten
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.scrollToSelectedIndex();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, searchResults.length - 1);
            this.scrollToSelectedIndex();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (searchResults[this.selectedIndex]) {
                this.selectResult(searchResults[this.selectedIndex]);
            }
        }
    }

    scrollToSelectedIndex() {
        if (this.scrollViewport) {
            this.scrollViewport.scrollToIndex(this.selectedIndex);
        }
    }
}
