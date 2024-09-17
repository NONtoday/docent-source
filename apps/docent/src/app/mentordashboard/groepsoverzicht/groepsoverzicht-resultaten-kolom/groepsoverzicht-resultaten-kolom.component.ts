import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewContainerRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MentordashboardResultatenInstellingen, PartialLeerlingFragment, SorteringOrder } from '@docent/codegen';
import { CssVarPipe, DeviceService, IconDirective, NotificationColor, NotificationCounterComponent } from 'harmony';
import { IconInformatie, IconName, IconSort19, IconSort91, provideIcons } from 'harmony-icons';
import { filter, fromEvent } from 'rxjs';
import { match } from 'ts-pattern';
import { GroepsoverzichtResultatenKolomNaam, LeerlingCijferOverzicht } from '../../../core/models/mentordashboard.model';
import { PopupOpenDirective } from '../../../core/popup/popup-open.directive';
import { PopupService } from '../../../core/popup/popup.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { AvatarStackComponent } from '../../../shared/components/avatar-stack/avatar-stack.component';
import { commaResult } from '../../../shared/pipes/comma-result.pipe';
import { Resultatensoort } from '../../mentordashboard.utils';
import { GroepsoverzichtResultatenKolomPopupComponent } from '../groepsoverzicht-resultaten-kolom-popup/groepsoverzicht-resultaten-kolom-popup.component';
import { GroepsoverzichtResultatenSidebarComponent } from '../groepsoverzicht-resultaten-sidebar/groepsoverzicht-resultaten-sidebar.component';
import { GroepsoverzichtLeerlingCijferKaartComponent } from './../groepsoverzicht-leerling-cijfer-kaart/groepsoverzicht-leerling-cijfer-kaart.component';

@Component({
    selector: 'dt-groepsoverzicht-resultaten-kolom',
    standalone: true,
    imports: [
        IconDirective,
        AvatarStackComponent,
        CssVarPipe,
        GroepsoverzichtLeerlingCijferKaartComponent,
        TooltipDirective,
        NotificationCounterComponent,
        PopupOpenDirective
    ],
    templateUrl: './groepsoverzicht-resultaten-kolom.component.html',
    styleUrls: ['./groepsoverzicht-resultaten-kolom.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconInformatie, IconSort19, IconSort91)]
})
export class GroepsoverzichtResultatenKolomComponent implements OnChanges {
    @Input({ required: true }) tab: Resultatensoort;
    @Input({ required: true }) titel: 'Op niveau' | 'Extra aandacht' | 'Aandacht';
    @Input({ required: true }) leerlingenCijferOverzicht: LeerlingCijferOverzicht[];
    @Input({ required: true }) naam: GroepsoverzichtResultatenKolomNaam;
    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;

    sorteerRichtingSelected = output<SorteringOrder>();

    public kolom: GroepsoverzichtResultatenKolom;
    public leerlingen: PartialLeerlingFragment[] = [];

    private elementRef = inject(ElementRef);
    private viewContainerRef = inject(ViewContainerRef);
    private deviceService = inject(DeviceService);
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);

    constructor() {
        fromEvent(this.elementRef.nativeElement, 'click')
            .pipe(
                filter(() => this.deviceService.isPhoneOrTabletPortrait() && this.leerlingen.length > 0),
                takeUntilDestroyed()
            )
            .subscribe(() => {
                const popup = this.popupService.popup(
                    this.viewContainerRef,
                    GroepsoverzichtResultatenKolomPopupComponent.filterPopupsettings,
                    GroepsoverzichtResultatenKolomPopupComponent
                );
                popup.kolom = this.kolom;
                popup.leerlingenCijferOverzichtKolom = this.leerlingenCijferOverzicht;
                popup.instellingen = this.instellingen;
                popup.tab = this.tab;
            });

        // Sluit popup als we switchen van device, omdat deze verschillende soorten popups gebruiken
        this.deviceService.onDeviceChange$
            .pipe(
                filter(() => this.popupService.isPopupOpenFor(this.viewContainerRef)),
                takeUntilDestroyed()
            )
            .subscribe(() => this.popupService.closePopUp());
    }

    ngOnChanges() {
        const grenswaarde = match(this.naam)
            .with('aandacht', 'opNiveau', () => commaResult(this.instellingen.grenswaardeOnvoldoende))
            .with('extraAandacht', () => commaResult(this.instellingen.grenswaardeZwaarOnvoldoende))
            .exhaustive();
        const aantalInstelling = match(this.naam)
            .with('aandacht', 'opNiveau', () => this.instellingen.aantalVakkenOnvoldoende)
            .with('extraAandacht', () => this.instellingen.aantalVakkenZwaarOnvoldoende)
            .exhaustive();
        this.kolom = groepsoverzichtResultaatKolommen[this.naam](grenswaarde, aantalInstelling);
        this.leerlingen = this.leerlingenCijferOverzicht.map((leerlingCijferOverzicht) => leerlingCijferOverzicht.leerling);
    }

    trackByLeerlingId(_: number, item: LeerlingCijferOverzicht) {
        return item.leerling.id;
    }

    sortIconClick() {
        this.sorteerRichtingSelected.emit(this.sorteerRichting === SorteringOrder.DESC ? SorteringOrder.ASC : SorteringOrder.DESC);
    }

    onLeerlingClick(overzicht: LeerlingCijferOverzicht) {
        this.sidebarService.openSidebar(GroepsoverzichtResultatenSidebarComponent, {
            leerlingCijferoverzicht: overzicht,
            resultatenSoort: this.tab
        });
    }

    get sorteerIcon(): IconName {
        switch (this.sorteerRichting) {
            case SorteringOrder.DESC:
                return 'sort19';
            case SorteringOrder.ASC:
                return 'sort91';
        }
    }

    get sorteerRichting(): SorteringOrder {
        return this.instellingen.sorteringen.groepsoverzicht[this.naam];
    }

    get sorteerTooltipTekst(): string {
        switch (this.sorteerRichting) {
            case SorteringOrder.DESC:
                return 'Gesorteerd op indicatief gemiddelde hoogst-laagst';
            case SorteringOrder.ASC:
                return 'Gesorteerd op indicatief gemiddelde laagst-hoogst';
        }
    }
}

export interface GroepsoverzichtResultatenKolom {
    titel: string;
    color: NotificationColor;
    tooltip: string;
    info: string;
}

export const groepsoverzichtResultaatKolommen: Record<
    GroepsoverzichtResultatenKolomNaam,
    (grens: string, aantal: number) => GroepsoverzichtResultatenKolom
> = {
    opNiveau: (grenswaarde: string) => ({
        titel: 'Op niveau',
        color: 'positive',
        tooltip: `<b>Op niveau</b> <br> Alle vakken gem. >= ${grenswaarde}`,
        info: `Alle vakken gem. >= ${grenswaarde}`
    }),
    extraAandacht: (grenswaarde: string, aantalInstelling: number) => ({
        titel: 'Extra aandacht',
        color: 'negative',
        tooltip: `<b>Extra aandacht</b> <br> ${aantalInstelling} of meer vakken gem. < ${grenswaarde}`,
        info: `${aantalInstelling} of meer vakken gem. < ${grenswaarde}`
    }),
    aandacht: (grenswaarde: string, aantalInstelling: number) => ({
        titel: 'Aandacht',
        color: 'accent',
        tooltip: `<b>Aandacht</b> <br> ${aantalInstelling} of meer vakken gem. < ${grenswaarde}`,
        info: `${aantalInstelling} of meer vakken gem. < ${grenswaarde}`
    })
};
