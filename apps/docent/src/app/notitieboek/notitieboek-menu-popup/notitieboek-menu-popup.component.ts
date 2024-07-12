import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { collapseOnLeaveAnimation, expandOnEnterAnimation } from 'angular-animations';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconAllesMarkeren, IconCheck, IconChevronBoven, IconGroep, IconOnderwijs, IconSluiten, provideIcons } from 'harmony-icons';
import { Observable, debounceTime, filter, map, of, switchMap, tap } from 'rxjs';
import { P, match } from 'ts-pattern';
import {
    NotitieboekMenuLeerlingItem,
    NotitieboekMenuLeerlingItemFieldsFragment,
    NotitieboekMenuLesgroepItem,
    NotitieboekMenuQuery,
    NotitieboekMenuSearchQuery,
    NotitieboekMenuStamgroepItem
} from '../../../generated/_types';
import { IdObject } from '../../core/models/shared.model';
import { startLoading, stopLoading } from '../../core/operators/loading.operators';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { SearchComponent } from '../../rooster-shared/components/search/search.component';
import { WithRequiredProperty, loadingState } from '../../rooster-shared/utils/utils';
import { JoinPipe } from '../../shared/pipes/join.pipe';
import { NotitieboekMenuItemIdPipe, notitieboekMenuItemId } from '../notitieboek-menu-item-id.pipe';
import { NotitieboekMenuItemNaamPipe } from '../notitieboek-menu-item-naam.pipe';
import { NotitieboekMenuLeerlingItemComponent } from '../notitieboek-menu-leerling-item/notitieboek-menu-leerling-item.component';
import { NotitieboekMenuLesgroepItemComponent } from '../notitieboek-menu-lesgroep-item/notitieboek-menu-lesgroep-item.component';
import { NotitieboekMenuStamgroepItemComponent } from '../notitieboek-menu-stamgroep-item/notitieboek-menu-stamgroep-item.component';

@Component({
    selector: 'dt-notitieboek-menu-popup',
    standalone: true,
    imports: [
        PopupComponent,
        SearchComponent,
        NotitieboekMenuItemNaamPipe,
        NotitieboekMenuItemIdPipe,
        RouterModule,
        ButtonComponent,
        OutlineButtonComponent,
        BackgroundIconComponent,
        SpinnerComponent,
        JoinPipe,
        NotitieboekMenuLeerlingItemComponent,
        NotitieboekMenuStamgroepItemComponent,
        NotitieboekMenuLesgroepItemComponent,
        IconDirective,
        AsyncPipe
    ],
    templateUrl: './notitieboek-menu-popup.component.html',
    styleUrls: ['./notitieboek-menu-popup.component.scss'],
    animations: [expandOnEnterAnimation(), collapseOnLeaveAnimation()],
    providers: [provideIcons(IconCheck, IconSluiten, IconAllesMarkeren, IconChevronBoven, IconOnderwijs, IconGroep)]
})
export class NotitieboekMenuPopupComponent implements OnInit, Popup, OnDestroy {
    private router = inject(Router);
    private notitieboekDataService = inject(NotitieboekDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    public notitieboekMenu$: Observable<NotitieboekMenuQuery['notitieboekMenu']>;
    public isSearching$: Observable<boolean>;
    public search$: Observable<NotitieboekMenuSearchQuery['notitieboekMenuSearch']>;
    public searchLoadingState = loadingState();

    public items: Record<string, { open: boolean; data$: Observable<any> }>;
    public showConfirmMarkerenGelezen = false;

    ngOnInit() {
        this.notitieboekMenu$ = this.notitieboekDataService.notitieboekMenu().pipe(
            tap((menu) => {
                if (!this.items) {
                    this.items = menu.groepen.reduce(
                        (acc, groep) => ({
                            ...acc,
                            [notitieboekMenuItemId(groep)]: {
                                open: false,
                                data$: match(groep)
                                    .with({ lesgroep: P.select() }, (lesgroep) =>
                                        this.notitieboekDataService.notitieboekMenuLesgroepLeerlingen(lesgroep.id)
                                    )
                                    .with({ stamgroep: P.select() }, (stamgroep) =>
                                        this.notitieboekDataService.notitieboekMenuStamgroepLeerlingen(stamgroep.id)
                                    )
                                    .otherwise(() => of([]))
                            }
                        }),
                        {
                            individueel: { open: false, data$: this.notitieboekDataService.notitieboekMenuIndividueleMentorLeerlingen() },
                            ongelezen: { open: true, data$: of([]) }
                        }
                    );
                }
            })
        );
        this.isSearching$ = this.searchControl.valueChanges.pipe(map((value) => value.trim().length > 0));
        this.search$ = this.searchControl.valueChanges.pipe(
            filter((query) => query.trim().length > 0),
            startLoading(this.searchLoadingState, 100),
            debounceTime(300),
            switchMap((query) => this.notitieboekDataService.notitieboekMenuSearch(query)),
            stopLoading(this.searchLoadingState)
        );
    }

    ngOnDestroy() {
        this.notitieboekDataService.evictNotitieboekMenuQuery();
    }

    toggleGroup(groep: NotitieboekMenuQuery['notitieboekMenu']['groepen'][number]) {
        const id = notitieboekMenuItemId(groep);
        this.items[id].open = !this.items[id].open;
    }

    toggleOngelezen() {
        this.items.ongelezen.open = !this.items.ongelezen.open;
    }

    toggleIndividueel() {
        this.items.individueel.open = !this.items.individueel.open;
    }

    onLeerlingInGroepClick(
        leerling: NotitieboekMenuLeerlingItemFieldsFragment,
        groep: NotitieboekMenuQuery['notitieboekMenu']['groepen'][number]
    ) {
        const queryParams = match(groep)
            .with({ lesgroep: P.any }, (lesgroepItem) => ({ lesgroep: lesgroepItem.lesgroep.id }))
            .with({ stamgroep: P.any }, (stamgroepItem) => ({ stamgroep: stamgroepItem.stamgroep.id }))
            .otherwise(() => ({}));

        this.router.navigate(['/notitieboek'], { queryParams: { leerling: leerling.leerling.id, ...queryParams } });
    }

    onIndividueleLeerlingClick(leerling: NotitieboekMenuLeerlingItemFieldsFragment) {
        this.router.navigate(['/notitieboek'], { queryParams: { leerling: leerling.leerling.id, individueel: true } });
    }

    markeerAllesGelezen(event: Event) {
        event.stopPropagation();
        this.notitieboekDataService.markeerAllesGelezen();
    }

    mayClose(): boolean {
        return true;
    }

    trackById(index: number, item: IdObject) {
        return item.id;
    }

    isLeerlingItem = (
        item: NotitieboekMenuSearchQuery['notitieboekMenuSearch'][number]
    ): item is WithRequiredProperty<NotitieboekMenuLeerlingItem, '__typename'> => item.__typename === 'NotitieboekMenuLeerlingItem';

    isLesgroepItem = (
        item: NotitieboekMenuSearchQuery['notitieboekMenuSearch'][number]
    ): item is WithRequiredProperty<NotitieboekMenuLesgroepItem, '__typename'> => item.__typename === 'NotitieboekMenuLesgroepItem';

    isStamgroepItem = (
        item: NotitieboekMenuSearchQuery['notitieboekMenuSearch'][number]
    ): item is WithRequiredProperty<NotitieboekMenuStamgroepItem, '__typename'> => item.__typename === 'NotitieboekMenuStamgroepItem';

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 380;
        popupSettings.height = 460;
        popupSettings.preferedDirection = [PopupDirection.Right];
        popupSettings.scrollable = true;
        popupSettings.offsets = {
            ...popupSettings.offsets,
            right: { left: 30, top: 0 }
        };
        return popupSettings;
    }
}
