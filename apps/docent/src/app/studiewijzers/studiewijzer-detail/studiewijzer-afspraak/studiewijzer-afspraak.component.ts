import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    Afspraak,
    HuiswerkType,
    Lesgroep,
    Medewerker,
    MethodeSubHoofdstuk,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerWeek,
    Toekenning
} from '@docent/codegen';
import { IconDirective, IconPillComponent, TooltipDirective } from 'harmony';
import { IconChevronOnder, IconGroep, IconToevoegen, provideIcons } from 'harmony-icons';
import { partial } from 'lodash-es';
import { DragDropData, StudiewijzerContent } from '../../../core/models/studiewijzers/studiewijzer.model';
import { PopupService } from '../../../core/popup/popup.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { accent_positive_1 } from '../../../rooster-shared/colors';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { LesuurComponent } from '../../../rooster-shared/components/lesuur/lesuur.component';
import { LesgroepenPipe } from '../../../rooster-shared/pipes/lesgroepen.pipe';
import { RoosterToetsPipe } from '../../../rooster-shared/pipes/roostertoets.pipe';
import { VolledigeNaamPipe, getVolledigeNaam } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { StudiewijzeritemToevoegenPopupComponent } from '../../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { StudiewijzeritemSidebarComponent } from '../../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import {
    createAfspraakToekenning,
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
import { StudiewijzerAfspraakLesgroepenPopupComponent } from './studiewijzer-afspraak-lesgroepen-popup/studiewijzer-afspraak-lesgroepen-popup.component';

@Component({
    selector: 'dt-studiewijzer-afspraak',
    templateUrl: './studiewijzer-afspraak.component.html',
    styleUrls: ['./studiewijzer-afspraak.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        AvatarComponent,
        TooltipDirective,
        LesuurComponent,
        BackgroundIconComponent,
        CdkDropList,
        StudiewijzeritemComponent,
        CdkDrag,
        CdkDragPlaceholder,
        LesgroepenPipe,
        VolledigeNaamPipe,
        RoosterToetsPipe,
        IconDirective,
        IconPillComponent
    ],
    providers: [provideIcons(IconGroep, IconChevronOnder, IconToevoegen)]
})
export class StudiewijzerAfspraakComponent implements OnInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    private dragDropService = inject(StudiewijzerDragDropDataService);
    private route = inject(ActivatedRoute);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    @ViewChild('toevoegen', { read: ViewContainerRef, static: true }) toevoegen: ViewContainerRef;
    @ViewChild('lesgroepenPill', { read: ViewContainerRef }) lesgroepenPill: ViewContainerRef;

    @Input() studiewijzerAfspraak: StudiewijzerAfspraak;
    @Input() disableDragDrop: boolean;
    @Input() lesgroep: Lesgroep;
    @Input() heeftVaksecties: boolean;

    onVerwijder = output<Toekenning>();
    onDupliceer = output<Toekenning>();
    onUpdateLesitemType = output<{
        huiswerkType: HuiswerkType;
        toekenning: Toekenning;
    }>();

    moetAvatarTonen = false;
    medewerker: Medewerker;
    isPopupOpen: boolean;
    accent_positive_1 = accent_positive_1;
    isDragging = false;

    datePipe = new DatePipe('nl');

    ngOnInit() {
        const bevatNietDeIngelogdeMedewerker = this.studiewijzerAfspraak.afspraak.medewerkers.every(
            (medewerker) => medewerker.id !== this.medewerkerDataService.medewerkerId
        );

        if (bevatNietDeIngelogdeMedewerker && this.studiewijzerAfspraak.afspraak.medewerkers.length > 0) {
            this.medewerker = this.studiewijzerAfspraak.afspraak.medewerkers[0];
            this.moetAvatarTonen = true;
            this.changeDetector.markForCheck();
        }
    }

    verplaatsNaarAfspraak(event: CdkDragDrop<StudiewijzerContent>) {
        if (isToekenning(event.item.data)) {
            this.verplaatsToekenning(event);
        } else {
            const saveToekenningenCallback: SaveToekenningenCallback = event.item.data;

            const hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerAfspraak.toekenningen);
            const createToekenningFn = partial(createAfspraakToekenning, this.studiewijzerAfspraak.afspraak.begin, hoogsteSortering);

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
            destinationDate: this.studiewijzerAfspraak.afspraak.begin,
            destAfspraakId: this.studiewijzerAfspraak.afspraak.id,
            toekenningIndex: event.currentIndex
        };

        if ((<StudiewijzerWeek>dragDropData.afkomst).weeknummer) {
            this.dragDropService.weekNaarAfspraak(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerAfspraak.toekenningen)
            );
        } else if ((<StudiewijzerAfspraak>dragDropData.afkomst).afspraak) {
            if ((<StudiewijzerAfspraak>dragDropData.afkomst).afspraak.id === dragDropData.destAfspraakId) {
                const toekenningen = getOptimisticSortering(
                    this.studiewijzerAfspraak.toekenningen,
                    event.previousIndex,
                    event.currentIndex
                );
                this.dragDropService.sorteerToekenningen(
                    dragDropData.abstractStudiewijzerId,
                    this.studiewijzerAfspraak,
                    event.previousIndex,
                    event.currentIndex,
                    mapToToekenningenSortering(toekenningen),
                    'studiewijzeritemafspraaktoekenningen'
                );
            } else {
                this.dragDropService.afspraakNaarAfspraak(
                    dragDropData,
                    mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerAfspraak.toekenningen)
                );
            }
        } else if ((<StudiewijzerDag>dragDropData.afkomst).dag) {
            this.dragDropService.dagNaarAfspraak(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.studiewijzerAfspraak.toekenningen)
            );
        }
    }

    isGeenInleverPeriode = (item: CdkDrag<Toekenning | MethodeSubHoofdstuk>) => {
        if ('inhoud' in item) {
            return true;
        }
        return !(<Toekenning>item.data).studiewijzeritem?.inleverperiode;
    };

    openToevoegenPopup() {
        const popupSettings = StudiewijzeritemToevoegenPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.toevoegen, popupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.afspraak = this.studiewijzerAfspraak.afspraak;
        popup.heeftToegangTotElo = true;
        popup.hoogsteSortering = getHoogsteToekenningSortering(this.studiewijzerAfspraak.toekenningen);
        popup.onSjabloonClick = null;
        popup.toonLesgroepControls = this.studiewijzerAfspraak.afspraak.lesgroepen.length > 1;
        if (this.heeftVaksecties) {
            popup.onSjabloonClick = () => {
                this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, {
                    studiewijzerContent: this.studiewijzerAfspraak
                });
            };
        }

        this.isPopupOpen = true;
    }

    onPopupClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.detectChanges();
    };

    openSidebar(toekenning: Toekenning, afspraak: Afspraak, openInEditMode: boolean) {
        if (!this.isDragging) {
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning, afspraak, openInEditMode });
        }
    }

    openToekenningenVanLesgroepenPopup() {
        const popupSettings = StudiewijzerAfspraakLesgroepenPopupComponent.defaultPopupsettings;
        const popup = this.popupService.popup(this.lesgroepenPill, popupSettings, StudiewijzerAfspraakLesgroepenPopupComponent);

        popup.afspraak = this.studiewijzerAfspraak.afspraak;
        popup.lesgroepVanStudiewijzer = this.lesgroep.id;
    }

    trackById(index: number, item: Toekenning) {
        return item.id;
    }

    lesuurTooltip = () => getTooltip(this.datePipe, this.studiewijzerAfspraak.afspraak);
    medewerkerLesuurTooltip = () => getTooltip(this.datePipe, this.studiewijzerAfspraak.afspraak, true);
}

const getTooltip = (pipe: DatePipe, afspraak: Afspraak, metMedewerker?: boolean): string => {
    const medewerker = metMedewerker ? afspraak.medewerkers[0] : undefined;
    return [
        medewerker ? getVolledigeNaam(medewerker) : undefined,
        pipe.transform(afspraak.begin, 'HH:mm'),
        pipe.transform(afspraak.eind, 'HH:mm'),
        afspraak.locatie
    ]
        .filter(Boolean)
        .join(' - ');
};
