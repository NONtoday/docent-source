import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';

import { AfspraakQuery, AfspraakToekenning, HuiswerkType, Toekenning } from '@docent/codegen';
import { ColorToken, IconDirective, IconPillComponent, PillComponent } from 'harmony';
import {
    IconBewerken,
    IconClockRadio,
    IconHuiswerk,
    IconInleveropdracht,
    IconLesstof,
    IconNietZichtbaar,
    IconOntkoppelen,
    IconOpgegeven,
    IconOpties,
    IconSynchroniseren,
    IconToets,
    IconVerwijderen,
    provideIcons
} from 'harmony-icons';
import { match } from 'ts-pattern';
import { PopupOpenDirective } from '../../../core/popup/popup-open.directive';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupDirection } from '../../../core/popup/popup.settings';
import { SidebarService } from '../../../core/services/sidebar.service';
import {
    ActionsPopupComponent,
    annulerenButton,
    bewerkButton,
    ontkoppelButton,
    verwijderButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { first, getHuiswerkTypeTitel } from '../../../rooster-shared/utils/utils';
import { StudiewijzeritemInhoudComponent } from '../../../shared/components/studiewijzeritem-inhoud/studiewijzeritem-inhoud.component';
import { StudiewijzeritemSidebarComponent } from '../../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { VerwijderPopupComponent } from '../../../shared/components/verwijder-popup/verwijder-popup.component';
import { getToekenningDatum } from '../../../shared/utils/toekenning.utils';

@Component({
    selector: 'dt-lesitem',
    templateUrl: './lesitem.component.html',
    styleUrls: ['./lesitem.component.scss', './../../../rooster-shared/scss/bullet.list.view.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TooltipDirective,
        PopupOpenDirective,
        IconComponent,
        StudiewijzeritemInhoudComponent,
        DtDatePipe,
        IconDirective,
        IconPillComponent,
        PillComponent
    ],
    providers: [
        provideIcons(
            IconNietZichtbaar,
            IconSynchroniseren,
            IconOpties,
            IconOntkoppelen,
            IconVerwijderen,
            IconBewerken,
            IconOpgegeven,
            IconClockRadio,
            IconToets,
            IconLesstof,
            IconHuiswerk,
            IconInleveropdracht
        )
    ]
})
export class LesitemComponent implements OnInit, OnChanges {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    public viewContainerRef = inject(ViewContainerRef);
    private sidebarService = inject(SidebarService);
    @ViewChild('moreOptionsIcon', { read: ViewContainerRef }) moreOptionsIconRef: ViewContainerRef;
    @ViewChild('deleteIcon', { read: ViewContainerRef }) deleteIconRef: ViewContainerRef;
    @ViewChild('ontkoppelIcon', { read: ViewContainerRef }) ontkoppelIconRef: ViewContainerRef;

    @Input() isToekomend: boolean;
    @Input() toekenning: Toekenning;
    @Input() afspraak: AfspraakQuery['afspraak'];
    @Input() heeftToegangTotDifferentiatie: boolean;

    verwijderToekenning = output<Toekenning>();
    ontkoppelToekenning = output<void>();
    verwijderAlleDiffLeerlingen = output<void>();
    verwijderDiffGroep = output<string>();
    verwijderDiffLeerling = output<string>();
    onDifferentiatieToekenning = output<void>();

    zichtbaarheid = true;
    huiswerkType = HuiswerkType;
    datumLabelContent: Date;
    titel: string;

    showDatumLabel: boolean;
    showLesgroepLabel: boolean;
    showTijdsindicatieLabel: boolean;
    heeftLabels: boolean;

    ngOnInit() {
        this.datumLabelContent = (<AfspraakToekenning>this.toekenning).afgerondOpDatumTijd;
    }

    ngOnChanges() {
        this.titel = first(this.toekenning.studiewijzeritem.onderwerp, getHuiswerkTypeTitel(this.toekenning.studiewijzeritem.huiswerkType));
        this.showDatumLabel = this.isToekomend;
        this.showLesgroepLabel = this.afspraak.lesgroepen.length > 1;
        this.showTijdsindicatieLabel = !!this.toekenning.studiewijzeritem.tijdsindicatie;
        this.heeftLabels = this.showDatumLabel || this.showLesgroepLabel || this.showTijdsindicatieLabel;
    }

    onDeleteClick() {
        const popupSettings = VerwijderPopupComponent.defaultPopupSettings;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(this.deleteIconRef, popupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = this.deleteClickedFn;
    }

    onEditClick() {
        this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning: this.toekenning, openInEditMode: true });
        this.changeDetector.markForCheck();
    }

    onOntkoppelClick() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 220;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(this.ontkoppelIconRef, settings, ActionsPopupComponent);
        popup.title = 'Weet je zeker dat je het lesitem wilt ontkoppelen?';
        popup.customButtons = [ontkoppelButton(() => this.ontkoppelToekenning.emit()), annulerenButton()];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    deleteClickedFn = () => {
        this.verwijderToekenning.emit(this.toekenning);
    };

    openActionsPopup() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 162;

        const onEdit = () =>
            this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, { toekenning: this.toekenning, openInEditMode: true });
        const customButtons = this.toekenning.synchroniseertMet ? [ontkoppelButton(() => this.ontkoppelToekenning.emit())] : [];
        const popup = this.popupService.popup(this.moreOptionsIconRef, popupSettings, ActionsPopupComponent);
        popup.customButtons = [...customButtons, bewerkButton(onEdit), verwijderButton(this.deleteClickedFn)];
        popup.onActionClicked = () => this.popupService.closePopUp();
        this.changeDetector.markForCheck();
    }

    getToekenningDatum(toekenning: Toekenning): Date | undefined {
        return getToekenningDatum(toekenning);
    }

    getHuiswerkIconColorToken(huiswerkType: HuiswerkType, heeftInleveropdracht?: boolean): ColorToken {
        if (heeftInleveropdracht) {
            return 'bg-alternative-normal';
        }
        return match<HuiswerkType, ColorToken>(huiswerkType)
            .with(HuiswerkType.HUISWERK, () => 'bg-primary-normal')
            .with(HuiswerkType.TOETS, () => 'bg-warning-normal')
            .with(HuiswerkType.GROTE_TOETS, () => 'bg-negative-normal')
            .with(HuiswerkType.LESSTOF, () => 'bg-positive-normal')
            .exhaustive();
    }
}
