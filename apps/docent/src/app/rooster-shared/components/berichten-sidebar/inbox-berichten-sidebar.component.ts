import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { SpinnerComponent } from 'harmony';
import { IconBericht, IconCheck, IconToevoegen, provideIcons } from 'harmony-icons';
import { Observable, map, tap } from 'rxjs';
import { InboxBericht } from '../../../../generated/_types';
import { UriService } from '../../../auth/uri-service';
import { AANTAL_BERICHTEN_PER_REQUEST, MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { InboxBerichtComponent } from '../bericht/inbox-bericht.component';
import { MessageComponent } from '../message/message.component';
import { OutlineButtonComponent } from '../outline-button/outline-button.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'dt-inbox-berichten-sidebar',
    templateUrl: './inbox-berichten-sidebar.component.html',
    styleUrls: ['./inbox-berichten-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 200 })],
    standalone: true,
    imports: [SidebarComponent, InboxBerichtComponent, SpinnerComponent, MessageComponent, OutlineButtonComponent, AsyncPipe],
    providers: [provideIcons(IconBericht, IconCheck, IconToevoegen)]
})
export class InboxBerichtenSidebarComponent implements OnInit {
    private router = inject(Router);
    private medewerkerDataService = inject(MedewerkerDataService);
    private uriService = inject(UriService);
    private changeDetector = inject(ChangeDetectorRef);
    berichten$: Observable<InboxBericht[]>;
    loading = false;
    aantalGetoondeBerichten = 0;
    alleBerichtenGeladen = false;
    showMessage = false;
    aantalOngelezenBerichten$ = this.medewerkerDataService.aantalOngelezenBerichten$;
    heeftBerichtenWijzigenRecht$: Observable<boolean>;

    ngOnInit() {
        this.loading = true;
        this.heeftBerichtenWijzigenRecht$ = this.medewerkerDataService.heeftBerichtenWijzigenRecht();
        this.berichten$ = this.medewerkerDataService.getBerichtenVanMedewerker().pipe(
            // Filter de null values eruit die in de typePolicy is toegevoegd (changeDetection)
            map(({ data }) => data.berichtenVanMedewerker.filter(Boolean)),
            tap((berichten: InboxBericht[]) => {
                if (berichten) {
                    this.alleBerichtenGeladen = this.aantalGetoondeBerichten === berichten.length;
                    this.aantalGetoondeBerichten = berichten.length;
                    this.loading = false;
                }
            })
        );
    }

    toonMeerBerichten() {
        if (!this.alleBerichtenGeladen) {
            this.loading = true;
            this.medewerkerDataService.fetchMoreBerichtenVanMedewerker(this.aantalGetoondeBerichten);
        }
    }

    onBerichtClick(bericht: InboxBericht) {
        if (!!bericht.inleveropdrachtContext?.inleveraarId && !!bericht.inleveropdrachtContext?.toekenningId) {
            if (!bericht.gelezen) {
                this.medewerkerDataService.markeerBerichtGelezen(bericht.id);
            }
            this.router.navigate(['/inleveropdrachten', bericht.inleveropdrachtContext.toekenningId], {
                queryParams: { detail: bericht.inleveropdrachtContext.inleveraarId }
            });
        } else {
            this.deeplinkToUrl(this.uriService.getDeepLinkUrl(`/berichten/${bericht.id}`));
        }
    }

    onNieuwBericht() {
        this.deeplinkToUrl(this.uriService.getDeepLinkUrl(`/berichten/nieuw`));
    }

    allesGelezen() {
        this.medewerkerDataService.markeerAlleBerichtenGelezen().subscribe(() => {
            this.showMessage = true;
            this.changeDetector.detectChanges();
        });
    }

    closeSidebar() {
        this.router.navigate([], {
            queryParams: {
                berichtenSidebar: null
            },
            queryParamsHandling: 'merge'
        });
    }

    deeplinkToUrl(deeplink: string) {
        window.location.assign(deeplink);
    }

    get toonMeerBerichtenKnop(): boolean {
        return this.aantalGetoondeBerichten % AANTAL_BERICHTEN_PER_REQUEST === 0;
    }
}
