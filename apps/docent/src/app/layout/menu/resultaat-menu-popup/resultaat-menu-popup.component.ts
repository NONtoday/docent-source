import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconDirective, SpinnerComponent, SwitchComponent, SwitchGroupComponent } from 'harmony';
import { IconChevronRechts, IconExamendossier, IconGroep, IconVoortgangsdossier, provideIcons } from 'harmony-icons';
import { groupBy } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { LesgroepenQuery } from '../../../../generated/_types';
import { UriService } from '../../../auth/uri-service';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { HeeftRechtDirective } from '../../../rooster-shared/directives/heeft-recht.directive';

interface VakLesgroepen {
    naam: string;
    lesgroepen: LesgroepenQuery['lesgroepen'];
}

type Dossier = 'voortgangsdossier' | 'examendossier';

@Component({
    selector: 'dt-resultaat-menu-popup',
    templateUrl: './resultaat-menu-popup.component.html',
    styleUrls: ['./resultaat-menu-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        HeeftRechtDirective,
        BackgroundIconComponent,
        SpinnerComponent,
        AsyncPipe,
        IconDirective,
        SwitchComponent,
        SwitchGroupComponent
    ],
    providers: [provideIcons(IconVoortgangsdossier, IconExamendossier, IconGroep, IconChevronRechts)]
})
export class ResultaatMenuPopupComponent implements OnInit, OnDestroy, Popup {
    private medewerkerDataService = inject(MedewerkerDataService);
    private uriService = inject(UriService);
    private router = inject(Router);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    public vakken$: Observable<VakLesgroepen[]>;
    public heeftVoortgangsLesgroepen$: Observable<boolean>;
    public heeftExamenLesgroepen$: Observable<boolean>;
    public dossier$ = new BehaviorSubject<Dossier>('voortgangsdossier');

    private onDestroy$ = new Subject<void>();

    ngOnInit(): void {
        const moetExamendossierHebben$ = this.dossier$.pipe(map((dossier) => dossier === 'examendossier'));

        // wanneer de medewerker alleen inzienrechten heeft op examendossiers, switch dan van tab
        this.medewerkerDataService
            .getMedewerker()
            .pipe(
                take(1),
                filter((medewerker) => !medewerker.settings.heeftVoortgangsdossierInzienRecht)
            )
            .subscribe(() => this.dossier$.next('examendossier'));

        const lesgroepenMetVakVanDocent$ = this.medewerkerDataService.getLesgroepenMetDossier().pipe(
            map((lesgroepen) => lesgroepen.filter((lesgroep) => lesgroep.vak)),
            shareReplayLastValue()
        );

        this.vakken$ = combineLatest([moetExamendossierHebben$, lesgroepenMetVakVanDocent$]).pipe(
            map(([moetExamendossierHebben, lesgroepen]) =>
                Object.entries(groupBy(lesgroepen, 'vak.naam'))
                    .map(
                        (vaklesgroepenTuple): VakLesgroepen => ({
                            naam: vaklesgroepenTuple[0],
                            lesgroepen: vaklesgroepenTuple[1].filter(
                                (lesgroep) => !moetExamendossierHebben || lesgroep.examendossierOndersteund === moetExamendossierHebben
                            )
                        })
                    )
                    .filter((vaklesgroep) => vaklesgroep.lesgroepen.length > 0)
            ),
            map((vakLesgroepen) =>
                vakLesgroepen.sort((lhs, rhs) => lhs.naam.toLocaleLowerCase().localeCompare(rhs.naam.toLocaleLowerCase()))
            ),
            shareReplayLastValue()
        );
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    navigateTo(lesgroepId: string) {
        const dossier = this.dossier$.value;
        if (dossier === 'examendossier') {
            window.location.assign(this.uriService.getDeepLinkUrl(`/lesgroep/${lesgroepId}/${dossier}`));
        } else {
            this.router.navigate([`/resultaten/${dossier}/${lesgroepId}`]);
        }
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.showCloseButton = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.width = 380;
        popupSettings.preferedDirection = [PopupDirection.Right];
        popupSettings.scrollable = true;
        popupSettings.offsets = {
            ...popupSettings.offsets,
            right: { left: 15, top: 70 }
        };
        return popupSettings;
    }
}
