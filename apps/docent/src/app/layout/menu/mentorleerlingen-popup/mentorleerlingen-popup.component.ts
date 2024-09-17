import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MentorleerlingenQuery } from '@docent/codegen';
import { SpinnerComponent } from 'harmony';
import { IconNotitieboek, provideIcons } from 'harmony-icons';
import { Observable, combineLatest, map, startWith, tap } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { SearchComponent } from '../../../rooster-shared/components/search/search.component';
import { HeeftVestigingsRechtDirective } from '../../../rooster-shared/directives/heeft-vestigings-recht.directive';
import { getVolledigeNaam } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional, sortLocale, sortLocaleNested } from '../../../rooster-shared/utils/utils';
import { MentorgroepPopupElementComponent } from './mentorgroep-popup-element/mentorgroep-popup-element.component';
import { MentorleerlingPopupElementComponent } from './mentorleerling-popup-element/mentorleerling-popup-element.component';

@Component({
    selector: 'dt-mentorleerlingen-popup',
    templateUrl: './mentorleerlingen-popup.component.html',
    styleUrls: ['./mentorleerlingen-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        SearchComponent,
        MentorleerlingPopupElementComponent,
        MentorgroepPopupElementComponent,
        SpinnerComponent,
        AsyncPipe,
        HeeftVestigingsRechtDirective
    ],
    providers: [provideIcons(IconNotitieboek)]
})
export class MentorleerlingenPopupComponent implements OnInit, Popup {
    public medewerkerDataService = inject(MedewerkerDataService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @ViewChildren('mentorleerling', { read: ElementRef }) mentorleerlingenElements: QueryList<ElementRef>;
    @ViewChildren('mentorgroep', { read: ElementRef }) mentorgroepElements: QueryList<ElementRef>;

    mentorleerlingen$: Observable<MentorleerlingenQuery['mentorleerlingen']>;
    heeftToegangTotMentordashboardCompleet$: Observable<boolean>;

    @Input() headerContext = false;
    @Input() headerContextGroepId: Optional<string>;

    currentHeaderItemId: string;

    public searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    public isSearching$: Observable<boolean>;

    public showIndividueelOverzicht = signal(true);
    public showGroepsOverzicht = signal(true);

    ngOnInit() {
        this.heeftToegangTotMentordashboardCompleet$ = this.medewerkerDataService.heeftToegangTotMentordashboardCompleet();
        this.currentHeaderItemId = this.router.url.includes('gezamenlijk-overzicht')
            ? 'gezamenlijk-overzicht'
            : this.route.snapshot.params.id;
        const search$ = this.searchControl.valueChanges.pipe(startWith(''));
        this.isSearching$ = search$.pipe(map((search) => search.length > 0));
        const mentorleerlingen$ = this.medewerkerDataService.getMentorleerlingen().pipe(
            tap((mentorLeerlingen) => this.showIndividueelOverzicht.set(mentorLeerlingen.individueleMentorleerlingen.length > 0)),
            map((mentorLeerlingen) => {
                if (!this.headerContextGroepId) {
                    return mentorLeerlingen;
                }
                const filteredMentorLeerlingen =
                    this.headerContextGroepId === 'gezamenlijk-overzicht'
                        ? {
                              stamgroepMentorleerlingen: [],
                              individueleMentorleerlingen: mentorLeerlingen.individueleMentorleerlingen
                          }
                        : {
                              stamgroepMentorleerlingen: mentorLeerlingen.stamgroepMentorleerlingen.filter(
                                  (stamgroepMentorLeerlingen) => stamgroepMentorLeerlingen.stamgroep.id === this.headerContextGroepId
                              ),
                              individueleMentorleerlingen: []
                          };
                return filteredMentorLeerlingen as MentorleerlingenQuery['mentorleerlingen'];
            }),
            tap(() => {
                // Tap om naar de actieve leerling te scrollen
                setTimeout(() => {
                    const elementIdLeerling = `mentorleerling-${this.currentHeaderItemId}`;
                    const elementIdGroep = `mentorgroep-${this.currentHeaderItemId}`;
                    const leerlingItem = this.mentorleerlingenElements.find((item) => item.nativeElement.id === elementIdLeerling);
                    const groepItem = this.mentorgroepElements.find((item) => item.nativeElement.id === elementIdGroep);
                    if (leerlingItem) {
                        leerlingItem.nativeElement.scrollIntoView({
                            behavior: 'auto',
                            block: 'center'
                        });
                        return;
                    }
                    if (groepItem) {
                        groepItem.nativeElement.scrollIntoView({
                            behavior: 'auto',
                            block: 'center'
                        });
                        return;
                    }
                });
            })
        );

        this.mentorleerlingen$ = combineLatest([mentorleerlingen$, search$, this.isSearching$]).pipe(
            map(([mentorlln, search, isSearching]): MentorleerlingenQuery['mentorleerlingen'] => {
                // Niet zoeken is query resultaat teruggeven
                if (!isSearching) {
                    return mentorlln;
                }

                const searchLowerCased = search.toLowerCase();

                // Vind stamgroep leerlingen obv zoekterm, filter zodat stamgroep alleen wordt behouden als er leerlingen zijn gevonden
                const gevondenLeerlingenStamgroep = mentorlln.stamgroepMentorleerlingen
                    .map((stamgroepMentorLeerling) => ({
                        ...stamgroepMentorLeerling,
                        mentorleerlingen: stamgroepMentorLeerling.mentorleerlingen.filter((leerling) =>
                            getVolledigeNaam(leerling).toLowerCase().includes(searchLowerCased)
                        )
                    }))
                    .filter((stamgroepMentorLeerling) => stamgroepMentorLeerling.mentorleerlingen.length > 0);

                // Vind stamgroepen obv zoekterm, laat mentorleerlingen van stamgroep leeg
                const gevondenGroepen = mentorlln.stamgroepMentorleerlingen
                    .filter((stamgroepMentorLeerling) => stamgroepMentorLeerling.stamgroep.naam.toLowerCase().includes(searchLowerCased))
                    .map((stamgroepMentorLeerling) => ({
                        ...stamgroepMentorLeerling,
                        stamgroep: stamgroepMentorLeerling.stamgroep,
                        mentorleerlingen: []
                    }));

                // Filter eventuele dubbelingen bij gevonden stamgroepen
                const gevondenLeerlingenEnStamgroepen = [
                    ...gevondenLeerlingenStamgroep,
                    ...gevondenGroepen.filter(
                        (groep) =>
                            !gevondenLeerlingenStamgroep.some(
                                (stamgroepMentorLeerling) => groep.stamgroep.id === stamgroepMentorLeerling.stamgroep.id
                            )
                    )
                ];

                const gevondenLeerlingenIndividueel = mentorlln.individueleMentorleerlingen.filter((individueleMentorLeerling) =>
                    getVolledigeNaam(individueleMentorLeerling.leerling).toLowerCase().includes(searchLowerCased)
                );

                // Laat groepsoverzicht optie alleen zien als er groepen zijn gevonden
                this.showGroepsOverzicht.set(gevondenGroepen.length > 0);
                // Laat individueel overzicht optie alleen zien als er op 'individueel' is gezocht
                this.showIndividueelOverzicht.set('individueel'.includes(searchLowerCased));
                return {
                    stamgroepMentorleerlingen: sortLocaleNested(
                        gevondenLeerlingenEnStamgroepen,
                        (stmLeerlingen) => stmLeerlingen.mentorleerlingen,
                        ['leerling.achternaam', 'leerling.roepnaam']
                    ),
                    individueleMentorleerlingen: sortLocale(gevondenLeerlingenIndividueel, ['leerling.achternaam', 'leerling.roepnaam'])
                };
            })
        );
    }

    mayClose(): boolean {
        return true;
    }

    onSelected(leerlingId: string, event: Event) {
        // wanneer we op het mentordashboard zitten willen we op de huidige tab blijven
        if (this.router.url.includes('/mentordashboard/leerling')) {
            // Strip queryparams van huidige url
            let currentUrlWithoutParams = this.router.url;
            if (currentUrlWithoutParams.indexOf('?') >= 0) {
                currentUrlWithoutParams = currentUrlWithoutParams.split('?')[0];
            }

            // Gebruik regex om de leerling id uit de URL te vissen.
            // Uitleg: de "([^/]+)" groep matcht alles dat niet een "/" bevat.
            const findUrlLeerlingId = currentUrlWithoutParams.match(/leerling\/([^/]+)/);
            if (findUrlLeerlingId) {
                // Het resultaat is een array van regex matches en op index 1 zit de groep van de leerling id.
                this.router.navigate([currentUrlWithoutParams.replace(findUrlLeerlingId[1], leerlingId)]);
            } else {
                // Fallback voor de zekerheid, hierbij wordt de tab niet onthouden.
                this.router.navigate(['/mentordashboard/leerling', leerlingId]);
            }
        } else {
            const route = ['/mentordashboard/leerling', leerlingId];
            if (this.router.url.includes('notitieboek') && this.headerContext) {
                route.push('notitieboek');
            }
            this.router.navigate(route);
        }

        this.popup.onClose();
        event.stopPropagation();
    }

    onSelectedGroep(stamgroepId: string) {
        const route = ['/mentordashboard/stamgroep', stamgroepId];
        if (this.router.url.includes('notitieboek') && this.headerContext) {
            route.push('notitieboek');
        }
        this.router.navigate(route);
        this.popup.onClose();
    }

    onOverzichtIndividueel() {
        this.router.navigate(['/mentordashboard/gezamenlijk-overzicht']);
        this.popup.onClose();
    }

    closePopup() {
        this.popup.onClose();
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Popout,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 380;
        popupSettings.preferedDirection = [PopupDirection.Right];
        popupSettings.scrollable = true;
        popupSettings.offsets = {
            ...popupSettings.offsets,
            right: { left: 30, top: 0 }
        };
        return popupSettings;
    }
}
