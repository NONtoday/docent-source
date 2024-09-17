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
import { differenceInMinutes, getISOWeek, isSameWeek, setISOWeek } from 'date-fns';
import { partial } from 'lodash-es';

import { HuiswerkType, SjabloonViewQuery, SjabloonWeek, WeekToekenning } from '@docent/codegen';
import { IconDirective, PillComponent, TagComponent } from 'harmony';
import { IconLabelToevoegen, IconPijlBoven, IconPijlOnder, IconToevoegen, provideIcons } from 'harmony-icons';
import { DragDropData } from '../../../core/models/studiewijzers/studiewijzer.model';
import { PopupService } from '../../../core/popup/popup.service';
import { DeviceService } from '../../../core/services/device.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { accent_positive_1 } from '../../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { toDate } from '../../../rooster-shared/utils/date.utils';
import { StudiewijzeritemToevoegenPopupComponent } from '../../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StudiewijzeritemSidebarComponent } from '../../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { SjabloonGekoppeldWeeknummerPipe } from '../../../shared/pipes/sjabloon-gekoppeld-weeknummer.pipe';
import {
    createWeekToekenning,
    getHoogsteToekenningSortering,
    getOptimisticSortering,
    isToekenning,
    mapToToekenningenSortering,
    mapToToekenningenSorteringVerplaatsing
} from '../../../shared/utils/toekenning.utils';
import { SaveToekenningenCallback } from '../../methode-sidebar/methode-sidebar.component';
import { SelecteerStudiewijzerContentSidebarComponent } from '../../selecteer-studiewijzer-content-sidebar/selecteer-studiewijzer-content-sidebar.component';
import { StudiewijzerDragDropDataService } from '../../studiewijzer-drag-drop-data.service';
import { StudiewijzeritemComponent } from '../../studiewijzeritem/studiewijzeritem.component';
import { VakantieComponent } from '../../vakantie/vakantie.component';
import {
    PlanningVerschuifDirection,
    VerschuifPlanningPopupComponent
} from '../../verschuif-planning-popup/verschuif-planning-popup.component';
import { LabelToevoegenPopupComponent } from './label-toevoegen-popup/label-toevoegen-popup.component';

export type SjabloonViewToekenning = SjabloonViewQuery['sjabloonView']['weken'][number]['toekenningen'][number];

@Component({
    selector: 'dt-sjabloon-week',
    templateUrl: './sjabloon-week.component.html',
    styleUrls: ['./sjabloon-week.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TooltipDirective,
        TagComponent,
        BackgroundIconComponent,
        CdkDropList,
        VakantieComponent,
        StudiewijzeritemComponent,
        CdkDrag,
        CdkDragPlaceholder,
        SjabloonGekoppeldWeeknummerPipe,
        IconDirective,
        PillComponent
    ],
    providers: [provideIcons(IconPijlBoven, IconPijlOnder, IconLabelToevoegen, IconToevoegen)]
})
export class SjabloonWeekComponent implements OnChanges {
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private dragDropService = inject(StudiewijzerDragDropDataService);
    private deviceService = inject(DeviceService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild('toevoegen', { read: ViewContainerRef }) toevoegenRef: ViewContainerRef;
    @ViewChild('labelToevoegen', { read: ViewContainerRef }) labelToevoegenRef: ViewContainerRef;
    @ViewChild('verschuifUp', { read: ViewContainerRef }) verschuifUp: ViewContainerRef;
    @ViewChild('verschuifDown', { read: ViewContainerRef }) verschuifDown: ViewContainerRef;

    @Input() @HostBinding('class.in-bulkmode') toonBulkacties: boolean;
    @Input() sjabloonWeek: SjabloonViewQuery['sjabloonView']['weken'][number];
    @Input() isEigenaar: boolean;
    @Input() disableDragDrop: boolean;
    @Input() heeftToegangTotElo = true;
    @Input() synctSchooljaar: number;
    @Input() first = false;
    @Input() showVerschuifOmhoog: boolean;
    @Input() showVerschuifOmlaag: boolean;
    @Input() verschuifOmhoogWarningVanaf: number;
    @Input() verschuifOmlaagWarningVanaf: number;

    addLabel = output<string>();
    removeLabel = output<void>();
    onVerwijder = output<SjabloonViewToekenning>();
    onDupliceer = output<SjabloonViewToekenning>();
    verschuifPlanningOmhoog = output<number>();
    verschuifPlanningOmlaag = output<number>();
    onUpdateLesitemType = output<{
        huiswerkType: HuiswerkType;
        toekenning: SjabloonViewToekenning;
    }>();

    public isHuidigeWeek: boolean;
    public isEerstePeriodeWeek = false;

    isPopupOpen: boolean;
    accent_positive_1 = accent_positive_1;

    ngOnChanges(): void {
        this.isEerstePeriodeWeek = Boolean(
            this.sjabloonWeek.periode && this.sjabloonWeek.gekoppeldWeeknummer === getISOWeek(this.sjabloonWeek.periode.begin!)
        );
        this.isHuidigeWeek = isSameWeek(new Date(), setISOWeek(new Date(), this.sjabloonWeek.gekoppeldWeeknummer!));
    }

    verplaatsNaarWeek(event: CdkDragDrop<SjabloonViewQuery['sjabloonView']['weken'][number]>) {
        if (isToekenning(event.item.data)) {
            this.verplaatsToekenning(event);
        } else {
            const hoogsteSortering = getHoogsteToekenningSortering(this.sjabloonWeek.toekenningen as WeekToekenning[]);
            const createToekenningFn = partial(createWeekToekenning, this.sjabloonWeek.weeknummer, hoogsteSortering);

            const saveToekenningenCallback: SaveToekenningenCallback = event.item.data;
            saveToekenningenCallback(createToekenningFn);
        }
    }

    verplaatsToekenning(event: CdkDragDrop<SjabloonViewQuery['sjabloonView']['weken'][number]>) {
        const toekenning: SjabloonViewToekenning = event.item.data;
        const dragDropData: DragDropData = {
            abstractStudiewijzerId: this.route.snapshot.paramMap.get('id')!,
            toekenning: toekenning as WeekToekenning,
            afkomst: event.previousContainer.data as SjabloonWeek,
            isStartInleverperiode: toekenning.isStartInleverperiode!,
            destWeeknummer: this.sjabloonWeek.weeknummer,
            toekenningIndex: event.currentIndex
        };

        if ((<SjabloonWeek>dragDropData.afkomst).weeknummer === dragDropData.destWeeknummer) {
            const toekenningen = getOptimisticSortering(
                this.sjabloonWeek.toekenningen as WeekToekenning[],
                event.previousIndex,
                event.currentIndex
            );
            this.dragDropService.sorteerSjabloonToekenning(
                dragDropData.abstractStudiewijzerId,
                this.sjabloonWeek.weeknummer,
                event.previousIndex,
                event.currentIndex,
                mapToToekenningenSortering(toekenningen)
            );
        } else {
            const inleveropdracht = toekenning.studiewijzeritem.conceptInleveropdracht;
            if (inleveropdracht) {
                dragDropData.conceptInleveropdrachtWijziging = {
                    oudeWeekStart: toekenning.startWeek,
                    oudeWeekEind: toekenning.eindWeek,
                    startVerplaatst: toekenning.isStartInleverperiode!,
                    deadlineVerplaatst: !toekenning.isStartInleverperiode
                };
                let nieuweStartWeek = toekenning.isStartInleverperiode ? this.sjabloonWeek.weeknummer : toekenning.startWeek;
                let nieuweEindWeek = toekenning.isStartInleverperiode ? toekenning.eindWeek : this.sjabloonWeek.weeknummer;

                // wanneer beide verplaats moeten worden, dan kunnen zowel start of eind op deze sjabloonweek gezet worden

                const startVoorbijEindGesleept = toekenning.isStartInleverperiode && this.sjabloonWeek.weeknummer > toekenning.eindWeek;

                const eindVoorbijStartGesleept = !toekenning.isStartInleverperiode && this.sjabloonWeek.weeknummer < toekenning.startWeek;

                if (startVoorbijEindGesleept || eindVoorbijStartGesleept) {
                    nieuweStartWeek = this.sjabloonWeek.weeknummer;
                    nieuweEindWeek = this.sjabloonWeek.weeknummer;
                }

                // wanneer de start & eind in dezelfde week komen, controlleer of dan nog wel minimaal een uur tussen start & eind zit.
                if (nieuweStartWeek === nieuweEindWeek) {
                    const startTijd = `${inleveropdracht.startUur}:${inleveropdracht.startMinuut}`;
                    const eindTijd = `${inleveropdracht.eindUur}:${inleveropdracht.eindMinuut}`;

                    const startDatum = toDate(dragDropData.destWeeknummer!, inleveropdracht.startDag, startTijd);
                    const eindDatum = toDate(dragDropData.destWeeknummer!, inleveropdracht.eindDag, eindTijd);

                    const verschilInMinuten = differenceInMinutes(eindDatum, startDatum);

                    if (verschilInMinuten < 60) {
                        this.showOngeldigeInleveropdrachtPopup(
                            toekenning,
                            dragDropData.conceptInleveropdrachtWijziging.oudeWeekStart,
                            dragDropData.conceptInleveropdrachtWijziging.oudeWeekEind
                        );
                        return;
                    }
                }

                // we passen de start en eindweek pas na het mogelijk tonen van de popup aan,
                // omdat de gebruiker nog op annuleren kan drukken
                dragDropData.toekenning = {
                    ...toekenning,
                    startWeek: nieuweStartWeek,
                    eindWeek: nieuweEindWeek
                } as WeekToekenning;
            }
            this.dragDropService.sjabloonNaarWeek(
                dragDropData,
                mapToToekenningenSorteringVerplaatsing(dragDropData, this.sjabloonWeek.toekenningen as WeekToekenning[])
            );
        }
    }

    openPlanningVerschuifPopup(direction: PlanningVerschuifDirection) {
        this.isPopupOpen = true;
        const popupSettings = VerschuifPlanningPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const icon = direction === 'omhoog' ? this.verschuifUp : this.verschuifDown;
        const popup = this.popupService.popup(icon, popupSettings, VerschuifPlanningPopupComponent);
        const isGesynced = Boolean(this.synctSchooljaar);
        popup.direction = direction;
        popup.showInfoIcon = isGesynced;
        if (direction === 'omhoog') {
            popup.showOmhoogWarningVanaf = this.verschuifOmhoogWarningVanaf;
            popup.opslaanFn = (aantalWeken) =>
                isGesynced ? this.openPlanningVerschuifGuard(aantalWeken, direction) : this.verschuifPlanningOmhoog.emit(aantalWeken);
        } else {
            popup.showOmlaagWarningVanaf = this.verschuifOmlaagWarningVanaf;
            popup.opslaanFn = (aantalWeken) =>
                isGesynced ? this.openPlanningVerschuifGuard(aantalWeken, direction) : this.verschuifPlanningOmlaag.emit(aantalWeken);
        }
    }

    openPlanningVerschuifGuard(aantalWeken: number, direction: PlanningVerschuifDirection) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Sjabloon synchroniseert met studiewijzer(s)';
        popup.message = 'Wijzigingen worden direct doorgevoerd in de gesynchroniseerde studiewijzers. \n\n <b>Wil je doorgaan?<b>';
        popup.cancelLabel = 'Annuleren';
        popup.actionLabel = 'Doorgaan';
        popup.showLoaderOnConfirm = true;

        popup.onConfirmFn = () => {
            if (direction === 'omhoog') {
                this.verschuifPlanningOmhoog.emit(aantalWeken);
            } else {
                this.verschuifPlanningOmlaag.emit(aantalWeken);
            }
            return true;
        };
    }

    showOngeldigeInleveropdrachtPopup(toekenning: SjabloonViewToekenning, oudeWeekStart: number, oudeWeekEind: number) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );
        popup.title = 'Let op, de inleverperiode wordt ongeldig';
        popup.message = `Het startmoment moet minimaal 1 uur voor de deadline gepland zijn. Wijzig de periode handmatig in de inleveropdracht of annuleer.`;
        popup.actionLabel = 'Bewerken';
        popup.cancelLabel = 'Annuleren';
        popup.warning = true;
        popup.onConfirmFn = () => {
            this.openSidebar(toekenning, true);
            return true;
        };
        popup.onCancelFn = () => {
            toekenning.startWeek = oudeWeekStart;
            toekenning.eindWeek = oudeWeekEind;
        };
    }

    openToevoegenPopup() {
        const popupSettings = StudiewijzeritemToevoegenPopupComponent.defaultPopupSettings;
        popupSettings.horizontalEdgeOffset = 100;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.toevoegenRef, popupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.inSjabloon = true;
        popup.week = this.sjabloonWeek.weeknummer;
        popup.heeftToegangTotElo = this.heeftToegangTotElo;
        popup.hoogsteSortering = getHoogsteToekenningSortering(this.sjabloonWeek.toekenningen as WeekToekenning[]);
        popup.showInleveropdracht = true;
        popup.onStudiewijzerClick = () =>
            this.sidebarService.openSidebar(SelecteerStudiewijzerContentSidebarComponent, { weeknummer: this.sjabloonWeek.weeknummer });
    }

    openLabelToevoegenPopup() {
        this.isPopupOpen = true;

        const popupSettings = LabelToevoegenPopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onPopupClose;

        const popup = this.popupService.popup(this.labelToevoegenRef, popupSettings, LabelToevoegenPopupComponent);
        popup.onSubmitFn = (label: string) => this.addLabel.emit(label);
    }

    onPopupClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.detectChanges();
    };

    openSidebar(toekenning: SjabloonViewToekenning, openInEditMode?: boolean) {
        this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning: toekenning as any, openInEditMode });
    }

    trackById(index: number, item: SjabloonViewToekenning) {
        return item.id;
    }
}
