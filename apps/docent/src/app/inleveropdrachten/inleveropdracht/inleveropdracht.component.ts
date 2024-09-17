import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AfspraakToekenning, DagToekenning } from '@docent/codegen';
import { isAfter, isBefore } from 'date-fns';
import { IconDirective, IconPillComponent } from 'harmony';
import { IconChevronOnder, IconGroep, IconInleveropdracht, IconOpties, provideIcons } from 'harmony-icons';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import {
    ActionsPopupComponent,
    bekijkOpdrachtButton,
    bewerkButton,
    verwijderButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { StudiewijzeritemTitelPipe } from '../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { mapDifferentiatieToKleurenStackElements } from '../../rooster-shared/utils/color-token-utils';
import { KleurenStackComponent, KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';
import { StudiewijzeritemSidebarComponent } from '../../shared/components/studiewijzeritem-sidebar/studiewijzeritem-sidebar.component';
import { getInleveringenAantalPillTagColor } from '../inleveropdrachten.util';

@Component({
    selector: 'dt-inleveropdracht',
    templateUrl: './inleveropdracht.component.html',
    styleUrls: ['./inleveropdracht.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        BackgroundIconComponent,
        TooltipDirective,
        KleurenStackComponent,
        AsyncPipe,
        StudiewijzeritemTitelPipe,
        DtDatePipe,
        IconDirective,
        IconPillComponent
    ],
    providers: [provideIcons(IconGroep, IconInleveropdracht, IconChevronOnder, IconOpties)]
})
export class InleveropdrachtComponent implements OnChanges {
    public elementRef = inject(ElementRef);
    private changeDetector = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    private sidebarService = inject(SidebarService);
    private deviceService = inject(DeviceService);
    private medewerkerService = inject(MedewerkerDataService);
    @HostBinding('class.toon-differentiatie') @Input() toonDifferentiatie: boolean;
    @HostBinding('class.popup-open') popupOpen: boolean;

    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;
    @ViewChild('inleveringen', { read: ViewContainerRef }) inleveringenRef: ViewContainerRef;

    @Input() inleveropdracht: DagToekenning | AfspraakToekenning;

    onVerwijder = output<DagToekenning | AfspraakToekenning>();
    onInleveringenClick = output<ViewContainerRef>();

    inleverperiodeIsOpen: boolean;
    kleuren: KleurenStackElement[];

    public isDesktop = toSignal(this.deviceService.isDesktop$, { initialValue: this.deviceService.isDesktop() });
    public isTabletOfDesktop = toSignal(this.deviceService.isTabletOrDesktop$, { initialValue: this.deviceService.isTabletOrDesktop() });
    public getInleveringenAantalColor = getInleveringenAantalPillTagColor;

    ngOnChanges() {
        this.inleverperiodeIsOpen = isAfter(new Date(), this.inleverperiode.begin) && isBefore(new Date(), this.inleverperiode.eind);
        this.kleuren = mapDifferentiatieToKleurenStackElements(
            this.inleveropdracht.differentiatiegroepen,
            this.inleveropdracht.differentiatieleerlingen
        );
    }

    get inleverperiode() {
        return this.inleveropdracht.studiewijzeritem.inleverperiode!;
    }

    onInleveringenLabelClick(event: Event) {
        event.stopPropagation();
        this.onInleveringenClick.emit(this.inleveringenRef);
    }

    onMoreOptions(event: Event) {
        event.stopPropagation();

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 185;
        popupSettings.onCloseFunction = () => {
            this.popupOpen = false;
            this.changeDetector.markForCheck();
        };

        this.medewerkerService.differentiatieToegestaanVoorVestiging(this.inleveropdracht.lesgroep!.vestigingId).subscribe((toegestaan) => {
            const popup = this.popupService.popup(this.moreOptionsRef, popupSettings, ActionsPopupComponent);
            popup.customButtons = [
                bekijkOpdrachtButton(() =>
                    this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                        toekenning: this.inleveropdracht,
                        toonDifferentiatie: toegestaan
                    })
                ),
                bewerkButton(() =>
                    this.sidebarService.openSidebar(StudiewijzeritemSidebarComponent, {
                        toekenning: this.inleveropdracht,
                        toonDifferentiatie: toegestaan,
                        openInEditMode: true
                    })
                ),
                verwijderButton(() => {
                    this.onVerwijder.emit(this.inleveropdracht);
                }, 'inl-overzicht-verwijder-opdracht')
            ];
            popup.onActionClicked = () => {
                this.popupService.closePopUp();
                this.popupOpen = false;
            };
            this.popupOpen = true;
        });
    }
}
