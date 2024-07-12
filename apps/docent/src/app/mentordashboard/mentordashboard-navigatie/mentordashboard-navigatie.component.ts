import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HorizontalScrollDirective } from 'harmony';
import { IconArchief, IconDashboard, IconNotitieboek, IconResultaten, IconSmiley, IconYesRadio, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, map, startWith, take, tap } from 'rxjs';
import { Maybe, MentorleerlingenQuery, Settings, Stamgroep } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { FeatureService } from '../../core/services/feature.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { Optional, equalsId } from '../../rooster-shared/utils/utils';
import { MentordashboardService } from '../mentordashboard.service';
import { alleMentorLeerlingen } from '../mentordashboard.utils';
import {
    MentordashboardNavigatieItemComponent,
    NavigatieItem
} from './mentordashboard-navigatie-item/mentordashboard-navigatie-item.component';

type MentorLeerlingenStamgroep = MentorleerlingenQuery['mentorleerlingen']['stamgroepMentorleerlingen'][number]['mentorleerlingen'];
export type MentorLeerlingStamgroep =
    MentorleerlingenQuery['mentorleerlingen']['stamgroepMentorleerlingen'][number]['mentorleerlingen'][number];

@Component({
    selector: 'dt-mentordashboard-navigatie',
    templateUrl: './mentordashboard-navigatie.component.html',
    styleUrls: ['./mentordashboard-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MentordashboardNavigatieItemComponent, AsyncPipe, HorizontalScrollDirective],
    providers: [provideIcons(IconResultaten, IconSmiley, IconYesRadio, IconArchief, IconNotitieboek, IconDashboard)]
})
export class MentordashboardNavigatieComponent implements OnInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    private uriService = inject(UriService);
    private activatedRoute = inject(ActivatedRoute);
    private featureService = inject(FeatureService);
    private notitieboekDataService = inject(NotitieboekDataService);
    private mentordashboardService = inject(MentordashboardService);
    public navigatieItems$: Observable<NavigatieItem[]>;
    public isGroepsoverzicht$: Observable<boolean>;

    ngOnInit(): void {
        const alleMentorLeerlingen$ = this.medewerkerDataService.getMentorleerlingen().pipe(map(alleMentorLeerlingen));
        const settings$ = this.medewerkerDataService.getMedewerker().pipe(
            take(1),
            map((medewerker) => medewerker.settings)
        );
        const resultatenDisabled$ = this.featureService.isFeatureDisabled('mentordashboard', 'resultaten');
        // startWith(null) omdat er bij het groepsoverzicht niet altijd een leerling is en dan de combineLatest niet werkt
        const huidigeLeerling$ = this.mentordashboardService.huidigeLeerling$.pipe(startWith(null));
        const huidigeStamgroep$ = this.mentordashboardService.huidigeStamgroep$.pipe(startWith(null));
        this.isGroepsoverzicht$ = this.activatedRoute.url.pipe(
            map((url) => url[0].path === 'stamgroep' || url[0].path === 'gezamenlijk-overzicht')
        );
        const heeftMentordashboardCompleet$ = this.medewerkerDataService.heeftToegangTotMentordashboardCompleet();
        this.navigatieItems$ = combineLatest([
            alleMentorLeerlingen$,
            settings$,
            resultatenDisabled$,
            huidigeLeerling$,
            huidigeStamgroep$,
            this.isGroepsoverzicht$,
            heeftMentordashboardCompleet$
        ]).pipe(
            map(
                ([
                    leerlingen,
                    settings,
                    resultatenDisabled,
                    huidigeLeerling,
                    huidigeStamgroep,
                    isGroepsoverzicht,
                    heeftMentordashboardCompleet
                ]): NavigatieItem[] => {
                    if (isGroepsoverzicht) {
                        return this.getNavItemsGroepsoverzicht(settings, huidigeStamgroep);
                    }

                    if (!isGroepsoverzicht && huidigeLeerling) {
                        const leerling = leerlingen.find(equalsId(huidigeLeerling.id));
                        if (leerling) {
                            return this.getNavItemsLeerling(
                                leerlingen,
                                settings,
                                resultatenDisabled,
                                leerling,
                                heeftMentordashboardCompleet
                            );
                        }
                    }

                    return [];
                }
            ),
            tap((navItems) => {
                if (navItems.length === 0) {
                    return;
                }
                // zet het huidige navItem op basis van de url en de routerlink wanneer beschikbaar
                const currentNavItem = navItems.find(
                    (navItem) => navItem.titel.toLowerCase() === this.activatedRoute.firstChild?.snapshot?.url[0]?.path
                );
                if (currentNavItem) this.mentordashboardService.setCurrentNavItem(currentNavItem);
            })
        );
    }

    private getLeerlingnummerUitUrl(leerlingen: MentorLeerlingenStamgroep): Optional<number> {
        const leerlingId = this.activatedRoute.snapshot.paramMap.get('id');
        return leerlingId ? leerlingen.find(equalsId(leerlingId))?.leerlingnummer : null;
    }

    private getNavItemsLeerling(
        leerlingen: MentorLeerlingenStamgroep,
        settings: Settings,
        resultatenDisabled: boolean,
        leerling: MentorLeerlingStamgroep,
        heeftMentordashboardCompleet: boolean
    ): NavigatieItem[] {
        const profielNavItem: NavigatieItem = {
            icon: 'smiley',
            titel: 'Profiel',
            routerLink: './profiel',
            dataGtm: 'mentordashboard-leerling-profiel',
            routerlinkExactMatch: true
        };
        const registratiesNavItemTitel = 'Registraties';
        const registratiesNavItem: NavigatieItem = {
            icon: 'yesRadio',
            titel: registratiesNavItemTitel,
            routerLink: `./${registratiesNavItemTitel.toLowerCase()}`,
            dataGtm: 'mentordashboard-leerling-registraties',
            routerlinkExactMatch: false
        };
        const dossierNavItem: NavigatieItem = {
            icon: 'archief',
            titel: 'Dossier',
            deeplink: () => this.uriService.getLeerlingZorgvierkant(this.getLeerlingnummerUitUrl(leerlingen) || leerling.leerlingnummer),
            dataGtm: 'mentordashboard-leerling-zorgvierkant-deeplink',
            routerlinkExactMatch: true
        };

        const navigatieItems: NavigatieItem[] = [profielNavItem, registratiesNavItem];

        if (settings.heeftVoortgangsdossierInzienRecht) {
            const resultatenDeeplinkNavItem: NavigatieItem = {
                icon: 'resultaten',
                titel: 'Resultaten',
                deeplink: () =>
                    this.uriService.getLeerlingVoortgangsdossier(this.getLeerlingnummerUitUrl(leerlingen) || leerling.leerlingnummer),
                dataGtm: 'mentordashboard-leerling-voortgangsdossier-deeplink',
                routerlinkExactMatch: true
            };
            const resultatenNavItemTitel = 'Resultaten';
            const resultatenNavItem: NavigatieItem = {
                icon: 'resultaten',
                titel: resultatenNavItemTitel,
                routerLink: `./${resultatenNavItemTitel.toLowerCase()}`,
                dataGtm: 'mentordashboard-leerling-voortgangsdossier',
                routerlinkExactMatch: false
            };
            navigatieItems.push(resultatenDisabled ? resultatenDeeplinkNavItem : resultatenNavItem);
        }

        const vestigingNotitieboekToegang = settings.vestigingRechten.find(
            (vr) => vr.vestigingId === leerling.vestigingId
        )?.heeftToegangTotNotitieboek;
        if (vestigingNotitieboekToegang) {
            const notitieboekStamgroepNavItemTitel = 'Notitieboek';
            const notitieboekStamgroepNavItem: NavigatieItem = {
                icon: 'notitieboek',
                titel: notitieboekStamgroepNavItemTitel,
                badge: this.notitieboekDataService.getAantalOngelezenLeerlingNotities(leerling.id),
                routerLink: `./${notitieboekStamgroepNavItemTitel.toLowerCase()}`,
                dataGtm: 'mentordashboard-leerling-notitieboek',
                routerlinkExactMatch: false
            };
            navigatieItems.push(notitieboekStamgroepNavItem);
        }

        navigatieItems.push(dossierNavItem);

        const leerlingoverzichtNavItem: NavigatieItem = {
            icon: 'dashboard',
            titel: 'Leerlingoverzicht',
            routerLink: './overzicht',
            dataGtm: 'mentordashboard-leerlingoverzicht',
            routerlinkExactMatch: true
        };

        return heeftMentordashboardCompleet ? [leerlingoverzichtNavItem, ...navigatieItems] : [...navigatieItems];
    }
    private getNavItemsGroepsoverzicht(settings: Settings, huidigeStamgroep: Maybe<Stamgroep>): NavigatieItem[] {
        const groepsoverzichtNavItem: NavigatieItem = {
            icon: 'dashboard',
            titel: 'Groepsoverzicht',
            routerLink: './',
            dataGtm: 'mentordashboard-groepsoverzicht',
            routerlinkExactMatch: true
        };
        const navigatieItems: NavigatieItem[] = [groepsoverzichtNavItem];
        const vestigingNotitieboekToegang =
            huidigeStamgroep &&
            settings.vestigingRechten.find((vr) => vr.vestigingId === huidigeStamgroep.vestigingId)?.heeftToegangTotNotitieboek;
        if (vestigingNotitieboekToegang && this.activatedRoute.snapshot.url[0].path !== 'gezamenlijk-overzicht') {
            const notitieboekLeerlingNavItemTitel = 'Notitieboek';
            const notitieboekLeerlingNavItem: NavigatieItem = {
                icon: 'notitieboek',
                titel: notitieboekLeerlingNavItemTitel,
                badge: this.notitieboekDataService.getAantalOngelezenStamgroepNotities(huidigeStamgroep.id),
                routerLink: `./${notitieboekLeerlingNavItemTitel.toLowerCase()}`,
                dataGtm: 'mentordashboard-stamgroep-notitieboek',
                routerlinkExactMatch: false
            };
            navigatieItems.push(notitieboekLeerlingNavItem);
        }
        return navigatieItems;
    }
}
