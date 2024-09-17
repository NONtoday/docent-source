import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { LeerlingVerjaardagen } from '@docent/codegen';
import { BehaviorSubject, Observable } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { JarigeLeerlingComponent } from '../jarige-leerling/jarige-leerling.component';
import { RoosterDataService } from '../rooster-data.service';

type PeriodeTabs = 'dezeWeek' | 'volgendeWeek';

@Component({
    selector: 'dt-verjaardagen-popup',
    templateUrl: './verjaardagen-popup.component.html',
    styleUrls: ['./verjaardagen-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, JarigeLeerlingComponent, AsyncPipe]
})
export class VerjaardagenPopupComponent implements OnInit, Popup {
    private roosterDataService = inject(RoosterDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    activeTab$ = new BehaviorSubject<PeriodeTabs>('dezeWeek');
    verjaardagenDezeEnVolgendeWeek$: Observable<LeerlingVerjaardagen>;

    ngOnInit(): void {
        this.verjaardagenDezeEnVolgendeWeek$ = this.roosterDataService.verjaardagen();
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = true;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.width = 380;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
