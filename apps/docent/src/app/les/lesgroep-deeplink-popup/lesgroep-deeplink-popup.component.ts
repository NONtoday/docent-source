import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from 'harmony';
import {
    IconExamendossier,
    IconGroep,
    IconGroepAlt,
    IconNotitieboek,
    IconReactieToevoegen,
    IconStudiewijzer,
    IconVoortgangsdossier,
    provideIcons
} from 'harmony-icons';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Lesgroep, LesgroepFieldsFragment, LesgroepStudiewijzerQuery, NotitieContext } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { LesgroepDataService } from '../../core/services/lesgroep-data.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ActueleNotitiesSidebarComponent } from '../../notitieboek/actuele-notities-sidebar/actuele-notities-sidebar.component';
import { ActionButton, ActionsPopupComponent } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { HeeftRechtDirective } from '../../rooster-shared/directives/heeft-recht.directive';
import { toId } from '../../rooster-shared/utils/utils';
import { PopupButtonComponent } from '../../shared/components/popup-button/popup-button.component';
import { LesplanningDataService } from '../lesplanning/lesplanning-data.service';

@Component({
    selector: 'dt-lesgroep-deeplink-popup',
    templateUrl: './lesgroep-deeplink-popup.component.html',
    styleUrls: ['./lesgroep-deeplink-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, BackgroundIconComponent, PopupButtonComponent, RouterLink, HeeftRechtDirective, SpinnerComponent],
    providers: [
        provideIcons(
            IconGroep,
            IconReactieToevoegen,
            IconNotitieboek,
            IconGroepAlt,
            IconVoortgangsdossier,
            IconExamendossier,
            IconStudiewijzer
        )
    ]
})
export class LesgroepDeeplinkPopupComponent implements Popup, OnInit, OnDestroy {
    private medewerkerDataService = inject(MedewerkerDataService);
    private lesplanningDataSerivce = inject(LesplanningDataService);
    private lesgroepDataService = inject(LesgroepDataService);
    private uriService = inject(UriService);
    private sidebarService = inject(SidebarService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    lesgroepen: Lesgroep[];
    lesgroepStudiewijzers = new Map<string, LesgroepStudiewijzerQuery['lesgroepStudiewijzers'][number]>();
    toonLesgroep: boolean;
    customButtons: ActionButton[];
    toonCustomButtons: boolean;
    onActionClicked: () => void;
    showDividerLine = true;

    metStudiewijzerLink: boolean;
    metVoortgangsdossierLink = true;
    lesgroepenMetVoorgangsdossiersIds: string[] = [];
    vestigingenMetNotitieboek = new Set<string>();
    toonNieuweNotitie = false;

    studiewijzerLoading: boolean;
    voortgangsdossierLoading: boolean;
    notitieboekLoading: boolean;

    onDestroy$ = new Subject<void>();

    ngOnInit(): void {
        this.toonLesgroep = this.lesgroepen.length > 1;
        this.toonCustomButtons = this.customButtons?.length > 0;

        if (this.metStudiewijzerLink) {
            this.studiewijzerLoading = true;
            this.medewerkerDataService
                .heeftToegangTotEloEnSw()
                .pipe(
                    switchMap((heeftToegang) =>
                        heeftToegang
                            ? this.lesplanningDataSerivce.getLesgroepStudiewijzers(this.lesgroepen.map((lesgroep) => lesgroep.id))
                            : of(new Map<string, LesgroepStudiewijzerQuery['lesgroepStudiewijzers'][number]>())
                    ),
                    takeUntil(this.onDestroy$)
                )
                .subscribe((lesgroepStudiewijzers) => {
                    this.lesgroepStudiewijzers = lesgroepStudiewijzers;
                    this.studiewijzerLoading = false;
                });
        }
        if (this.metVoortgangsdossierLink) {
            this.voortgangsdossierLoading = true;
            this.lesgroepDataService
                .getLesgroepenMetDossier(this.lesgroepen.map(toId))
                .pipe(takeUntil(this.onDestroy$))
                .subscribe((lesgroepen) => {
                    this.lesgroepenMetVoorgangsdossiersIds = lesgroepen.map(toId);
                    this.voortgangsdossierLoading = false;
                });
        }

        this.medewerkerDataService.getVestigingIdsMetNotitieboekRechten().subscribe((vestigingIds) => {
            this.vestigingenMetNotitieboek = vestigingIds;
            this.notitieboekLoading = false;
        });
    }

    onNieuweNotitie(lesgroep: Lesgroep) {
        this.popup.onClose();
        this.sidebarService.openSidebar(ActueleNotitiesSidebarComponent, {
            context: {
                context: NotitieContext.LESGROEP,
                id: lesgroep.id,
                lesgroep: lesgroep
            },
            nieuwOnEnter: true
        });
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    mayClose(): boolean {
        return true;
    }

    onKlassenboek(lesgroep: LesgroepFieldsFragment) {
        window.location.assign(this.uriService.getKlassenboekLink(lesgroep.id));
    }

    onExamendossier(lesgroep: LesgroepFieldsFragment) {
        window.location.assign(this.uriService.getLesgroepExamendossierLink(lesgroep.id));
    }

    onCustomButtonClick(customButton: ActionButton, lesgroep: LesgroepFieldsFragment) {
        customButton.onClickFn(lesgroep);
        this.onActionClicked?.();
    }

    public static get defaultPopupsettings() {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 312;
        return settings;
    }

    get loading() {
        return this.studiewijzerLoading || this.voortgangsdossierLoading || this.notitieboekLoading;
    }
}
