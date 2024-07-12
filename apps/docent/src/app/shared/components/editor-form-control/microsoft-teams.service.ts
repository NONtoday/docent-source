import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// MSAL (authentication lib) imports
import * as msal from '@azure/msal-browser';
// MS GraphClient imports
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/lib/src/authentication/msal-browser/AuthCodeMSALBrowserAuthenticationProvider';
import { ENVIRONMENT_CONFIG } from '../../../environment.config';
import { Optional } from '../../../rooster-shared/utils/utils';

export class TeamData {
    title: string;
    location: string;
    id: string;
}
export class ChannelData {
    title: string;
    location: string;
    id: string;
}

export class TeamChannelData {
    teamData: TeamData;
    channelData: ChannelData[];
}

// This service can be used to obtain user-subscribed teams and channels at the Microsoft Graph API.
// There are three main Observerables, onTeamsList, onChannelList, onAllChannelList.
// onTeamsList : Supplies a list of joined teamnames, ids and urls (if available). Can be triggered by calling listUserJoinedTeams()
// onChannelsList : Supplies a list of joined Channels on a specific team. Can be triggered by calling listTeamsChannels(teamData);
// onAllChanneList : Suppplies a list of all joined Channels of all user joined teams. Can be triggered by calling listAllChannelsOfAllJoinedTeams();
// There is also an onError Observerable which will send a string on any error using the previous trigger functions.
@Injectable({
    providedIn: 'root'
})
export class MicrosoftTeamsService {
    // events
    private _onTeamsList$ = new BehaviorSubject<Optional<TeamData[]>>(null);
    private _onChannelList$ = new BehaviorSubject<Optional<TeamChannelData>>(null);
    private _onAllChannelList$ = new BehaviorSubject<Optional<TeamChannelData[]>>(null);
    private _onError$ = new Subject<Optional<string>>();
    private environment = inject(ENVIRONMENT_CONFIG);

    // computed properties
    get msGraphRedirectUri(): string {
        const port = window.location.port;
        const portString = port && port !== '80' && port !== '443' ? ':' + port : '';
        const currentHost = `${window.location.protocol}//${window.location.hostname}${portString}`;
        return currentHost + this._msGraphRedirectUriPath;
    }

    // internals
    private _initializedMSClient: Client;
    private _msGraphRedirectUriPath = '/microsoft/auth';
    private _joinedTeamsPath = '/me/joinedTeams';
    private _tempChannelData: TeamChannelData[] = [];

    async signIn(): Promise<Optional<boolean>> {
        this._onError$.next(null);
        this._onAllChannelList$.next(null);
        const requestedScopes = ['Team.ReadBasic.All', 'Channel.ReadBasic.All'];
        const msalConfig = {
            auth: {
                clientId: this.environment.msGraphClientId,
                redirectUri: this.msGraphRedirectUri
            }
        };
        const msalInstance = new msal.PublicClientApplication(msalConfig);

        return msalInstance.handleRedirectPromise().then((response) => {
            let account: Optional<msal.AccountInfo>;
            if (response !== null) {
                account = response.account;
            } else {
                const currentAccounts = msalInstance.getAllAccounts();
                if (currentAccounts.length === 0) {
                    msalInstance.loginRedirect({
                        scopes: requestedScopes
                    });
                    return;
                } else {
                    account = currentAccounts[0];
                }
            }
            if (!account) {
                this._onError$.next('Er is geen Microsoft account beschikbaar om team channels voor op te vragen.');
                return false;
            }

            const authCodeOptions = { scopes: requestedScopes, interactionType: msal.InteractionType.Popup, account };
            const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(msalInstance, authCodeOptions);

            const clientOptions = {
                authProvider
            };
            this._initializedMSClient = Client.initWithMiddleware(clientOptions);
            return true;
        });
    }

    // This initializes the authentication and might open a popup as required by MSAL lib
    listUserJoinedTeams(): void {
        if (this._initializedMSClient === undefined) {
            return this._onError$.next('Er is geen inlogde gebruiker bekend.');
        }
        this._internalJoinedTeamsFetch(this._onTeamsList$.next);
    }

    private _internalJoinedTeamsFetch(callback: (teams: TeamData[]) => void) {
        if (this._initializedMSClient === undefined) {
            return this._onError$.next('Er is geen inlogde gebruiker bekend.');
        }
        this._initializedMSClient
            .api(this._joinedTeamsPath)
            .get()
            .then((data: any) => {
                if (data && data.value) {
                    const joinedTeams: TeamData[] = data.value.map((msTeam: any) => {
                        return {
                            title: msTeam.displayName,
                            location: msTeam.webUrl,
                            id: msTeam.id
                        };
                    });
                    callback(joinedTeams);
                } else {
                    this._onError$.next('Kon geen Teams ophalen voor de huidige gebruiker.');
                }
            })
            .catch(() => {
                this._onError$.next('Kon geen Teams ophalen voor de huidige gebruiker.');
            });
    }

    listTeamsChannels(team: TeamData): void {
        if (this._initializedMSClient === undefined) {
            this._onError$.next('Er is geen inlogde gebruiker bekend.');
            return;
        }
        if (!team || !team.id) {
            this._onError$.next('Kon geen channels ophalen voor huidige team');
            return;
        }
        this._initializedMSClient
            .api(`teams/${team.id}/channels`)
            .get()
            .then((channels: any) => {
                if (channels.value) {
                    const mappedChannels: ChannelData[] = channels.value.map((channel: any) => {
                        return {
                            title: channel.displayName,
                            location: channel.webUrl,
                            id: channel.id
                        };
                    });
                    this._onChannelList$.next({
                        teamData: team,
                        channelData: mappedChannels
                    });
                } else {
                    this._onError$.next('Kon geen Teams ophalen voor de huidige gebruiker.');
                }
            })
            .catch(() => {
                this._onError$.next('Kon geen Teams ophalen voor de huidige gebruiker.');
            });
    }

    isAuthenticated(): boolean {
        return undefined !== this._initializedMSClient;
    }

    listAllChannelsOfAllJoinedTeams(): void {
        if (this._initializedMSClient === undefined) {
            this._onError$.next(
                'Er is een fout opgetreden bij het toevoegen van een Microsoft Teams channel. Er is geen inlogde gebruiker bekend.'
            );
            return;
        }
        this._tempChannelData = [];
        this._onError$.next(null);
        this._internalJoinedTeamsFetch((teams: TeamData[]) => {
            const promises: any[] = [];
            teams.forEach((team: TeamData) => {
                promises.push(
                    this._initializedMSClient
                        .api(`teams/${team.id}/channels`)
                        .get()
                        .then((channels: any) => {
                            if (channels.value) {
                                const mappedChannels: ChannelData[] = channels.value.map((channel: any) => {
                                    return {
                                        title: channel.displayName,
                                        location: channel.webUrl,
                                        id: channel.id
                                    };
                                });
                                this._tempChannelData.push({
                                    teamData: team,
                                    channelData: mappedChannels
                                });
                            } else {
                                this._onError$.next(
                                    'Er is een fout opgetreden bij het toevoegen van een Microsoft Teams channel. Er konden geen Teams worden opgehaald voor de ingelogde gebruiker.'
                                );
                            }
                        })
                        .catch(() => {
                            this._onError$.next(
                                'Er is een fout opgetreden bij het toevoegen van een Microsoft Teams channel. Er konden geen Teams worden opgehaald voor de ingelogde gebruiker.'
                            );
                        })
                );
            });
            Promise.all(promises).then(() => {
                this._onAllChannelList$.next(this._tempChannelData);
            });
        });
    }

    get onTeamsList(): BehaviorSubject<Optional<TeamData[]>> {
        return this._onTeamsList$;
    }

    get onChannelList(): BehaviorSubject<Optional<TeamChannelData>> {
        return this._onChannelList$;
    }

    get onAllChannelList(): BehaviorSubject<Optional<TeamChannelData[]>> {
        return this._onAllChannelList$;
    }

    get onError(): Subject<Optional<string>> {
        return this._onError$;
    }
}
