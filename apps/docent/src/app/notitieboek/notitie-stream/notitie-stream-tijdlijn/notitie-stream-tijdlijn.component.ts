import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    QueryList,
    Renderer2,
    ViewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotitieContext, NotitieFieldsFragment } from '@docent/codegen';
import { SpinnerComponent } from 'harmony';
import { delay, filter, map, Observable, tap } from 'rxjs';
import { NotitieboekContext, NotitiePeriodeQuery, NotitiePeriodesQuery } from '../../../core/models/notitieboek.model';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { isPresent } from '../../../rooster-shared/utils/utils';
import { NotitieKaartComponent } from '../../notitie-kaart/notitie-kaart.component';
import { injectToonSchooljaarSelectie } from '../../notitieboek-providers';
import { isHuidigeWeek as utilIsHuidigeWeek } from '../../notitieboek.util';

@Component({
    selector: 'dt-notitie-stream-tijdlijn',
    standalone: true,
    imports: [CommonModule, SpinnerComponent, DtDatePipe, NotitieKaartComponent, BackgroundIconComponent, RouterModule],
    templateUrl: './notitie-stream-tijdlijn.component.html',
    styleUrl: './notitie-stream-tijdlijn.component.scss',
    host: {
        '[class.is-empty]': 'noNotities()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotitieStreamTijdlijnComponent implements AfterViewInit {
    private activatedRoute = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private renderer = inject(Renderer2);
    private router = inject(Router);
    private toonSchooljaarSelectie = injectToonSchooljaarSelectie();
    @ViewChildren(NotitieKaartComponent) kaarten: QueryList<NotitieKaartComponent>;

    public context = input.required<NotitieboekContext>();
    public huidigeSchooljaarSelected = input.required<boolean>();
    public stream = input.required<Observable<NotitiePeriodesQuery>>();
    public noNotities = input.required<boolean | null>();
    public heeftMeerdereSchooljaren = input.required<boolean>();

    public isLeerlingContext = computed(() => this.context().context === NotitieContext.LEERLING);

    ngAfterViewInit(): void {
        this.kaarten.changes
            .pipe(
                map(() => this.kaarten.find((kaart) => kaart.notitie.id === this.activatedRoute.snapshot.queryParams.scrollto)),
                filter(isPresent),
                tap((scrollToKaart) => {
                    scrollToKaart.elementRef.nativeElement.scrollIntoView(true);
                    this.renderer.addClass(scrollToKaart.elementRef.nativeElement, 'highlight');
                }),
                delay(2000),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((scrollToKaart) => {
                this.renderer.removeClass(scrollToKaart.elementRef.nativeElement, 'highlight');
            });
    }

    isHuidigeWeek(week: NotitiePeriodeQuery): boolean {
        return utilIsHuidigeWeek(week);
    }

    notitieBewerken(notitie: NotitieFieldsFragment) {
        const queryIndex = this.router.url.indexOf('?');
        const redirectUrl = this.router.url.substring(0, queryIndex === -1 ? undefined : queryIndex);
        this.router.navigate([redirectUrl], {
            queryParams: {
                ...this.activatedRoute.snapshot.queryParams,
                [this.context().context.toLowerCase()]: this.context().id,
                notitie: notitie.id,
                edit: 'true'
            }
        });
    }

    selecteerAnderSchooljaar() {
        this.toonSchooljaarSelectie.emit();
    }
}
