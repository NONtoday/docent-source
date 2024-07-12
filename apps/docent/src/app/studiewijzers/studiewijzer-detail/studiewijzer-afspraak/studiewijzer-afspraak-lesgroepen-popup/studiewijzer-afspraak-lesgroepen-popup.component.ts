import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getISOWeek } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconChevronRechts, IconGroep, provideIcons } from 'harmony-icons';
import { sortBy } from 'lodash-es';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Afspraak, AfspraakToekenningenVoorLesgroepenQuery } from '../../../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { BackgroundIconComponent } from '../../../../rooster-shared/components/background-icon/background-icon.component';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { StudiewijzerDataService } from '../../../studiewijzer-data.service';
import { StudiewijzeritemComponent } from '../../../studiewijzeritem/studiewijzeritem.component';

@Component({
    selector: 'dt-studiewijzer-afspraak-lesgroepen-popup',
    templateUrl: './studiewijzer-afspraak-lesgroepen-popup.component.html',
    styleUrls: ['./studiewijzer-afspraak-lesgroepen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, TooltipDirective, BackgroundIconComponent, StudiewijzeritemComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconGroep, IconChevronRechts)]
})
export class StudiewijzerAfspraakLesgroepenPopupComponent implements OnInit, Popup {
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private router = inject(Router);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    // Inputs
    afspraak: Afspraak;
    lesgroepVanStudiewijzer: string;

    afspraakToekenningenVoorLesgroepen$: Observable<AfspraakToekenningenVoorLesgroepenQuery['afspraakToekenningenVoorLesgroepen']>;

    ngOnInit(): void {
        this.afspraakToekenningenVoorLesgroepen$ = this.studiewijzerDataService
            .getAfspraakToekenningenVoorLesgroepen(this.afspraak.id, this.lesgroepVanStudiewijzer)
            .pipe(map((afspraakLesgroepToekenningen) => sortBy(afspraakLesgroepToekenningen, ['studiewijzerId', 'lesgroep.naam'])));
    }

    navigeerNaarStudiewijzer(studiewijzerId: Optional<string>) {
        if (studiewijzerId) {
            // Intern redirecten om component reuse te voorkomen i.v.m. het correct scrollen van de pagina.
            const url = this.router.parseUrl(
                `/internal?url=${encodeURIComponent(`/studiewijzers/${studiewijzerId}?week=${getISOWeek(this.afspraak.begin)}`)}`
            );
            this.router.navigateByUrl(url, { skipLocationChange: true });
        }
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();
        popupSettings.width = 240;
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        return popupSettings;
    }
}
