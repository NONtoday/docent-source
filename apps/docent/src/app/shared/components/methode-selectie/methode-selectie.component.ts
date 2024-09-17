import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Methode, MethodenQuery, RecenteMethode, RecenteMethodesQuery } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconZoeken, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, take } from 'rxjs/operators';
import { MethodenTab } from '../../../core/models/studiewijzers/methode.model';
import { startLoading, stopLoading } from '../../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { DeviceService } from '../../../core/services/device.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AutofocusDirective } from '../../../rooster-shared/directives/autofocus.directive';
import { loadingState } from '../../../rooster-shared/utils/utils';
import { MethodeDataService } from '../../../studiewijzers/methode-data.service';
import { MethodeComponent } from '../methode/methode.component';

@Component({
    selector: 'dt-methode-selectie',
    templateUrl: './methode-selectie.component.html',
    styleUrls: ['./methode-selectie.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, AutofocusDirective, SpinnerComponent, MethodeComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconZoeken)]
})
export class MethodeSelectieComponent implements OnInit {
    public sidebarService = inject(SidebarService);
    private methodeService = inject(MethodeDataService);
    private medewerkerService = inject(MedewerkerDataService);
    private deviceService = inject(DeviceService);
    @Input() inShareContent: boolean;

    onMethodeSelectie = output<MethodenQuery['methoden'][number] | RecenteMethode>();
    @Input() activeTab$ = new BehaviorSubject<MethodenTab>('recent');

    public methoden$: Observable<Array<RecenteMethodesQuery['recenteMethodes'][number] | MethodenQuery['methoden'][number]>>;
    public loadingState = loadingState();
    public onMethodeClick: (methode: Methode) => void;
    public filter$: Observable<string>;
    public isDesktop: boolean;

    public searchForm = new UntypedFormGroup({
        search: new UntypedFormControl('')
    });

    ngOnInit() {
        this.isDesktop = this.deviceService.isDesktop();
        const vakcodes$ = this.activeTab$.pipe(
            startLoading(this.loadingState, 0),
            switchMap((tab) => (tab === 'alleMethoden' ? of(undefined) : this.medewerkerService.getVakcodesVanDocent()))
        );

        this.filter$ = this.searchForm
            .get('search')!
            .valueChanges.pipe(debounceTime(200), distinctUntilChanged(), startWith(''), shareReplayLastValue());

        const getMethoden$ = vakcodes$.pipe(
            switchMap((vakcodes) => this.methodeService.getMethoden(vakcodes)),
            stopLoading(this.loadingState)
        );

        const filteredMethoden$ = combineLatest([getMethoden$, this.filter$]).pipe(
            map(([methoden, query]: [Methode[], string]) => {
                const re = new RegExp([...query].join('.*'), 'i');
                return methoden.filter((methode) => re.test(methode.naam ?? '')) as MethodenQuery['methoden'];
            })
        );

        const recenteMethoden$ = this.methodeService.getRecenteMethodes(this.medewerkerService.medewerkerUuid).pipe(shareReplayLastValue());

        recenteMethoden$
            .pipe(
                filter((recenteMethoden) => recenteMethoden.length === 0),
                take(1)
            )
            .subscribe(() => this.activeTab$.next('mijnVakken'));

        this.methoden$ = this.activeTab$.pipe(switchMap((activeTab) => (activeTab === 'recent' ? recenteMethoden$ : filteredMethoden$)));
    }

    setTab(tab: MethodenTab) {
        this.activeTab$.next(tab);
    }

    methodeClick(methode: MethodenQuery['methoden'][number] | RecenteMethode) {
        this.methodeService.updateRecenteMethodes(this.medewerkerService.medewerkerUuid, methode as Methode);
        this.onMethodeSelectie.emit(methode);
    }
}
