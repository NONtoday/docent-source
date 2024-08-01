import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { QuillEditorComponent, SelectionChange } from 'ngx-quill';
import Quill from 'quill';
import { Observable, Subject, fromEvent } from 'rxjs';
import { debounceTime, map, startWith, takeUntil } from 'rxjs/operators';

import { IconDirective } from 'harmony';
import { IconBold, IconGoogleMeet, IconItalic, IconLink, IconMsTeams, IconOpties, IconUnderline, provideIcons } from 'harmony-icons';
import { localOrCookieStorage } from '../../../auth/storage-config';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../core/popup/popup.service';
import { DeviceService } from '../../../core/services/device.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ActionButton, ActionsPopupComponent } from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { Optional, getPercentageViewWidth, isStringNullOrEmpty } from '../../../rooster-shared/utils/utils';
import { SupportedConferenceTypes, VideoConferenceComponent } from '../video-conference/video-conference.component';

export interface ConferenceDateRange {
    start: string;
    eind: string;
}

export class ConvertedChannelData {
    channelTitle: string;
    teamTitle: string;
    location: string;
}

@Component({
    selector: 'dt-editor-form-control',
    templateUrl: './editor-form-control.component.html',
    styleUrls: ['./editor-form-control.component.scss'],
    standalone: true,
    imports: [CommonModule, QuillEditorComponent, ReactiveFormsModule, IconDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconOpties, IconMsTeams, IconGoogleMeet, IconBold, IconItalic, IconUnderline, IconLink)]
})
export class EditorFormControlComponent implements OnInit, OnDestroy {
    @ViewChild(QuillEditorComponent, { static: true }) editor: QuillEditorComponent;
    @ViewChild('eventhandler', { static: true }) handler: ElementRef;
    @ViewChild('morePopout', { read: ViewContainerRef }) morePopout: ViewContainerRef;
    @ViewChild('morePopoutNonMobile', { read: ViewContainerRef }) morePopoutNonMobile: ViewContainerRef;

    @Input() formGroup: UntypedFormGroup;
    @Input() controlName: string;
    @Input() placeholder: string;
    @Input() conferenceDateRange: ConferenceDateRange;
    @Input() conferenceType: SupportedConferenceTypes = SupportedConferenceTypes.MSTEAMS;
    @Input() showBorder: boolean;
    @Input() showBorderBottom = false;

    // Styling inputs
    @Input() heeftBijlagen: boolean;
    @Input() useMinHeight: Optional<boolean>;
    @Input() setInitialFocus: boolean;
    @Input() inSidebar: boolean;
    @Input() useSidebarWidth: boolean;

    triggerChangeDetection = output<void>();

    private medewerkerDataService = inject(MedewerkerDataService);
    private elementRef = inject(ElementRef);
    private deviceService = inject(DeviceService);
    private renderer = inject(Renderer2);
    private popupService = inject(PopupService);
    private toastService = inject(ToastService);

    minSidebarDesktopWidth$: Observable<boolean>;
    meetAllowed$: Observable<boolean>;
    teamsAllowed$: Observable<boolean>;

    private msTeamsWindow: Optional<Window>;
    private teamsInterval: Optional<NodeJS.Timeout>;
    private destroy$ = new Subject<void>();

    isOpen = false;

    quillBounds = this.elementRef.nativeElement.parentElement;

    constructor() {
        // if omdat Quill in de tests niet gevonden kan worden
        if (Quill) {
            const link = Quill.import('formats/link');
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            (link as any).sanitize = (url: string) => (url.startsWith('http') ? url : 'https://' + url);
        }
    }

    ngOnInit(): void {
        this.minSidebarDesktopWidth$ = fromEvent(window, 'resize').pipe(
            debounceTime(10),
            map(this.isSidebarSmallerThanMinWidth),
            startWith(this.isSidebarSmallerThanMinWidth())
        );

        // Zorgen dat er een border om de editor en het tekstveld komt
        this.editor.onSelectionChanged.pipe(takeUntil(this.destroy$)).subscribe((focus: SelectionChange) => {
            if (focus.range) {
                this.renderer.addClass(this.handler.nativeElement, 'focus');
            } else {
                this.renderer.removeClass(this.handler.nativeElement, 'focus');
            }
        });
        this.teamsAllowed$ = this.medewerkerDataService.getMedewerker().pipe(
            map((medewerker) => medewerker?.settings?.toegangTotMSTeams ?? false),
            shareReplayLastValue()
        );
        this.meetAllowed$ = this.medewerkerDataService.getMedewerker().pipe(
            map((medewerker) => medewerker?.settings?.toegangTotGoogleMeet ?? false),
            shareReplayLastValue()
        );
    }

    ngOnDestroy(): void {
        this.msTeamsWindow?.close();
        this.destroy$.next();
        this.destroy$.complete();
    }

    onEditorCreated(quill: any) {
        const toolbar = quill.getModule('toolbar');
        const toolbarbuttons = toolbar.container.querySelectorAll('button');

        toolbarbuttons.forEach((button: HTMLElement) => {
            button.setAttribute('tabindex', '-1');
        });

        if (this.setInitialFocus) {
            quill.focus();
        }
    }

    onContentChanged() {
        // niks doen, maar event afvangen zodat form dirty wordt
    }

    openConferenceWindow(type: SupportedConferenceTypes) {
        let query = '?type=' + (type ? type : SupportedConferenceTypes.MSTEAMS.toString());
        if (this.conferenceDateRange?.start) {
            query += `&startDate=${encodeURIComponent(btoa(this.conferenceDateRange.start))}`;
        }
        if (this.conferenceDateRange?.eind) {
            query += `&endDate=${encodeURIComponent(btoa(this.conferenceDateRange.eind))}`;
        }
        const url = '/share/meeting' + query;
        this.msTeamsWindow = window.open(
            url,
            'msMeeting',
            'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=500,height=648'
        );
        this.pollResult();
    }

    openTeamsWindow() {
        this.startTeamsFlow(this.morePopoutNonMobile);
    }

    startTeamsFlow(viewRef: ViewContainerRef) {
        this.popupService.closePopUp();
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 240;
        const popup = this.popupService.popup(viewRef, popupSettings, ActionsPopupComponent);
        const channelLinkKiezen: ActionButton = {
            icon: undefined,
            color: 'primary',
            text: 'Teams channel kiezen',
            gtmTag: 'msteams-channel-start',
            onClickFn: () => this.startExistingTeamFlow()
        };
        const createConference: ActionButton = {
            icon: undefined,
            color: 'primary',
            text: 'Teams afspraak aanmaken',
            onClickFn: () => this.startCreateTeamsFlow()
        };
        popup.customButtons = [channelLinkKiezen, createConference];
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };
    }

    startGoogleMeetFlow(): void {
        this.openConferenceWindow(SupportedConferenceTypes.GOOGLEMEET);
    }

    startExistingTeamFlow(): void {
        this.resetRequestedTeams();
        this.openConferenceWindow(SupportedConferenceTypes.MSTEAMSCHANNEL);
    }

    resetRequestedTeams() {
        localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_data);
        localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_error);
    }

    startCreateTeamsFlow() {
        this.openConferenceWindow(SupportedConferenceTypes.MSTEAMS);
    }

    popoutConferences() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 156;
        const popup = this.popupService.popup(this.morePopout, popupSettings, ActionsPopupComponent);
        const googleMeetButton: ActionButton = {
            icon: 'googleMeet',
            color: 'primary',
            text: 'Google Meet',
            onClickFn: () => this.startGoogleMeetFlow()
        };
        const msTeamsButton: ActionButton = {
            icon: 'msTeams',
            color: 'primary',
            text: 'Microsoft Teams',
            onClickFn: () => this.startTeamsFlow(this.morePopout)
        };
        popup.customButtons = [msTeamsButton, googleMeetButton];
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };
    }

    private pollResult() {
        // Er loopt al een interval, voorkom een tweede.
        if (this.teamsInterval) {
            return;
        }
        this.teamsInterval = setInterval(() => {
            const error = localOrCookieStorage.getItem(VideoConferenceComponent.existing_teams_error);
            const meetingUrl = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_url);
            const titel = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_titel);
            // Geen meetingUrl is geen resultaat.
            if (isStringNullOrEmpty(meetingUrl)) {
                if (this.msTeamsWindow?.closed) {
                    // Als het window gesloten is gaat er ook geen resultaat meer komen.
                    if (this.teamsInterval) clearInterval(this.teamsInterval);
                    this.teamsInterval = null;
                    this.msTeamsWindow = null;
                    this.toastService.error(error ?? 'Het inplannen is afgebroken, probeer het normaals.');
                }
                return;
            }
            if (this.teamsInterval) clearInterval(this.teamsInterval);

            // Het resultaat van VideoConferenceComponent wordt in de localOrCookieStorage opgeslagen.
            localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_error);
            localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_titel);
            localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_url);
            // Voeg toe aan de editor als er een titel en url in de localOrCookieStorage staat.
            // Geen titel en/of url betekent dat het window is afgesloten zonder succesvol resultaat.
            if (!isStringNullOrEmpty(titel)) {
                const index = this.editor.quillEditor.getSelection()?.index ?? this.editor.quillEditor.getLength();
                this.editor.quillEditor.insertText(index, titel!, 'link', meetingUrl, 'user');
                this.formGroup.updateValueAndValidity();
            }

            this.teamsInterval = null;
            this.msTeamsWindow = null;
        }, 500);
    }

    // Bepaalt of de breedte van de sidebar de minimale breedte is namelijk 540px,
    // of dat deze de berekende 35 vw is.
    private isSidebarSmallerThanMinWidth = (): boolean => this.deviceService.isDesktop() && getPercentageViewWidth(35)! < 540;
}
