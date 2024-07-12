import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { BrowseComponent, SpinnerComponent, TabInput, TabRowComponent } from 'harmony';
import { derivedAsync } from 'ngxtension/derived-async';
import { GemistResultaat, LeerlingoverzichtVakSamenvattingResponse, Vak, VakToetsTrend } from '../../../../generated/_types';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../../rooster-shared/utils/utils';
import { docentPendingQuery } from '../../../shared/utils/apollo.utils';
import { LeerlingoverzichtDataService, leerlingoverzichtVakSamenvattingDefault } from '../leerlingoverzicht-data.service';
import { LeerlingoverzichtVakAlleResultatenComponent } from './leerlingoverzicht-vak-alle-resultaten/leerlingoverzicht-vak-alle-resultaten.component';
import { LeerlingoverzichtVakAlleSeResultatenComponent } from './leerlingoverzicht-vak-alle-se-resultaten/leerlingoverzicht-vak-alle-se-resultaten.component';
import { LeerlingoverzichtVakSamenvattingRegistratiesComponent } from './leerlingoverzicht-vak-samenvatting-registraties/leerlingoverzicht-vak-samenvatting-registraties.component';
import { LeerlingoverzichtVakSamenvattingResultatenComponent } from './leerlingoverzicht-vak-samenvatting-resultaten/leerlingoverzicht-vak-samenvatting-resultaten.component';
import { RapportvergaderingNotitieComponent } from './rapportvergadering-notitie/rapportvergadering-notitie.component';

@Component({
    selector: 'dt-leerlingoverzicht-vak-samenvatting-sidebar',
    standalone: true,
    imports: [
        BrowseComponent,
        SidebarComponent,
        TabRowComponent,
        LeerlingoverzichtVakSamenvattingResultatenComponent,
        LeerlingoverzichtVakAlleResultatenComponent,
        LeerlingoverzichtVakAlleSeResultatenComponent,
        RapportvergaderingNotitieComponent,
        SpinnerComponent,
        LeerlingoverzichtVakSamenvattingRegistratiesComponent
    ],
    templateUrl: './leerlingoverzicht-vak-samenvatting-sidebar.component.html',
    styleUrls: ['./leerlingoverzicht-vak-samenvatting-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtVakSamenvattingSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    leerlingoverzichtDataService = inject(LeerlingoverzichtDataService);

    data: LeerlingoverzichtVakSamenvattingSidebarData;
    @Input({ required: true, alias: 'data' }) set _data(data: LeerlingoverzichtVakSamenvattingSidebarData) {
        this.data = data;
        this.selectedPeriode.set(data.selectedPeriode);
    }

    // Huidige periode is het laatste element in de periodes array.
    isActuelePeriode = computed(() => this.data.actuelePeriode === this.selectedPeriode());
    heeftVolgendePeriode = computed(() => this.data.periodes.indexOf(this.selectedPeriode()) < this.data.periodes.length - 1);
    heeftVorigePeriode = computed(() => this.data.periodes.indexOf(this.selectedPeriode()) > 0);
    selectedPeriode = signal(1);

    activeTab = signal<SidebarTabLabel>('Samenvatting');
    tabs: readonly TabInput[];

    vakSamenvatting = derivedAsync(
        () =>
            this.leerlingoverzichtDataService.leerlingoverzichtVakSamenvatting(
                this.data.leerlingId,
                this.data.vak.id,
                this.selectedPeriode(),
                this.data.isExamen
            ),
        { initialValue: docentPendingQuery(leerlingoverzichtVakSamenvattingDefault) }
    );

    resultaten = computed(() => (<LeerlingoverzichtVakSamenvattingResponse>this.vakSamenvatting().data).resultaten);

    ngOnInit(): void {
        this.tabs = this.data.isExamen ? SidebarExamenTabs : SidebarTabs;
    }

    asTabLabel(value: string): SidebarTabLabel {
        return value as SidebarTabLabel;
    }

    changeTab(label: SidebarTabLabel) {
        this.activeTab.set(label);
    }

    volgendePeriode() {
        if (this.heeftVolgendePeriode()) this.selectedPeriode.set(this.selectedPeriode() + 1);
    }

    vorigePeriode() {
        if (this.heeftVorigePeriode()) this.selectedPeriode.set(this.selectedPeriode() - 1);
    }
}

const samenvattingTab = {
    label: 'Samenvatting' as const,
    additionalAttributes: { 'data-gtm': 'leerlingoverzicht-vak-sidebar-samenvatting' }
};
const alleResultatenTab = {
    label: 'Alle resultaten' as const,
    additionalAttributes: { 'data-gtm': 'leerlingoverzicht-vak-sidebar-alle-resultaten' }
};
const alleSEResultatenTab = {
    label: 'Alle SE resultaten' as const,
    additionalAttributes: { 'data-gtm': 'leerlingoverzicht-vak-sidebar-alle-se-resultaten' }
};
const SidebarTabs = [samenvattingTab, alleResultatenTab] as const satisfies readonly TabInput[];
const SidebarExamenTabs = [samenvattingTab, alleSEResultatenTab] as const satisfies readonly TabInput[];
type SidebarTabLabel = 'Samenvatting' | 'Alle resultaten' | 'Alle SE resultaten';

interface LeerlingoverzichtVakSamenvattingSidebarDataBase {
    leerlingId: string;
    periodes: number[];
    actuelePeriode: number;
    selectedPeriode: number;
    trend: Optional<VakToetsTrend>;
    gemisteToetsen: GemistResultaat[];
    vak: Vak;
}

type LeerlingoverzichtVakResultatenSamenvattingSidebarData = LeerlingoverzichtVakSamenvattingSidebarDataBase & {
    isExamen: false;
};

type LeerlingoverzichtVakExamenSamenvattingSidebarData = LeerlingoverzichtVakSamenvattingSidebarDataBase & {
    isExamen: true;
    seResultaat: Optional<number>;
};
type LeerlingoverzichtVakSamenvattingSidebarData =
    | LeerlingoverzichtVakResultatenSamenvattingSidebarData
    | LeerlingoverzichtVakExamenSamenvattingSidebarData;
