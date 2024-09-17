import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { GeldendAdviesResultaat, GroepsoverzichtVakRapportResultaatTrend, MentordashboardResultatenInstellingen } from '@docent/codegen';
import { CssVarPipe, IconPillComponent, PillComponent, PillTagColor, TagComponent, TagIcon, TooltipDirective } from 'harmony';
import { IconChevronOnder, IconName, IconTrendBeneden, IconTrendBoven, provideIcons } from 'harmony-icons';
import { PopupOpenDirective } from '../../../../core/popup/popup-open.directive';
import { PopupService } from '../../../../core/popup/popup.service';
import { createTrendwaardePill } from '../../../mentordashboard.utils';
import { MentordashboardResultaatKleurPipe } from '../../../pipes/mentordashboard-resultaat-kleur.pipe';
import { GroepsoverzichtSidebarAdvieskolommenPopupComponent } from '../groepsoverzicht-sidebar-advieskolommen-popup/groepsoverzicht-sidebar-advieskolommen-popup.component';

@Component({
    selector: 'dt-groepsoverzicht-sidebar-vak-resultaat',
    standalone: true,
    imports: [
        IconPillComponent,
        TagComponent,
        CssVarPipe,
        PillComponent,
        PopupOpenDirective,
        MentordashboardResultaatKleurPipe,
        TooltipDirective
    ],
    templateUrl: './groepsoverzicht-sidebar-vak-resultaat.component.html',
    styleUrls: ['./groepsoverzicht-sidebar-vak-resultaat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronOnder, IconTrendBeneden, IconTrendBoven)]
})
export class GroepsoverzichtSidebarVakResultaatComponent implements OnChanges {
    @ViewChild('tag', { read: ViewContainerRef }) tagRef: ViewContainerRef;

    @Input({ required: true }) public instellingen: MentordashboardResultatenInstellingen;
    @Input({ required: true }) public resultaatTrend: GroepsoverzichtVakRapportResultaatTrend;

    trendwaardePill: TrendwaardePill;
    adviesTag: AdviesTag;

    private popupService = inject(PopupService);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.resultaatTrend) {
            this.trendwaardePill = createTrendwaardePill(
                this.resultaatTrend.trendindicatie,
                this.resultaatTrend.aantalResultatenVoorTrendindicatie,
                this.resultaatTrend.vak.naam
            );

            const aantalKolommen: number = this.resultaatTrend.advieskolommen.length;
            if (aantalKolommen === 1) {
                const adviesResultaat: GeldendAdviesResultaat = this.resultaatTrend.advieskolommen[0];
                this.adviesTag = {
                    text: `${adviesResultaat.adviesKolomAfkorting} • ${adviesResultaat.geldendResultaat.formattedResultaat}`,
                    icon: 'chevronOnder'
                };
            }
            if (aantalKolommen > 1) {
                this.adviesTag = {
                    text: `Advies (${aantalKolommen})`,
                    icon: 'chevronOnder'
                };
            }
        }
    }

    openAdviesKolommenPopup(resultaatTrend: GroepsoverzichtVakRapportResultaatTrend): void {
        if (this.popupService.isPopupOpenFor(this.tagRef)) {
            this.popupService.closePopUp();
            return;
        }
        const popup = this.popupService.popup(
            this.tagRef,
            GroepsoverzichtSidebarAdvieskolommenPopupComponent.defaultPopupSettings,
            GroepsoverzichtSidebarAdvieskolommenPopupComponent
        );
        popup.kolommen = resultaatTrend.advieskolommen;
        popup.vaknaam = resultaatTrend.vak.naam;
    }

    get resultaatText(): string {
        if (this.resultaatTrend.rapportCijferkolom) {
            return this.resultaatTrend.isAlternatieveNormering
                ? this.resultaatTrend.rapportCijferkolom.formattedResultaatAlternatief!
                : this.resultaatTrend.rapportCijferkolom.formattedResultaat!;
        }
        return '-';
    }
}

export interface TrendwaardePill {
    text: string;
    color: PillTagColor;
    icon?: IconName;
    tooltip: string;
}

interface AdviesTag {
    text: string;
    icon: TagIcon;
}
