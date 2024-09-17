import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { addDays, addWeeks, getDate, getISOWeek, getMonth, getYear, startOfWeek, subWeeks } from 'date-fns';
import { IconDirective, SpinnerComponent, SwitchComponent, SwitchGroupComponent } from 'harmony';

import { Lesgroep } from '@docent/codegen';
import {
    IconChevronLinks,
    IconChevronRechts,
    IconKalenderDag,
    IconOpties,
    IconRijTonen,
    IconRijVerbergen,
    IconTaart,
    IconUitklappenLinks,
    IconUitklappenRechts,
    IconWerkdruk,
    provideIcons
} from 'harmony-icons';
import { Observable } from 'rxjs';
import { PopupService } from '../../core/popup/popup.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { LesgroepenVanDocentPopupComponent } from '../../rooster-shared/components/lesgroepen-van-docent-popup/lesgroepen-van-docent-popup.component';
import { LinkComponent } from '../../rooster-shared/components/link/link.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { RoosterDataService } from '../rooster-data.service';
import { VerjaardagenPopupComponent } from '../verjaardagen-popup/verjaardagen-popup.component';

@Component({
    selector: 'dt-rooster-toolbar',
    templateUrl: './rooster-toolbar.component.html',
    styleUrls: ['./rooster-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        IconDirective,
        SwitchGroupComponent,
        SwitchComponent,
        BackgroundIconComponent,
        TooltipDirective,
        RouterLink,
        LinkComponent,
        SpinnerComponent,
        IconComponent,
        AsyncPipe,
        DtDatePipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconKalenderDag,
            IconChevronLinks,
            IconChevronRechts,
            IconOpties,
            IconTaart,
            IconWerkdruk,
            IconRijVerbergen,
            IconRijTonen,
            IconUitklappenRechts,
            IconUitklappenLinks
        )
    ]
})
export class RoosterToolbarComponent {
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private roosterDataService = inject(RoosterDataService);
    @ViewChild('werkdrukIcon', { read: ViewContainerRef }) werkdrukIcon: ViewContainerRef;
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcons: ViewContainerRef;
    @ViewChild('jarigIcon', { read: ViewContainerRef }) jarigIcon: ViewContainerRef;

    @HostBinding('class.show-weekend') @Input() public showWeekend: boolean;
    @Input() date: Date;
    @Input() public loading: boolean;
    @Input() public dayViewMode: boolean;
    @Input() public toonVrijeUren: boolean;

    toggleWeekend = output<void>();
    toggleDayViewMode = output<boolean>();
    toggleVrijeUren = output<void>();

    aantalVerjaardagen$: Observable<number>;

    public animating = false;

    constructor() {
        this.aantalVerjaardagen$ = this.roosterDataService.aantalVerjaardagenVandaag();
    }

    path(date: Date): string {
        return `/rooster/${getYear(date)}/${getMonth(date) + 1}/${getDate(date)}`;
    }

    setWeekViewMode(mode: boolean) {
        this.toggleDayViewMode.emit(mode);
    }

    onWeekendClick() {
        this.toggleWeekend.emit();
    }

    onVrijeUrenClick() {
        this.toggleVrijeUren.emit();
    }

    animationStarted() {
        this.animating = true;
    }
    animationEnded() {
        this.animating = false;
    }

    openMoreOptions() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;

        const popup = this.popupService.popup(this.moreOptionsIcons, popupSettings, ActionsPopupComponent);
        const vrijeUrenAction: ActionButton = {
            icon: this.toonVrijeUren ? 'rijVerbergen' : 'rijTonen',
            color: this.toonVrijeUren ? 'negative' : 'primary',
            text: this.toonVrijeUren ? 'Verberg vrije uren' : 'Toon vrije uren',
            onClickFn: () => {
                this.popupService.closePopUp();
                this.onVrijeUrenClick();
            },
            gtmTag: this.toonVrijeUren ? 'verberg-vrije-uren' : 'toon-vrije-uren'
        };
        const werkdrukAction: ActionButton = {
            icon: 'werkdruk',
            color: 'primary',
            text: 'Toon werkdruk',
            onClickFn: () => {
                this.popupService.closePopUp(true);
                this.openWerkdruk();
            }
        };

        const isJarigAction: ActionButton = {
            icon: 'taart',
            color: 'primary',
            text: 'Jarige leerlingen',
            onClickFn: () => {
                this.popupService.closePopUp(true);
                this.openJarigPopup();
            },
            notificationCount: this.aantalVerjaardagen$
        };

        popup.customButtons = [vrijeUrenAction, werkdrukAction, isJarigAction];
    }

    openWerkdruk() {
        const popup = this.popupService.popup(
            this.werkdrukIcon,
            LesgroepenVanDocentPopupComponent.defaultPopupSettings,
            LesgroepenVanDocentPopupComponent
        );

        popup.onLesgroep = (lesgroep: Lesgroep, alleLesgroepen: Lesgroep[]) => {
            this.popupService.closePopUp();
            const schooljaar = getSchooljaar(this.date);

            // Lazy load de werkdruksidebar, zodat die niet mee komt in de main bundle
            // De comment in de import is om de chunck een duidelijkere naam te geven ipv een auto gegenereerde naam.
            import(
                /* webpackChunkName: 'WerkdrukSidebar' */ '../../rooster-shared/components/werkdruk/werkdruk-sidebar/werkdruk-sidebar.component'
            ).then(({ WerkdrukSidebarComponent }) => {
                this.sidebarService.openSidebar(WerkdrukSidebarComponent, {
                    lesgroepen: alleLesgroepen,
                    initielePeildatum: this.date,
                    eersteWeek: getISOWeek(schooljaar.start) + 1,
                    laatsteWeek: getISOWeek(schooljaar.eind),
                    initieleLeerlingenContext: [],
                    initieleLesgroepenContext: [lesgroep],
                    showRooster: true
                });
            });
        };
    }

    openJarigPopup() {
        const popupSettings = VerjaardagenPopupComponent.defaultPopupSettings;
        this.popupService.popup(this.jarigIcon, popupSettings, VerjaardagenPopupComponent);
    }

    get datumHuidigeWeek(): Date {
        if (getISOWeek(new Date()) === 1) {
            return addDays(startOfWeek(new Date()), 5);
        }

        return new Date();
    }

    get vorigeWeek(): Date {
        if (getISOWeek(subWeeks(this.date, 1)) === 1) {
            return subWeeks(addDays(startOfWeek(this.date), 5), 1);
        }

        return subWeeks(this.date, 1);
    }

    get volgendeWeek(): Date {
        if (getISOWeek(addWeeks(this.date, 1)) === 1) {
            return addWeeks(addDays(startOfWeek(this.date), 5), 1);
        }

        return addWeeks(this.date, 1);
    }
    get dag(): number {
        return getDate(this.date);
    }
    get maand(): number {
        return getMonth(this.date) + 1;
    }
}
