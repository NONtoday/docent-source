import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import {
    IconHuiswerk,
    IconInleveropdracht,
    IconLesstof,
    IconMethode,
    IconSjabloon,
    IconStudiewijzer,
    IconToets,
    IconToetsGroot,
    provideIcons
} from 'harmony-icons';
import { partial } from 'lodash-es';
import { Observable } from 'rxjs';
import { Afspraak, Differentiatiegroep, HuiswerkType, Leerling, PartialLeerlingFragment, Toekenning } from '../../../generated/_types';
import { Appearance, HorizontalOffset, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { HuiswerkTypeIconPipe } from '../../rooster-shared/pipes/huiswerk-type-icon.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import {
    createAfspraakToekenning,
    createConceptInleveropdrachtToekenning,
    createDagToekenning,
    createInleveropdrachtToekenning,
    createWeekToekenning
} from '../../shared/utils/toekenning.utils';
import { MethodeSidebarComponent } from '../../studiewijzers/methode-sidebar/methode-sidebar.component';

@Component({
    selector: 'dt-studiewijzeritem-toevoegen-popup',
    templateUrl: './studiewijzeritem-toevoegen-popup.component.html',
    styleUrls: ['./studiewijzeritem-toevoegen-popup.component.scss'],
    providers: [
        HuiswerkTypeIconPipe,
        provideIcons(IconHuiswerk, IconToets, IconToetsGroot, IconLesstof, IconInleveropdracht, IconStudiewijzer, IconMethode, IconSjabloon)
    ],
    standalone: true,
    imports: [PopupComponent, AsyncPipe, IconDirective, PopupButtonComponent]
})
export class StudiewijzeritemToevoegenPopupComponent implements OnInit, Popup {
    private sidebarService = inject(SidebarService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public week: number;
    public dag: Date;
    public hoogsteSortering: number;
    public showInleveropdracht = true;
    public showUitMethode = true;
    public afspraak: Afspraak;
    public heeftToegangTotElo: boolean;
    public inSjabloon: boolean;
    public huiswerkType = HuiswerkType;
    public differentiatieLeerlingen: PartialLeerlingFragment[];
    public differentiatieGroepen: Differentiatiegroep[];
    public onStudiewijzerClick: Optional<() => void>;
    public onSjabloonClick: Optional<() => void>;
    public kanToevoegenUitMethode$: Observable<boolean>;
    public toonLesgroepControls = false;

    ngOnInit() {
        this.kanToevoegenUitMethode$ = this.medewerkerDataService.importUitMethodeToegestaan();
    }

    addSwi(hwType: HuiswerkType, inleveropdracht = false) {
        let toekenning: Toekenning;

        if (inleveropdracht) {
            toekenning = this.inSjabloon
                ? createConceptInleveropdrachtToekenning(this.week, this.hoogsteSortering)
                : createInleveropdrachtToekenning(this.dag ?? this.afspraak.begin, this.hoogsteSortering);
        } else if (this.week) {
            toekenning = createWeekToekenning(this.week, this.hoogsteSortering, hwType);
        } else if (this.dag) {
            toekenning = createDagToekenning(this.dag, this.hoogsteSortering, hwType);
        } else if (this.afspraak) {
            toekenning = createAfspraakToekenning(this.afspraak.begin, this.hoogsteSortering, hwType);
        } else {
            return;
        }

        if (this.differentiatieLeerlingen) {
            toekenning.differentiatieleerlingen = this.differentiatieLeerlingen as Leerling[];
        }
        if (this.differentiatieGroepen) {
            toekenning.differentiatiegroepen = this.differentiatieGroepen;
        }

        this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
            toekenning,
            afspraak: this.afspraak,
            openInEditMode: true,
            toonLesgroepenControls: this.toonLesgroepControls
        });
        this.popup.onClose();
    }

    openStudiewijzerSelectie() {
        this.onStudiewijzerClick?.();
        this.popup.onClose();
    }

    openSjabloonSelectie() {
        this.onSjabloonClick?.();
        this.popup.onClose();
    }

    openMethodeInhoudSelectieSidebar() {
        let createToekenningFn: (type: HuiswerkType) => Toekenning;

        if (this.week) {
            createToekenningFn = partial(createWeekToekenning, this.week, this.hoogsteSortering);
        } else if (this.dag) {
            createToekenningFn = partial(createDagToekenning, this.dag ?? this.afspraak.begin, this.hoogsteSortering);
        } else if (this.afspraak) {
            createToekenningFn = partial(createAfspraakToekenning, this.afspraak.begin, this.hoogsteSortering);
        } else {
            return;
        }

        this.sidebarService.openSidebar(MethodeSidebarComponent, { createToekenningFn });
        this.popup.onClose();
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings(): PopupSettings {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.width = 232;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.horizontalOffset = HorizontalOffset.Left;
        popupSettings.horizontalEdgeOffset = 16;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Right, PopupDirection.Left, PopupDirection.Top];

        return popupSettings;
    }
}
