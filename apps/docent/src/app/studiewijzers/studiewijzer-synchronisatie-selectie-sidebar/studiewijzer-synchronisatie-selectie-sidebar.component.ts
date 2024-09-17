import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SjabloonViewQuery, namedOperations } from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { getYear } from 'date-fns';
import { flatMap, get, isNil } from 'lodash-es';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap, take, tap } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { Studiewijzer, SynchronisatieStudiewijzerOverzichtView } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import {
    IconGroep,
    IconOntkoppelen,
    IconPijlLinks,
    IconReeks,
    IconSjabloon,
    IconSynchroniseren,
    IconToevoegen,
    provideIcons
} from 'harmony-icons';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { accent_positive_1 } from '../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { MessageComponent } from '../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SelectableStudiewijzerComponent } from '../selectable-studiewijzer/selectable-studiewijzer.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { WeekSelectiePopupComponent } from '../studiewijzer-overzicht/edit-studiewijzer-sidebar/week-selectie-popup/week-selectie-popup.component';
import { StudiewijzerOntkoppelenPopupComponent } from './studiewijzer-ontkoppelen-popup/studiewijzer-ontkoppelen-popup.component';

interface StudiewijzerFormControl {
    checked: boolean;
    studiewijzer: Studiewijzer;
}

@Component({
    selector: 'dt-studiewijzer-synchronisatie-selectie-sidebar',
    templateUrl: './studiewijzer-synchronisatie-selectie-sidebar.component.html',
    styleUrls: ['./studiewijzer-synchronisatie-selectie-sidebar.component.scss'],
    animations: [slideInUpOnEnterAnimation({ duration: 200 }), slideOutDownOnLeaveAnimation({ duration: 100 })],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        FormsModule,
        ReactiveFormsModule,
        SelectableStudiewijzerComponent,
        OutlineButtonComponent,
        ButtonComponent,
        TooltipDirective,
        BackgroundIconComponent,
        SpinnerComponent,
        MessageComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconPijlLinks, IconSynchroniseren, IconReeks, IconGroep, IconOntkoppelen, IconToevoegen, IconSjabloon)]
})
export class StudiewijzerSynchronisatieSelectieSidebarComponent extends BaseSidebar implements OnInit, OnDestroy {
    public sidebarService = inject(SidebarService);
    private medewerkerService = inject(MedewerkerDataService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private sjabloonDataService = inject(SjabloonDataService);
    private formBuilder = inject(UntypedFormBuilder);
    private activatedRoute = inject(ActivatedRoute);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private deviceService = inject(DeviceService);
    private viewContainerRef = inject(ViewContainerRef);
    @ViewChild('startWeekLabel', { read: ViewContainerRef }) startWeekLabel: ViewContainerRef;
    @ViewChild('startweekButton', { read: ViewContainerRef }) startweekButton: ViewContainerRef;
    @ViewChildren('ontkoppelIcon', { read: ViewContainerRef }) ontkoppelIcons: QueryList<ViewContainerRef>;

    @Input() gesynchroniseerdeStudiewijzers: SjabloonViewQuery['sjabloonView']['sjabloon']['gesynchroniseerdeStudiewijzers'] = [];
    @Input() synchronisatieStartweek: number;

    onShowToevoegenMessage = output<string>();

    schooljaar = getYear(getSchooljaar(new Date()).start);
    huidigeMedewerker: string;
    studiewijzerOverzichtViews$: Observable<Optional<SynchronisatieStudiewijzerOverzichtView[]>>;
    studiewijzerForm = new UntypedFormGroup({});
    studiewijzerFormSub: Subscription;
    formDisabled = true;
    weeknummer: number;
    showToevoegenStudiewijzers$ = new BehaviorSubject(false);
    inSidebarMessage$ = new BehaviorSubject<Optional<string>>(undefined);

    loadingStudiewijzers = false;
    studiewijzerIdOntkoppelenInProgress: string;

    public accent_positive_1 = accent_positive_1;

    ngOnInit() {
        this.showToevoegenStudiewijzers$.next(this.gesynchroniseerdeStudiewijzers.length === 0);
        this.huidigeMedewerker = this.medewerkerService.medewerkerUuid;
        const nietGesynchroniseerdeStudiewijzers = (studiewijzer: Studiewijzer) =>
            !this.gesynchroniseerdeStudiewijzers.some((syncSw) => syncSw.id === studiewijzer.id);

        const heeftStudiewijzers = (view: SynchronisatieStudiewijzerOverzichtView) =>
            view.studiewijzers.length > 0 || view.categorieen.some((cat) => cat.studiewijzers.length > 0);

        this.studiewijzerOverzichtViews$ = this.showToevoegenStudiewijzers$.pipe(
            distinctUntilChanged(),
            tap((showToevoegenSws) => (this.loadingStudiewijzers = showToevoegenSws)),
            switchMap((showToevoegen) =>
                showToevoegen
                    ? this.studiewijzerDataService
                          .getSynchronisatieStudiewijzerOverzichtView([this.schooljaar, this.schooljaar + 1], this.huidigeMedewerker)
                          .pipe(
                              map((studiewijzerViews: SynchronisatieStudiewijzerOverzichtView[]) =>
                                  studiewijzerViews
                                      .map((view) => ({
                                          studiewijzers: view.studiewijzers.filter(nietGesynchroniseerdeStudiewijzers),
                                          categorieen: view.categorieen.map((categorie) => ({
                                              ...categorie,
                                              studiewijzers: categorie.studiewijzers.filter(nietGesynchroniseerdeStudiewijzers)
                                          })),
                                          schooljaar: view.schooljaar
                                      }))
                                      .filter(heeftStudiewijzers)
                              ),
                              tap((studiewijzerViews: SynchronisatieStudiewijzerOverzichtView[]) => {
                                  const studiewijzers = new Map<number, StudiewijzerFormControl[]>();
                                  studiewijzerViews.forEach((view) => {
                                      const toFormControlObject = (studiewijzer: Studiewijzer) => ({
                                          checked: false,
                                          studiewijzer
                                      });
                                      const losseStudiewijzers = view.studiewijzers.map(toFormControlObject);
                                      const categorieStudiewijzers = flatMap(view.categorieen, (cat) => cat.studiewijzers).map(
                                          toFormControlObject
                                      );

                                      studiewijzers.set(view.schooljaar, [...losseStudiewijzers, ...categorieStudiewijzers]);
                                  });

                                  studiewijzers.forEach((value, key) => {
                                      this.studiewijzerForm.removeControl(String(key));
                                      this.studiewijzerForm.addControl(String(key), this.formBuilder.array(value));
                                  });

                                  this.disableGesynchroniseerdeStudiewijzer();
                              }),
                              shareReplayLastValue()
                          )
                    : of(undefined)
            ),
            tap(() => (this.loadingStudiewijzers = false))
        );

        this.studiewijzerFormSub = this.studiewijzerOverzichtViews$
            .pipe(
                take(1),
                switchMap(() => this.studiewijzerForm.valueChanges)
            )
            .subscribe((controls) => {
                this.popupService.closePopUp();

                const checked = get(controls, this.schooljaar, []).some((control: StudiewijzerFormControl) => control.checked)
                    ? get(controls, this.schooljaar, []).find((control: StudiewijzerFormControl) => control.checked)
                    : get(controls, this.schooljaar + 1, []).find((control: StudiewijzerFormControl) => control.checked);

                this.formDisabled = !checked;

                if (get(checked, 'studiewijzer.schooljaar', 0) === this.schooljaar) {
                    this.disableFormArraySchooljaar(this.schooljaar + 1);
                    const vestigingId = checked.studiewijzer.vestigingId;
                    this.disableFormControlVestigingId(vestigingId, this.schooljaar);
                } else if (get(checked, 'studiewijzer.schooljaar', 0) === this.schooljaar + 1) {
                    this.disableFormArraySchooljaar(this.schooljaar);
                    const vestigingId = checked.studiewijzer.vestigingId;
                    this.disableFormControlVestigingId(vestigingId, this.schooljaar + 1);
                } else {
                    this.enableFormArrays();
                }

                this.disableGesynchroniseerdeStudiewijzer();
            });

        this.weeknummer = this.synchronisatieStartweek;
    }

    onToevoegenClick() {
        this.showToevoegenStudiewijzers$.next(true);
    }

    ngOnDestroy() {
        this.studiewijzerFormSub.unsubscribe();
    }

    getSchooljaarNaam(studiewijzerOverzichtView: SynchronisatieStudiewijzerOverzichtView): string {
        return `Schooljaar ${studiewijzerOverzichtView.schooljaar}-${studiewijzerOverzichtView.schooljaar + 1}`;
    }

    get checkedControlSchooljaarNaam() {
        let schooljaar: number;

        if (this.studiewijzerForm.value[this.schooljaar]) {
            schooljaar = this.studiewijzerForm.value[this.schooljaar].find((control: StudiewijzerFormControl) => control.checked)
                ?.studiewijzer.schooljaar;
        } else {
            schooljaar = this.studiewijzerForm.value[this.schooljaar + 1].find((control: StudiewijzerFormControl) => control.checked)
                ?.studiewijzer.schooljaar;
        }

        return `${schooljaar}/${schooljaar + 1}`;
    }

    disableFormArraySchooljaar(schooljaar: number) {
        if (this.studiewijzerForm.get(String(schooljaar))) {
            (this.studiewijzerForm.get(String(schooljaar)) as UntypedFormArray).disable({ emitEvent: false });
        }
    }

    disableFormControlVestigingId(vestigingId: string, schooljaar: number) {
        if (this.studiewijzerForm.get(String(schooljaar))) {
            (this.studiewijzerForm.get(String(schooljaar)) as UntypedFormArray).controls
                .filter((control) => control.value.studiewijzer.vestigingId !== vestigingId)
                .forEach((control) => control.disable({ emitEvent: false }));
        }
    }

    disableGesynchroniseerdeStudiewijzer() {
        if (this.gesynchroniseerdeStudiewijzers.length > 0) {
            const studiewijzer = this.gesynchroniseerdeStudiewijzers[0];
            const teDisablenSchooljaar = this.schooljaar === studiewijzer.schooljaar ? this.schooljaar + 1 : this.schooljaar;
            this.disableFormArraySchooljaar(teDisablenSchooljaar);
            this.disableFormControlVestigingId(studiewijzer.vestigingId, studiewijzer.schooljaar);
        }
    }

    enableFormArrays() {
        this.studiewijzerForm.enable({ emitEvent: false });
    }

    selecteerWeek = (weeknummer: number) => {
        this.weeknummer = weeknummer;
        this.changeDetector.detectChanges();
    };

    selecteerStartweek() {
        if (this.synchronisatieStartweek) {
            return;
        }
        const popupSettings = WeekSelectiePopupComponent.getDefaultPopupsettings(this.deviceService.isPhone());
        popupSettings.title = 'Inplannen vanaf';
        popupSettings.headerLabel = this.checkedControlSchooljaarNaam;

        const popup = this.popupService.popup(this.startweekButton, popupSettings, WeekSelectiePopupComponent);
        popup.cijferPeriodeWeken$ = this.studiewijzerDataService.getCijferPeriodeWekenMetVakantie(
            this.lesgroepVanCheckedStudiewijzer,
            this.studiewijzerIdVanCheckedStudiewijzer
        );
        popup.geselecteerdeWeek = this.weeknummer;
        popup.selecteerWeek = this.selecteerWeek;
    }

    getControlName(studiewijzerView: SynchronisatieStudiewijzerOverzichtView, studiewijzerIndex: number, categorieIndex?: number) {
        let controlName = 0;

        if (!isNil(categorieIndex)) {
            controlName += studiewijzerView.studiewijzers.length;

            for (let index = 0; index < categorieIndex; index++) {
                controlName += studiewijzerView.categorieen[index].studiewijzers.length;
            }
        }

        return (controlName += studiewijzerIndex);
    }

    openOntkoppelPopup(studiewijzer: SjabloonViewQuery['sjabloonView']['sjabloon']['gesynchroniseerdeStudiewijzers'][number]) {
        const popupSettings = StudiewijzerOntkoppelenPopupComponent.defaultPopupsettings;
        popupSettings.margin.right = 10;

        const icon = this.ontkoppelIcons.find((ontkoppelIcon) => ontkoppelIcon.element.nativeElement.id === studiewijzer.id)!;
        const popup = this.popupService.popup(icon, popupSettings, StudiewijzerOntkoppelenPopupComponent);
        popup.studiewijzer = studiewijzer as Studiewijzer;
        popup.bewaarFn = () => this.ontkoppel(studiewijzer as Studiewijzer, false);
        popup.verwijderFn = () => this.ontkoppel(studiewijzer as Studiewijzer, true);
    }

    openWeekSelectiePopup() {
        const eersteSyncedSw = this.gesynchroniseerdeStudiewijzers[0];

        const popupSettings = WeekSelectiePopupComponent.getDefaultPopupsettings(this.deviceService.isPhone());
        popupSettings.preferedDirection = [PopupDirection.Top, PopupDirection.Bottom];
        popupSettings.title = 'Inplannen vanaf';
        popupSettings.headerLabel = `${eersteSyncedSw.schooljaar}/${eersteSyncedSw.schooljaar + 1}`;

        const popup = this.popupService.popup(this.startWeekLabel, popupSettings, WeekSelectiePopupComponent);

        popup.cijferPeriodeWeken$ = this.studiewijzerDataService.getCijferPeriodeWekenMetVakantie(
            eersteSyncedSw.lesgroep.id,
            eersteSyncedSw.id
        );
        popup.geselecteerdeWeek = this.weeknummer;
        popup.selecteerWeek = (weeknummer) => this.updateStartWeek(weeknummer);
    }

    updateStartWeek(startweek: number) {
        const popup = this.popupService.popup(
            this.viewContainerRef,
            ConfirmationDialogComponent.defaultPopupSettings,
            ConfirmationDialogComponent
        );

        popup.title = 'Let op, je wijzigt de startweek';
        popup.message =
            'Lesitems uit dit sjabloon worden opnieuw ingepland vanaf de gekozen startweek in gesynchroniseerde studiewijzers. <br><br> Wil je de wijziging opslaan?';
        popup.cancelLabel = 'Annuleren';
        popup.actionLabel = 'Wijziging opslaan';
        popup.showLoaderOnConfirm = true;
        popup.confirmGtmTag = 'synchronisatie-startweek-wijzigen';
        popup.onCancelFn = () => {
            this.popupService.closePopUp();
        };
        popup.onConfirmFn = () => {
            this.sjabloonDataService.verschuifSjabloonContent(this.activatedRoute.snapshot.paramMap.get('id')!, startweek).subscribe(() => {
                this.popupService.closePopUp();
                this.sidebarService.closeSidebar();
                this.onShowToevoegenMessage.emit(`Startweek is gewijzigd naar week ${startweek}`);
            });

            return true;
        };
    }

    ontkoppel(studiewijzer: Studiewijzer, verwijderItems: boolean) {
        const sjabloonId = this.activatedRoute.snapshot.paramMap.get('id')!;
        this.sjabloonDataService
            .ontkoppelVanSjabloon(sjabloonId, studiewijzer.id, verwijderItems, [namedOperations.Query.sjabloonView])
            .subscribe(() => {
                this.gesynchroniseerdeStudiewijzers = this.gesynchroniseerdeStudiewijzers.filter((sw) => sw.id !== studiewijzer.id);
                if (this.gesynchroniseerdeStudiewijzers.length === 0) {
                    this.onShowToevoegenMessage.emit(`${studiewijzer.lesgroep.naam} is ontkoppeld`);
                    this.sidebarService.closeSidebar();
                } else {
                    this.inSidebarMessage$.next(`${studiewijzer.lesgroep.naam} is ontkoppeld`);
                }
                this.changeDetector.detectChanges();
            });
        this.popupService.closePopUp();
        this.studiewijzerIdOntkoppelenInProgress = studiewijzer.id;
        this.changeDetector.detectChanges();
    }

    onSubmit() {
        const controls: StudiewijzerFormControl[] =
            this.studiewijzerForm.value[this.schooljaar] || this.studiewijzerForm.value[this.schooljaar + 1];
        const checkedStudiewijzers = controls
            .filter((control: StudiewijzerFormControl) => control.checked)
            .map((control: StudiewijzerFormControl) => control.studiewijzer);
        const sjabloonId = this.activatedRoute.snapshot.paramMap.get('id')!;

        this.sjabloonDataService.synchroniseerMetSjabloon(sjabloonId, this.weeknummer, checkedStudiewijzers).subscribe(() => {
            this.showToevoegenStudiewijzers$.next(false);
            controls
                .filter((control: StudiewijzerFormControl) => control.checked)
                .forEach((control: StudiewijzerFormControl) => (control.checked = false));
            const lesgroepnamen = checkedStudiewijzers.map((sw) => sw.lesgroep.naam).join(', ');
            this.inSidebarMessage$.next(
                `Sjabloon gesynchroniseerd naar <b>${lesgroepnamen}</b> en start in <b>week ${this.weeknummer}</b>`
            );
        });
    }

    annuleer() {
        if (this.showToevoegenStudiewijzers$.value) {
            this.showToevoegenStudiewijzers$.next(false);
            const controls = this.studiewijzerForm.value[this.schooljaar] || this.studiewijzerForm.value[this.schooljaar + 1];
            controls
                .filter((control: StudiewijzerFormControl) => control.checked)
                .forEach((control: StudiewijzerFormControl) => (control.checked = false));
        } else {
            this.sidebarService.closeSidebar();
        }
    }

    get heeftCheckedControls(): boolean {
        if (this.studiewijzerForm) {
            if (this.studiewijzerForm.value[this.schooljaar]) {
                return (
                    this.studiewijzerForm.value[this.schooljaar].filter((control: StudiewijzerFormControl) => control.checked).length > 0
                );
            } else if (this.studiewijzerForm.value[this.schooljaar + 1]) {
                return (
                    this.studiewijzerForm.value[this.schooljaar + 1].filter((control: StudiewijzerFormControl) => control.checked).length >
                    0
                );
            }

            return false;
        }

        return false;
    }

    get lesgroepVanCheckedStudiewijzer(): string {
        const controls = this.studiewijzerForm.value[this.schooljaar] || this.studiewijzerForm.value[this.schooljaar + 1];
        return controls.find((control: StudiewijzerFormControl) => control.checked).studiewijzer.lesgroep.id;
    }

    get studiewijzerIdVanCheckedStudiewijzer(): string {
        const controls = this.studiewijzerForm.value[this.schooljaar] || this.studiewijzerForm.value[this.schooljaar + 1];
        return controls.find((control: StudiewijzerFormControl) => control.checked).studiewijzer.id;
    }

    get sidebarTitel(): string {
        if (this.gesynchroniseerdeStudiewijzers.length === 0) {
            return 'Synchroniseren naar';
        } else if (this.showToevoegenStudiewijzers$.value) {
            return 'Studiewijzer toevoegen';
        } else {
            return 'Bewerk synchronisaties';
        }
    }
}
