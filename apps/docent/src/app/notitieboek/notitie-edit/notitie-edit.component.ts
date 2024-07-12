import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    inject,
    output
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IconDirective, TooltipDirective } from 'harmony';
import { IconInformatie, IconPijlLinks, provideIcons } from 'harmony-icons';
import { omit } from 'lodash-es';
import { Observable, Subject, combineLatest, map, startWith, tap } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { P, match } from 'ts-pattern';
import {
    BijlageFieldsFragment,
    Maybe,
    Notitie,
    NotitieBetrokkeneInput,
    NotitieContext,
    NotitieFieldsFragment,
    NotitieInput,
    Vak,
    VestigingVakkenQuery
} from '../../../generated/_types';
import { bijlageFieldsFragmentToBijlageInput } from '../../core/converters/bijlage.converters';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { ComponentUploadService } from '../../core/services/component-upload.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { ToastService } from '../../core/toast/toast.service';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { FormDropdownComponent } from '../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { OmschrijvingEnBijlageComponent } from '../../rooster-shared/components/omschrijving-en-bijlage/omschrijving-en-bijlage.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { AutofocusDirective } from '../../rooster-shared/directives/autofocus.directive';
import { DropDownOption } from '../../rooster-shared/utils/dropdown.util';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { SwitchComponent } from '../../shared/components/switch/switch.component';
import { replaceInArray } from '../../shared/utils/array.utils';
import { Betrokkene, BetrokkeneSelectieComponent } from '../betrokkene-selectie/betrokkene-selectie.component';
import { NotitieZichtbaarheidButtonComponent } from '../notitie-zichtbaarheid-button/notitie-zichtbaarheid-button.component';
import { NotitieZichtbaarheidForm } from '../notitie-zichtbaarheid-popup/notitie-zichtbaarheid-popup.component';
import { NotitieDelenDisabled, isNotitieDelenDisabled } from '../notitieboek-delen.pipe';

@Component({
    selector: 'dt-notitie-edit',
    standalone: true,
    imports: [
        RouterModule,
        ReactiveFormsModule,
        TooltipDirective,
        FormDropdownComponent,
        OutlineButtonComponent,
        ButtonComponent,
        BetrokkeneSelectieComponent,
        NotitieZichtbaarheidButtonComponent,
        NotitieDelenDisabled,
        SwitchComponent,
        AutofocusDirective,
        IconDirective,
        OmschrijvingEnBijlageComponent,
        AsyncPipe
    ],
    templateUrl: './notitie-edit.component.html',
    styleUrls: ['./../notitie-detail/notitie-detail-header.scss', './notitie-edit.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentUploadService, provideIcons(IconPijlLinks, IconInformatie)]
})
export class NotitieEditComponent implements OnInit, OnChanges, OnDestroy {
    private notitieDataService = inject(NotitieboekDataService);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);
    private changeDetectorRef = inject(ChangeDetectorRef);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(OmschrijvingEnBijlageComponent) omschrijvingEnBijlage: OmschrijvingEnBijlageComponent;

    @Input() notitie: NotitieFieldsFragment | NotitieInput;
    @Input() context: NotitieboekContext;
    @Input() inSidebar: boolean;
    @Input() betrokkenenAltijdVerwijderbaar = false;
    onAnnuleerNotitie = output<void>();
    onSaveNotitie = output<{
        isNieuw: boolean;
        notitieId: string;
    }>();
    leerlingBetrokkene?: Maybe<NotitieFieldsFragment['leerlingBetrokkenen']>;

    public vakkenDropdownOptions$: Observable<DropDownOption<VestigingVakkenQuery['vestigingVakken'][number] | null>[]>;
    public bevatMentorleerling$: Observable<boolean>;
    public header: string;
    public formSubmitted = false;

    private defaultVak: Maybe<Vak>;

    public form = new FormGroup({
        betrokkenen: new FormControl<Betrokkene[]>([], {
            validators: [Validators.required],
            nonNullable: true
        }),
        titel: new FormControl(''),
        vak: new FormControl<Optional<VestigingVakkenQuery['vestigingVakken'][number]>>(null),
        belangrijk: new FormControl(false, { nonNullable: true }),
        privacygevoelig: new FormControl(false, { nonNullable: true }),
        gedeeldVoorMentoren: new FormControl(false, { nonNullable: true }),
        gedeeldVoorDocenten: new FormControl(false, { nonNullable: true }),
        reactiesToegestaan: new FormControl(false, { nonNullable: true }),
        vastgeprikt: new FormControl(false, { nonNullable: true }),
        initieelVastgeprikt: new FormControl(false, { nonNullable: true }),
        inhoud: new FormControl('', { validators: Validators.required, nonNullable: true }),
        bijlagen: new FormControl<NotitieFieldsFragment['bijlagen']>([])
    });

    public onDestroy$ = new Subject<void>();

    canDeactivate() {
        return this.form.pristine;
    }

    ngOnInit(): void {
        this.initializeForm();

        this.route.queryParams
            .pipe(
                filter((params) => params.leerlingBetrokkenenIds),
                distinctUntilChanged(),
                map((params): string[] => JSON.parse(params.leerlingBetrokkenenIds)),
                map((leerlingIds) =>
                    leerlingIds.map((id: string) => this.notitieDataService.notitieLeerlingBetrokkeneFromCache(id)?.leerling)
                ),
                takeUntil(this.onDestroy$)
            )
            .subscribe((leerlingBetrokkenen) => {
                if (!this.isSavedNotitie(this.notitie)) {
                    this.form.controls.betrokkenen.setValue(leerlingBetrokkenen.filter(isPresent));
                }
            });

        this.vakkenDropdownOptions$ = this.notitieDataService.getVestigingVakken(this.context.context, this.context.id).pipe(
            map((vakken) => [
                { text: 'Geen vak', value: null },
                ...vakken.map((vak): DropDownOption<typeof vak> => ({ text: vak.naam, value: vak }))
            ]),
            tap(() => {
                if (!this.isSavedNotitie(this.notitie)) {
                    this.form.patchValue({ vak: this.defaultVak });
                }
            })
        );

        this.bevatMentorleerling$ = combineLatest([
            this.form.controls.betrokkenen.valueChanges.pipe(startWith(this.form.controls.betrokkenen.value)),
            this.medewerkerDataService.getMentorleerlingenLijstIds()
        ]).pipe(
            map(([betrokkenen, mentorleerlingIds]) => betrokkenen.some((betrokkene) => mentorleerlingIds.includes(betrokkene.id))),
            tap((bevatMentorleerling) => {
                if (!bevatMentorleerling) {
                    this.form.patchValue({ belangrijk: false, initieelVastgeprikt: false });
                }
            }),
            shareReplayLastValue()
        );

        this.form.controls.betrokkenen.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe((betrokkenen) => {
            const docentenDelenDisabled = isNotitieDelenDisabled(betrokkenen, 'Docenten');
            if (docentenDelenDisabled) {
                this.form.patchValue({ gedeeldVoorDocenten: false });
            }

            const mentorenDelenDisabled = isNotitieDelenDisabled(betrokkenen, 'Mentoren');
            if (mentorenDelenDisabled) {
                this.form.patchValue({ gedeeldVoorMentoren: false });
            }
        });
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    ngOnChanges() {
        if (this.notitie && this.context) {
            this.header = this.isSavedNotitie(this.notitie) ? 'Notitie bewerken' : 'Nieuwe notitie';
            this.initializeForm();
        }
    }

    initializeForm() {
        const defaultBetrokkene = match(this.context)
            .with({ context: NotitieContext.LEERLING }, (c) => c.leerling)
            .with({ context: NotitieContext.LESGROEP }, (c) => (this.contextToevoegen ? c.lesgroep : null))
            .with({ context: NotitieContext.STAMGROEP }, (c) => (this.contextToevoegen ? c.stamgroep : null))
            .exhaustive();

        // Vanuit de lesregistratie kan een vak worden meegegeven. In dat geval is dat het default vak.
        this.defaultVak = match(this.context)
            .with({ leerling: P.any, vak: P.select() }, (vak) => vak ?? null) // undefined omzetten naar null ivm setValue
            .with({ lesgroep: P.any }, (c) => c.lesgroep?.vak ?? null)
            .otherwise(() => null);

        const betrokkenen: Betrokkene[] = this.isSavedNotitie(this.notitie)
            ? [
                  ...this.notitie.leerlingBetrokkenen.map((l) => l.leerling),
                  ...this.notitie.lesgroepBetrokkenen.map((l) => l.lesgroep),
                  ...this.notitie.stamgroepBetrokkenen.map((s) => s.stamgroep)
              ]
            : [defaultBetrokkene].filter(isPresent);
        this.form.reset();
        this.form.setValue({
            belangrijk: this.notitie.belangrijk,
            privacygevoelig: this.notitie.privacygevoelig,
            betrokkenen,
            vak: this.isSavedNotitie(this.notitie) ? this.notitie.vak ?? null : this.defaultVak,
            titel: this.notitie.titel ?? '',
            inhoud: this.notitie.inhoud,
            gedeeldVoorMentoren: this.notitie.gedeeldVoorMentoren,
            gedeeldVoorDocenten: this.notitie.gedeeldVoorDocenten,
            reactiesToegestaan: this.notitie.reactiesToegestaan,
            vastgeprikt: this.notitie.vastgeprikt,
            initieelVastgeprikt: this.notitie.initieelVastgeprikt,
            bijlagen: this.isSavedNotitie(this.notitie) ? this.notitie.bijlagen : []
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    onSubmit() {
        if (this.form.valid) {
            const notitieForm = this.form.getRawValue();
            const notitieInput: NotitieInput = {
                ...omit(notitieForm, 'vak'),
                id: this.notitie.id,
                titel: notitieForm.titel ?? '',
                vakId: notitieForm.vak?.id,
                betrokkenen: notitieForm.betrokkenen.map(this.betrokkeneToBetrokkeneInput),
                bijlagen: this.notitie.bijlagen.map(bijlageFieldsFragmentToBijlageInput) ?? []
            };
            this.formSubmitted = true;
            this.notitieDataService.saveNotitie(notitieInput).subscribe({
                next: (notitie) => {
                    this.formSubmitted = false;
                    if (notitie.data) {
                        this.form.markAsPristine();
                        this.onSaveNotitie.emit({ isNieuw: !notitieInput.id, notitieId: notitie.data.saveNotitie.id });
                    }
                },
                error: (error) => {
                    this.formSubmitted = false;
                    if (error.message.includes('Voeg minimaal één leerling of groep toe waar je les aan geeft of mentor van bent')) {
                        this.form.controls.betrokkenen.setErrors({ betrokkenen: true });
                        this.changeDetectorRef.detectChanges();
                    } else {
                        this.toastService.error(error.message);
                    }
                }
            });
        }
    }

    setDelen(popupForm: NotitieZichtbaarheidForm) {
        this.form.patchValue({
            gedeeldVoorDocenten: popupForm.docenten,
            gedeeldVoorMentoren: popupForm.mentoren,
            reactiesToegestaan: popupForm.reactiesToegestaan
        });
        if (!popupForm.docenten && popupForm.mentoren) {
            this.form.patchValue({ initieelVastgeprikt: false });
        }
    }

    setVastgeprikt(isVastgeprikt: boolean) {
        this.form.patchValue({
            vastgeprikt: isVastgeprikt
        });
    }

    setInitieelVastgeprikt(isInitieelVastgeprikt: boolean) {
        this.form.patchValue({
            initieelVastgeprikt: isInitieelVastgeprikt
        });
    }

    isSavedNotitie(notitie: NotitieFieldsFragment | NotitieInput): notitie is NotitieFieldsFragment {
        return 'id' in notitie;
    }

    betrokkeneToBetrokkeneInput = (betrokkene: Betrokkene): NotitieBetrokkeneInput => ({
        id: betrokkene.id,
        context:
            betrokkene.__typename === 'Leerling'
                ? NotitieContext.LEERLING
                : betrokkene.__typename === 'Lesgroep'
                  ? NotitieContext.LESGROEP
                  : NotitieContext.STAMGROEP
    });

    fileUploaded(bijlage: BijlageFieldsFragment) {
        this.notitie = { ...this.notitie, bijlagen: [...this.notitie.bijlagen, bijlage] } as Notitie;
        this.form.markAsDirty();
        this.changeDetectorRef.detectChanges();
    }

    removeBijlage(bijlageToRemove: BijlageFieldsFragment) {
        this.notitie = { ...this.notitie, bijlagen: this.notitie.bijlagen.filter((b) => b !== bijlageToRemove) } as Notitie;
        this.form.markAsDirty();
    }

    onBijlageSave({ bijlage, index }: { bijlage: BijlageFieldsFragment; index: number }) {
        this.notitie = { ...this.notitie, bijlagen: replaceInArray(index, bijlage, this.notitie.bijlagen) } as Notitie;
        this.form.markAsDirty();
    }

    public get contextToevoegen() {
        return this.route.snapshot.queryParams.contextToevoegen || this.inSidebar;
    }

    public get isUploading(): boolean {
        return this.omschrijvingEnBijlage?.isUploading;
    }
}
