import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { differenceInCalendarDays, differenceInMinutes, endOfDay, isSameDay, isToday, subHours } from 'date-fns';
import { partial } from 'lodash-es';

import {
    HuiswerkType,
    Inleverperiode,
    Lesgroep,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerWeek,
    Toekenning
} from '@docent/codegen';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { DragDropData, InleverperiodeWijziging, StudiewijzerContent } from '../../../core/models/studiewijzers/studiewijzer.model';
import { PopupOpenDirective } from '../../../core/popup/popup-open.directive';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../../core/popup/popup.settings';
import { SidebarService } from '../../../core/services/sidebar.service';
import { accent_positive_1 } from '../../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { setToSameDay } from '../../../rooster-shared/utils/date.utils';
import { formatNL } from '../../../rooster-shared/utils/utils';
import { StudiewijzeritemToevoegenPopupComponent } from '../../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StudiewijzeritemSidebarComponent } from '../../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import {
    createDagToekenning,
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
import { VakantieComponent } from '../../vakantie/vakantie.component';
import { StudiewijzerAfspraakComponent } from '../studiewijzer-afspraak/studiewijzer-afspraak.component';

@Component({
    selector: 'dt-studiewijzer-dag',
    templateUrl: './studiewijzer-dag.component.html',
    styleUrls: ['./studiewijzer-dag.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        BackgroundIconComponent,
        PopupOpenDirective,
        VakantieComponent,
        CdkDropList,
        StudiewijzeritemComponent,
        CdkDrag,
        CdkDragPlaceholder,
        StudiewijzerAfspraakComponent,
        DtDatePipe
    ],
    providers: [provideIcons(IconToevoegen)]
})
export class StudiewijzerDagComponent implements OnChanges {
    private viewContainerRef = inject(ViewContainerRef);
    private route = inject(ActivatedRoute);
    private dragDropService = inject(StudiewijzerDragDropDataService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private sidebarService = inject(SidebarService);
    @ViewChild('toevoegen', { read: ViewContainerRef, static: true }) toevoegenRef: ViewContainerRef;

    @HostBinding('class.zonder-afspraken') zonderAfspraken: boolean;
    @HostBinding('class.met-vakanties') metVakanties: boolean;

    @Input() studiewijzerDag: StudiewijzerDag;
    @Input() disableDragDrop: boolean;
    @Input() lesgroep: Lesgroep;
    @Input() heeftVaksecties: boolean;

    onVerwijder = output<Toekenning>();
    onDupliceer = output<Toekenning>();
    onUpdateLesitemType = output<{
        huiswerkType: HuiswerkType;
        toekenning: Toekenning;
    }>();

    geenItems = false;
    geenDagItems = false;
    isPopupOpen: boolean;
    isVandaag: boolean;
    accent_positive_1 = accent_positive_1;
    isDragging = false;

    ngOnChanges(): void {
        this.zonderAfspraken = this.studiewijzerDag.afspraken.length === 0;
        this.metVakanties = this.studiewijzerDag.vakanties.length > 0;

        this.geenItems =
            this.studiewijzerDag.toekenningen.length === 0 &&
            this.studiewijzerDag.afspraken.length === 0 &&
            this.studiewijzerDag.vakanties.length === 0;

        this.geenDagItems = this.studiewijzerDag.toekenningen.length === 0 && this.studiewijzerDag.vakanties.length === 0;

        this.isVandaag = isToday(this.studiewijzerDag.dag);
    }

    verplaatsNaarDag(event: CdkDragDrop<StudiewijzerContent>) {
        if (isToekenning(event.item.data)) {
            this.verplaatsToekenning(event);
        } else {
            const saveToekenningenCallback: SaveToekenningenCallback = event.item.data;

            const hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerDag.toekenningen);
            const createToekenningFn = partial(createDagToekenning, this.studiewijzerDag.dag, hoogsteSortering);

            saveToekenningenCallback(createToekenningFn);
        }
    }

    verplaatsToekenning(event: CdkDragDrop<StudiewijzerContent>) {
        const toekenning = event.item.data;
        const dragDropData: DragDropData = {
            abstractStudiewijzerId: this.route.snapshot.paramMap.get('id')!,
            lesgroepId: this.lesgroep.id,
            toekenning,
            afkomst: event.previousContainer.data,
            isStartInleverperiode: event.item.data.isStartInleverperiode,
            destinationDate: this.studiewijzerDag.dag,
            toekenningIndex: event.currentIndex
        };

        const inleverperiode = toekenning.studiewijzeritem.inleverperiode;
        if (inleverperiode) {
            dragDropData.inleverperiodeWijziging = this.berekenWijzigingen(
                inleverperiode,
                dragDropData.destinationDate!,
                dragDropData.isStartInleverperiode
            );
            if (dragDropData.inleverperiodeWijziging.tijdGewijzigd) {
                this.showBevestigPopup(dragDropData);
                return;
            }
        }

        if ((<StudiewijzerWeek>dragDropData.afkomst).weeknummer) {
            this.dragDropService.weekNaarDag(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerDag.toekenningen)
            );
        } else if ((<StudiewijzerAfspraak>dragDropData.afkomst).afspraak) {
            this.dragDropService.afspraakNaarDag(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerDag.toekenningen)
            );
        } else if ((<StudiewijzerDag>dragDropData.afkomst).dag) {
            if (isSameDay((<StudiewijzerDag>dragDropData.afkomst).dag, dragDropData.destinationDate!)) {
                const toekenningen = getOptimisticSortering(this.studiewijzerDag.toekenningen, event.previousIndex, event.currentIndex);
                this.dragDropService.sorteerToekenningen(
                    dragDropData.abstractStudiewijzerId,
                    this.studiewijzerDag,
                    event.previousIndex,
                    event.currentIndex,
                    mapToToekenningenSortering(toekenningen),
                    'studiewijzeritemdagtoekenningen'
                );
            } else {
                this.dragDropService.dagNaarDag(
                    dragDropData,
                    mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerDag.toekenningen)
                );
            }
        }
    }

    private berekenWijzigingen(inleverperiode: Inleverperiode, destDag: Date, isStart: boolean): InleverperiodeWijziging {
        const wijziging = this.defaultInleverperiodeWijziging(inleverperiode, isStart);

        if (isStart) {
            wijziging.nieuweDatums.start = setToSameDay(inleverperiode.begin, destDag);

            const verschilInDagen = differenceInCalendarDays(wijziging.nieuweDatums.start, inleverperiode.eind);
            if (verschilInDagen > 0) {
                // We verschuiven de deadline mee met de start
                wijziging.deadlineVerplaatst = true;
                wijziging.nieuweDatums.eind = setToSameDay(inleverperiode.eind, destDag);
            }

            return this.setNieuweTijden(wijziging.nieuweDatums.start, wijziging.nieuweDatums.eind, wijziging);
        } else {
            wijziging.nieuweDatums.eind = setToSameDay(inleverperiode.eind, destDag);

            const verschilInDagen = differenceInCalendarDays(wijziging.nieuweDatums.eind, inleverperiode.begin);
            if (verschilInDagen < 0) {
                // We verschuiven de start mee met de deadline
                wijziging.startVerplaatst = true;
                wijziging.nieuweDatums.start = setToSameDay(inleverperiode.begin, destDag);
            }

            return this.setNieuweTijden(wijziging.nieuweDatums.start, wijziging.nieuweDatums.eind, wijziging);
        }
    }

    private defaultInleverperiodeWijziging(inleverperiode: Inleverperiode, isStart: boolean): InleverperiodeWijziging {
        return {
            startVerplaatst: isStart,
            deadlineVerplaatst: !isStart,
            tijdGewijzigd: false,
            oudeDatums: {
                start: inleverperiode.begin,
                eind: inleverperiode.eind
            },
            nieuweDatums: {
                start: inleverperiode.begin,
                eind: inleverperiode.eind
            }
        };
    }

    private setNieuweTijden(newStart: Date, newEnd: Date, wijziging: InleverperiodeWijziging): InleverperiodeWijziging {
        const verschilInMinuten = differenceInMinutes(newEnd, newStart);

        if (verschilInMinuten < 60) {
            wijziging.tijdGewijzigd = true;
            if (newStart.getHours() > 0) {
                wijziging.nieuweDatums.start = subHours(newEnd, 1);
            } else {
                wijziging.nieuweDatums.eind = endOfDay(newEnd);
            }
        }

        return wijziging;
    }

    openToevoegenPopup() {
        const popupSettings = StudiewijzeritemToevoegenPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.toevoegenRef, popupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.dag = this.studiewijzerDag.dag;
        popup.heeftToegangTotElo = true;
        popup.hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerDag.toekenningen);
        popup.onSjabloonClick = this.heeftVaksecties
            ? () => this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, { studiewijzerContent: this.studiewijzerDag })
            : null;

        this.isPopupOpen = true;
        this.changeDetector.detectChanges();
    }

    onPopupClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.detectChanges();
    };

    openSidebar(toekenning: Toekenning, openInEditMode: boolean) {
        if (!this.isDragging) {
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning, openInEditMode });
        }
    }

    trackByAfspraak(index: number, item: StudiewijzerAfspraak) {
        return item.afspraak.id;
    }

    trackById(index: number, item: Toekenning) {
        return item.studiewijzeritem.inleverperiode ? `${item.id}-${String(item.isStartInleverperiode)}` : item.id;
    }

    showBevestigPopup(dragDropData: DragDropData) {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        const nieuweStart = dragDropData.inleverperiodeWijziging!.nieuweDatums.start;
        const nieuwEind = dragDropData.inleverperiodeWijziging!.nieuweDatums.eind;

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);
        popup.title = 'Let op, de tijd van de inleverperiode verandert';
        popup.message = `Omdat een inleverperiode minimaal <b>1 uur</b> moet duren, wordt de &nbsp; &nbsp; &nbsp;
        inlevertijd van de inleverperiode automatisch aangepast naar: <br>
        Starttijd: <b>${formatNL(nieuweStart, 'HH:mm')} </b> - Deadline: <b>${formatNL(nieuwEind, 'HH:mm')}</b>`;
        popup.actionLabel = 'Opslaan';
        popup.cancelLabel = 'Annuleren';
        popup.warning = true;
        popup.onConfirmFn = () => {
            this.dragDropService.dagNaarDag(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerDag.toekenningen)
            );
            return true;
        };
    }
}
