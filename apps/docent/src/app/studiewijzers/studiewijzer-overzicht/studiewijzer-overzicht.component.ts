import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getYear } from 'date-fns';
import { IconDirective, SpinnerComponent, SwitchComponent, SwitchGroupComponent } from 'harmony';
import {
    IconDraggable,
    IconInformatie,
    IconPijlBoven,
    IconPijlOnder,
    IconSjabloon,
    IconStudiewijzer,
    IconToevoegen,
    provideIcons
} from 'harmony-icons';
import flatMap from 'lodash-es/flatMap';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
    GetLesgroepenQuery,
    Lesgroep,
    Studiewijzer,
    StudiewijzerCategorie,
    StudiewijzerOverzichtViewQuery
} from '../../../generated/_types';
import { allowChildAnimations } from '../../core/core-animations';
import { startLoading, stopLoading } from '../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService, desktopQuery } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { ActionsPopupComponent, defaultButtons } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { loadingState } from '../../rooster-shared/utils/utils';
import { SchooljaarSelectieComponent } from '../../shared/components/schooljaar-selectie/schooljaar-selectie.component';
import { VerwijderPopupComponent } from '../../shared/components/verwijder-popup/verwijder-popup.component';
import {
    AbstractStudiewijzerCategorie,
    AbstractStudiewijzerCategorieComponent,
    CategorieDeleteClick,
    CategorieMoreActionsClick,
    CategorieMove
} from '../abstract-studiewijzer-categorie/abstract-studiewijzer-categorie.component';
import { AddCategorieComponent } from '../add-categorie/add-categorie.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { EditStudiewijzerSidebarComponent } from './edit-studiewijzer-sidebar/edit-studiewijzer-sidebar.component';
import { StudiewijzerOverzichtItemComponent } from './studiewijzer-overzicht-item/studiewijzer-overzicht-item.component';

@Component({
    selector: 'dt-studiewijzer-overzicht',
    templateUrl: './studiewijzer-overzicht.component.html',
    styleUrls: ['../../shared/scss/toevoegen.tile.scss', './studiewijzer-overzicht.component.scss'],
    animations: [allowChildAnimations],
    standalone: true,
    imports: [
        HeaderComponent,
        SchooljaarSelectieComponent,
        SpinnerComponent,
        CdkDropListGroup,
        CdkDropList,
        StudiewijzerOverzichtItemComponent,
        CdkDrag,
        RouterLink,
        CdkDragPlaceholder,
        CdkDragHandle,
        AddCategorieComponent,
        AbstractStudiewijzerCategorieComponent,
        EditStudiewijzerSidebarComponent,
        AsyncPipe,
        IconDirective,
        SwitchGroupComponent,
        SwitchComponent
    ],
    providers: [provideIcons(IconStudiewijzer, IconToevoegen, IconDraggable, IconInformatie, IconPijlBoven, IconPijlOnder, IconSjabloon)]
})
export class StudiewijzerOverzichtComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private sidebarService = inject(SidebarService);
    public popupService = inject(PopupService);
    private deviceService = inject(DeviceService);
    public view$: Observable<StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']>;
    public lesgroepenZonderSw$: Observable<GetLesgroepenQuery['lesgroepen']>;
    public schooljaar$: Observable<number>;
    public heeftLesgroepenZonderSw$: Observable<boolean>;
    public huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
    public loadingState = loadingState();

    public notDesktop$: Observable<boolean>;

    public editStudiewijzerSidebar$: SidebarInputs<EditStudiewijzerSidebarComponent>;

    ngOnInit() {
        this.notDesktop$ = this.deviceService.onDeviceChange$.pipe(map((state) => !state.breakpoints[desktopQuery]));

        this.schooljaar$ = this.route.queryParamMap.pipe(
            startLoading(this.loadingState),
            map((queryParams) => parseInt(queryParams.get('jaar')!, 10) || this.huidigSchooljaar),
            shareReplayLastValue()
        );

        this.view$ = this.schooljaar$.pipe(
            switchMap((schooljaar) =>
                this.studiewijzerDataService.getStudiewijzerOverzichtView(schooljaar, this.medewerkerDataService.medewerkerUuid)
            ),
            stopLoading(this.loadingState),
            shareReplayLastValue()
        );

        const alleLesgroepen$ = this.schooljaar$.pipe(
            switchMap((schooljaar) => this.studiewijzerDataService.getLesgroepen(schooljaar, this.medewerkerDataService.medewerkerId))
        );
        const toLesgroepId = (studiewijzer: Studiewijzer) => studiewijzer.lesgroep.id;
        const studiewijzerLesgroepenIds$ = this.view$.pipe(
            map((view) => [
                ...view.studiewijzers.map(toLesgroepId),
                ...flatMap(view.categorieen, (categorie) => categorie.studiewijzers).map(toLesgroepId)
            ])
        );

        this.lesgroepenZonderSw$ = combineLatest([studiewijzerLesgroepenIds$, alleLesgroepen$]).pipe(
            map(([swlesgroepIds, lesgroepen]) => lesgroepen.filter((lesgroep: Lesgroep) => !swlesgroepIds.includes(lesgroep.id))),
            shareReplayLastValue()
        );

        this.heeftLesgroepenZonderSw$ = this.lesgroepenZonderSw$.pipe(map((lesgroepen) => lesgroepen.length > 0));

        this.editStudiewijzerSidebar$ = this.sidebarService.watchFor(EditStudiewijzerSidebarComponent);
    }

    addStudiewijzer() {
        this.sidebarService.openSidebar(EditStudiewijzerSidebarComponent, { studiewijzer: {} as Studiewijzer });
    }

    addCategorie() {
        this.studiewijzerDataService.createStudiewijzerCategorie(this.medewerkerDataService.medewerkerUuid, this.schooljaar);
    }

    setEditMode(categorieId: string, value: boolean) {
        this.studiewijzerDataService.setStudiewijzerCategorieEditMode(categorieId, value);
    }

    saveCategorie(categorie: AbstractStudiewijzerCategorie) {
        this.studiewijzerDataService.saveStudiewijzerCategorie(
            this.medewerkerDataService.medewerkerUuid,
            this.schooljaar,
            categorie as StudiewijzerCategorie
        );
    }

    moveCategorie(categorie: StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']['categorieen'][number], move: CategorieMove) {
        this.studiewijzerDataService.moveStudiewijzerCategorie(
            move,
            this.medewerkerDataService.medewerkerUuid,
            this.schooljaar,
            categorie as StudiewijzerCategorie
        );
    }

    removeEmptyCategories() {
        this.studiewijzerDataService.removeEmptyStudiewijzerCategorieen(this.schooljaar, this.medewerkerDataService.medewerkerUuid);
    }

    openMoreActionsPopup(
        categorie: StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']['categorieen'][number],
        { viewContainerRef, showUp, showDown, focusInputAndListenToEnterEvent }: CategorieMoreActionsClick
    ) {
        const popup = this.popupService.popup(viewContainerRef, ActionsPopupComponent.defaultPopupsettings, ActionsPopupComponent);
        popup.customButtons = defaultButtons(
            () => {
                this.studiewijzerDataService.setStudiewijzerCategorieEditMode(categorie.id, true);
                focusInputAndListenToEnterEvent();
            },
            () => {
                this.studiewijzerDataService.deleteStudiewijzerCategorie(
                    this.medewerkerDataService.medewerkerUuid,
                    this.schooljaar,
                    categorie as StudiewijzerCategorie
                );
            },
            null,
            'verwijder-categorie'
        );
        popup.onActionClicked = () => this.popupService.closePopUp();

        if (showUp) {
            popup.customButtons.push({
                icon: 'pijlBoven',
                color: 'neutral',
                text: 'Verplaats naar boven',
                onClickFn: () =>
                    this.studiewijzerDataService.moveStudiewijzerCategorie(
                        -1,
                        this.medewerkerDataService.medewerkerUuid,
                        this.schooljaar,
                        categorie as StudiewijzerCategorie
                    )
            });
        }

        if (showDown) {
            popup.customButtons.push({
                icon: 'pijlOnder',
                color: 'neutral',
                text: 'Verplaats naar beneden',
                onClickFn: () =>
                    this.studiewijzerDataService.moveStudiewijzerCategorie(
                        1,
                        this.medewerkerDataService.medewerkerUuid,
                        this.schooljaar,
                        categorie as StudiewijzerCategorie
                    )
            });
        }
    }

    openDeletePopup(
        categorie: StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']['categorieen'][number],
        { element, deleteFn, cancelFn }: CategorieDeleteClick
    ) {
        const popup = this.popupService.popup(element, VerwijderPopupComponent.defaultPopupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => {
            deleteFn();
            this.studiewijzerDataService.deleteStudiewijzerCategorie(
                this.medewerkerDataService.medewerkerUuid,
                this.schooljaar,
                categorie as StudiewijzerCategorie
            );
        };
        popup.onCancelClick = cancelFn;
        popup.gtmTag = 'verwijder-categorie';
    }

    verplaats(dragAndDropData: any) {
        this.studiewijzerDataService.verplaatsStudiewijzer(
            this.medewerkerDataService.medewerkerUuid,
            this.schooljaar,
            dragAndDropData.item.data,
            dragAndDropData.previousContainer.data,
            dragAndDropData.container.data
        );
    }

    trackById(index: number, item: StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']['categorieen'][number]) {
        return item.id;
    }

    public get schooljaar() {
        return parseInt(this.route.snapshot.queryParamMap.get('jaar')!, 10) || this.huidigSchooljaar;
    }
}
