import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { getYear } from 'date-fns';
import { IconDirective, NotificationColor, TooltipDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import {
    LeerlingAfwezigheidsKolom,
    LeerlingoverzichtVakDetailRegistratie,
    LeerlingoverzichtVakDetailRegistratieWrapper,
    MentordashboardOverzichtRegistratieCategorie,
    Registratie
} from '../../../../../generated/_types';
import { getSchooljaar } from '../../../../rooster-shared/utils/date.utils';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { MentordashboardOverzichtSidebarVakRegistratieComponent } from '../../../mentordashboard-overzicht-sidebar-registratiedetails/mentordashboard-overzicht-sidebar-vak-registratie/mentordashboard-overzicht-sidebar-vak-registratie.component';
import { isVrijveldCategorie, vrijVeldNaam } from '../../../mentordashboard.utils';
import { registratieContent } from '../../leerlingoverzicht.model';

@Component({
    selector: 'dt-leerlingoverzicht-vak-samenvatting-registraties',
    standalone: true,
    imports: [MentordashboardOverzichtSidebarVakRegistratieComponent, IconDirective, TooltipDirective],
    templateUrl: './leerlingoverzicht-vak-samenvatting-registraties.component.html',
    styleUrls: ['./leerlingoverzicht-vak-samenvatting-registraties.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconInformatie)]
})
export class LeerlingoverzichtVakSamenvattingRegistratiesComponent {
    vakRegistraties = signal<VakDetailRegistratieContent[]>([]);
    voorHeleSchooljaarText = signal<string | null>(null);

    @Input({ required: true }) isExamen: boolean;

    @Input({ required: true, alias: 'registratieWrapper' }) set _registratieWrapper(wrapper: LeerlingoverzichtVakDetailRegistratieWrapper) {
        this.vakRegistraties.set(
            wrapper.vakDetailRegistraties
                .filter((vakDetailRegistratie) => vakDetailRegistratie.registraties.length > 0)
                .map((vakDetailRegistratie) => ({
                    aantalLesmomenten: wrapper.aantalLesmomenten,
                    isAfwezigheidsCategorie: this.isAfwezigheidsCategorie(vakDetailRegistratie),
                    notificationColor: this.getCategorieColor(vakDetailRegistratie),
                    registraties: vakDetailRegistratie.registraties,
                    totaalMinuten: vakDetailRegistratie.totaalMinuten,
                    trend: vakDetailRegistratie.trend,
                    trendTooltip: this.createTrendTooltipText(vakDetailRegistratie.trend),
                    vakOfTitel: this.getCategorieNaam(vakDetailRegistratie)
                }))
        );

        if (wrapper.voorHeleSchooljaar) {
            const schooljaar = getSchooljaar(new Date());
            const voorHeleSchooljaarText = `${getYear(schooljaar.start)}/${getYear(schooljaar.eind)}`;
            this.voorHeleSchooljaarText.set(voorHeleSchooljaarText);
        } else {
            this.voorHeleSchooljaarText.set(null);
        }
    }

    createTrendTooltipText(trend: Optional<number>): Optional<string> {
        if (!trend) return null;
        return `<strong>${Math.abs(trend)} ${trend < 0 ? 'minder' : 'meer'}</strong> vergeleken met vorige periode`;
    }

    getCategorieColor({ categorie }: LeerlingoverzichtVakDetailRegistratie): NotificationColor {
        return registratieContent[this.getCategorieContentKey(categorie)].kleur;
    }

    getCategorieNaam({ categorie }: LeerlingoverzichtVakDetailRegistratie): string {
        return isVrijveldCategorie(categorie) ? vrijVeldNaam(categorie) : registratieContent[this.getCategorieContentKey(categorie)].naam;
    }

    isAfwezigheidsCategorie({ categorie }: LeerlingoverzichtVakDetailRegistratie): boolean {
        return isVrijveldCategorie(categorie) ? false : afwezigheidCategorieKolommen.includes(categorie.kolom);
    }

    private getCategorieContentKey(categorie: MentordashboardOverzichtRegistratieCategorie): keyof typeof registratieContent {
        return isVrijveldCategorie(categorie) ? 'VRIJ_VELD' : categorie.kolom;
    }
}

interface VakDetailRegistratieContent {
    aantalLesmomenten: Optional<number>;
    isAfwezigheidsCategorie: boolean;
    notificationColor: NotificationColor;
    registraties: Array<Registratie>;
    totaalMinuten: Optional<number>;
    trend: Optional<number>;
    trendTooltip: Optional<string>;
    vakOfTitel: string;
}

const afwezigheidCategorieKolommen: LeerlingAfwezigheidsKolom[] = [
    LeerlingAfwezigheidsKolom.GEOORLOOFD_AFWEZIG,
    LeerlingAfwezigheidsKolom.ONGEOORLOOFD_AFWEZIG
];
