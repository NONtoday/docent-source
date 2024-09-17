import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CijferPeriodeWeek } from '@docent/codegen';
import { getISOWeek } from 'date-fns';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconInformatie, IconReeks, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { VakantieComponent } from '../../../vakantie/vakantie.component';

@Component({
    selector: 'dt-week-selectie-popup',
    templateUrl: './week-selectie-popup.component.html',
    styleUrls: ['./week-selectie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, TooltipDirective, VakantieComponent, SpinnerComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconInformatie, IconReeks)]
})
export class WeekSelectiePopupComponent implements Popup, OnInit {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public cijferPeriodeWeken$: Observable<CijferPeriodeWeek[]>;
    public startweekSchooljaar$: Observable<Optional<number>>;
    public geselecteerdeWeek: number;

    selecteerWeek: (weeknummer: number) => void;

    public static getDefaultPopupsettings(isPhone: boolean) {
        const popupSettings = new PopupSettings();
        popupSettings.width = 340;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Popout,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Top];

        if (isPhone) {
            popupSettings.width = 280;
        } else {
            popupSettings.headerIcon = 'reeks';
        }

        return popupSettings;
    }

    ngOnInit() {
        this.startweekSchooljaar$ = this.cijferPeriodeWeken$.pipe(map((weken) => weken.find((week) => !week.vakantienaam)?.weeknummer));
    }

    onSelecteerWeek(weeknummer: number) {
        this.popup.onClose();
        this.selecteerWeek(weeknummer);
    }

    mayClose(): boolean {
        return true;
    }

    isEersteWeekVanPeriode(week: CijferPeriodeWeek) {
        return week.periode && week.weeknummer === getISOWeek(week.periode.begin!);
    }
}
