import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { SpinnerComponent } from 'harmony';
import { IconNaarNotitieboek, IconToevoegen, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, Subject, combineLatest, filter, takeUntil } from 'rxjs';
import { NotitieFieldsFragment } from '../../../generated/_types';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional, notEmpty } from '../../rooster-shared/utils/utils';
import { NotitieKaartComponent } from '../notitie-kaart/notitie-kaart.component';

@Component({
    selector: 'dt-notities-sidebar',
    standalone: true,
    imports: [CommonModule, SidebarComponent, SpinnerComponent, NotitieKaartComponent, OutlineButtonComponent],
    templateUrl: './notities-sidebar.component.html',
    styleUrls: ['./notities-sidebar.component.scss'],
    providers: [provideIcons(IconToevoegen, IconNaarNotitieboek)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotitiesSidebarComponent extends BaseSidebar implements OnInit, OnDestroy {
    private notitieboekDataService = inject(NotitieboekDataService);
    public sidebarService = inject(SidebarService);
    @Input() titel: Optional<string>;
    @Input() context: NotitieboekContext;
    @Input() notities$: Observable<NotitieFieldsFragment[]>;
    @Input() openNotitieActiveId?: string;
    @Input() openInNotitieboekCallback?: (notitieId: string) => void;
    @Input() onNotitieToevoegenClick: Optional<() => void>;
    @Input() onNavigeerNotitieboekClick: Optional<() => void>;
    @Input() showEditOptions = false;

    activeNotitieId$ = new BehaviorSubject<Optional<string>>(null);

    private onDestroy$ = new Subject<boolean>();

    ngOnInit() {
        this.setupMarkeerGelezenSubscription();
        this.setActiveNotitie(this.openNotitieActiveId);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    onNotitieClick(notitieId: string) {
        const activeNotitieId = notitieId === this.activeNotitieId$.value ? null : notitieId;
        this.setActiveNotitie(activeNotitieId);
    }

    openInNotiteboek(notitieId: string) {
        this.openInNotitieboekCallback?.(notitieId);
    }

    private setActiveNotitie(notitieId: Optional<string>) {
        this.activeNotitieId$.next(notitieId);
    }

    private setupMarkeerGelezenSubscription() {
        combineLatest([this.notities$, this.activeNotitieId$])
            .pipe(
                filter(([, activeNotitieId]) => notEmpty(activeNotitieId)),
                takeUntil(this.onDestroy$)
            )
            .subscribe(([notities, activeNotitieId]) => {
                const activeNotitie = notities.find((notitie) => notitie.id === activeNotitieId);
                if (activeNotitie) {
                    this.notitieboekDataService.markeerGelezen(activeNotitie, this.context);
                }
            });
    }
}
