import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconDownloaden, IconSamengesteldeToets, IconWeging, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { ImporteerbareResultatenVanLeerlingQuery, ResultaatkolomType } from '../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { OnvoldoendePipe } from '../pipes/onvoldoende.pipe';
import { ResultaatDataService } from '../resultaat-data.service';

type ImporteerbareResultaten = ImporteerbareResultatenVanLeerlingQuery['importeerbareResultatenVanLeerling'];
export type ImporteerbaarResultaat = ImporteerbareResultaten[number]['importeerbareResultaten'][number]['resultaat'];
export type ImporteerbaarResultaatLabel = ImporteerbaarResultaat['resultaatLabel'];

@Component({
    selector: 'dt-selecteer-resultaat-popup',
    templateUrl: './selecteer-resultaat-popup.component.html',
    styleUrls: ['./selecteer-resultaat-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, TooltipDirective, AsyncPipe, OnvoldoendePipe, IconDirective],
    providers: [provideIcons(IconDownloaden, IconSamengesteldeToets, IconWeging)]
})
export class SelecteerResultaatPopupComponent implements OnInit, Popup {
    private resultaatDataService = inject(ResultaatDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    leerlingUUID: string;
    lesgroepId: string;
    alternatiefNiveau: boolean;
    onResultaatClick: (resultaat: ImporteerbaarResultaat) => void;

    resultaatKolomType = ResultaatkolomType;
    resultaatProperty: string;
    resultaatLabelProperty: keyof ImporteerbaarResultaat;

    importeerbareResultaten$: Observable<ImporteerbareResultaten>;

    ngOnInit() {
        this.importeerbareResultaten$ = this.resultaatDataService.getImporteerbareResultatenVanLeerling(this.leerlingUUID, this.lesgroepId);
        this.resultaatProperty = this.alternatiefNiveau ? 'formattedResultaatAfwijkendNiveau' : 'formattedResultaat';
        this.resultaatLabelProperty = this.alternatiefNiveau ? 'resultaatLabelAfwijkendNiveau' : 'resultaatLabel';
    }

    mayClose(): boolean {
        return true;
    }

    heeftResultaatLabel = (resultaat: ImporteerbaarResultaat) => Boolean(resultaat[this.resultaatLabelProperty]);

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.showHeader = false;
        popupSettings.width = 320;
        popupSettings.preferedDirection = [PopupDirection.Right, PopupDirection.Left];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
