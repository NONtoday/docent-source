import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, inject, output } from '@angular/core';
import { getYear } from 'date-fns';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconChevronLinks, IconChevronRechts, IconGroep, IconToevoegen, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { Studiewijzer, StudiewijzerOverzichtViewQuery } from '../../../generated/_types';
import { startLoading, stopLoading } from '../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { accent_positive_1 } from '../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { loadingState } from '../../rooster-shared/utils/utils';
import { SidebarCategorieDividerComponent } from '../sidebar-categorie-divider/sidebar-categorie-divider.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';

@Component({
    selector: 'dt-studiewijzer-selectie',
    templateUrl: './studiewijzer-selectie.component.html',
    styleUrls: ['./studiewijzer-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SpinnerComponent, BackgroundIconComponent, SidebarCategorieDividerComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconChevronLinks, IconChevronRechts, IconGroep, IconToevoegen)]
})
export class StudiewijzerSelectieComponent implements OnInit {
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataSerivce = inject(MedewerkerDataService);
    @HostBinding('class.geen-doorklik') @Input() geenDoorklik = false;
    @Input() alleenMetBijlagen = false;
    onSelect = output<any>();

    public huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
    public schooljaar$ = new BehaviorSubject<number>(this.huidigSchooljaar);
    public studiewijzerOverzichtView$: Observable<StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']>;
    public heeftStudiewijzers$: Observable<boolean>;
    public accent_positive_1 = accent_positive_1;
    public loadingState = loadingState();

    ngOnInit() {
        this.studiewijzerOverzichtView$ = this.schooljaar$.pipe(
            startLoading(this.loadingState),
            switchMap((schooljaar) =>
                this.studiewijzerDataService.getStudiewijzerOverzichtView(schooljaar, this.medewerkerDataSerivce.medewerkerUuid)
            ),
            stopLoading(this.loadingState),
            shareReplayLastValue()
        );
        if (this.alleenMetBijlagen) {
            this.studiewijzerOverzichtView$ = this.studiewijzerOverzichtView$.pipe(
                map((studiewijzerOverzichtView) => ({
                    studiewijzers: studiewijzerOverzichtView.studiewijzers.filter(
                        (studiewijzer: Studiewijzer) => studiewijzer.aantalBijlagen > 0
                    ),
                    categorieen: studiewijzerOverzichtView.categorieen.map((categorie) => ({
                        ...categorie,
                        studiewijzers: categorie.studiewijzers.filter((studiewijzer) => studiewijzer.aantalBijlagen > 0)
                    }))
                }))
            );
        }
        this.heeftStudiewijzers$ = this.studiewijzerOverzichtView$.pipe(
            map(
                (studiewijzerOverzichtView) =>
                    studiewijzerOverzichtView.studiewijzers.length > 0 ||
                    studiewijzerOverzichtView.categorieen.some((categorie) => categorie.studiewijzers.length > 0)
            ),
            startWith(true)
        );
    }
}
