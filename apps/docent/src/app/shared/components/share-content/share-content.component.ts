import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    AfspraakToekenning,
    BijlageFieldsFragment,
    BijlageType,
    DagToekenning,
    HuiswerkType,
    Inleverperiode,
    Lesgroep,
    Medewerker,
    SharedLinkContext,
    Studiewijzeritem,
    ToekomendeAfsprakenVanLesgroepenQuery
} from '@docent/codegen';
import { getYear, setHours, setMinutes, startOfDay } from 'date-fns';
import { IconDirective } from 'harmony';
import {
    IconChevronLinks,
    IconGroep,
    IconHuiswerk,
    IconInleveropdracht,
    IconLesstof,
    IconSomtoday,
    IconToets,
    IconToetsGroot,
    IconVerwijderen,
    provideIcons
} from 'harmony-icons';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { SaveToekenningContainer } from '../../../core/models';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { ComponentUploadService } from '../../../core/services/component-upload.service';
import { ConnectDataService } from '../../../core/services/connect-data.service';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { UploadDataService } from '../../../core/services/upload-data.service';
import { LesplanningDataService } from '../../../les/lesplanning/lesplanning-data.service';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { FormDropdownComponent } from '../../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { DropDownOption } from '../../../rooster-shared/utils/dropdown.util';
import { MAX_INT_VALUE, Optional } from '../../../rooster-shared/utils/utils';
import { StudiewijzerDataService } from '../../../studiewijzers/studiewijzer-data.service';
import { mapLeerdoelenNaarBulletList } from '../../utils/toekenning.utils';
import { ToekenningFormulierComponent } from '../studiewijzeritem-sidebar/toekenning-formulier/toekenning-formulier.component';
import { RadioOption, radioOptions } from './radio-options';
import { ShareContentRadioOptionComponent } from './share-content-radio-option/share-content-radio-option.component';

@Component({
    selector: 'dt-share-content',
    templateUrl: './share-content.component.html',
    styleUrls: ['./share-content.component.scss'],
    providers: [
        ComponentUploadService,
        UploadDataService,
        provideIcons(
            IconChevronLinks,
            IconSomtoday,
            IconGroep,
            IconVerwijderen,
            IconHuiswerk,
            IconLesstof,
            IconToets,
            IconToetsGroot,
            IconInleveropdracht
        )
    ],
    standalone: true,
    imports: [
        CommonModule,
        AvatarComponent,
        ReactiveFormsModule,
        FormDropdownComponent,
        IconComponent,
        BackgroundIconComponent,
        ShareContentRadioOptionComponent,
        IconDirective,
        ToekenningFormulierComponent,
        VolledigeNaamPipe,
        MessageComponent,
        OutlineButtonComponent,
        ButtonComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareContentComponent implements OnInit, OnDestroy {
    private medewerkerDataService = inject(MedewerkerDataService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private lesplanningDataService = inject(LesplanningDataService);
    private route = inject(ActivatedRoute);
    private connectDataService = inject(ConnectDataService);
    @ViewChild('formDropdown') formDropdown: FormDropdownComponent<Lesgroep>;
    @ViewChild(ToekenningFormulierComponent) toekenningFormulier: ToekenningFormulierComponent;

    medewerker$: Observable<Medewerker>;
    lesgroepenDropDownOptions$: Observable<DropDownOption<Lesgroep>[]>;
    geselecteerdeGroepen$ = new BehaviorSubject<Lesgroep[]>([]);
    url: string;
    page = 1;
    toekomendeAfsprakenVanLesgroepen$: Observable<ToekomendeAfsprakenVanLesgroepenQuery['toekomendeAfsprakenVanLesgroepen']>;

    contextHintsId: Optional<string>;
    contextHints: SharedLinkContext;

    toekenningFormulierInputToekenning: DagToekenning;

    form: UntypedFormGroup;
    radioOptions = radioOptions;

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.url = atob(decodeURIComponent(this.route.snapshot.queryParamMap.get('q') ?? '')) ?? '';

        const hints = decodeURIComponent(this.route.snapshot.queryParamMap.get('hints') ?? '');
        this.contextHintsId = hints?.trim().length > 0 && hints !== 'null' ? hints : null;

        this.form = new UntypedFormGroup({
            lesgroep: new UntypedFormControl(this.formDropdown?.value ?? null),
            titel: new UntypedFormControl('', [Validators.required, Validators.maxLength(255)]),
            lesitemType: new UntypedFormControl('HUISWERK', [Validators.required])
        });

        this.medewerker$ = this.medewerkerDataService.getMedewerker().pipe(shareReplayLastValue());
        const lesgroepen$ = this.medewerker$.pipe(
            switchMap((medewerker) => this.studiewijzerDataService.getLesgroepen(getYear(getSchooljaar(new Date()).start), medewerker.id)),
            startWith([]),
            shareReplayLastValue()
        );

        if (this.contextHintsId) {
            combineLatest([this.connectDataService.getSharedLinkContextHints(this.contextHintsId), lesgroepen$])
                .pipe(takeUntil(this.destroy$))
                .subscribe(([contextHints, lesgroepenVanDocent]) => {
                    const lesgroepen =
                        contextHints.groups.length > 0
                            ? lesgroepenVanDocent.filter((lesgroep: Lesgroep) => contextHints.groups.indexOf(lesgroep.UUID) !== -1)
                            : [];
                    this.geselecteerdeGroepen$.next(lesgroepen);
                    this.form.controls.titel.setValue(contextHints.homeworkTitle ?? '');
                    this.form.controls.lesitemType.setValue(this.getHuiswerkType(contextHints));
                    this.contextHints = contextHints;
                });
        }

        this.toekomendeAfsprakenVanLesgroepen$ = this.geselecteerdeGroepen$.pipe(
            map((lesgroepen) => lesgroepen.map((lesgroep) => lesgroep.id)),
            switchMap((lesgroepIds) => this.lesplanningDataService.getToekomendeAfsprakenVanLesgroepen(lesgroepIds))
        );

        this.lesgroepenDropDownOptions$ = combineLatest([lesgroepen$, this.geselecteerdeGroepen$]).pipe(
            map(([lesgroepen, geslecteerdeLesgroepen]) => {
                const filteredLesgroepen = lesgroepen.filter(
                    (lesgroep: Lesgroep) =>
                        !geslecteerdeLesgroepen.some((geselecteerdeLesgroep) => geselecteerdeLesgroep.id === lesgroep.id)
                );

                return filteredLesgroepen.map(
                    (lesgroep) =>
                        ({
                            text: lesgroep.naam,
                            value: lesgroep
                        }) as DropDownOption<Lesgroep>
                );
            })
        );

        this.form.valueChanges.subscribe((change) => {
            if (change.lesgroep) {
                this.geselecteerdeGroepen$.next([...this.geselecteerdeGroepen$.value, change.lesgroep]);
                this.form.controls.lesgroep.reset(false);
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    saveToekenning(toekenningenContainer: SaveToekenningContainer) {
        const toSavetoekenningen = this.geselecteerdeGroepen$.value.map((lesgroep) => ({
            ...toekenningenContainer.toekenningen[0],
            lesgroep
        }));

        (<AfspraakToekenning>toekenningenContainer.toekenningen[0]).afgerondOpDatumTijd
            ? this.lesplanningDataService.saveAfspraakToekenning(toSavetoekenningen as AfspraakToekenning[])
            : this.lesplanningDataService.saveDagToekenning(toSavetoekenningen as DagToekenning[]);

        this.nextPage();
    }

    nextPage() {
        if (this.page === 1) {
            this.setToekenningFormulierInputToekenning();
        }

        this.page = this.page + 1;
    }

    previousPage() {
        this.page = this.page - 1;
    }

    removeLesgroep(lesgroep: Lesgroep) {
        this.geselecteerdeGroepen$.next(this.geselecteerdeGroepen$.value.filter((geselecteerdeGroep) => geselecteerdeGroep !== lesgroep));
    }

    onLesitemTypeClick(radioOption: RadioOption) {
        this.form.controls.lesitemType?.setValue(radioOption.value);
    }

    onAnnuleren() {
        window.close();
    }

    terugNaarSomtoday() {
        window.open('/rooster');
        window.close();
    }

    get lesgroepControl(): UntypedFormControl {
        return this.form.controls.lesgroep as UntypedFormControl;
    }

    get checkedOption(): string {
        return this.form?.controls.lesitemType?.value;
    }

    get heeftLesgroep(): boolean {
        return this.geselecteerdeGroepen$.value.length > 0;
    }

    get heeftLesgroepEnTitel(): boolean {
        return this.heeftLesgroep && this.form.controls.titel.valid;
    }

    setToekenningFormulierInputToekenning() {
        const omschrijving = this.contextHints?.description ?? '';

        const studiewijzeritem: Studiewijzeritem = {
            id: undefined,
            huiswerkType: this.form.controls.lesitemType.value === 'INLEVEROPDRACHT' ? 'HUISWERK' : this.form.controls.lesitemType.value,
            onderwerp: this.form.controls.titel.value,
            leerdoelen: mapLeerdoelenNaarBulletList(this.contextHints?.learningGoals),
            omschrijving: omschrijving,
            zichtbaarVoorLeerling: true,
            notitie: undefined,
            notitieZichtbaarVoorLeerling: true,
            bijlagen: [
                {
                    url: this.contextHints?.url ?? this.url,
                    type: BijlageType.URL,
                    zichtbaarVoorLeerling: true,
                    titel: this.form.controls.titel.value,
                    sortering: MAX_INT_VALUE,
                    contentType: 'text/html'
                } as BijlageFieldsFragment
            ],
            projectgroepen: []
        } as any as Studiewijzeritem;

        if (this.form.controls.lesitemType.value === 'INLEVEROPDRACHT') {
            studiewijzeritem.inleverperiode = {
                id: undefined,
                begin: this.contextHints?.assignmentStart
                    ? new Date(this.contextHints.assignmentStart)
                    : setMinutes(setHours(new Date(), 9), 0),
                eind: this.contextHints?.assignmentEnd
                    ? new Date(this.contextHints.assignmentEnd)
                    : setMinutes(setHours(new Date(), 23), 0),
                omschrijving: null,
                plagiaatDetectie: false,
                stuurBerichtBijInlevering: false,
                inleveringenAantal: 0,
                inleveringenVerwacht: 0,
                herinnering: 0,
                startSortering: MAX_INT_VALUE,
                eindSortering: MAX_INT_VALUE
            } as any as Inleverperiode;
        }

        this.toekenningFormulierInputToekenning = {
            datum: this.contextHints?.date ? startOfDay(new Date(this.contextHints.date)) : new Date(),
            studiewijzeritem,
            sortering: MAX_INT_VALUE
        } as DagToekenning;
    }

    private getHuiswerkType(context: SharedLinkContext): string {
        if (context.homeworkType) {
            const homeworkType = context.homeworkType.toUpperCase() as keyof typeof HuiswerkType | 'INLEVEROPDRACHT';
            // Inleveropdracht is eigenlijk huiswerk, maar is wel een optie voor type selectie.
            if (homeworkType === 'INLEVEROPDRACHT') {
                return homeworkType;
            }
            const isKnownType = Object.keys(HuiswerkType).includes(homeworkType);
            return isKnownType ? HuiswerkType[homeworkType] : HuiswerkType.HUISWERK;
        }
        return HuiswerkType.HUISWERK;
    }
}
