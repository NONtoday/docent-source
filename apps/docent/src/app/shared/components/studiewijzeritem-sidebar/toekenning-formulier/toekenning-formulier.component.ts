import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import {
    AbstractControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators
} from '@angular/forms';
import { collapseAnimation } from 'angular-animations';
import { getHours, getMinutes, isBefore, isEqual as isEqualDate, isSameDay, isSameMinute, setHours, startOfDay } from 'date-fns';
import { CounterTagComponent, IconDirective, SpinnerComponent, TagComponent, TooltipDirective } from 'harmony';
import {
    IconChevronBoven,
    IconGroep,
    IconHuiswerk,
    IconKalenderDag,
    IconLeerdoel,
    IconLesstof,
    IconLijst,
    IconLink,
    IconName,
    IconNotificatie,
    IconPijlLinks,
    IconReacties,
    IconTijd,
    IconToets,
    IconToetsGroot,
    IconToevoegen,
    IconUitklappenRechts,
    provideIcons
} from 'harmony-icons';
import { flatMap, isEqual, orderBy } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import {
    Afspraak,
    AfspraakQuery,
    AfspraakToekenning,
    BasisSjabloonFieldsFragment,
    BijlageFieldsFragment,
    DagToekenning,
    Differentiatiegroep,
    HuiswerkType,
    Leerling,
    Lesgroep,
    Methode,
    MethodenQuery,
    RecenteMethode,
    Sjabloon,
    Toekenning,
    ToekomendeAfsprakenQuery,
    WeekToekenning
} from '../../../../../generated/_types';
import { methodeInhoudToBijlage } from '../../../../core/converters/bijlage.converters';
import { SaveToekenningContainer } from '../../../../core/models';
import { Schooljaar } from '../../../../core/models/schooljaar.model';
import { MethodenTab, ToSaveMethode } from '../../../../core/models/studiewijzers/methode.model';
import { shareReplayLastValue } from '../../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { DifferentiatiegroepenDataService } from '../../../../core/services/differentiatiegroepen-data.service';
import { MedewerkerDataService } from '../../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { ConceptInleveropdrachtStartVoorEindValidator } from '../../../../core/validators/conceptInleveropdracht-start-voor-eind.validator';
import { startVoorEindValidator } from '../../../../core/validators/startVoorEind.validator';
import { ActionsPopupComponent, opslaanEnKopieerButton } from '../../../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { DatepickerComponent, DatepickerHighlightDay } from '../../../../rooster-shared/components/datepicker/datepicker.component';
import { FormCheckboxComponent } from '../../../../rooster-shared/components/form-checkbox/form-checkbox.component';
import { FormDropdownComponent } from '../../../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { LesuurComponent } from '../../../../rooster-shared/components/lesuur/lesuur.component';
import { OmschrijvingEnBijlageComponent } from '../../../../rooster-shared/components/omschrijving-en-bijlage/omschrijving-en-bijlage.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { TimeInputHelperDirective } from '../../../../rooster-shared/directives/time-input-helper.directive';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { RoosterToetsPipe } from '../../../../rooster-shared/pipes/roostertoets.pipe';
import { ToekenningDatumPipe } from '../../../../rooster-shared/pipes/toekenningDatum.pipe';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';
import { addVoorloopNul, formatAsISODate, getSchooljaar } from '../../../../rooster-shared/utils/date.utils';
import { DropDownOption, dagenVanDeWeekOptions, herinneringOptions } from '../../../../rooster-shared/utils/dropdown.util';
import { MAX_INT_VALUE, Optional, copyObject, equalsId, hhmmToDate, notEqualsId, toId } from '../../../../rooster-shared/utils/utils';
import { MethodeDataService } from '../../../../studiewijzers/methode-data.service';
import { SjabloonDataService } from '../../../../studiewijzers/sjabloon-data.service';
import { KleurToTagColorPipe } from '../../../pipes/color-to-text-color.pipe';
import { OmschrijvingPlaceholderPipe } from '../../../pipes/omschrijving-placeholder.pipe';
import { replaceInArray } from '../../../utils/array.utils';
import { isAfspraakToekenning, mapLeerdoelenNaarBulletList } from '../../../utils/toekenning.utils';
import { groepTooltip, leerlingenTooltip } from '../../../utils/tooltips.utils';
import { SelecteerBijlagePopupComponent } from '../../bijlage/selecteer-bijlage-popup/selecteer-bijlage-popup.component';
import { UrlToevoegenPopupComponent } from '../../bijlage/url-toevoegen-popup/url-toevoegen-popup.component';
import { DifferentiatieSelectieComponent } from '../../differentiatie/differentiatie-selectie/differentiatie-selectie.component';
import { ConferenceDateRange, EditorFormControlComponent } from '../../editor-form-control/editor-form-control.component';
import {
    LesgroepControl,
    LesgroepSynchronisatieToekenningFormControlComponent
} from '../../lesgroep-synchronisatie-toekenning-form-control/lesgroep-synchronisatie-toekenning-form-control.component';
import { LesmomentSelectiePopupComponent } from '../../lesmoment-selectie-popup/lesmoment-selectie-popup.component';
import { MethodeInhoudSelectieComponent } from '../../methode-inhoud-selectie/methode-inhoud-selectie.component';
import { MethodeSelectieComponent } from '../../methode-selectie/methode-selectie.component';
import { RangedDatepickerComponent } from '../../ranged-datepicker/ranged-datepicker.component';
import { SynchroniseerItemMetSjabloonComponent } from '../../synchroniseer-item-met-sjabloon/synchroniseer-item-met-sjabloon.component';
import { ZichtbaarheidsToggleFormControlComponent } from '../../zichtbaarheids-toggle-form-control/zichtbaarheids-toggle-form-control.component';

@Component({
    selector: 'dt-toekenning-formulier',
    templateUrl: './toekenning-formulier.component.html',
    styleUrls: ['./toekenning-formulier.component.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MethodeSelectieComponent,
        MethodeInhoudSelectieComponent,
        SpinnerComponent,
        DifferentiatieSelectieComponent,
        FormsModule,
        ReactiveFormsModule,
        SynchroniseerItemMetSjabloonComponent,
        LesuurComponent,
        TooltipDirective,
        LesgroepSynchronisatieToekenningFormControlComponent,
        ZichtbaarheidsToggleFormControlComponent,
        TagComponent,
        CounterTagComponent,
        FormDropdownComponent,
        TimeInputHelperDirective,
        FormCheckboxComponent,
        RangedDatepickerComponent,
        DatepickerComponent,
        BackgroundIconComponent,
        EditorFormControlComponent,
        OmschrijvingEnBijlageComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe,
        VolledigeNaamPipe,
        ToekenningDatumPipe,
        RoosterToetsPipe,
        DtDatePipe,
        OmschrijvingPlaceholderPipe,
        KleurToTagColorPipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconGroep,
            IconToevoegen,
            IconLeerdoel,
            IconChevronBoven,
            IconLijst,
            IconReacties,
            IconHuiswerk,
            IconToets,
            IconToetsGroot,
            IconLesstof,
            IconNotificatie,
            IconKalenderDag,
            IconTijd,
            IconUitklappenRechts,
            IconLink,
            IconPijlLinks
        )
    ]
})
export class ToekenningFormulierComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    private medewerkerDataService = inject(MedewerkerDataService);
    private viewContainerRef = inject(ViewContainerRef);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    private sjabloonDataService = inject(SjabloonDataService);
    private formBuilder = inject(UntypedFormBuilder);
    private methodeService = inject(MethodeDataService);
    public sidebarService = inject(SidebarService);
    private differentiatieDataService = inject(DifferentiatiegroepenDataService);
    @ViewChild('titel', { read: ElementRef, static: false }) titelRef: ElementRef;
    @ViewChild('uploadIcon', { read: ViewContainerRef }) uploadIcon: ViewContainerRef;
    @ViewChild('methodeIcon', { read: ViewContainerRef }) methodeIcon: ViewContainerRef;
    @ViewChild(OmschrijvingEnBijlageComponent) omschrijvingEnBijlage: OmschrijvingEnBijlageComponent;
    @ViewChild('afrondenOp', { read: ViewContainerRef }) afrondenOp: ViewContainerRef;
    @ViewChild('opgevenVoor', { read: ViewContainerRef }) opgevenVoorRef: ViewContainerRef;

    @Input() toekenning: Toekenning;
    @Input() toonDatepicker = false;
    @Input() magSynchroniserenMetSjabloon: boolean;
    @Input() toonLesgroepenControls: boolean;
    @Input() toonUitMethode: boolean;
    @Input() afspraak: AfspraakQuery['afspraak'];
    @Input() conceptInleveropdrachtWeekOpties: DropDownOption<number>[];
    @Input() heeftToegangTotElo: Optional<boolean>;
    @Input() heeftToegangTotSw: Optional<boolean>;
    @Input() gesynchroniseerdeSjablonen?: BasisSjabloonFieldsFragment[];
    @Input() lesgroepen: Lesgroep[];
    @Input() toekomendeAfspraken: ToekomendeAfsprakenQuery['toekomendeAfspraken'];
    @Input() inShareContent: boolean;
    @Input() openWithDirtyForm = false;
    @Input() magDifferentiatieTonen = true;
    @Input() magDifferentiatieBewerken: boolean;

    onSaveToekenning = output<SaveToekenningContainer>();
    onCancel = output<() => void>();

    activeMethodenTab$ = new BehaviorSubject<MethodenTab>('recent');
    studiewijzeritemForm: UntypedFormGroup;
    opgevenVoorAfspraak: Optional<ToekomendeAfsprakenQuery['toekomendeAfspraken'][number]>;
    uploadingFiles = new Subject<FileList>();
    bijlagen: BijlageFieldsFragment[];
    submitted: boolean;
    lesgroepenControls$: Observable<LesgroepControl[]>;
    gesynchroniseerdSjabloon: Optional<Sjabloon>;
    studiewijzerItem: Toekenning['studiewijzeritem'];
    schooljaar$: Observable<Schooljaar>;

    // Differentiatie
    leerlingenVanLesgroep$: Observable<Leerling[]>;
    differentiatiegroepen$ = new BehaviorSubject<Differentiatiegroep[]>([]);
    differentiatieleerlingen$ = new BehaviorSubject<Leerling[]>([]);
    showDifferentiatiePage$ = new BehaviorSubject(false);
    differentiatie$: Observable<[Leerling[], Differentiatiegroep[]]>;
    toonIedereenTag$: Observable<boolean>;

    // Methode
    uitMethodeToegestaan$: Observable<boolean>;
    methodeSelectie$ = new BehaviorSubject<boolean>(false);
    methodeSubject$ = new BehaviorSubject<Optional<Methode>>(null);
    methodeInhoud$: Observable<Optional<Methode>>;

    // Conferencedata
    conferenceDateRange: ConferenceDateRange;
    plagiaatControleerbaar$: Observable<boolean>;

    // dropdown helpers
    dagenInWeek = dagenVanDeWeekOptions;
    herinneringOptions = herinneringOptions;
    typeOpties: DropDownOption<HuiswerkType>[] = [
        { text: 'Huiswerk', value: HuiswerkType.HUISWERK, icon: 'huiswerk', iconColor: 'fg-primary-normal' },
        { text: 'Toets', value: HuiswerkType.TOETS, icon: 'toets', iconColor: 'fg-warning-normal' },
        { text: 'Grote toets', value: HuiswerkType.GROTE_TOETS, icon: 'toetsGroot', iconColor: 'fg-negative-normal' },
        { text: 'Lesstof', value: HuiswerkType.LESSTOF, icon: 'lesstof', iconColor: 'fg-positive-normal' }
    ];
    iconNotificatie: IconName = 'notificatie';
    iconVandaag: IconName = 'kalenderDag';
    iconDeadline: IconName = 'tijd';
    iconStart: IconName = 'uitklappenRechts';

    groepTooltip = groepTooltip;
    leerlingenTooltip = leerlingenTooltip;

    public isOmschrijvingOpen = true;
    public isNotitieOpen = false;
    public isLeerdoelenOpen = false;
    public toonDifferentiatie$ = new BehaviorSubject<boolean>(true);
    public highlightDagen: DatepickerHighlightDay[];

    private lesgroepId$ = new BehaviorSubject<Optional<string>>(undefined);
    private destroy$ = new Subject<boolean>();

    ngOnInit(): void {
        this.isNotitieOpen = !!this.toekenning.studiewijzeritem.notitie;
        this.isLeerdoelenOpen = !!this.toekenning.studiewijzeritem.leerdoelen;
        this.bijlagen = this.toekenning.studiewijzeritem.bijlagen.map(copyObject) as BijlageFieldsFragment[];
        this.toonIedereenTag$ = combineLatest([this.differentiatiegroepen$, this.differentiatieleerlingen$]).pipe(
            map(([groepen, leerlingen]) => groepen.length === 0 && leerlingen.length === 0),
            startWith(this.toekenning.differentiatiegroepen?.length === 0 && this.toekenning.differentiatieleerlingen?.length === 0)
        );

        this.plagiaatControleerbaar$ = this.medewerkerDataService.isPlagiaatControleerbaar();

        const inleverperiode = this.toekenning.studiewijzeritem.inleverperiode;
        const conceptInleveropdracht = this.toekenning.studiewijzeritem.conceptInleveropdracht;
        const weekToekenning = <WeekToekenning>this.toekenning;

        this.studiewijzeritemForm = new UntypedFormGroup({
            huiswerkType: new UntypedFormControl(this.toekenning.studiewijzeritem.huiswerkType),
            titel: new UntypedFormControl(this.toekenning.studiewijzeritem.onderwerp ?? '', Validators.maxLength(150)),
            tijdsindicatie: new UntypedFormControl(this.toekenning.studiewijzeritem.tijdsindicatie),
            zichtbaarheid: new UntypedFormControl(this.toekenning.studiewijzeritem.zichtbaarVoorLeerling),
            omschrijving: new UntypedFormControl(this.toekenning.studiewijzeritem.omschrijving),
            notitie: new UntypedFormControl(this.toekenning.studiewijzeritem.notitie),
            leerdoelen: new UntypedFormControl(this.toekenning.studiewijzeritem.leerdoelen),
            notitieZichtbaarVoorLeerling: new UntypedFormControl(this.toekenning.studiewijzeritem.notitieZichtbaarVoorLeerling),
            lesgroepen: new UntypedFormGroup({}),
            inleverperiode: new UntypedFormGroup({
                range: new UntypedFormGroup(
                    {
                        begin: new UntypedFormControl(inleverperiode?.begin, Validators.required),
                        eind: new UntypedFormControl(inleverperiode?.eind, Validators.required)
                    },
                    { validators: [startVoorEindValidator('begin', 'eind')] }
                ),
                plagiaatDetectie: new UntypedFormControl(inleverperiode?.plagiaatDetectie),
                stuurBerichtBijInlevering: new UntypedFormControl(inleverperiode?.stuurBerichtBijInlevering),
                herinnering: new UntypedFormControl(inleverperiode?.herinnering)
            }),
            conceptInleveropdracht: new UntypedFormGroup(
                {
                    startWeek: new UntypedFormControl(weekToekenning?.startWeek, Validators.required),
                    eindWeek: new UntypedFormControl(weekToekenning?.eindWeek, Validators.required),
                    startDag: new UntypedFormControl(conceptInleveropdracht?.startDag, Validators.required),
                    eindDag: new UntypedFormControl(conceptInleveropdracht?.eindDag, Validators.required),
                    startTijd: new UntypedFormControl(
                        `${addVoorloopNul(conceptInleveropdracht?.startUur ?? 0)}:${addVoorloopNul(
                            conceptInleveropdracht?.startMinuut ?? 0
                        )}`,
                        Validators.required
                    ),
                    eindTijd: new UntypedFormControl(
                        `${addVoorloopNul(conceptInleveropdracht?.eindUur ?? 0)}:${addVoorloopNul(
                            conceptInleveropdracht?.eindMinuut ?? 0
                        )}`,
                        Validators.required
                    ),
                    plagiaatDetectie: new UntypedFormControl(conceptInleveropdracht?.plagiaatDetectie),
                    stuurBerichtBijInlevering: new UntypedFormControl(conceptInleveropdracht?.stuurBerichtBijInlevering),
                    herinnering: new UntypedFormControl(conceptInleveropdracht?.herinnering)
                },
                { validators: [ConceptInleveropdrachtStartVoorEindValidator] }
            )
        });
        this.studiewijzerItem = this.genereerStudiewijzeritem();

        if (this.openWithDirtyForm) {
            this.studiewijzeritemForm.markAsDirty();
        }

        if (this.toonLesgroepenControls) {
            const toLesgroepControl = (docentLesgroepen: Lesgroep[]) =>
                orderBy(
                    this.afspraak.lesgroepen.map((lesgroep) => ({
                        checked: true,
                        lesgroep,
                        disabled:
                            !docentLesgroepen.some((docentGroep) => docentGroep.id === lesgroep.id) ||
                            lesgroep.id === this.lesgroepId$.value,
                        synchroniseert: false
                    })),
                    'disabled'
                );

            this.lesgroepenControls$ = this.medewerkerDataService.getLesgroepenVanDocent().pipe(
                map(toLesgroepControl),
                tap((disabledControls) =>
                    disabledControls.forEach((control, key) => {
                        (<UntypedFormGroup>this.studiewijzeritemForm.controls['lesgroepen']).addControl(
                            String(key),
                            this.formBuilder.control({ value: control, disabled: control.disabled })
                        );
                    })
                )
            );
        }

        if (this.toonDatepicker) {
            // afspraak begin kan leeg zijn via /share
            const afspraakIsVandaag = isSameDay(this.afspraak?.begin, new Date());
            const afspraakVoorVandaag = isBefore(this.afspraak?.begin, startOfDay(new Date()));
            const nieuweToekenning = !this.toekenning.id;
            if ((afspraakIsVandaag || afspraakVoorVandaag) && nieuweToekenning) {
                // selecteer de volgende les
                const huidigeAfspraakIndex = this.toekomendeAfspraken.findIndex((afspraak) =>
                    isEqualDate(afspraak.begin, this.afspraak.begin)
                );
                this.opgevenVoorAfspraak = this.toekomendeAfspraken[huidigeAfspraakIndex + 1];
            } else {
                const toekenning = this.toekenning;
                if (isAfspraakToekenning(toekenning)) {
                    this.opgevenVoorAfspraak = this.toekomendeAfspraken.find((afspraak) =>
                        isSameMinute(afspraak.begin, toekenning.afgerondOpDatumTijd)
                    );
                }
            }
            this.studiewijzeritemForm.addControl(
                'opgevenVoor',
                new UntypedFormControl(
                    this.opgevenVoorAfspraak?.begin ?? (<DagToekenning>this.toekenning).datum ?? new Date(),
                    Validators.required
                )
            );

            const highlightAfspraken = this.toekomendeAfspraken.reduce((highlightedAfspraakOpDatum, afspraak) => {
                const datumKey = formatAsISODate(afspraak.begin);
                const geldendeAfspraak = highlightedAfspraakOpDatum.get(datumKey);
                if (!geldendeAfspraak || (!geldendeAfspraak.isRoosterToets && afspraak.isRoosterToets)) {
                    highlightedAfspraakOpDatum.set(datumKey, {
                        datum: afspraak.begin,
                        highlightColor: afspraak.isRoosterToets ? 'warning' : 'primary'
                    });
                }
                return highlightedAfspraakOpDatum;
            }, new Map());

            this.highlightDagen = Array.from(highlightAfspraken.values());

            this.schooljaar$ = this.studiewijzeritemForm.get('opgevenVoor')!.valueChanges.pipe(
                map((datum) => getSchooljaar(datum)),
                startWith(getSchooljaar(this.studiewijzeritemForm.get('opgevenVoor')!.value)),
                distinctUntilChanged()
            );

            this.studiewijzeritemForm
                .get('opgevenVoor')!
                .valueChanges.pipe(takeUntil(this.destroy$))
                .subscribe((opgevenVoor) => {
                    const afsprakenOpGekozenDag = this.toekomendeAfspraken.filter((afspraak) => isSameDay(opgevenVoor, afspraak.begin));
                    if (afsprakenOpGekozenDag.length > 1) {
                        this.opgevenVoorAfspraak = undefined;
                        const settings = LesmomentSelectiePopupComponent.defaultPopupSettings;
                        settings.offsets = { ...settings.offsets, bottom: { left: settings.width / 2, top: 38 } };
                        const popup = this.popupService.popup(this.opgevenVoorRef, settings, LesmomentSelectiePopupComponent);
                        popup.afspraken = afsprakenOpGekozenDag;
                        popup.onAfspraakSelection = (selectedAfspraak) => {
                            this.opgevenVoorAfspraak = selectedAfspraak;
                            this.changeDetector.markForCheck();
                        };
                    } else if (afsprakenOpGekozenDag.length === 1) {
                        this.opgevenVoorAfspraak = afsprakenOpGekozenDag[0];
                    } else {
                        this.opgevenVoorAfspraak = undefined;
                    }
                });
        }

        if (!this.toonDatepicker && this.toekenning.studiewijzeritem.inleverperiode) {
            this.schooljaar$ = this.inleverperiodeRangeGroup.get('begin')!.valueChanges.pipe(
                map((datum) => getSchooljaar(datum)),
                startWith(getSchooljaar(this.inleverperiodeRangeGroup.get('begin')!.value)),
                distinctUntilChanged()
            );
        }

        this.patchInleverperiode();
        this.setTeamsDate();

        this.uitMethodeToegestaan$ = this.medewerkerDataService.importUitMethodeToegestaan();

        const groepenLeerlingen$ = this.differentiatiegroepen$.pipe(map((groepen) => groepen.flatMap((groep) => groep.leerlingen)));
        const distinctLesgroepId$ = this.lesgroepId$.pipe(distinctUntilChanged());

        const leerlingenVanLesgroep$ = distinctLesgroepId$.pipe(
            switchMap((lesgroepId) =>
                combineLatest([
                    this.differentiatieDataService.getLeerlingenMetDifferentiatiegroepenVanLesgroep(lesgroepId!),
                    this.differentiatieleerlingen$,
                    groepenLeerlingen$
                ]).pipe(
                    map(([leerlingen, diffLeerlingen, diffGroepenLeerlingen]) =>
                        leerlingen.filter(
                            (leerling) => !diffLeerlingen.some(equalsId(leerling.id)) && !diffGroepenLeerlingen.some(equalsId(leerling.id))
                        )
                    ),
                    shareReplayLastValue()
                )
            )
        );

        const differentiatiegroepenVanLesgroep$ = distinctLesgroepId$.pipe(
            switchMap((lesgroepId) =>
                combineLatest([this.differentiatieDataService.getDifferentiatiegroepen(lesgroepId!), this.differentiatiegroepen$]).pipe(
                    map(([groepen, diffGroepen]) => groepen.filter((groep) => !diffGroepen.some(equalsId(groep.id)))),
                    shareReplayLastValue()
                )
            )
        );

        this.differentiatie$ = combineLatest([leerlingenVanLesgroep$, differentiatiegroepenVanLesgroep$]);
        this.differentiatiegroepen$.next(this.toekenning.differentiatiegroepen?.map(copyObject) ?? []);
        this.differentiatieleerlingen$.next(this.toekenning.differentiatieleerlingen?.map(copyObject) ?? []);
    }

    ngOnChanges(): void {
        const heeftToekenning = this.differentiatiegroepen$.value.length > 0 || this.differentiatieleerlingen$.value.length > 0;
        this.toonDifferentiatie$.next(
            (this.heeftToegangTotElo &&
                this.heeftToegangTotSw &&
                this.magDifferentiatieTonen &&
                this.lesgroepen?.length === 1 &&
                this.magDifferentiatieBewerken) ||
                (!this.magDifferentiatieBewerken && heeftToekenning)
        );
        this.lesgroepId$.next(this.lesgroepen?.[0]?.id);
    }

    ngAfterViewInit() {
        this.methodeInhoud$ = this.methodeSubject$.pipe(
            filter(Boolean),
            switchMap((methode: Methode) => this.methodeService.getHoofdstukken(methode.publisher, methode.id)),
            withLatestFrom(this.methodeSubject$),
            map(
                ([hoofdstukken, methode]) =>
                    ({
                        ...methode,
                        hoofdstukken
                    }) as Methode
            )
        );

        this.titelRef.nativeElement.focus();

        this.studiewijzeritemForm.controls['huiswerkType'].valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.studiewijzerItem = this.genereerStudiewijzeritem();
        });
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    private patchInleverperiode() {
        const inleverperiode = this.toekenning.studiewijzeritem.inleverperiode;
        const conceptInleveropdracht = this.toekenning.studiewijzeritem.conceptInleveropdracht;

        if (inleverperiode) {
            this.studiewijzeritemForm.removeControl('conceptInleveropdracht');
        } else if (conceptInleveropdracht) {
            this.studiewijzeritemForm.removeControl('inleverperiode');
        } else {
            this.studiewijzeritemForm.removeControl('inleverperiode');
            this.studiewijzeritemForm.removeControl('conceptInleveropdracht');
        }
    }

    saveToekenning(copyOnSave = false) {
        this.submitted = true;

        if (this.studiewijzeritemForm.valid && this.isDirty && this.titelOfOmschrijving) {
            let toekenningMoment = {};

            if (this.toonDatepicker) {
                if (this.opgevenVoorAfspraak) {
                    toekenningMoment = {
                        afgerondOpDatumTijd: this.opgevenVoorAfspraak.begin,
                        aangemaaktOpDatumTijd: (<AfspraakToekenning>this.toekenning).aangemaaktOpDatumTijd ?? this.afspraak?.begin
                    };
                } else {
                    toekenningMoment = { datum: this.studiewijzeritemForm.get('opgevenVoor')!.value };
                }
            }

            const toekenning: Toekenning = {
                ...this.toekenning,
                ...toekenningMoment,
                studiewijzeritem: this.genereerStudiewijzeritem(),
                differentiatiegroepen: this.differentiatiegroepen$.value,
                differentiatieleerlingen: this.differentiatieleerlingen$.value
            };

            if (this.toonDatepicker) {
                if (this.opgevenVoorAfspraak) {
                    delete toekenning['datum' as keyof Toekenning];
                } else {
                    delete toekenning['afgerondOpDatumTijd' as keyof Toekenning];
                    delete toekenning['aangemaaktOpDatumTijd' as keyof Toekenning];
                }
            }

            if (toekenning.studiewijzeritem.inleverperiode) {
                toekenning.studiewijzeritem.inleverperiode = {
                    ...toekenning.studiewijzeritem.inleverperiode,
                    begin: this.studiewijzeritemForm.value.inleverperiode.range.begin,
                    eind: this.studiewijzeritemForm.value.inleverperiode.range.eind,
                    plagiaatDetectie: this.studiewijzeritemForm.value.inleverperiode.plagiaatDetectie,
                    stuurBerichtBijInlevering: this.studiewijzeritemForm.value.inleverperiode.stuurBerichtBijInlevering,
                    herinnering: this.studiewijzeritemForm.value.inleverperiode.herinnering,
                    startSortering: toekenning.studiewijzeritem.inleverperiode.startSortering ?? toekenning.sortering,
                    eindSortering: toekenning.studiewijzeritem.inleverperiode.eindSortering ?? toekenning.sortering
                };

                if (this.toekenning.isStartInleverperiode) {
                    toekenning.studiewijzeritem.inleverperiode = {
                        ...toekenning.studiewijzeritem.inleverperiode,
                        startSortering: toekenning.studiewijzeritem.inleverperiode.startSortering ?? toekenning.sortering
                    };
                } else {
                    toekenning.studiewijzeritem.inleverperiode = {
                        ...toekenning.studiewijzeritem.inleverperiode,
                        startSortering: toekenning.studiewijzeritem.inleverperiode.startSortering ?? toekenning.sortering
                    };
                }
            } else if (toekenning.studiewijzeritem.conceptInleveropdracht) {
                (<WeekToekenning>toekenning).startWeek = this.studiewijzeritemForm.value.conceptInleveropdracht.startWeek;
                (<WeekToekenning>toekenning).eindWeek = this.studiewijzeritemForm.value.conceptInleveropdracht.eindWeek;
                const startTijd = hhmmToDate(this.studiewijzeritemForm.value.conceptInleveropdracht.startTijd);
                const eindTijd = hhmmToDate(this.studiewijzeritemForm.value.conceptInleveropdracht.eindTijd);

                toekenning.studiewijzeritem.conceptInleveropdracht = {
                    ...toekenning.studiewijzeritem.conceptInleveropdracht,
                    plagiaatDetectie: this.studiewijzeritemForm.value.conceptInleveropdracht.plagiaatDetectie,
                    stuurBerichtBijInlevering: this.studiewijzeritemForm.value.conceptInleveropdracht.stuurBerichtBijInlevering,
                    herinnering: this.studiewijzeritemForm.value.conceptInleveropdracht.herinnering,
                    startDag: this.studiewijzeritemForm.value.conceptInleveropdracht.startDag,
                    startUur: getHours(startTijd),
                    startMinuut: getMinutes(startTijd),
                    eindDag: this.studiewijzeritemForm.value.conceptInleveropdracht.eindDag,
                    eindUur: getHours(eindTijd),
                    eindMinuut: getMinutes(eindTijd)
                };

                toekenning.sortering = MAX_INT_VALUE;

                if (this.toekenning.isStartInleverperiode) {
                    toekenning.studiewijzeritem.conceptInleveropdracht = {
                        ...toekenning.studiewijzeritem.conceptInleveropdracht,
                        startSortering: toekenning.studiewijzeritem.conceptInleveropdracht.startSortering ?? toekenning.sortering
                    };
                } else {
                    toekenning.studiewijzeritem.conceptInleveropdracht = {
                        ...toekenning.studiewijzeritem.conceptInleveropdracht,
                        startSortering: toekenning.studiewijzeritem.conceptInleveropdracht.startSortering ?? toekenning.sortering
                    };
                }
            }

            if (this.gesynchroniseerdSjabloon) {
                toekenning.synchroniseertMet = this.gesynchroniseerdSjabloon.naam;
            }

            const lesgroepControls: LesgroepControl[] = Object.values(
                (<UntypedFormGroup>this.studiewijzeritemForm.controls['lesgroepen']).controls
            )
                .map((control) => control.value)
                .filter(
                    (control) =>
                        (control.checked && !control.synchroniseert && !control.disabled) || control.lesgroep.id === this.lesgroepId$.value
                );

            if (lesgroepControls.length > 0) {
                this.onSaveToekenning.emit({
                    toekenningen: lesgroepControls.map((lesgroepControl) => ({
                        ...toekenning,
                        lesgroep: lesgroepControl.lesgroep,
                        differentiatiegroepen:
                            this.lesgroepId$.value === lesgroepControl.lesgroep.id ? toekenning.differentiatiegroepen : [],
                        differentiatieleerlingen:
                            this.lesgroepId$.value === lesgroepControl.lesgroep.id ? toekenning.differentiatieleerlingen : []
                    })),
                    gesynchroniseerdSjabloon: this.gesynchroniseerdSjabloon,
                    copyOnSave,
                    context: this.afspraak as Afspraak
                });
            } else if (this.lesgroepen?.length > 0) {
                this.onSaveToekenning.emit({
                    toekenningen: this.lesgroepen.map((lesgroep) => ({ ...toekenning, lesgroep })),
                    gesynchroniseerdSjabloon: this.gesynchroniseerdSjabloon,
                    copyOnSave,
                    context: this.afspraak as Afspraak
                });
            } else {
                this.onSaveToekenning.emit({
                    toekenningen: [toekenning],
                    gesynchroniseerdSjabloon: this.gesynchroniseerdSjabloon,
                    copyOnSave,
                    context: this.afspraak as Afspraak
                });
            }
        }
    }

    openUploadPopup() {
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.width = 200;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top, PopupDirection.Left, PopupDirection.Right];
        const selecteerBijlagePopup = this.popupService.popup(this.uploadIcon, popupSettings, SelecteerBijlagePopupComponent);
        selecteerBijlagePopup.selectFiles = (files: FileList) => this.uploadingFiles.next(files);
        selecteerBijlagePopup.saveUrl = (bijlage) => this.saveUrl(bijlage);
        return false;
    }

    openUrlPopup(url: BijlageFieldsFragment) {
        const popupSettings = new PopupSettings();

        popupSettings.headerIcon = 'link';
        popupSettings.title = 'Link toevoegen';
        popupSettings.appearance = {
            mobile: Appearance.Fullscreen,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Window,
            desktop: Appearance.Window
        };

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, UrlToevoegenPopupComponent);
        popup.url = url;
        popup.saveUrl = (bijlage, previousUrl) => this.saveUrl(bijlage, previousUrl);
    }

    fileUploaded(bijlage: BijlageFieldsFragment) {
        this.bijlagen.push(bijlage);
    }

    saveUrl(url: BijlageFieldsFragment, previousUrl?: BijlageFieldsFragment) {
        if (previousUrl) {
            const index = this.bijlagen.findIndex((bijlage) => bijlage.url === previousUrl.url && bijlage.titel === previousUrl.titel);
            this.bijlagen[index] = { ...url };
        } else {
            this.bijlagen.push(url);
        }

        this.changeDetector.detectChanges();
    }

    removeBijlage(bijlageToRemove: BijlageFieldsFragment) {
        this.bijlagen = this.bijlagen.filter((bijlage) => bijlage !== bijlageToRemove);
    }

    setTeamsDate() {
        if (this.toonDatepicker) {
            this.conferenceDateRange = {
                start: this.opgevenVoorAfspraak?.begin.toISOString() ?? setHours(this.opgevenVoor!.value, 9).toISOString(),
                eind: this.opgevenVoorAfspraak?.eind.toISOString() ?? setHours(this.opgevenVoor!.value, 10).toISOString()
            };
        } else if ((<AfspraakToekenning>this.toekenning).afgerondOpDatumTijd || (<DagToekenning>this.toekenning).datum) {
            const start =
                (<AfspraakToekenning>this.toekenning).afgerondOpDatumTijd?.toISOString() ??
                setHours((<DagToekenning>this.toekenning).datum, 9).toISOString();

            this.conferenceDateRange = {
                start,
                eind: this.afspraak?.eind?.toISOString() ?? setHours(new Date(start), new Date(start).getHours() + 1).toISOString()
            };
        }
    }

    onBijlageSave({ bijlage, index }: { bijlage: BijlageFieldsFragment; index: number }) {
        this.bijlagen = replaceInArray(index, bijlage, this.bijlagen);
        this.studiewijzeritemForm.markAsDirty();
    }

    onSynchroniserenEdit(sjabloon: Sjabloon) {
        this.gesynchroniseerdSjabloon = sjabloon;

        this.lesgroepenControls$ = combineLatest([
            this.lesgroepenControls$,
            this.sjabloonDataService.getGesynchroniseerdeLesgroepen(sjabloon.id)
        ]).pipe(
            map(([controls, gesynchroniseerdeLesgroepen]) =>
                controls.map(
                    (control) =>
                        ({
                            ...control,
                            synchroniseert: gesynchroniseerdeLesgroepen.some((lesgroep) => lesgroep.id === control.lesgroep.id)
                        }) as LesgroepControl
                )
            ),
            tap(this.updateLesgroepenControls.bind(this))
        );

        this.changeDetector.detectChanges();
    }

    onUnlink() {
        this.gesynchroniseerdSjabloon = null;

        this.lesgroepenControls$ = this.lesgroepenControls$.pipe(
            map((controls) =>
                controls.map(
                    (control) =>
                        ({
                            ...control,
                            synchroniseert: false
                        }) as LesgroepControl
                )
            ),
            tap(this.updateLesgroepenControls.bind(this))
        );

        this.changeDetector.detectChanges();
    }

    toggleZichtbaarheid() {
        const control = this.studiewijzeritemForm.controls['zichtbaarheid'];
        control.setValue(!control.value);
    }

    openMethodeSelectie() {
        this.methodeSelectie$.next(true);
        this.sidebarService.changePage({
            id: 'methoden',
            titel: 'Uit methode',
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 3,
            isVerdieping: true,
            onIconClick: () => {
                this.methodeSelectie$.next(false);
                this.sidebarService.previousPage();
            }
        });
    }

    onMethodeInhoudenToevoegen(selecties: ToSaveMethode[]) {
        const subHoofdstukken = flatMap(selecties, (selectie) => selectie.selectie.subHoofdstuk);
        this.bijlagen = [
            ...this.bijlagen,
            ...selecties
                .map((selectie) => selectie.selectie.subHoofdstuk.inhoud)
                .flat()
                .map(methodeInhoudToBijlage)
        ];

        const paragraafLeerdoelen = subHoofdstukken
            .map((paragraaf) => {
                const leerdoelen = [...paragraaf.leerdoelen, ...paragraaf.inhoud.map((inhoud) => inhoud.leerdoelen).flat()];
                return leerdoelen.length > 0 ? mapLeerdoelenNaarBulletList(leerdoelen, paragraaf.naam) : null;
            })
            .filter(Boolean);

        const currentValue = this.studiewijzeritemForm.controls.leerdoelen.value;
        this.studiewijzeritemForm.controls.leerdoelen.setValue([currentValue, ...paragraafLeerdoelen].filter(Boolean).join('<br>').trim());

        this.isLeerdoelenOpen = true;
        this.nextMethode();
        this.sidebarService.previousPage();
        this.sidebarService.previousPage();
        this.methodeSelectie$.next(false);
    }

    removeGroep(groep: Differentiatiegroep) {
        this.differentiatiegroepen$.next(this.differentiatiegroepen$.value.filter(notEqualsId(groep.id)));
        this.studiewijzeritemForm.markAsDirty();
    }

    removeLeerling(leerling: Leerling) {
        this.differentiatieleerlingen$.next(this.differentiatieleerlingen$.value.filter(notEqualsId(leerling.id)));
        this.studiewijzeritemForm.markAsDirty();
    }

    openOpslaanEnKopiePopup(ref: ViewContainerRef) {
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.preferedDirection = [PopupDirection.Top];
        settings.width = 252;

        const popup = this.popupService.popup(ref, settings, ActionsPopupComponent);
        popup.customButtons = [opslaanEnKopieerButton(() => this.saveToekenning(true))];
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    genereerStudiewijzeritem() {
        return {
            ...this.toekenning.studiewijzeritem,
            huiswerkType: this.studiewijzeritemForm.controls['huiswerkType'].value,
            onderwerp: this.studiewijzeritemForm.controls['titel'].value ?? null,
            tijdsindicatie: this.studiewijzeritemForm.controls['tijdsindicatie'].value ?? null,
            omschrijving: this.studiewijzeritemForm.controls['omschrijving'].value ?? '',
            notitie: this.studiewijzeritemForm.controls['notitie'].value ?? '',
            leerdoelen: this.studiewijzeritemForm.controls['leerdoelen'].value ?? '',
            zichtbaarVoorLeerling: this.studiewijzeritemForm.controls['zichtbaarheid'].value,
            notitieZichtbaarVoorLeerling: this.studiewijzeritemForm.controls['notitieZichtbaarVoorLeerling'].value,
            bijlagen: this.bijlagen
        };
    }

    private updateLesgroepenControls(lesgroepControls: LesgroepControl[]) {
        Object.values((<UntypedFormGroup>this.studiewijzeritemForm.controls['lesgroepen']).controls).forEach((control) => {
            control.setValue(lesgroepControls.find((lesgroepControl) => lesgroepControl.lesgroep.id === control.value.lesgroep.id));
        });
    }

    public nextMethode(methode?: MethodenQuery['methoden'][number] | RecenteMethode) {
        this.methodeSubject$.next((methode as Methode) ?? null);
        if (methode !== undefined) {
            this.sidebarService.changePage({
                id: 'methoden',
                titel: methode.naam ?? '-',
                icon: 'pijlLinks',
                iconClickable: true,
                pagenumber: 3,
                onIconClick: () => {
                    this.methodeSubject$.next(null);
                    this.sidebarService.previousPage();
                }
            });
        }
    }

    triggerEditorChangeDetection() {
        setTimeout(() => {
            this.studiewijzeritemForm.controls['omschrijving'].updateValueAndValidity();
            this.changeDetector.detectChanges();
        });
    }

    onAnnulerenClick() {
        this.onCancel.emit(() => {
            this.differentiatiegroepen$.next(this.toekenning.differentiatiegroepen);
            this.differentiatieleerlingen$.next(this.toekenning.differentiatieleerlingen);
            this.bijlagen = this.toekenning.studiewijzeritem.bijlagen as BijlageFieldsFragment[];
        });
    }

    closeDifferentiatie = () => {
        this.showDifferentiatiePage$.next(false);
        this.sidebarService.previousPage();
    };

    openDifferentiatieSidebar() {
        this.sidebarService.changePage({
            ...this.sidebarService.currentPage,
            titel: 'Kies groep of leerling',
            onIconClick: this.closeDifferentiatie,
            icon: 'pijlLinks',
            iconClickable: true
        });

        this.showDifferentiatiePage$.next(true);
    }

    voegDifferentiatieToe(leerlingen: Leerling[], differentiatiegroepen: Differentiatiegroep[], leerlingenVanLesgroep: Leerling[]) {
        this.differentiatiegroepen$.next([...this.differentiatiegroepen$.value, ...differentiatiegroepen]);
        const groepLeerlingen = this.differentiatiegroepen$.value.flatMap((groep) => groep.leerlingen);
        this.differentiatieleerlingen$.next(
            [...this.differentiatieleerlingen$.value, ...leerlingen].filter((leerling) => !groepLeerlingen.some(equalsId(leerling.id)))
        );
        if (this.differentiatiegroepen$.value.length === 0 && leerlingen.length === leerlingenVanLesgroep.length) {
            this.differentiatieleerlingen$.next([]);
        }

        this.studiewijzeritemForm.markAsDirty();
        this.closeDifferentiatie();
    }

    get isDirty(): boolean {
        const notitieDirty = this.studiewijzeritemForm.controls.notitie.dirty;
        const leerdoelenDirty = this.studiewijzeritemForm.controls.leerdoelen.dirty;
        const omschrijvingDirty = this.studiewijzeritemForm.controls.omschrijving.dirty;
        const bijlagenDirty =
            this.bijlagen.length !== this.toekenning.studiewijzeritem.bijlagen.length ||
            this.bijlagen.filter((bijlage) => this.toekenning.studiewijzeritem.bijlagen.indexOf(bijlage) < 0).length > 0;
        const inShareContentMetData =
            this.inShareContent && (!!this.toekenning.studiewijzeritem.omschrijving || !!this.toekenning.studiewijzeritem.onderwerp);

        return (
            this.studiewijzeritemForm.dirty ||
            notitieDirty ||
            leerdoelenDirty ||
            omschrijvingDirty ||
            bijlagenDirty ||
            inShareContentMetData
        );
    }

    heeftTekstueleOfDifferentiatieWijzigingen(): boolean {
        const aantalDiffGroepenGewijzigd = this.toekenning.differentiatiegroepen.length !== this.differentiatiegroepen$.value.length;
        const toekenningDifferentiatieGroepenIds = this.toekenning.differentiatiegroepen.map(toId);
        const differentiatieGroepenIds = this.differentiatiegroepen$.value.map(toId);
        const differentiatieGroepenIdsGewijzigd =
            toekenningDifferentiatieGroepenIds.filter((id) => differentiatieGroepenIds.indexOf(id) === -1).length > 0;
        const differentiatieGroepenGewijzigd = aantalDiffGroepenGewijzigd || differentiatieGroepenIdsGewijzigd;

        const aantalDiffLeerlingenGewijzigd =
            this.toekenning.differentiatieleerlingen.length !== this.differentiatieleerlingen$.value.length;
        const toekenningDifferentiatieLeerlingenIds = this.toekenning.differentiatieleerlingen.map(toId);
        const differentiatieLeerlingenIds = this.differentiatieleerlingen$.value.map(toId);
        const differentiatieLeerlingenIdsGewijzigd =
            toekenningDifferentiatieLeerlingenIds.filter((id) => differentiatieLeerlingenIds.indexOf(id) === -1).length > 0;
        const differentiatieLeerlingenGewijzigd = aantalDiffLeerlingenGewijzigd || differentiatieLeerlingenIdsGewijzigd;

        if (
            !isEqual(this.toekenning.studiewijzeritem.bijlagen, this.bijlagen) ||
            this.studiewijzeritemForm.controls.omschrijving.dirty ||
            this.studiewijzeritemForm.controls.notitie.dirty ||
            this.studiewijzeritemForm.controls.leerdoelen.dirty ||
            differentiatieGroepenGewijzigd ||
            differentiatieLeerlingenGewijzigd
        ) {
            return true;
        }

        return Object.keys(this.studiewijzeritemForm.controls).some((controlName) => {
            const control = this.studiewijzeritemForm.controls[controlName];
            return controlName !== 'zichtbaarheid' && control.dirty && controlName !== 'notitieZichtbaarVoorLeerling' && control.dirty;
        });
    }

    get titelOfOmschrijving(): boolean {
        return (
            this.studiewijzeritemForm.controls.omschrijving.value?.length > 2 ||
            this.studiewijzeritemForm.controls['titel'].value.length > 0
        );
    }

    get toonSychronisatieBalk(): boolean {
        const nieuweToekenning = !this.toekenning.id;
        const bestaandeToekenningMetSync = !!this.toekenning.id && !!this.toekenning.synchroniseertMet;

        return this.magSynchroniserenMetSjabloon && (nieuweToekenning || bestaandeToekenningMetSync);
    }

    get isUploading(): boolean {
        return this.omschrijvingEnBijlage?.isUploading;
    }
    get conceptInleveropdracht(): AbstractControl {
        return this.studiewijzeritemForm.controls['conceptInleveropdracht'];
    }
    get inleverperiodeFormGroup(): UntypedFormGroup {
        return <UntypedFormGroup>this.studiewijzeritemForm.get('inleverperiode');
    }
    get inleverperiodeRangeGroup(): UntypedFormGroup {
        return <UntypedFormGroup>this.inleverperiodeFormGroup.get('range');
    }
    get opgevenVoor() {
        return this.studiewijzeritemForm.get('opgevenVoor');
    }
    get zichtbaarheidLabel(): string {
        return (this.studiewijzeritemForm.controls['zichtbaarheid'].value ? 'Zichtbaar' : 'Niet zichtbaar') + ' voor leerlingen';
    }
    get inleverperiodeOfConceptInleveropdracht(): boolean {
        return !!this.toekenning.studiewijzeritem.inleverperiode || !!this.toekenning.studiewijzeritem.conceptInleveropdracht;
    }
}
