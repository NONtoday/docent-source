import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { Subject } from 'rxjs';
import {
    ActueleNotitieItemsQuery,
    LesRegistratie,
    LesRegistratieQuery,
    PeriodeQuery,
    SignaleringenQuery
} from '../../../../generated/_types';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { NotitieAccordionComponent } from '../notitie-accordion/notitie-accordion.component';
import { SignaleringenComponent } from '../signaleringen/signaleringen.component';
import { VandaagAfwezigComponent } from '../vandaag-afwezig/vandaag-afwezig.component';

export enum infopanelsNavItem {
    AFWEZIGHEID = 'afwezigheid',
    SIGNALERINGEN = 'signaleringen',
    NOTITIES = 'notities'
}

@Component({
    selector: 'dt-infopanels-sidebar',
    templateUrl: './infopanels-sidebar.component.html',
    styleUrls: ['./infopanels-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, VandaagAfwezigComponent, SignaleringenComponent, NotitieAccordionComponent, AsyncPipe]
})
export class InfopanelsSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    public selectedNav$: Subject<infopanelsNavItem> = new Subject();

    @Input() titel: string;
    @Input() navItem: infopanelsNavItem;
    @Input() leerlingRegistraties: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'];
    @Input() vrijVeldDefinities: LesRegistratie['overigeVrijVeldDefinities'];
    @Input() signaleringen: SignaleringenQuery['signaleringen'];
    @Input() periode: PeriodeQuery['periode'];
    @Input() heeftNotitieboekToegang: boolean;
    @Input() actueleNotities: ActueleNotitieItemsQuery['actueleNotitieItems'];

    public readonly afwezigheidNav = infopanelsNavItem.AFWEZIGHEID;
    public readonly signaleringenNav = infopanelsNavItem.SIGNALERINGEN;
    public readonly notitiesNav = infopanelsNavItem.NOTITIES;

    public geenAfwezigen = false;

    ngOnInit(): void {
        setTimeout(() => this.selectedNav$.next(this.navItem));
        this.geenAfwezigen = this.leerlingRegistraties.every((registratie) => registratie.aanwezig);
    }

    closeSidebar(): void {
        this.sidebarService.closeSidebar();
    }
}
