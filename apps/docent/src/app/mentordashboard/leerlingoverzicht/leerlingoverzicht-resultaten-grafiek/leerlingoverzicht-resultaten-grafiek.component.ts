import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { BrowseComponent, HorizontalScrollButtonsDirective, IconDirective, SettingButtonComponent, TooltipDirective } from 'harmony';
import { IconChevronLinks, IconChevronRechts, IconInformatie, IconVergelijk, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { Resultatensoort } from '../../mentordashboard.utils';
import {
    LeerlingoverzichtResultatenVakGrafiekData,
    LeerlingoverzichtResultatenVakGrafiekHeader,
    VergelijkingOptie
} from '../leerlingoverzicht.model';
import { LeerlingoverzichtResultatenGrafiekHeaderGemiddeldeComponent } from './../leerlingoverzicht-resultaten-grafiek-header-gemiddelde/leerlingoverzicht-resultaten-grafiek-header-gemiddelde.component';
import { LeerlingoverzichtResultatenVakGrafiekenComponent } from './../leerlingoverzicht-resultaten-vak-grafieken/leerlingoverzicht-resultaten-vak-grafieken.component';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten-grafiek',
    standalone: true,
    imports: [
        BackgroundIconComponent,
        LeerlingoverzichtResultatenVakGrafiekenComponent,
        LeerlingoverzichtResultatenGrafiekHeaderGemiddeldeComponent,
        BrowseComponent,
        SettingButtonComponent,
        TooltipDirective,
        IconDirective,
        HorizontalScrollButtonsDirective
    ],
    templateUrl: './leerlingoverzicht-resultaten-grafiek.component.html',
    styleUrls: ['./leerlingoverzicht-resultaten-grafiek.component.scss'],
    providers: [provideIcons(IconChevronLinks, IconChevronRechts, IconVergelijk, IconInformatie)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenGrafiekComponent {
    public readonly vergelijkOpties: VergelijkingOptie[] = ['Stamgroep', 'Parallelklassen'];
    public readonly vergelijkDataGtm = this.vergelijkOpties.map((optie) => ({
        attribute: 'data-gtm',
        value: `leerlingoverzicht-vergelijk-${optie}`
    }));
    @Input({ required: true }) selectedTab: Resultatensoort;
    @Input({ required: true }) selectedPeriode: number;
    @Input({ required: true }) vakgrafieken: LeerlingoverzichtResultatenVakGrafiekData[];
    @Input({ required: true }) headers: LeerlingoverzichtResultatenVakGrafiekHeader[];
    @Input({ required: true }) heeftVorigePeriode: boolean;
    @Input({ required: true }) heeftVolgendePeriode: boolean;
    @Input({ required: true }) vergelijking: (typeof this.vergelijkOpties)[number] | undefined;
    @Input({ required: true }) vergelijkingTooltip: string | undefined;
    @Input({ required: true }) vergelijkingLoading: boolean;

    onVorigePeriode = output<void>();
    onVolgendePeriode = output<void>();
    openVakResultatenSidebar = output<LeerlingoverzichtResultatenVakGrafiekData>();
    onVergelijkOptie = output<VergelijkingOptie | undefined>();

    vorigePeriode() {
        if (this.heeftVorigePeriode) this.onVorigePeriode.emit();
    }

    volgendePeriode() {
        if (this.heeftVolgendePeriode) this.onVolgendePeriode.emit();
    }
}
