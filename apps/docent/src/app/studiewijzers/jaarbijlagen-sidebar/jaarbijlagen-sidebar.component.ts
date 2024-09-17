import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
    Bijlage,
    BijlageFieldsFragment,
    BijlageMap,
    BijlageMapFieldsFragment,
    Differentiatiegroep,
    Leerling,
    Sjabloon,
    SjabloonQuery,
    Studiewijzer,
    StudiewijzerJaarbijlagen,
    StudiewijzerQuery
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { SpinnerComponent } from 'harmony';
import { IconPijlLinks, IconSjabloon, IconStudiewijzer, IconToevoegen, IconVerversen, provideIcons } from 'harmony-icons';
import get from 'lodash-es/get';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BulkDifferentiatieContainer } from '../../core/models/studiewijzers/shared.model';
import { SidebarPage } from '../../core/models/studiewijzers/studiewijzer.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { Appearance, PopupSettings } from '../../core/popup/popup.settings';
import { ComponentUploadService } from '../../core/services/component-upload.service';
import { DifferentiatiegroepenDataService } from '../../core/services/differentiatiegroepen-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional, equalsId, toId } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DifferentiatieSelectieComponent } from '../../shared/components/differentiatie/differentiatie-selectie/differentiatie-selectie.component';
import { BijlagenSelectieComponent } from '../bijlagen-selectie/bijlagen-selectie.component';
import { JaarbijlageDataService } from '../jaarbijlage-data.service';
import { SjabloonDataService } from '../sjabloon-data.service';
import { SjabloonSelectieComponent } from '../sjabloon-selectie/sjabloon-selectie.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { StudiewijzerSelectieComponent } from '../studiewijzer-selectie/studiewijzer-selectie.component';
import {
    bijlagenSidebarPage,
    selecteerBijlagenSidebarPage,
    selecteerSjabloonSidebarPage,
    selecteerStudiewijzerSidebarPage
} from './jaarbijlagen-sidebar.pages';
import { JaarbijlagenComponent } from './jaarbijlagen/jaarbijlagen.component';

interface AbstractStudiewijzerJaarbijlagen {
    abstractStudiewijzer: StudiewijzerQuery['studiewijzer'] | SjabloonQuery['sjabloon'];
    jaarbijlagen: StudiewijzerJaarbijlagen;
}

@Component({
    selector: 'dt-jaarbijlagen-sidebar',
    templateUrl: './jaarbijlagen-sidebar.component.html',
    styleUrls: ['./jaarbijlagen-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentUploadService, provideIcons(IconStudiewijzer, IconSjabloon, IconPijlLinks, IconToevoegen, IconVerversen)],
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 })],
    standalone: true,
    imports: [
        SidebarComponent,
        JaarbijlagenComponent,
        StudiewijzerSelectieComponent,
        SjabloonSelectieComponent,
        BijlagenSelectieComponent,
        DifferentiatieSelectieComponent,
        MessageComponent,
        SpinnerComponent,
        AsyncPipe
    ]
})
export class JaarbijlagenSidebarComponent extends BaseSidebar implements OnInit, OnChanges {
    public sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private jaarbijlageDataService = inject(JaarbijlageDataService);
    private sjabloonDataService = inject(SjabloonDataService);
    private swDataService = inject(StudiewijzerDataService);
    private differentiatiegroepenDataService = inject(DifferentiatiegroepenDataService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild(JaarbijlagenComponent) jaarbijlagen: JaarbijlagenComponent;

    @Input() abstractSwId: string;
    @Input() isSjabloon: boolean;
    @Input() isEditable: boolean;
    @Input() heeftVaksecties: boolean;
    @Input() heeftToegangTotDifferentiatie: boolean;

    public selectedAbstractStudiewijzer: Studiewijzer | Sjabloon;
    public selectedJaarbijlagen$: Observable<StudiewijzerJaarbijlagen>;

    public selectedMap$: Observable<Optional<BijlageMapFieldsFragment>>;
    public _selectedMap$ = new BehaviorSubject<Optional<BijlageMapFieldsFragment>>(undefined);

    abstractStudiewijzer$: Observable<Optional<StudiewijzerQuery['studiewijzer']> | Optional<SjabloonQuery['sjabloon']>>;
    studiewijzerJaarbijlagen$: Observable<AbstractStudiewijzerJaarbijlagen>;
    isUrlFormOpen$: Observable<boolean | BijlageFieldsFragment>;
    isBijlageFormOpen$: Observable<boolean>;

    isToevoegenToegestaan: boolean;
    showToevoegenGelukt: boolean;

    differentiatieObject: Optional<BijlageMap | Bijlage>;
    bulkDifferentiatie: Optional<BulkDifferentiatieContainer>;

    uploadFormGroup: UntypedFormGroup;
    uploadingFiles = new Subject<FileList>();

    leerlingenVanLesgroep$: Observable<Leerling[]>;
    differentiatiegroepen$ = new BehaviorSubject<Differentiatiegroep[]>([]);
    differentiatieleerlingen$ = new BehaviorSubject<Leerling[]>([]);
    showDifferentiatiePage$ = new BehaviorSubject(false);
    differentiatie$: Observable<[Leerling[], Differentiatiegroep[]]>;
    toonIedereenTag$: Observable<boolean>;

    constructor() {
        super();
        this.sidebarService.changePage(bijlagenSidebarPage);
    }

    ngOnInit() {
        this.studiewijzerJaarbijlagen$ = combineLatest([
            this.abstractStudiewijzer$,
            this.jaarbijlageDataService.getJaarbijlagen(this.abstractSwId)
        ]).pipe(
            // getJaarbijlagen komt binnen met de nieuwe values, maar Angular ziet het niet als change,
            // om deze reden zelf er een nieuw object van maken zodat het wel een change is.
            map(
                ([abstractStudiewijzer, jaarbijlagen]) =>
                    ({
                        abstractStudiewijzer,
                        jaarbijlagen: { ...jaarbijlagen }
                    }) as AbstractStudiewijzerJaarbijlagen
            ),
            shareReplayLastValue()
        );

        this.selectedMap$ = combineLatest([this._selectedMap$, this.studiewijzerJaarbijlagen$]).pipe(
            map(([internalSelectedMap, swJaarbijlagen]) =>
                internalSelectedMap
                    ? (swJaarbijlagen.jaarbijlagen.mappen.find(
                          (bijlagemap: BijlageMap) => bijlagemap.id === internalSelectedMap.id
                      ) as BijlageMapFieldsFragment)
                    : null
            ),
            shareReplayLastValue()
        );

        if (!this.isSjabloon) {
            const groepenLeerlingen$ = this.differentiatiegroepen$.pipe(map((groepen) => groepen.flatMap((groep) => groep.leerlingen)));
            this.leerlingenVanLesgroep$ = this.abstractStudiewijzer$.pipe(
                switchMap((abstractSw) =>
                    this.differentiatiegroepenDataService.getLeerlingenMetDifferentiatiegroepenVanLesgroep(
                        (abstractSw as Studiewijzer).lesgroep.id
                    )
                )
            );
            this.differentiatie$ = this.abstractStudiewijzer$.pipe(
                switchMap((abstractSw) => {
                    const leerlingenVanLesgroep$ = combineLatest([
                        this.leerlingenVanLesgroep$,
                        this.differentiatieleerlingen$,
                        groepenLeerlingen$
                    ]).pipe(
                        map(([leerlingen, diffLeerlingen, diffGroepenLeerlingen]) =>
                            leerlingen
                                .filter((leerling) => !diffLeerlingen.some(equalsId(leerling.id)))
                                .filter((leerling) => !diffGroepenLeerlingen.some(equalsId(leerling.id)))
                        ),
                        shareReplayLastValue()
                    );
                    const differentiatiegroepenVanLesgroep$ = combineLatest([
                        this.differentiatiegroepenDataService.getDifferentiatiegroepen((abstractSw as Studiewijzer).lesgroep.id),
                        this.differentiatiegroepen$
                    ]).pipe(
                        map(([groepen, diffGroepen]) => groepen.filter((groep) => !diffGroepen.some(equalsId(groep.id)))),
                        shareReplayLastValue()
                    );
                    return combineLatest([leerlingenVanLesgroep$, differentiatiegroepenVanLesgroep$]);
                })
            );
        }
    }

    ngOnChanges() {
        if (this.isSjabloon) {
            this.abstractStudiewijzer$ = this.sjabloonDataService.getSjabloon(this.abstractSwId);
        } else {
            this.abstractStudiewijzer$ = this.swDataService.getStudiewijzer(this.abstractSwId);
        }
    }

    closeDifferentiatie = () => {
        this.differentiatieObject = null;
        this.bulkDifferentiatie = null;
        this.differentiatiegroepen$.next([]);
        this.differentiatieleerlingen$.next([]);

        if (this.showDifferentiatiePage$.getValue()) {
            // Differentiatiesidebar wordt niet getoond als de bulkoptie 'iedereen' is gekozen, en kan dan dus ook niet gesloten worden.
            this.showDifferentiatiePage$.next(false);
            this.sidebarService.previousPage();
        }
    };

    openDifferentiatieSidebar(event: BijlageMap | Bijlage) {
        this.differentiatieObject = event;
        this.differentiatiegroepen$.next([...event.differentiatiegroepen]);
        this.differentiatieleerlingen$.next([...event.differentiatieleerlingen]);
        this.sidebarService.changePage({
            ...this.sidebarService.currentPage,
            titel: 'Kies groep of leerling',
            onIconClick: this.closeDifferentiatie,
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 4
        });

        this.showDifferentiatiePage$.next(true);
    }

    openDifferentiatieSidebarBulk(event: BulkDifferentiatieContainer) {
        this.bulkDifferentiatie = event;
        if (event.iedereen) {
            this.voegBulkDifferentiatieToe([], [], true);
        } else {
            this.sidebarService.changePage({
                ...this.sidebarService.currentPage,
                titel: 'Kies groep of leerling',
                onIconClick: this.closeDifferentiatie,
                icon: 'pijlLinks',
                iconClickable: true,
                pagenumber: 4
            });

            this.showDifferentiatiePage$.next(true);
        }
    }

    heeftDifferentiatie() {
        return (differentieerbaar: Bijlage | BijlageMap) =>
            differentieerbaar.differentiatiegroepen?.length > 0 || differentieerbaar.differentiatieleerlingen?.length > 0;
    }

    voegDifferentiatieToe(leerlingen: Leerling[], differentiatiegroepen: Differentiatiegroep[], leerlingenVanLesgroep: Leerling[]) {
        if (this.bulkDifferentiatie) {
            const bevatGedifferentieerdeItems =
                this.bulkDifferentiatie.selectedBijlagen.some(this.heeftDifferentiatie()) ||
                this.bulkDifferentiatie.selectedMappen.some(this.heeftDifferentiatie());

            if (bevatGedifferentieerdeItems) {
                this.openBulkDifferentiatieGuard(leerlingen, differentiatiegroepen);
            } else {
                this.voegBulkDifferentiatieToe(leerlingen, differentiatiegroepen, false);
            }
        } else {
            this.voegIndividueleDifferentiatieToe(leerlingen, differentiatiegroepen, leerlingenVanLesgroep);
        }

        this.differentiatiegroepen$.next([]);
        this.differentiatieleerlingen$.next([]);
    }

    voegIndividueleDifferentiatieToe(
        leerlingen: Leerling[],
        differentiatiegroepen: Differentiatiegroep[],
        leerlingenVanLesgroep: Leerling[]
    ) {
        const object = {
            ...this.differentiatieObject,
            differentiatiegroepen: [...this.differentiatieObject!.differentiatiegroepen, ...differentiatiegroepen],
            differentiatieleerlingen: [...this.differentiatieObject!.differentiatieleerlingen, ...leerlingen]
        };

        this.differentiatiegroepen$.next([...this.differentiatiegroepen$.value, ...differentiatiegroepen]);
        this.differentiatieleerlingen$.next([...this.differentiatieleerlingen$.value, ...leerlingen]);
        if (leerlingen.length === leerlingenVanLesgroep.length) {
            this.differentiatieleerlingen$.next([]);
            object.differentiatieleerlingen = [];
        }

        if ('bijlagen' in this.differentiatieObject!) {
            this.jaarbijlageDataService.saveJaarbijlageMap(object as BijlageMapFieldsFragment, this.abstractSwId);
        } else {
            this.jaarbijlageDataService.saveJaarbijlage(
                object as BijlageFieldsFragment,
                this.abstractSwId,
                this.isSjabloon,
                this._selectedMap$.value
            );
        }
        this.closeDifferentiatie();
    }

    openBulkDifferentiatieGuard(leerlingen: Leerling[], differentiatiegroepen: Differentiatiegroep[]) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Differentiatie vervangen of aanvullen?';
        popup.message = 'Er zijn jaarbijlagen of mappen met differentiaties. Wil je deze vervangen of aanvullen?';
        popup.outlineConfirmKnop = true;
        popup.actionLabel = 'Aanvullen';
        popup.icon = 'toevoegen';
        popup.buttonColor = 'positive';
        popup.cancelLabel = 'Vervangen';
        popup.cancelIcon = 'verversen';
        popup.cancelButtonColor = 'primary';

        popup.onConfirmFn = () => {
            this.voegBulkDifferentiatieToe(leerlingen, differentiatiegroepen, false);
            return true;
        };
        popup.onCancelFn = () => this.voegBulkDifferentiatieToe(leerlingen, differentiatiegroepen, true);
    }

    voegBulkDifferentiatieToe(leerlingen: Leerling[], differentiatiegroepen: Differentiatiegroep[], vervangen: boolean) {
        const mapIds = this.bulkDifferentiatie!.selectedMappen.map(toId);
        const leerlingIds = leerlingen.map(toId);
        const differentiatiegroepIds = differentiatiegroepen.map(toId);

        this.jaarbijlageDataService.bulkDifferentierenJaarbijlagen(
            this.bulkDifferentiatie!.selectedBijlagen,
            mapIds,
            this.abstractSwId,
            leerlingIds,
            differentiatiegroepIds,
            vervangen
        );

        setTimeout(() => {
            // Timeout nodig, omdat we terugkomen van een andere sidebarpage en de jaarbijlagen viewchild nog niet direct weer beschikbaar is.
            this.jaarbijlagen.closeBulkacties();
        });

        this.closeDifferentiatie();
    }

    onSidebarIconClick(page: SidebarPage) {
        if (page.onIconClick) {
            page.onIconClick();
        } else {
            this.sidebarService.previousPage();
        }
    }

    closeSidebar() {
        if (this.jaarbijlagen && this.jaarbijlagen.isUploading()) {
            this.openUploadGuard();
        } else {
            if (this.jaarbijlagen) {
                this.jaarbijlagen.closeBulkacties();
            }
            this.sidebarService.closeSidebar();
        }
    }

    onCancelClick() {
        this.isUrlFormOpen$ = of(false);
        this.isBijlageFormOpen$ = of(false);
    }

    bijlagenAdded(data: { mappen: BijlageMapFieldsFragment[]; bijlagen: BijlageFieldsFragment[] }) {
        this.jaarbijlageDataService
            .bijlagenToevoegenAanAbstractStudiewijzer(
                this.abstractSwId,
                data.bijlagen,
                data.mappen,
                get(this._selectedMap$.value, 'id')!,
                this.isSjabloon
            )
            .subscribe(() => (this.showToevoegenGelukt = true));

        const newPage = this._selectedMap$.value
            ? ({
                  titel: this._selectedMap$.value.naam,
                  icon: 'pijlLinks',
                  iconClickable: true,
                  pagenumber: 3,
                  onIconClick: () => {
                      this.jaarbijlagen.deselecteerMap();
                  }
              } as SidebarPage)
            : bijlagenSidebarPage;

        this.sidebarService.changePage(newPage);
        this.changeDetector.markForCheck();
    }

    toSelectSjabloonPage() {
        this.sidebarService.changePage(selecteerSjabloonSidebarPage);
    }

    toSelectStudiewijzerPage() {
        this.sidebarService.changePage(selecteerStudiewijzerSidebarPage);
    }

    onSelectMap(bijlageMap: BijlageMap | undefined) {
        this._selectedMap$.next(bijlageMap as BijlageMapFieldsFragment);
    }

    onStudiewijzerSelect(studiewijzer: Studiewijzer) {
        this.sidebarService.changePage({ ...selecteerBijlagenSidebarPage, titel: studiewijzer.lesgroep.naam });
        this.selectedAbstractStudiewijzer = studiewijzer;
        this.selectedJaarbijlagen$ = this.jaarbijlageDataService.getJaarbijlagen(studiewijzer.id);
    }

    onSjabloonSelect(sjabloon: Sjabloon) {
        this.sidebarService.changePage({ ...selecteerBijlagenSidebarPage, titel: sjabloon.naam });
        this.selectedAbstractStudiewijzer = sjabloon;
        this.selectedJaarbijlagen$ = this.jaarbijlageDataService.getJaarbijlagen(sjabloon.id);
    }

    private openUploadGuard() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };
        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, ConfirmationDialogComponent);

        popup.title = 'Let op, er zijn nog bestanden aan het uploaden';
        popup.message = 'Als je het overzicht sluit worden de uploads afgebroken. Weet je zeker dat je het overzicht wilt sluiten?';
        popup.actionLabel = 'Ja, sluit overzicht';
        popup.cancelLabel = 'Terug naar overzicht';

        popup.onConfirmFn = () => {
            if (this.jaarbijlagen) {
                this.jaarbijlagen.closeBulkacties();
                // De uploads kunnen klaar zijn op het moment als deze subscription uitgevoerd wordt.
                if (this.jaarbijlagen.uploadLijst) {
                    this.jaarbijlagen.uploadLijst.cancelAllUploads();
                }
            }

            this.sidebarService.closeSidebar();
            return true;
        };
    }
}
