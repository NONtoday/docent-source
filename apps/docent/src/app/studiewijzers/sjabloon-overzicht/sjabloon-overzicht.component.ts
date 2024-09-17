import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Sjabloon, SjabloonCategorie, StudiewijzerCategorie, Vaksectie, VaksectieView } from '@docent/codegen';
import { IconDirective, SpinnerComponent, SwitchComponent, SwitchGroupComponent } from 'harmony';
import { IconDraggable, IconPijlBoven, IconPijlOnder, IconSjabloon, IconStudiewijzer, IconToevoegen, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { allowChildAnimations } from '../../core/core-animations';
import { startLoading, stopLoading } from '../../core/operators/loading.operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { HeaderComponent } from '../../layout/header/header.component';
import { accent_positive_1 } from '../../rooster-shared/colors';
import { ActionsPopupComponent, defaultButtons } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { Optional, loadingState } from '../../rooster-shared/utils/utils';
import { KeuzeOptiesComponent } from '../../shared/components/keuze-opties/keuze-opties.component';
import { VerwijderPopupComponent } from '../../shared/components/verwijder-popup/verwijder-popup.component';
import {
    AbstractStudiewijzerCategorieComponent,
    CategorieDeleteClick,
    CategorieMoreActionsClick,
    CategorieMove
} from '../abstract-studiewijzer-categorie/abstract-studiewijzer-categorie.component';
import { AddCategorieComponent } from '../add-categorie/add-categorie.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { SjabloonOntkoppelPopupComponent } from '../sjabloon-ontkoppel-popup/sjabloon-ontkoppel-popup.component';
import { EditSjabloonSidebarComponent } from './edit-sjabloon-sidebar/edit-sjabloon-sidebar.component';
import { SjabloonOverzichtItemComponent } from './sjabloon-overzicht-item/sjabloon-overzicht-item.component';

@Component({
    selector: 'dt-sjabloon-overzicht',
    templateUrl: './sjabloon-overzicht.component.html',
    styleUrls: ['../../shared/scss/toevoegen.tile.scss', './sjabloon-overzicht.component.scss'],
    animations: [allowChildAnimations],
    standalone: true,
    imports: [
        HeaderComponent,
        KeuzeOptiesComponent,
        SpinnerComponent,
        CdkDropListGroup,
        MessageComponent,
        CdkDropList,
        SjabloonOverzichtItemComponent,
        CdkDrag,
        RouterLink,
        CdkDragPlaceholder,
        CdkDragHandle,
        AddCategorieComponent,
        AbstractStudiewijzerCategorieComponent,
        EditSjabloonSidebarComponent,
        AsyncPipe,
        IconDirective,
        SwitchGroupComponent,
        SwitchComponent
    ],
    providers: [provideIcons(IconSjabloon, IconToevoegen, IconDraggable, IconPijlBoven, IconPijlOnder, IconStudiewijzer)]
})
export class SjabloonOverzichtComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private sjabloonDataService = inject(SjabloonDataService);
    private sidebarService = inject(SidebarService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild('dropDown', { read: ElementRef }) dropDownElement: ElementRef;
    @ViewChild('addTile', { read: ViewContainerRef }) addTileRef: ViewContainerRef;

    public vaksecties$: Observable<Vaksectie[]>;
    public sjabloonOverzichtView$: Observable<VaksectieView>;
    public selectedVaksectie$ = new BehaviorSubject<Optional<Vaksectie>>(null);
    public accentPositive1 = accent_positive_1;
    public loadingState = loadingState();

    public editSjabloonSidebar$: SidebarInputs<EditSjabloonSidebarComponent>;

    ngOnInit() {
        const medewerkerUuid = this.medewerkerDataService.medewerkerUuid;
        const viewdata$ = this.sjabloonDataService.getSjabloonOverzichtView(medewerkerUuid).pipe(startLoading(this.loadingState));

        const onthoudenVaksectie$ = this.route.queryParamMap.pipe(map((queryparamMap) => queryparamMap.get('vaksectie')));

        this.vaksecties$ = combineLatest([viewdata$, onthoudenVaksectie$]).pipe(
            tap(([views, onthoudenVaksectieId]) => {
                if (views.length > 0) {
                    const onthoudenVaksectie = views.find((view) => view.vaksectie.id === onthoudenVaksectieId)?.vaksectie;
                    const eersteVaksectie = views[0].vaksectie;
                    const selectedVaksectie = onthoudenVaksectie ?? eersteVaksectie;
                    this.selectedVaksectie$.next(selectedVaksectie);
                }
            }),
            map(([views]) => views.map((v) => v.vaksectie)),
            shareReplayLastValue()
        );

        this.sjabloonOverzichtView$ = combineLatest([this.selectedVaksectie$, viewdata$]).pipe(
            map(([selectedVaksectie, views]) =>
                selectedVaksectie
                    ? (views.find((vaksectieView) => vaksectieView.vaksectie.uuid === selectedVaksectie.uuid) as VaksectieView)
                    : ({ vaksectie: null } as any)
            ),
            stopLoading(this.loadingState)
        );

        this.sjabloonDataService
            .getSjablonenGekoppeldAanOudeStudiewijzers()
            .pipe(
                filter((sjablonen) => sjablonen.length > 0),
                take(1)
            )
            .subscribe((sjablonen) => {
                const popup = this.popupService.popup(
                    this.viewContainerRef,
                    SjabloonOntkoppelPopupComponent.defaultPopupSettings,
                    SjabloonOntkoppelPopupComponent
                );
                popup.sjablonen = sjablonen as Sjabloon[];
                popup.ontkoppelStudiewijzersVanSjablonen = () => this.ontkoppelStudiewijzersVanSjablonen(sjablonen as Sjabloon[]);
            });

        this.editSjabloonSidebar$ = this.sidebarService.watchFor(EditSjabloonSidebarComponent);
    }

    addCategorie() {
        this.sjabloonDataService.createSjabloonCategorie(this.medewerkerDataService.medewerkerUuid, this.selectedVaksectie$.value!.uuid);
    }

    setEditMode(categorieId: string, value: boolean) {
        this.sjabloonDataService.setSjabloonCategorieEditMode(categorieId, value);
    }

    saveCategorie(categorie: SjabloonCategorie | StudiewijzerCategorie) {
        this.sjabloonDataService.saveSjabloonCategorie(this.medewerkerDataService.medewerkerUuid, <SjabloonCategorie>categorie);
    }

    moveCategorie(categorie: SjabloonCategorie, move: CategorieMove) {
        this.sjabloonDataService.moveSjabloonCategorie(move, this.medewerkerDataService.medewerkerUuid, categorie);
    }

    removeEmptyCategories() {
        this.sjabloonDataService.removeEmptySjabloonCategorieen(this.medewerkerDataService.medewerkerUuid);
    }

    openMoreActionsPopup(
        categorie: SjabloonCategorie,
        { viewContainerRef, showUp, showDown, focusInputAndListenToEnterEvent }: CategorieMoreActionsClick
    ) {
        const popup = this.popupService.popup(viewContainerRef, ActionsPopupComponent.defaultPopupsettings, ActionsPopupComponent);
        popup.customButtons = defaultButtons(
            () => {
                this.popupService.closePopUp();
                this.sjabloonDataService.setSjabloonCategorieEditMode(categorie.id, true);
                focusInputAndListenToEnterEvent();
            },
            () => {
                this.popupService.closePopUp();
                this.sjabloonDataService.deleteSjabloonCategorie(this.medewerkerDataService.medewerkerUuid, categorie);
            },
            null,
            'verwijder-categorie'
        );

        if (showUp) {
            popup.customButtons.push({
                icon: 'pijlBoven',
                color: 'neutral',
                text: 'Verplaats naar boven',
                onClickFn: () => {
                    this.popupService.closePopUp();
                    this.sjabloonDataService.moveSjabloonCategorie(-1, this.medewerkerDataService.medewerkerUuid, categorie);
                }
            });
        }

        if (showDown) {
            popup.customButtons.push({
                icon: 'pijlOnder',
                color: 'neutral',
                text: 'Verplaats naar beneden',
                onClickFn: () => {
                    this.popupService.closePopUp();
                    this.sjabloonDataService.moveSjabloonCategorie(1, this.medewerkerDataService.medewerkerUuid, categorie);
                }
            });
        }
    }

    openDeletePopup(categorie: SjabloonCategorie, { element, deleteFn, cancelFn }: CategorieDeleteClick) {
        const popup = this.popupService.popup(element, VerwijderPopupComponent.defaultPopupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => {
            deleteFn();
            this.sjabloonDataService.deleteSjabloonCategorie(this.medewerkerDataService.medewerkerUuid, categorie);
        };
        popup.onCancelClick = cancelFn;
        popup.gtmTag = 'verwijder-categorie';
    }

    onVaksectieChanged(value: any) {
        this.selectedVaksectie$.next(value);
    }

    trackById(index: number, item: Sjabloon | SjabloonCategorie) {
        return item.id;
    }

    addSjabloon() {
        this.sidebarService.openSidebar(EditSjabloonSidebarComponent, { sjabloon: {} as Sjabloon });
    }

    verplaats(dragAndDropData: CdkDragDrop<SjabloonCategorie>) {
        if (dragAndDropData.previousContainer.data !== dragAndDropData.container.data) {
            this.sjabloonDataService.verplaatsSjabloon(
                this.medewerkerDataService.medewerkerUuid,
                dragAndDropData.item.data,
                dragAndDropData.previousContainer.data,
                dragAndDropData.container.data
            );
        }
    }

    closePopup() {
        if (this.popupService.isPopupOpen()) {
            this.popupService.closePopUp();
        }
    }

    onVaksectieSelect(vaksectie: Vaksectie) {
        this.router.navigate([], {
            queryParams: { vaksectie: vaksectie.id }
        });
    }

    ontkoppelStudiewijzersVanSjablonen(sjablonen: Sjabloon[]) {
        const sjabloonIds = sjablonen.map((sjabloon) => sjabloon.id);
        this.sjabloonDataService.ontkoppelStudiewijzersVanSjablonen(sjabloonIds);
        this.popupService.closePopUp();
    }
}
