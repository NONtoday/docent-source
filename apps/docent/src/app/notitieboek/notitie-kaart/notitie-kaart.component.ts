import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    input,
    output
} from '@angular/core';
import {
    LesgroepFieldsFragment,
    Maybe,
    NotitieContext,
    NotitieFieldsFragment,
    PartialLeerlingFragment,
    StamgroepFieldsFragment
} from '@docent/codegen';
import { IconDirective, IconTagComponent, TagComponent } from 'harmony';
import {
    IconBewerken,
    IconBijlage,
    IconBookmark,
    IconChevronBoven,
    IconChevronOnder,
    IconInformatie,
    IconNaarNotitieboek,
    IconOnderwijs,
    IconOpties,
    IconPinned,
    IconReacties,
    IconWaarschuwing,
    IconZichtbaar,
    provideIcons
} from 'harmony-icons';
import { orderBy } from 'lodash-es';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { match } from 'ts-pattern';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection, defaultPopupOffsets } from '../../core/popup/popup.settings';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import {
    ActionsPopupComponent,
    negativeButton,
    primaryButton,
    verwijderButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { getVolledigeNaam } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { isPresent, notEmpty } from '../../rooster-shared/utils/utils';
import { AvatarStackComponent } from '../../shared/components/avatar-stack/avatar-stack.component';
import { BijlageComponent } from '../../shared/components/bijlage/bijlage/bijlage.component';
import { BookmarkButtonComponent } from '../../shared/components/bookmark-button/bookmark-button.component';
import { SwitchComponent } from '../../shared/components/switch/switch.component';
import { NotitiePreviewPipe } from '../../shared/pipes/notitie-preview.pipe';
import { NotitieAuteurPipe } from '../notitie-auteur.pipe';
import { NotitieVastprikkenButtonComponent } from '../notitie-vastprikken-button/notitie-vastprikken-button.component';

@Component({
    selector: 'dt-notitie-kaart',
    standalone: true,
    imports: [
        CommonModule,
        TagComponent,
        IconTagComponent,
        BookmarkButtonComponent,
        NotitieVastprikkenButtonComponent,
        AvatarStackComponent,
        NotitieAuteurPipe,
        SwitchComponent,
        PopupComponent,
        TooltipDirective,
        DtDatePipe,
        NotitiePreviewPipe,
        IconDirective,
        BijlageComponent,
        IconDirective
    ],
    templateUrl: './notitie-kaart.component.html',
    styleUrls: ['./notitie-kaart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        provideIcons(
            IconOpties,
            IconReacties,
            IconBijlage,
            IconZichtbaar,
            IconPinned,
            IconBookmark,
            IconOnderwijs,
            IconInformatie,
            IconWaarschuwing,
            IconChevronBoven,
            IconChevronOnder,
            IconNaarNotitieboek,
            IconBewerken
        )
    ]
})
export class NotitieKaartComponent implements OnChanges, OnDestroy {
    private medewerkerDataService = inject(MedewerkerDataService);
    private notitieboekDataService = inject(NotitieboekDataService);
    private popupService = inject(PopupService);
    public elementRef = inject(ElementRef);
    private deviceService = inject(DeviceService);
    @ViewChild('zichtbaarheid', { read: ViewContainerRef, static: true }) zichtbaarheidViewRef: ViewContainerRef;
    @ViewChild('optiesDesktop', { read: ViewContainerRef, static: false }) optiesDesktopViewRef: ViewContainerRef;
    @ViewChild('optiesTouch', { read: ViewContainerRef, static: false }) optiesTouchViewRef: ViewContainerRef;
    @HostBinding('class.met-border') @Input() metBorder = true;
    @HostBinding('class.active-expand') @Input() expandOnActive = false;
    @HostBinding('class.rounded-corners-mobile') @Input() roundedCornersMobile = false;

    @Input() notitie: NotitieFieldsFragment;
    @Input() context: NotitieboekContext;
    @Input() meerOptiesPopupChildSelector?: string;
    @Input() showEditOptions = true;
    @Input() showOpenInNotitieboekOption = false;
    @Input() preferPopupDirectionTop = false;
    public huidigeSchooljaarSelected = input.required<boolean>();

    notitieBewerken = output<NotitieFieldsFragment>();
    openInNotitieboek = output<string>();

    public geschrevenInMentorContext = false;
    public isEigenNotitie = false;
    public betrokkenen: Maybe<string>;
    public heeftTitel: boolean;
    public isPrivacygevoelig: boolean;
    public leerlingen: PartialLeerlingFragment[];
    public lesgroepen: LesgroepFieldsFragment[];
    public stamgroepen: StamgroepFieldsFragment[];
    public isEnigeBetrokkene: boolean;
    public contextIds: string[] = [];
    public desktopOpenMoreOptions$ = new BehaviorSubject(false);

    private destroy$ = new Subject<void>();

    ngOnChanges(changes: SimpleChanges) {
        this.geschrevenInMentorContext =
            this.notitie.stamgroepBetrokkenen.some((s) => s.geschrevenInMentorContext) ||
            this.notitie.leerlingBetrokkenen.some((l) => l.geschrevenInMentorContext);
        this.isEigenNotitie = this.notitie.auteur.id === this.medewerkerDataService.medewerkerId;

        this.heeftTitel = notEmpty(this.notitie.titel);
        this.isPrivacygevoelig = this.notitie.privacygevoelig;

        this.leerlingen = this.notitie.leerlingBetrokkenen.map((l) => l.leerling);
        this.lesgroepen = this.notitie.lesgroepBetrokkenen.map((l) => l.lesgroep);
        this.stamgroepen = this.notitie.stamgroepBetrokkenen.map((s) => s.stamgroep);
        this.isEnigeBetrokkene =
            this.notitie.leerlingBetrokkenen.length + this.notitie.lesgroepBetrokkenen.length + this.notitie.stamgroepBetrokkenen.length ===
            1;

        if (changes.context && changes.context.currentValue !== changes.context.previousValue) {
            this.contextIds = match(this.context)
                .with({ context: NotitieContext.LEERLING }, (c) => [c.id, c.lesgroep?.id, c.stamgroep?.id].filter(isPresent))
                .otherwise((c) => [c.id]);
        }

        if (this.groepView) {
            this.betrokkenen = orderBy(
                [
                    ...this.notitie.leerlingBetrokkenen.map((lb) => ({
                        naam: getVolledigeNaam(lb.leerling),
                        prio: this.contextIds.includes(lb.leerling.id)
                    })),
                    ...this.notitie.lesgroepBetrokkenen.map((lg) => ({
                        naam: lg.lesgroep.naam,
                        prio: this.contextIds.includes(lg.lesgroep.id)
                    })),
                    ...this.notitie.stamgroepBetrokkenen.map((sg) => ({
                        naam: sg.stamgroep.naam,
                        prio: this.contextIds.includes(sg.stamgroep.id)
                    }))
                ],
                'prio',
                ['desc']
            )
                .map((x) => x.naam)
                .join(', ');
        }

        // Sluit altijd een open pop-up bij een device change
        this.deviceService.onDeviceChange$.pipe(takeUntil(this.destroy$)).subscribe(() => {
            if (this.popupService.isPopupOpen()) {
                this.desktopOpenMoreOptions$.next(false);
                this.popupService.closePopUp();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get groepView() {
        return !this.leerlingView;
    }

    get leerlingView() {
        return this.context.context === NotitieContext.LEERLING;
    }

    onVastprikken() {
        this.notitieboekDataService.vastprikken(this.notitie, this.context.context, this.context.id);
    }

    onBookmark() {
        this.notitieboekDataService.bookmark(this.notitie, this.context.context, this.context.id);
    }

    onOpenInNotitieboek(): void {
        this.openInNotitieboek.emit(this.notitie.id);
    }

    onVerwijderen(): void {
        this.notitieboekDataService.verwijderNotitie(this.notitie.id);
    }

    onBewerken(): void {
        this.notitieBewerken.emit(this.notitie);
    }

    openMoreActionsPopup(event: Event, fromDesktop: boolean) {
        event.stopPropagation();

        const customButtons = [];

        if (this.showOpenInNotitieboekOption) {
            customButtons.push(
                primaryButton('naarNotitieboek', 'Open in notitieboek', () => this.onOpenInNotitieboek(), 'notitie-bekijken')
            );
        }

        if (fromDesktop && this.showEditOptions && this.isEigenNotitie) {
            customButtons.push(primaryButton('bewerken', 'Bewerken', () => this.onBewerken(), 'notitie-bewerken'));
            customButtons.push(verwijderButton(() => this.onVerwijderen(), 'notitie-verwijderen'));
        }

        if (!fromDesktop) {
            customButtons.push(
                this.notitie.vastgeprikt
                    ? negativeButton('pinned', 'Vastprikken opheffen', () => this.onVastprikken(), 'notitieboek-vastprikken')
                    : primaryButton('pinned', 'Vastprikken', () => this.onVastprikken(), 'notitieboek-vastprikken')
            );
            customButtons.push(
                this.notitie.bookmarked
                    ? negativeButton('bookmark', 'Markering opheffen', () => this.onBookmark(), 'notitieboek-bookmarken')
                    : primaryButton('bookmark', 'Markeren', () => this.onBookmark(), 'notitieboek-bookmarken')
            );
        }

        // Maak de popup wat breder als er buttons met lange titels bijzitten.
        const extraWidth = this.showOpenInNotitieboekOption || (!fromDesktop && (this.notitie.vastgeprikt || this.notitie.bookmarked));

        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = extraWidth ? 236 : 164;

        // Verplaats de popup een stukje naar links als deze vanuit een notitie stream wordt geopend.
        if (document.querySelector('#notitie-stream')) {
            popupSettings.offsets = { ...defaultPopupOffsets, bottom: { top: 0, left: extraWidth ? -72 : -36 } };
        }

        // Er is standaard ruimte voor 3 buttons in de popup - zet de direction naar "Top" bij meer dan 3.
        if (this.preferPopupDirectionTop && customButtons.length > 3) {
            popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom];
        } else {
            popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        }

        // Op desktop moet de header niet veranderen zolang de meer opties popup open is.
        if (fromDesktop) {
            this.desktopOpenMoreOptions$.next(true);
            popupSettings.onCloseFunction = () => this.desktopOpenMoreOptions$.next(false);
        }

        const viewRef = fromDesktop ? this.optiesDesktopViewRef : this.optiesTouchViewRef;
        const popup = this.popupService.popup(viewRef, popupSettings, ActionsPopupComponent);
        popup.customButtons = customButtons;
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    get isActive(): boolean {
        return this.elementRef.nativeElement.classList.contains('is-active');
    }

    get isPrivacygevoeligStyling(): boolean {
        return this.isPrivacygevoelig && !(this.isActive && this.expandOnActive);
    }
}
