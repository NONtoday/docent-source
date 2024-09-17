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
import {
    Afspraak,
    Differentiatiegroep,
    HuiswerkType,
    Leerling,
    PartialLeerlingFragment,
    StudiewijzerAfspraak,
    StudiewijzerDag,
    StudiewijzerWeek
} from '@docent/codegen';
import { fadeInUpOnEnterAnimation } from 'angular-animations';
import { differenceInCalendarDays, isPast, isSameDay, isSameWeek } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { countBy, identity, join, maxBy, memoize, minBy, sum } from 'lodash-es';
import { LesitemType } from '../../../../core/models/studiewijzers/shared.model';
import {
    LesmomentDag,
    QueriedWerkdrukLeerlingen,
    QueriedWerkdrukLesgroepen,
    QueriedWerkdrukStudiewijzerItem,
    WerkdrukMetric,
    WerkdrukMetricSelectie
} from '../../../../core/models/werkdruk.model';
import { PopupService } from '../../../../core/popup/popup.service';
import { HorizontalOffset } from '../../../../core/popup/popup.settings';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { StudiewijzeritemToevoegenPopupComponent } from '../../../../shared-studiewijzer-les/studiewijzeritem-toevoegen-popup/studiewijzeritem-toevoegen-popup.component';
import { LesmomentSelectiePopupComponent } from '../../../../shared/components/lesmoment-selectie-popup/lesmoment-selectie-popup.component';
import { WerkdrukMetricHeightPipe } from '../../../../shared/pipes/werkdruk-metric-height.pipe';
import { SelecteerSjabloonContentSidebarComponent } from '../../../../studiewijzers/selecteer-sjabloon-content-sidebar/selecteer-sjabloon-content-sidebar.component';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { getVolledigeNaam } from '../../../pipes/volledige-naam.pipe';
import { Optional } from '../../../utils/utils';
import { werkdrukFilterType } from '../../../utils/werkdruk.utils';
import { BackgroundIconComponent } from '../../background-icon/background-icon.component';

@Component({
    selector: 'dt-werkdruk-metric',
    templateUrl: './werkdruk-metric.component.html',
    styleUrls: ['./werkdruk-metric.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [fadeInUpOnEnterAnimation({ duration: 300 })],
    standalone: true,
    imports: [TooltipDirective, BackgroundIconComponent, DtDatePipe, WerkdrukMetricHeightPipe, IconDirective],
    providers: [provideIcons(IconToevoegen)]
})
export class WerkdrukMetricComponent implements OnChanges {
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('itemToevoegen', { read: ViewContainerRef }) itemToevoegenRef: ViewContainerRef;

    @Input() metric: WerkdrukMetric;
    @Input() metricSelectie: Optional<WerkdrukMetricSelectie>;
    @Input() leerlingen: QueriedWerkdrukLeerlingen;
    @Input() lesmomentDag: LesmomentDag | undefined;
    @Input() weeknummer: number;
    @Input() showUitSjabloonOptie = false;
    @Input() showInleveropdrachtOptie = false;
    @Input() filteredLeerlingen: PartialLeerlingFragment[];
    @Input() filteredGroepen: QueriedWerkdrukLesgroepen;
    @Input() peildatum: Date;
    @Input() @HostBinding('class.show-additem') showAddItem = true;
    @Input() exacteLesgroepenMatch = true;

    @HostBinding('class.week') @Input() isWeek = false;
    @HostBinding('class.loading') isLoading = false;
    @HostBinding('@.disabled') animationsDisabled = false;

    typeSelected = output<WerkdrukMetricSelectie>();

    huiswerkType = HuiswerkType;
    huiswerkMetrics: QueriedWerkdrukStudiewijzerItem[] = [];
    groteToetsMetrics: QueriedWerkdrukStudiewijzerItem[] = [];
    toetsMetrics: QueriedWerkdrukStudiewijzerItem[] = [];
    inleveropdrachtenMetrics: QueriedWerkdrukStudiewijzerItem[] = [];
    isVandaag = false;
    heeftLesmoment = false;
    heeftRoosterToets = false;
    notificatiesTooltip = '';
    addItemPopupOpen = false;
    addItemDisabled = false;
    tooltipContent = (type: string, metrics: QueriedWerkdrukStudiewijzerItem[], leerlingen: QueriedWerkdrukLeerlingen) =>
        memoize(() => {
            const countedMetrics = countBy(
                metrics.flatMap((wswi) => wswi.leerlingUuids),
                identity
            );
            const leerlinguuids = Object.keys(countedMetrics);
            const aantallen = Object.values(countedMetrics);
            const gem = Math.round(sum(aantallen) / leerlinguuids.length);
            const maxLeerling =
                leerlingen?.find((l) => l.uuid === maxBy(leerlinguuids, (uuid) => countedMetrics[uuid])) ?? ({} as Leerling);
            const minLeerling =
                leerlingen?.find((l) => l.uuid === minBy(leerlinguuids, (uuid) => countedMetrics[uuid])) ?? ({} as Leerling);
            const maxAantal = countedMetrics[maxLeerling.uuid];
            const minAantal = countedMetrics[minLeerling.uuid];
            const isGelijkeVerdeling = aantallen.every((x) => x === maxAantal);
            const maxPlusAantalLeerlingen = aantallen.filter((x) => x === maxAantal).length - 1;
            const minPlusAantalLeerlingen = aantallen.filter((x) => x === minAantal).length - 1;
            const maxAnderen = maxPlusAantalLeerlingen > 0 ? ` (+${maxPlusAantalLeerlingen} lln)` : '';
            const minAnderen = minPlusAantalLeerlingen > 0 ? ` (+${minPlusAantalLeerlingen} lln)` : '';

            const gemiddelde = `<span class="text-content-semi">${type}</span><br>
            <span>Gemiddelde: ${gem} item(s)</span> <br>`;
            const minmax = `<span>Max: ${getVolledigeNaam(maxLeerling)}${maxAnderen}, ${maxAantal} item(s)</span> <br>
            <span>Min: ${getVolledigeNaam(minLeerling)}${minAnderen}, ${minAantal} item(s)</span> <br>`;

            return isGelijkeVerdeling ? gemiddelde : gemiddelde + minmax;
        });

    private generateNotificatieTooltip(): string {
        const classifiers = [];
        if (this.isVandaag) {
            classifiers.push('Vandaag');
        }
        if (this.heeftLesmoment) {
            classifiers.push(this.heeftRoosterToets ? 'Roostertoets' : 'Lesmoment');
        }
        return join(classifiers, ', ');
    }

    ngOnChanges() {
        this.isLoading = this.metric.loading ?? false;
        this.animationsDisabled = this.metric.loading ?? false;
        this.huiswerkMetrics = this.metric.items.filter(werkdrukFilterType('Huiswerk'));
        this.groteToetsMetrics = this.metric.items.filter(werkdrukFilterType('Grote toets'));
        this.toetsMetrics = this.metric.items.filter(werkdrukFilterType('Toets'));
        this.inleveropdrachtenMetrics = this.metric.items.filter(werkdrukFilterType('Inleveropdracht'));
        this.isVandaag = this.metric.datum ? isSameDay(this.metric.datum, new Date()) : false;
        this.addItemDisabled = this.isWeek
            ? this.isPastWeek(this.peildatum)
            : differenceInCalendarDays(this.metric.datum ?? new Date(), new Date()) < 0;
        this.heeftLesmoment = !!this.lesmomentDag?.lesmomenten?.length && this.lesmomentDag?.lesmomenten?.length > 0;
        this.heeftRoosterToets = this.lesmomentDag?.lesmomenten.some((lesmoment) => lesmoment.isRoosterToets) ?? false;
        this.notificatiesTooltip = this.generateNotificatieTooltip();
    }

    isPastWeek = (date: Date) => !isSameWeek(date, new Date()) && isPast(date);

    select(type: LesitemType) {
        if (!this.isLoading) {
            this.typeSelected.emit({
                metric: this.metric,
                type
            });
        }
    }

    addLesmoment() {
        if (this.addItemDisabled) {
            return;
        }

        this.addItemPopupOpen = true;

        const onHeleDagClick = (selectedDag: Date) => {
            this.addItemPopupOpen = true;
            const popup = this.openStudiewijzerItemPopup();
            popup.dag = selectedDag;
            const swDag = { dag: selectedDag } as StudiewijzerDag;
            popup.onSjabloonClick = this.showUitSjabloonOptie
                ? () => this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, { studiewijzerContent: swDag })
                : null;
            this.changeDetector.detectChanges();
        };

        if (this.isWeek) {
            const popup = this.openStudiewijzerItemPopup();
            popup.week = this.weeknummer;
            const swWeek = { weeknummer: this.weeknummer } as StudiewijzerWeek;
            popup.onSjabloonClick = this.showUitSjabloonOptie
                ? () => this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, { studiewijzerContent: swWeek })
                : null;
            this.changeDetector.detectChanges();
        } else {
            if (this.lesmomentDag!.lesmomenten.length === 0) {
                onHeleDagClick(this.lesmomentDag!.datum);
            } else {
                const lesmomentPopupSettings = LesmomentSelectiePopupComponent.defaultPopupSettings;
                lesmomentPopupSettings.onCloseFunction = () => {
                    this.addItemPopupOpen = false;
                    this.changeDetector.detectChanges();
                };
                const popup = this.popupService.popup(this.itemToevoegenRef, lesmomentPopupSettings, LesmomentSelectiePopupComponent);
                popup.afspraken = this.lesmomentDag!.lesmomenten;
                popup.showHeleDagOptie = true;
                popup.dag = this.lesmomentDag!.datum;
                popup.closeOnSelection = false;

                popup.onAfspraakSelection = (selectedAfspraak) => {
                    const popup = this.openStudiewijzerItemPopup();
                    this.addItemPopupOpen = true;
                    popup.afspraak = selectedAfspraak as Afspraak;
                    const swAfspraak = { afspraak: selectedAfspraak } as StudiewijzerAfspraak;
                    popup.onSjabloonClick = this.showUitSjabloonOptie
                        ? () =>
                              this.sidebarService.openSidebar(SelecteerSjabloonContentSidebarComponent, { studiewijzerContent: swAfspraak })
                        : null;

                    this.changeDetector.detectChanges();
                };
                popup.onHeleDagSelection = onHeleDagClick;
            }
        }
    }

    private openStudiewijzerItemPopup(): StudiewijzeritemToevoegenPopupComponent {
        const swiToevoegenPopupSettings = StudiewijzeritemToevoegenPopupComponent.defaultPopupSettings;
        swiToevoegenPopupSettings.onCloseFunction = () => {
            this.addItemPopupOpen = false;
            this.changeDetector.detectChanges();
        };
        swiToevoegenPopupSettings.horizontalEdgeOffset = 0;
        swiToevoegenPopupSettings.horizontalOffset = HorizontalOffset.Center;
        const popup = this.popupService.popup(this.itemToevoegenRef, swiToevoegenPopupSettings, StudiewijzeritemToevoegenPopupComponent);
        popup.heeftToegangTotElo = true;
        popup.hoogsteSortering = 0;
        popup.showUitMethode = false;
        popup.showInleveropdracht = this.showInleveropdrachtOptie;
        popup.differentiatieLeerlingen = this.filteredLeerlingen;
        popup.differentiatieGroepen = this.filteredGroepen
            .map((werkdifGroep) => werkdifGroep.differentiatiegroepen)
            .flatMap((x) => x) as Differentiatiegroep[];
        popup.toonLesgroepControls = !this.exacteLesgroepenMatch && popup.afspraak?.lesgroepen.length > 1;

        return popup;
    }
}
