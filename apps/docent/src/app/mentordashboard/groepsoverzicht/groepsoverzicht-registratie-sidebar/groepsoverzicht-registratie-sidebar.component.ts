import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { MaatregeltoekenningenQuery } from '@docent/codegen';
import { SpinnerComponent, TabInput, TabRowComponent, createNotificationCounterTab } from 'harmony';
import { IconLoader, provideIcons } from 'harmony-icons';
import { Observable, map, startWith } from 'rxjs';
import { MentordashboardOverzichtLeerlingRegistratieWithContent } from '../../../core/models/mentordashboard.model';
import { MaatregelToekenningDataService, MaatregelToekenningenMetStatus } from '../../../core/services/maatregeltoekenning-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';
import { MaatregelenLijstComponent } from '../../maatregelen-lijst/maatregelen-lijst.component';
import { MentordashboardOverzichtSidebarRegistratiedetailsComponent } from '../../mentordashboard-overzicht-sidebar-registratiedetails/mentordashboard-overzicht-sidebar-registratiedetails.component';

@Component({
    selector: 'dt-groepsoverzicht-registratie-sidebar',
    standalone: true,
    imports: [
        SidebarComponent,
        VolledigeNaamPipe,
        SpinnerComponent,
        TabRowComponent,
        MentordashboardOverzichtSidebarRegistratiedetailsComponent,
        MaatregelenLijstComponent,
        AsyncPipe
    ],
    templateUrl: './groepsoverzicht-registratie-sidebar.component.html',
    styleUrls: ['./groepsoverzicht-registratie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconLoader)]
})
export class GroepsoverzichtRegistratieSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private maatregelToekenningDataService = inject(MaatregelToekenningDataService);
    @Input() titel: Optional<string>;
    @Input({ required: true }) leerlingRegistratie: MentordashboardOverzichtLeerlingRegistratieWithContent;

    tabs$: Observable<TabInput[]>;
    activeTab = 'Registraties';
    maatregelToekenningen$: Observable<MaatregelToekenningenMetStatus>;

    ngOnInit() {
        this.maatregelToekenningen$ = this.maatregelToekenningDataService.getMaatregeltoekenningenMetStatus(
            this.leerlingRegistratie.leerlingId
        );
        this.tabs$ = this.maatregelToekenningen$.pipe(
            map(({ actief }) => this.createTabsWithCounter(actief)),
            startWith(defaultTabs)
        );
    }

    private createTabsWithCounter(actieveMaatregelen: MaatregeltoekenningenQuery['maatregeltoekenningen']): TabInput[] {
        // Gebruik de default tabs als basis
        return [
            defaultTabs[0],
            {
                // Voeg een counter notification toe aan deze tab als er 1 of meer actieve maatregelen zijn.
                ...defaultTabs[1],
                notification: actieveMaatregelen?.length
                    ? createNotificationCounterTab({ count: actieveMaatregelen.length, color: 'warning' })
                    : undefined
            }
        ];
    }

    onActiveTabChange(tabLabel: string) {
        this.activeTab = tabLabel;
    }
}

const defaultTabs: TabInput[] = [
    { label: 'Registraties', additionalAttributes: { 'data-gtm': 'groepsoverzicht-sidebar-registratiedetails-registraties' } },
    { label: 'Maatregelen', additionalAttributes: { 'data-gtm': 'groepsoverzicht-sidebar-registratiedetails-maatregelen' } }
];
