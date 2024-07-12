import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { IconDirective, PillComponent, SpinnerComponent } from 'harmony';
import { IconBlokken, IconFilter, IconInformatie, IconSettings, provideIcons } from 'harmony-icons';
import { sortBy } from 'lodash-es';
import { Observable, combineLatest, filter, map, of, switchMap, tap } from 'rxjs';
import { TotaaloverzichtRegistratiesQuery } from '../../../generated/_types';
import { allowChildAnimations } from '../../core/core-animations';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { LeerlingoverzichtDataService } from '../leerlingoverzicht/leerlingoverzicht-data.service';
import { registratieContent } from '../leerlingoverzicht/leerlingoverzicht.model';
import { LeerlingregistratieCategorieComponent } from '../leerlingregistratie-categorie/leerlingregistratie-categorie.component';
import { LeerlingregistratiesTotaalSidebarComponent } from '../leerlingregistraties-totaal-sidebar/leerlingregistraties-totaal-sidebar.component';
import { LeerlingregistratiesWeergavePopupComponent } from '../leerlingregistraties-weergave-popup/leerlingregistraties-weergave-popup.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';
import { MentordashboardService } from '../mentordashboard.service';
import { totaalRegistratiesCategorieId, totaalRegistratiesCategorieNaam } from '../mentordashboard.utils';
import { TotaalRegistratieCategorieNaamPipe } from '../pipes/totaal-registratie-categorie-naam.pipe';

export type TotaalRegistratie = TotaaloverzichtRegistratiesQuery['totaaloverzichtRegistraties']['totaalRegistraties'][number];

@Component({
    selector: 'dt-leerlingregistraties-totalen',
    templateUrl: './leerlingregistraties-totalen.component.html',
    styleUrls: ['./leerlingregistraties-totalen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    providers: [provideIcons(IconSettings, IconInformatie, IconFilter, IconBlokken)],
    animations: [allowChildAnimations, slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    imports: [
        RouterLink,
        TooltipDirective,
        LeerlingregistratieCategorieComponent,
        SpinnerComponent,
        AsyncPipe,
        IconDirective,
        TotaalRegistratieCategorieNaamPipe,
        MessageComponent,
        PillComponent
    ]
})
export class LeerlingregistratiesTotalenComponent implements OnInit {
    private mentordashboardDataService = inject(MentordashboardDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private mentordashboardService = inject(MentordashboardService);
    private deviceService = inject(DeviceService);
    private sidebarService = inject(SidebarService);
    private route = inject(ActivatedRoute);
    @ViewChild('filterButton', { read: ViewContainerRef }) filterButtonRef: ViewContainerRef;

    totaaloverzichtRegistraties$: Observable<TotaaloverzichtRegistratiesQuery['totaaloverzichtRegistraties']>;
    filteredTotaaloverzichtRegistraties$: Observable<TotaaloverzichtRegistratiesQuery['totaaloverzichtRegistraties']>;
    alleRegistratiesVerborgen: boolean;
    weergaveInstellingen$: Observable<string[]>;
    showWeergaveOpgeslagenMessage = signal(false);

    schooljaarString: string;
    aantalZichtbareCategorieen: Optional<string>;

    private leerlingoverzichtDataService = inject(LeerlingoverzichtDataService);

    ngOnInit(): void {
        const leerlingId$ = of(this.route.parent).pipe(
            filter(isPresent),
            switchMap((route) => route.params),
            map((params) => params.id),
            shareReplayLastValue()
        );

        this.totaaloverzichtRegistraties$ = leerlingId$.pipe(
            switchMap((leerlingId) => this.mentordashboardDataService.getTotaaloverzichtRegistraties(leerlingId)),
            map((overzichtRegistraties) => ({
                ...overzichtRegistraties,
                totaalRegistraties: sortBy(overzichtRegistraties.totaalRegistraties, [
                    (registratie) => registratieContent[registratie.kolom].sorteringsNummer,
                    'vrijveld.naam'
                ])
            })),
            shareReplayLastValue()
        );

        this.weergaveInstellingen$ = leerlingId$.pipe(
            switchMap((leerlingId) => this.leerlingoverzichtDataService.leerlingoverzichtInstellingen(leerlingId)),
            map((instellingen) => instellingen.weergaves),
            shareReplayLastValue()
        );

        this.filteredTotaaloverzichtRegistraties$ = combineLatest([
            this.totaaloverzichtRegistraties$,
            this.weergaveInstellingen$,
            this.deviceService.onDeviceChange$
        ]).pipe(
            tap(([totaaloverzichtRegistraties, zichtbareCategorieen]) => {
                const totaalRegistratiesLength = totaaloverzichtRegistraties.totaalRegistraties.length;
                const registratieIds = totaaloverzichtRegistraties.totaalRegistraties.map(totaalRegistratiesCategorieId);

                // Er kunnen vrijevelden opgeslagen zijn in de mongo settings die niet meer actief zijn in core.
                // Deze filteren we er eerst uit, anders kloppen de aantallen niet.
                const beschikbareCategorieen = zichtbareCategorieen.filter((categorie) => registratieIds.includes(categorie));
                const zichtbareCategorieenLength = Math.min(beschikbareCategorieen.length, totaalRegistratiesLength);
                this.alleRegistratiesVerborgen = zichtbareCategorieenLength === 0;

                this.aantalZichtbareCategorieen =
                    zichtbareCategorieenLength === totaalRegistratiesLength
                        ? null
                        : `${zichtbareCategorieenLength}/${totaalRegistratiesLength}`;

                if (this.deviceService.isPhone()) {
                    this.mentordashboardService.setActions([
                        {
                            icon: 'filter',
                            name: 'Filters',
                            notificatie: zichtbareCategorieen.length > 0,
                            action: () => this.openFilterPopup(totaaloverzichtRegistraties, zichtbareCategorieen),
                            cyTag: 'filter-button'
                        }
                    ]);
                }
            }),
            map(([totaaloverzichtRegistraties, zichtbareCategorieen]) => ({
                ...totaaloverzichtRegistraties,
                totaalRegistraties: sortBy(
                    totaaloverzichtRegistraties?.totaalRegistraties.filter((registratie) =>
                        zichtbareCategorieen.includes(totaalRegistratiesCategorieId(registratie))
                    ),
                    [(registratie) => registratieContent[registratie.kolom].sorteringsNummer, 'vrijveld.naam']
                )
            })),
            shareReplayLastValue()
        );

        const schooljaar = getYear(getSchooljaar(new Date()).start);
        this.schooljaarString = `Schooljaar ${schooljaar}-${schooljaar + 1}`;
    }

    openTotaalSidebar(registratie: TotaalRegistratie, totaalAantalLessen: number) {
        const schooljaar = getYear(getSchooljaar(new Date()).start);
        const huidigeLeerling = this.mentordashboardService.huidigeLeerling;
        this.sidebarService.openSidebar(LeerlingregistratiesTotaalSidebarComponent, {
            registratie,
            totaalAantalLessen,
            sidebar: {
                title: `${totaalRegistratiesCategorieNaam(registratie)} • ${schooljaar}/${schooljaar + 1}`,
                icon: null
            },
            sidebarAvatar:
                this.deviceService.isPhone() && huidigeLeerling
                    ? {
                          url: huidigeLeerling.pasfoto,
                          initialen: huidigeLeerling.initialen
                      }
                    : undefined
        });
    }

    openFilterPopup(registraties: TotaaloverzichtRegistratiesQuery['totaaloverzichtRegistraties'], zichtbareCategorieen: string[]) {
        const popup = this.popupService.popup(
            this.filterButtonRef ?? this.viewContainerRef,
            LeerlingregistratiesWeergavePopupComponent.defaultPopupSettings,
            LeerlingregistratiesWeergavePopupComponent
        );

        popup.columns = registraties.totaalRegistraties.map((registratie) => {
            const display = totaalRegistratiesCategorieNaam(registratie);
            const id = totaalRegistratiesCategorieId(registratie);

            return {
                id: id,
                display: display,
                selected: zichtbareCategorieen.includes(id)
            };
        });
        popup.leerlingId = this.route.parent!.snapshot.params.id;
        popup.afterOpslaan = () => this.showWeergaveOpgeslagenMessage.set(true);
    }
}
