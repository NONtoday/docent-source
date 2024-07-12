import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { endOfDay, getHours, setHours, startOfDay } from 'date-fns';
import { ButtonComponent, IconDirective } from 'harmony';
import { IconGoogleMeet, IconInformatie, IconMsTeams, IconSettings, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { sha256 } from 'js-sha256';
import { isNil } from 'lodash-es';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { v4 } from 'uuid';
import { localOrCookieStorage } from '../../../auth/storage-config';
import { Schooljaar } from '../../../core/models/schooljaar.model';
import { startVoorEindValidator } from '../../../core/validators/startVoorEind.validator';
import { ENVIRONMENT_CONFIG } from '../../../environment.config';
import { FormCheckboxComponent } from '../../../rooster-shared/components/form-checkbox/form-checkbox.component';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { Optional, isStringNullOrEmpty } from '../../../rooster-shared/utils/utils';
import { ConvertedChannelData } from '../editor-form-control/editor-form-control.component';
import { ChannelData, MicrosoftTeamsService, TeamChannelData } from '../editor-form-control/microsoft-teams.service';
import { RangedDatepickerComponent } from '../ranged-datepicker/ranged-datepicker.component';

export enum SupportedConferenceTypes {
    GOOGLEMEET = 'GOOGLEMEET',
    MSTEAMS = 'MSTEAMS',
    MSTEAMSCHANNEL = 'MSTEAMSCHANNEL'
}

@Component({
    selector: 'dt-video-conference',
    templateUrl: './video-conference.component.html',
    styleUrls: ['./video-conference.component.scss'],
    standalone: true,
    imports: [
        TooltipDirective,
        OutlineButtonComponent,
        MessageComponent,
        ReactiveFormsModule,
        FormCheckboxComponent,
        RangedDatepickerComponent,
        IconDirective,
        ButtonComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGoogleMeet, IconMsTeams, IconWaarschuwing, IconSettings, IconInformatie)]
})
export class VideoConferenceComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private changeDetector = inject(ChangeDetectorRef);
    private msService = inject(MicrosoftTeamsService);
    private static DISCOVERY_DOCS = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
    private static SCOPES = 'https://www.googleapis.com/auth/calendar.events';
    private static API_KEY = 'AIzaSyCBGQqtSiH-GhyHjh0Zv-j30X714lNMBAE';

    private teamDataInterval: NodeJS.Timeout;

    public static meeting_titel = 'meeting_titel';
    public static meeting_url = 'meeting_url';
    public static meeting_begin = 'meeting_begin';
    public static meeting_eind = 'meeting_eind';
    public static meeting_hele_dag = 'meeting_hele_dag';
    public static existing_teams_data = 'existing_msteams_data';
    public static existing_teams_error = 'existing_msteams_error';
    public static conference_type = 'conference_type';

    status = 'Teams channels worden opgehaald...';

    meetingForm: UntypedFormGroup;

    hasResponse: boolean;
    channelsLoaded: boolean;
    settingsUrl?: Optional<string>;
    errorMessage?: Optional<string>;
    type: SupportedConferenceTypes;
    schooljaar: Schooljaar;

    // GMeet properties
    gapiSetup = false;

    authInstance: any;
    user: string;
    error: string;

    teamChannelData: ConvertedChannelData[];

    teamList$: Subscription;
    teamError$: Subscription;

    private environment = inject(ENVIRONMENT_CONFIG);

    ngOnInit() {
        localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_error);
        const foundType = localOrCookieStorage.getItem(VideoConferenceComponent.conference_type);
        localOrCookieStorage.removeItem(VideoConferenceComponent.conference_type);
        this.hasResponse = false;

        const queryParamMap = this.route.snapshot.queryParamMap;
        const encodedUrl = queryParamMap.get('q');
        const encodedStartDate = queryParamMap.get('startDate');
        const encodedEndDate = queryParamMap.get('endDate');
        const conferenceType = queryParamMap.get('type') || foundType;
        let startDate;
        let endDate;
        if (encodedStartDate) {
            startDate = new Date(atob(decodeURIComponent(encodedStartDate)));
            endDate = encodedEndDate ? new Date(atob(decodeURIComponent(encodedEndDate))) : setHours(startDate, getHours(startDate) + 1);
        } else if (encodedEndDate) {
            endDate = new Date(atob(decodeURIComponent(encodedEndDate)));
            startDate = setHours(endDate, getHours(endDate) - 1);
        } else {
            startDate = setHours(startOfDay(new Date()), 9);
            endDate = setHours(startDate, getHours(startDate) + 1);
        }
        if (conferenceType === SupportedConferenceTypes.GOOGLEMEET) {
            this.type = SupportedConferenceTypes.GOOGLEMEET;
            this.initGoogleAuth();
        } else if (conferenceType === SupportedConferenceTypes.MSTEAMSCHANNEL) {
            this.type = SupportedConferenceTypes.MSTEAMSCHANNEL;
        } else {
            this.type = SupportedConferenceTypes.MSTEAMS;
        }
        const error = queryParamMap.get('err');
        if (encodedUrl && encodedUrl.length > 0) {
            this.handleEncodedUrlResponse(encodedUrl, queryParamMap.get('sig'), queryParamMap.get('opt') ?? '');
        } else if (error && error.length > 0) {
            this.setErrorMessage(error);
        }

        this.schooljaar = getSchooljaar(startDate);

        this.meetingForm = new UntypedFormGroup({
            titel: new UntypedFormControl(
                SupportedConferenceTypes.MSTEAMS === conferenceType ? 'Microsoft Teams afspraak' : 'Google Meet afspraak',
                [Validators.maxLength(150), Validators.required]
            ),
            startEind: new UntypedFormGroup(
                {
                    begin: new UntypedFormControl(startDate, Validators.required),
                    eind: new UntypedFormControl(endDate, Validators.required)
                },
                { validators: [startVoorEindValidator()] }
            ),
            heleDag: new UntypedFormControl(false)
        });

        if (SupportedConferenceTypes.MSTEAMSCHANNEL === conferenceType) {
            if (!this.msService.isAuthenticated()) {
                this.saveState();
                this.msService
                    .signIn()
                    .then((result) => {
                        if (result) {
                            this.fetchTeams();
                        } else if (!isNil(result)) {
                            this.errorMessage = 'Er is geen Microsoft account beschikbaar om team channels voor op te vragen.';
                            this.changeDetector.markForCheck();
                        }
                        return;
                    })
                    .catch(() => {
                        this.errorMessage = 'Er is geen Microsoft account beschikbaar om team channels voor op te vragen.';
                        this.changeDetector.markForCheck();
                        return;
                    });
                return;
            } else {
                this.fetchTeams();
            }
        }
    }

    fetchTeams() {
        this.teamList$ = this.msService.onAllChannelList.pipe(filter(Boolean)).subscribe((next: TeamChannelData[]) => {
            const channels: ConvertedChannelData[] = [];
            next.forEach((teamData: TeamChannelData) => {
                channels.push(
                    ...teamData.channelData.map((channelData: ChannelData) => ({
                        channelTitle: channelData.title,
                        teamTitle: teamData.teamData.title,
                        location: channelData.location
                    }))
                );
            });
            this.teamChannelData = channels;
            this.channelsLoaded = true;
            this.changeDetector.detectChanges();
        });
        this.teamError$ = this.msService.onError.pipe(filter(Boolean)).subscribe((next: string) => {
            this.errorMessage = next;
            this.changeDetector.detectChanges();
        });
        this.msService.listAllChannelsOfAllJoinedTeams();
    }

    get startEindFormGroup(): UntypedFormGroup {
        return <UntypedFormGroup>this.meetingForm.get('startEind');
    }

    get isFormValid() {
        return this.meetingForm.valid;
    }

    get title(): string {
        switch (this.type) {
            case SupportedConferenceTypes.MSTEAMSCHANNEL:
                return 'Microsoft Teams channel kiezen';
            case SupportedConferenceTypes.MSTEAMS:
                return 'Microsoft Teams afspraak aanmaken';
            default:
                return 'Google Meet afspraak aanmaken';
        }
    }

    get successMessage(): string {
        return this.type === SupportedConferenceTypes.MSTEAMS ? 'Microsoft Teams afspraak aangemaakt' : 'Google Meet afspraak aangemaakt';
    }

    get isGoogleMeet(): boolean {
        return this.type === SupportedConferenceTypes.GOOGLEMEET;
    }

    reset() {
        const titel = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_titel);
        const begin = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_begin);
        const eind = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_eind);
        const heleDagVal = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_hele_dag);
        const heleDag = heleDagVal === 'true';

        // Zelfde als in de initialisatie
        const fallbackStartDate = setHours(startOfDay(new Date()), 9);

        this.meetingForm.patchValue({
            titel: titel,
            startEind: {
                begin: begin ? new Date(begin) : fallbackStartDate,
                eind: eind ? new Date(eind) : setHours(fallbackStartDate, getHours(fallbackStartDate) + 1)
            },
            heleDag: heleDag
        });
        this.errorMessage = null;
        this.hasResponse = false;
    }

    close() {
        this.reset();
        window.close();
    }

    onSubmit() {
        if (this.isFormValid) {
            const titel = this.meetingForm.get('titel')!.value;
            let begin = this.startEindFormGroup.get('begin')!.value;
            let eind = this.startEindFormGroup.get('eind')!.value;
            const heleDag = this.meetingForm.get('heleDag')!.value;

            if (heleDag) {
                begin = startOfDay(begin);
                eind = endOfDay(eind);
            }

            localOrCookieStorage.setItem(VideoConferenceComponent.meeting_titel, titel);
            localOrCookieStorage.setItem(VideoConferenceComponent.meeting_begin, begin.toISOString());
            localOrCookieStorage.setItem(VideoConferenceComponent.meeting_eind, eind.toISOString());
            localOrCookieStorage.setItem(VideoConferenceComponent.meeting_hele_dag, heleDag);

            if (SupportedConferenceTypes.MSTEAMS === this.type) {
                return this.redirectToConnect(begin, eind, titel);
            }
            this.startGoogleMeetFlow(begin, eind, titel);
        }
    }

    startGoogleMeetFlow(begin: Date, eind: Date, title: string) {
        this.authInstance.callback = () => {
            // @ts-expect-error gapi is onbekend
            gapi.client.load('calendar', 'v3', () => {
                const eventToInsert = {
                    summary: title,
                    description: title,
                    start: {
                        dateTime: begin.toISOString()
                    },
                    end: {
                        dateTime: eind.toISOString()
                    },
                    conferenceData: {
                        createRequest: {
                            requestId: v4()
                        }
                    }
                };

                // @ts-expect-error gapi is onbekend
                const request = gapi.client.calendar.events.insert({
                    calendarId: 'primary',
                    // verplicht mee te sturen als je een conference wenst aan te maken. conferencedata is hiermee in editmode.
                    conferenceDataVersion: 1,
                    resource: eventToInsert
                });
                request.execute((eventcreate: any) => {
                    this.hasResponse = true;
                    if (eventcreate && eventcreate.hangoutLink) {
                        const titel = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_titel);
                        localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_titel);
                        localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_begin);
                        localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_eind);
                        localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_hele_dag);
                        localOrCookieStorage.setItem(VideoConferenceComponent.meeting_titel, titel ?? '');
                        localOrCookieStorage.setItem(VideoConferenceComponent.meeting_url, eventcreate.hangoutLink);
                    } else {
                        this.setErrorMessage();
                    }
                    this.changeDetector.detectChanges();
                });
            });
        };
        // @ts-expect-error gapi
        if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            this.authInstance.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            this.authInstance.requestAccessToken({ prompt: '' });
        }
    }

    private initGoogleAuth(): void {
        // @ts-expect-error gapi is onbekend
        gapi.load('client', async () => {
            // @ts-expect-error gapi
            await gapi.client.init({
                apiKey: VideoConferenceComponent.API_KEY,
                discoveryDocs: [VideoConferenceComponent.DISCOVERY_DOCS]
            });
            // @ts-expect-error google account lib
            this.authInstance = google.accounts.oauth2.initTokenClient({
                client_id: this.environment.googleClientId,
                scope: VideoConferenceComponent.SCOPES
            });
        });
    }

    redirectToConnect(begin: Date, eind: Date, titel: string) {
        const env: string = this.connectEnvironment ? `/${this.connectEnvironment}` : '';
        this.openUrl(
            `https://share.connect.somtoday.nl/teams/${this.encode(begin.toISOString())}/${this.encode(eind.toISOString())}/${this.encode(
                titel
            )}${env}`
        );
    }

    redirectToSettings() {
        if (this.settingsUrl) {
            this.openUrl(this.settingsUrl);
        }
    }

    // Wrapper om window.location.replace om te stubben in de tests.
    openUrl(url: string) {
        window.location.replace(url);
    }

    private setErrorMessage(errorCode?: string) {
        this.hasResponse = true;
        const productName = SupportedConferenceTypes.MSTEAMS === this.type ? 'Microsoft Teams afspraak' : 'Google Meet afspraak';
        switch (errorCode) {
            case 'SESSION_ERROR':
                this.errorMessage =
                    'Er is een fout opgetreden bij het aanmaken van de ' +
                    productName +
                    ', omdat je sessie niet geldig is. Probeer het opnieuw.';
                break;
            case 'INPUT_VALIDATION_ERROR':
                this.errorMessage =
                    'Er is een fout opgetreden bij het aanmaken van de ' +
                    productName +
                    ', omdat er onjuiste waarden zijn ingevoerd. Probeer het opnieuw.';
                break;
            case 'AUTHENTICATION_ERROR':
                this.errorMessage =
                    'Er is een authenticatiefout opgetreden bij het aanmaken van de ' + productName + '. Probeer het opnieuw.';
                break;
            case 'MS_COMMUNICATION_ERROR':
                this.errorMessage =
                    'Er is een communicatiefout opgetreden bij het aanmaken van de ' + productName + '. Probeer het opnieuw.';
                break;
            default:
                this.errorMessage = 'Er is een fout opgetreden bij het aanmaken van de ' + productName + '. Probeer het opnieuw.';
                break;
        }
        this.changeDetector.markForCheck();
    }

    get connectEnvironment(): Optional<string> {
        return this.environment.connectEnvironment;
    }

    private encode(input: string): string {
        return encodeURIComponent(btoa(input));
    }

    private handleEncodedUrlResponse(encodedUrl: string, signature: Optional<string>, settingsUrl?: string) {
        this.hasResponse = true;
        try {
            const meetingUrl = atob(decodeURIComponent(encodedUrl));

            const titel = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_titel) ?? '';
            const begin = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_begin) ?? '';
            const eind = localOrCookieStorage.getItem(VideoConferenceComponent.meeting_eind) ?? '';

            const calculatedSignature = sha256(begin + eind + titel);
            if (calculatedSignature === signature) {
                // De titel en url van de meeting in de localStorage, zodat dit gedeeld is over meedere tabs.
                localOrCookieStorage.setItem(VideoConferenceComponent.meeting_titel, titel);
                localOrCookieStorage.setItem(VideoConferenceComponent.meeting_url, meetingUrl);

                localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_begin);
                localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_eind);
                localOrCookieStorage.removeItem(VideoConferenceComponent.meeting_hele_dag);

                if (!isStringNullOrEmpty(settingsUrl)) {
                    this.settingsUrl = atob(decodeURIComponent(settingsUrl!));
                }
                this.changeDetector.markForCheck();
            } else {
                this.setErrorMessage();
            }
        } catch (e) {
            this.setErrorMessage();
        }
    }

    selectChannel(channelData: ConvertedChannelData) {
        localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_error);
        localOrCookieStorage.removeItem(VideoConferenceComponent.existing_teams_data);
        localOrCookieStorage.setItem(VideoConferenceComponent.meeting_titel, channelData.teamTitle + ' - ' + channelData.channelTitle);
        localOrCookieStorage.setItem(VideoConferenceComponent.meeting_url, channelData.location);
        this.close();
    }

    private saveState() {
        localOrCookieStorage.setItem(VideoConferenceComponent.conference_type, this.type);
    }

    ngOnDestroy() {
        if (this.teamDataInterval) clearInterval(this.teamDataInterval);
        if (this.teamList$) this.teamList$.unsubscribe();
        if (this.teamError$) this.teamError$.unsubscribe();
    }
}
