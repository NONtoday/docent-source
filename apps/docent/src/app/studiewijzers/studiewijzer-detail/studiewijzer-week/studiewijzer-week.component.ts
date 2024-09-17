import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getISOWeek } from 'date-fns';

import {
    HuiswerkType,
    Lesgroep,
    MethodeSubHoofdstuk,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerWeek,
    Toekenning
} from '@docent/codegen';
import { BrowseComponent, IconDirective } from 'harmony';
import { IconPijlBoven, IconPijlOnder, IconToevoegen, provideIcons } from 'harmony-icons';
import { partial } from 'lodash-es';
import { DragDropData, StudiewijzerContent } from '../../../core/models/studiewijzers/studiewijzer.model';
import { PopupService } from '../../../core/popup/popup.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { accent_positive_1 } from '../../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../rooster-shared/utils/utils';
import { StudiewijzeritemToevoegenPopupComponent } from '../../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { StudiewijzeritemSidebarComponent } from '../../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import {
    createWeekToekenning,
    getHoogsteToekenningSortering,
    getOptimisticSortering,
    isToekenning,
    mapToToekenningenSortering,
    mapToToekenningenSorteringVerplaatsing
} from '../../../shared/utils/toekenning.utils';
import { SaveToekenningenCallback } from '../../methode-sidebar/methode-sidebar.component';
import { SelecteerSjabloonContentSidebarComponent } from '../../selecteer-sjabloon-content-sidebar/selecteer-sjabloon-content-sidebar.component';
import { StudiewijzerDragDropDataService } from '../../studiewijzer-drag-drop-data.service';
import { StudiewijzeritemComponent } from '../../studiewijzeritem/studiewijzeritem.component';
import {
    PlanningVerschuifDirection,
    VerschuifPlanningPopupComponent
} from '../../verschuif-planning-popup/verschuif-planning-popup.component';
import { StudiewijzerDagComponent } from '../studiewijzer-dag/studiewijzer-dag.component';

@Component({
    selector: 'dt-studiewijzer-week',
    templateUrl: './studiewijzer-week.component.html',
    styleUrls: ['./studiewijzer-week.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TooltipDirective,
        BackgroundIconComponent,
        CdkDropList,
        StudiewijzeritemComponent,
        CdkDrag,
        CdkDragPlaceholder,
        StudiewijzerDagComponent,
        IconDirective,
        BrowseComponent
    ],
    providers: [provideIcons(IconPijlBoven, IconPijlOnder, IconToevoegen)]
})
export class StudiewijzerWeekComponent implements OnChanges {
    public elementRef = inject(ElementRef);
    private route = inject(ActivatedRoute);
    private dragDropService = inject(StudiewijzerDragDropDataService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private sidebarService = inject(SidebarService);
    @ViewChild('toevoegen', { read: ViewContainerRef, static: true }) toevoegenRef: ViewContainerRef;
    @ViewChild('verschuif', { read: ViewContainerRef }) verschuifComp: ViewContainerRef;

    @Input() @HostBinding('class.in-bulkmode') inBulkmode: Optional<boolean>;
    @Input() studiewijzerWeek: StudiewijzerWeek;
    @Input() disableDragDrop: boolean;
    @Input() lesgroep: Lesgroep;
    @Input() heeftVaksecties: boolean;
    @Input() verschuifOmhoogWarningVanaf: number;
    @Input() verschuifOmlaagWarningVanaf: number;
    @Input() showVerschuifOmhoog: boolean;
    @Input() showVerschuifOmlaag: boolean;

    onVerwijder = output<Toekenning>();
    onDupliceer = output<Toekenning>();
    verschuifPlanningOmhoog = output<number>();
    verschuifPlanningOmlaag = output<number>();
    onUpdateLesitemType = output<{
        huiswerkType: HuiswerkType;
        toekenning: Toekenning;
    }>();

    isEerstePeriodeWeek = false;
    isPopupOpen: boolean;
    accent_positive_1 = accent_positive_1;
    isDragging = false;

    ngOnChanges(): void {
        this.isEerstePeriodeWeek = Boolean(
            this.studiewijzerWeek.periode &&
                getISOWeek(this.studiewijzerWeek.dagen[0].dag) === getISOWeek(this.studiewijzerWeek.periode.begin!)
        );
    }

    verplaatsNaarWeek(event: CdkDragDrop<StudiewijzerContent>) {
        if (isToekenning(event.item.data)) {
            this.verplaatsToekenning(event);
        } else {
            const saveToekenningenCallback: SaveToekenningenCallback = event.item.data;

            const hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerWeek.toekenningen);
            const createToekenningFn = partial(createWeekToekenning, this.studiewijzerWeek.weeknummer, hoogsteSortering);

            saveToekenningenCallback(createToekenningFn);
        }
    }

    verplaatsToekenning(event: CdkDragDrop<StudiewijzerContent>) {
        const dragDropData: DragDropData = {
            abstractStudiewijzerId: this.route.snapshot.paramMap.get('id')!,
            lesgroepId: this.lesgroep.id,
            toekenning: event.item.data,
            afkomst: event.previousContainer.data,
            isStartInleverperiode: event.item.data.isStartInleverperiode,
            destWeeknummer: this.studiewijzerWeek.weeknummer,
            toekenningIndex: event.currentIndex
        };

        if ((<StudiewijzerWeek>dragDropData.afkomst).weeknummer) {
            if ((<StudiewijzerWeek>dragDropData.afkomst).weeknummer === dragDropData.destWeeknummer) {
                const toekenningen = getOptimisticSortering(this.studiewijzerWeek.toekenningen, event.previousIndex, event.currentIndex);
                this.dragDropService.sorteerToekenningen(
                    dragDropData.abstractStudiewijzerId,
                    this.studiewijzerWeek,
                    event.previousIndex,
                    event.currentIndex,
                    mapToToekenningenSortering(toekenningen),
                    'studiewijzeritemweektoekenningen'
                );
            } else {
                this.dragDropService.weekNaarWeek(
                    dragDropData,
                    mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerWeek.toekenningen)
                );
            }
        } else if ((<StudiewijzerAfspraak>dragDropData.afkomst).afspraak) {
            this.dragDropService.afspraakNaarWeek(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerWeek.toekenningen)
            );
        } else if ((<StudiewijzerDag>dragDropData.afkomst).dag) {
            this.dragDropService.dagNaarWeek(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerWeek.toekenningen)
            );
        }
    }

    isGeenInleverPeriode = (item: CdkDrag<Toekenning | MethodeSubHoofdstuk>) => {
        if ('inhoud' in item) {
            return true;
        }
        return !(<Toekenning>item.data).studiewijzeritem?.inleverperiode;
    };

    // helper functies omdat type niet gecontroleerd wordt in de html. Zo is het dus type-safe
    openPlanningVerschuifOmlaagPopup = () => this.openPlanningVerschuifPopup('omlaag');
    openPlanningVerschuifOmhoogPopup = () => this.openPlanningVerschuifPopup('omhoog');
    private openPlanningVerschuifPopup(direction: PlanningVerschuifDirection) {
        const popupSettings = VerschuifPlanningPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.verschuifComp, popupSettings, VerschuifPlanningPopupComponent);
        popup.direction = direction;
        if (direction === 'omhoog') {
            popup.showOmhoogWarningVanaf = this.verschuifOmhoogWarningVanaf;
            popup.opslaanFn = (aantalWeken) => this.verschuifPlanningOmhoog.emit(aantalWeken);
        } else {
            popup.showOmlaagWarningVanaf = this.verschuifOmlaagWarningVanaf;
            popup.opslaanFn = (aantalWeken) => this.verschuifPlanningOmlaag.emit(aantalWeken);
        }
        this.isPopupOpen = true;
    }

    openToevoegenPopup() {
        const popupSettings = StudiewijzeritemToevoegenPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.toevoegenRef, popupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.week = this.studiewijzerWeek.weeknummer;
        popup.heeftToegangTotElo = true;
        popup.hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerWeek.toekenningen);
        popup.onSjabloonClick = this.heeftVaksecties
            ? () =>
                  this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, { studiewijzerContent: this.studiewijzerWeek })
            : null;

        this.isPopupOpen = true;
    }

    onPopupClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.detectChanges();
    };

    openSidebar(toekenning: Toekenning, openInEditMode?: boolean) {
        if (!this.isDragging) {
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning, openInEditMode });
        }
    }

    trackById(index: number, item: Toekenning) {
        return item.id;
    }

    trackByDag(index: number, item: StudiewijzerDag) {
        return item.dag.toISOString();
    }
}
