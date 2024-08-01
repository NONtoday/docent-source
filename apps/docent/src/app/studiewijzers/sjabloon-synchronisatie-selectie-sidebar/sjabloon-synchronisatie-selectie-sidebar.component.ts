import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    QueryList,
    ViewChildren,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';

import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { IconDirective, PillComponent, SpinnerComponent, TooltipDirective } from 'harmony';
import {
    IconOntkoppelen,
    IconPijlLinks,
    IconReeks,
    IconSluiten,
    IconSynchroniseren,
    IconToevoegen,
    IconWaarschuwing,
    provideIcons
} from 'harmony-icons';
import { BehaviorSubject } from 'rxjs';
import {
    BasisSjabloonFieldsFragment,
    Sjabloon,
    Studiewijzer,
    StudiewijzerFieldsFragment,
    namedOperations
} from '../../../generated/_types';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { accent_positive_1 } from '../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { SjabloonSelectieComponent } from '../sjabloon-selectie/sjabloon-selectie.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { WeekSelectiePopupComponent } from '../studiewijzer-overzicht/edit-studiewijzer-sidebar/week-selectie-popup/week-selectie-popup.component';
import { StudiewijzerOntkoppelenPopupComponent } from '../studiewijzer-synchronisatie-selectie-sidebar/studiewijzer-ontkoppelen-popup/studiewijzer-ontkoppelen-popup.component';

export interface VestigingSchooljaar {
    vestigingId: string;
    schooljaar: number;
}

@Component({
    selector: 'dt-sjabloon-synchronisatie-selectie-sidebar',
    templateUrl: './sjabloon-synchronisatie-selectie-sidebar.component.html',
    styleUrls: ['./sjabloon-synchronisatie-selectie-sidebar.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        TooltipDirective,
        SpinnerComponent,
        IconComponent,
        BackgroundIconComponent,
        SjabloonSelectieComponent,
        OutlineButtonComponent,
        ButtonComponent,
        MessageComponent,
        AsyncPipe,
        KeyValuePipe,
        IconDirective,
        PillComponent
    ],
    providers: [provideIcons(IconPijlLinks, IconSynchroniseren, IconOntkoppelen, IconWaarschuwing, IconReeks, IconSluiten, IconToevoegen)]
})
export class SjabloonSynchronisatieSelectieSidebarComponent extends BaseSidebar implements OnInit, OnChanges {
    public sidebarService = inject(SidebarService);
    private deviceService = inject(DeviceService);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private sjabloonDataService = inject(SjabloonDataService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChildren('startweek', { read: ViewContainerRef }) weekSelectieButtons: QueryList<ViewContainerRef>;
    @ViewChildren('ontkoppelIcon', { read: ViewContainerRef }) ontkoppelIcons: QueryList<ViewContainerRef>;

    public accent_positive_1 = accent_positive_1;

    @Input() studiewijzer: StudiewijzerFieldsFragment;

    onShowToevoegenMessage = output<string>();

    toonOverzicht: boolean;
    vestigingSchooljaar: VestigingSchooljaar;
    // De toe te voegen sjablonen met gekozen startweek.
    geselecteerdeSjablonenMap: Map<Sjabloon, number> = new Map();
    inSidebarMessage = new BehaviorSubject<Optional<string>>(undefined);

    // De geselecteerde sjablonen in het keuze menu die nog niet zijn toegevoegd aan het overzicht.
    geselecteerdeSjablonen: Sjabloon[] = [];

    sjabloonIdOntkoppelenInProgress: string;

    ngOnInit() {
        this.toonOverzicht = this.studiewijzer.gesynchroniseerdeSjablonen.length > 0;
    }

    ngOnChanges() {
        this.vestigingSchooljaar = {
            vestigingId: this.studiewijzer.vestigingId,
            schooljaar: this.studiewijzer.schooljaar
        };
    }

    selecteerSjabloon(sjabloon: Sjabloon) {
        if (this.geselecteerdeSjablonen.includes(sjabloon)) {
            this.geselecteerdeSjablonen = this.geselecteerdeSjablonen.filter((selected) => selected.id !== sjabloon.id);
        } else {
            this.geselecteerdeSjablonen.push(sjabloon);
        }

        this.changeDetector.markForCheck();
    }

    openOntkoppelPopup(sjabloon: BasisSjabloonFieldsFragment) {
        const icon = this.ontkoppelIcons.find((ontkoppelIcon) => ontkoppelIcon.element.nativeElement.id === sjabloon.id)!;
        const popup = this.popupService.popup(
            icon,
            StudiewijzerOntkoppelenPopupComponent.defaultPopupsettings,
            StudiewijzerOntkoppelenPopupComponent
        );
        popup.studiewijzer = this.studiewijzer as Studiewijzer;
        popup.bewaarFn = () => this.ontkoppelVanSjabloon(sjabloon, this.studiewijzer, false);
        popup.verwijderFn = () => this.ontkoppelVanSjabloon(sjabloon, this.studiewijzer, true);
    }

    private ontkoppelVanSjabloon(sjabloon: BasisSjabloonFieldsFragment, studiewijzer: StudiewijzerFieldsFragment, verwijderItems: boolean) {
        this.sjabloonDataService
            .ontkoppelVanSjabloon(sjabloon.id, studiewijzer.id, verwijderItems, [namedOperations.Query.studiewijzerView])
            .subscribe(() => {
                this.studiewijzer = {
                    ...this.studiewijzer,
                    gesynchroniseerdeSjablonen: this.studiewijzer.gesynchroniseerdeSjablonen.filter((s) => s.id !== sjabloon.id)
                };

                if (this.studiewijzer.gesynchroniseerdeSjablonen.length === 0) {
                    this.onShowToevoegenMessage.emit(`${sjabloon.naam} is ontkoppeld`);
                    this.sidebarService.closeSidebar();
                } else {
                    this.inSidebarMessage.next(`${sjabloon.naam} is ontkoppeld`);
                }
                this.changeDetector.detectChanges();
            });
        this.popupService.closePopUp();
        this.sjabloonIdOntkoppelenInProgress = sjabloon.id;
        this.changeDetector.detectChanges();
    }

    annuleer() {
        if (this.toonOverzicht) {
            this.sidebarService.closeSidebar();
        } else {
            this.geselecteerdeSjablonen = [];
            this.toonOverzicht = true;
        }
    }

    toevoegen() {
        this.geselecteerdeSjablonen.forEach((sjabloon) => this.geselecteerdeSjablonenMap.set(sjabloon, sjabloon.synchronisatieStartweek!));
        this.geselecteerdeSjablonen = [];
        this.toonOverzicht = true;
    }

    opslaan() {
        const synchronisaties: { sjabloonId: string; weeknummer: number }[] = [];
        this.geselecteerdeSjablonenMap.forEach((value: number, key: Sjabloon) => {
            synchronisaties.push({
                sjabloonId: key.id,
                weeknummer: value
            });
        });

        this.changeDetector.markForCheck();

        this.studiewijzerDataService.synchroniseerMetSjablonen(this.studiewijzer.id, synchronisaties).subscribe(
            () => {
                if (this.geselecteerdeSjablonenMap.size === 1) {
                    this.onShowToevoegenMessage.emit(
                        `${this.studiewijzer.lesgroep.naam} is gesynchroniseerd met ${
                            Array.from(this.geselecteerdeSjablonenMap.keys())[0].naam
                        }`
                    );
                } else {
                    this.onShowToevoegenMessage.emit(
                        `${this.studiewijzer.lesgroep.naam} is gesynchroniseerd met ${this.geselecteerdeSjablonenMap.size} sjablonen`
                    );
                }
                this.sidebarService.closeSidebar();
            },
            () => {
                this.changeDetector.markForCheck();
            }
        );
    }

    selecteerStartWeek(sjabloon: Sjabloon, index: number) {
        const popupSettings = WeekSelectiePopupComponent.getDefaultPopupsettings(this.deviceService.isPhone());
        popupSettings.title = `Inplannen vanaf`;
        popupSettings.headerLabel = `${this.studiewijzer.schooljaar}/${this.studiewijzer.schooljaar + 1}`;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];

        const popup = this.popupService.popup(this.weekSelectieButtons.toArray()[index], popupSettings, WeekSelectiePopupComponent);
        popup.cijferPeriodeWeken$ = this.studiewijzerDataService.getCijferPeriodeWekenMetVakantie(
            this.studiewijzer.lesgroep.id,
            this.studiewijzer.id
        );
        popup.geselecteerdeWeek = this.geselecteerdeSjablonenMap.get(sjabloon)!;
        popup.selecteerWeek = (weeknummer) => this.setWeeknummer(sjabloon, weeknummer);
    }

    private setWeeknummer(sjabloon: Sjabloon, weeknummer: number) {
        this.geselecteerdeSjablonenMap.set(sjabloon, weeknummer);
        this.changeDetector.markForCheck();
    }

    get genegeerdeSjablonen(): Sjabloon[] {
        return (<Sjabloon[]>this.studiewijzer.gesynchroniseerdeSjablonen).concat(Array.from(this.geselecteerdeSjablonenMap.keys()));
    }

    get opslaanDisabled(): boolean {
        return this.geselecteerdeSjablonenMap.size === 0 || Array.from(this.geselecteerdeSjablonenMap.values()).some((number) => !number);
    }

    get toonTerugknop(): boolean {
        return !this.toonOverzicht && this.studiewijzer.gesynchroniseerdeSjablonen.length > 0;
    }

    get toonButtonBar(): boolean {
        return this.geselecteerdeSjablonenMap.size > 0 || !this.toonOverzicht;
    }

    onMaskClicked() {
        if (this.geselecteerdeSjablonenMap.size === 0) {
            this.sidebarService.closeSidebar();
            return;
        }

        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, wijzigingen zijn niet opgeslagen';
        popup.message = 'Weet je zeker dat je wilt stoppen met bewerken van synchronisaties? Wijzigingen worden niet opgeslagen.';
        popup.actionLabel = 'Stoppen met bewerken';
        popup.cancelLabel = 'Annuleren';
        popup.outlineConfirmKnop = true;
        popup.buttonColor = 'negative';
        popup.onConfirmFn = () => {
            this.sidebarService.closeSidebar();
            return true;
        };
    }
}
