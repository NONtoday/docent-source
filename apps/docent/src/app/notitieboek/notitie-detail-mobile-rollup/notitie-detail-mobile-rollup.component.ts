import { animate, AUTO_STYLE, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    OnDestroy,
    OnInit,
    output,
    signal,
    viewChild,
    ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    NotitieBetrokkeneToegang,
    NotitieFieldsFragment,
    NotitieLeerlingBetrokkeneFieldsFragment,
    NotitieLesgroepBetrokkene,
    NotitieStamgroepBetrokkene
} from '@docent/codegen';
import { ButtonComponent, CheckboxComponent, IconDirective, IconTagComponent, TagComponent } from 'harmony';
import {
    IconBewerken,
    IconBijlage,
    IconBookmark,
    IconInformatie,
    IconPinned,
    IconToevoegen,
    IconVerwijderen,
    IconZichtbaar,
    provideIcons
} from 'harmony-icons';
import { map, startWith } from 'rxjs';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { AvatarStackComponent } from '../../shared/components/avatar-stack/avatar-stack.component';
import { BijlageComponent } from '../../shared/components/bijlage/bijlage/bijlage.component';
import { NotitieAuteurPipe } from '../notitie-auteur.pipe';
import { NotitieDetailLabelComponent } from '../notitie-detail-label/notitie-detail-label.component';
import { NotitieZichtbaarheidButtonComponent } from '../notitie-zichtbaarheid-button/notitie-zichtbaarheid-button.component';
import { isNotitieDelenDisabled, NotitieDelenDisabled } from '../notitieboek-delen.pipe';

@Component({
    selector: 'dt-notitie-detail-mobile-rollup',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NotitieDetailLabelComponent,
        VolledigeNaamPipe,
        IconDirective,
        OutlineButtonComponent,
        IconTagComponent,
        TagComponent,
        RouterModule,
        NotitieZichtbaarheidButtonComponent,
        NotitieDelenDisabled,
        TooltipDirective,
        VerwijderButtonComponent,
        ButtonComponent,
        CheckboxComponent,
        NotitieAuteurPipe,
        BijlageComponent,
        AvatarStackComponent,
        DtDatePipe
    ],
    providers: [
        provideIcons(IconZichtbaar, IconBewerken, IconToevoegen, IconVerwijderen, IconBookmark, IconInformatie, IconBijlage, IconPinned)
    ],
    templateUrl: './notitie-detail-mobile-rollup.component.html',
    styleUrl: './notitie-detail-mobile-rollup.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('slide', [
            transition(':enter', [
                style({ height: '0', padding: '0 16px', margin: '0' }),
                animate('0.25s ease-out', style({ height: AUTO_STYLE, padding: '16px', margin: '8px 0 0' }))
            ]),
            transition(':leave', [
                style({ height: AUTO_STYLE, padding: '16px', margin: '8px 0 0' }),
                animate('0.25s ease-out', style({ height: '0', padding: '0 16px', margin: '0', borderTop: '0', borderBottom: '0' }))
            ])
        ])
    ]
})
export class NotitieDetailMobileRollupComponent implements OnInit, OnDestroy, AfterViewInit {
    private destroyRef = inject(DestroyRef);
    private footerRef = viewChild('footer', { read: ViewContainerRef });
    private medewerkerDataService = inject(MedewerkerDataService);
    private notitieboekDataService = inject(NotitieboekDataService);
    private viewContainerRef = inject(ViewContainerRef);
    private resizeObserver: ResizeObserver | undefined = undefined;

    public context = input.required<NotitieboekContext>();
    public notitie = input.required<NotitieFieldsFragment>();
    public onNotitieDeleted = output<NotitieFieldsFragment>();
    public onNotitieEdit = output();
    public onNewNotitie = output();
    public onGroepLabelClick = output<NotitieStamgroepBetrokkene | NotitieLesgroepBetrokkene>();
    public onLeerlingLabelClick = output<NotitieLeerlingBetrokkeneFieldsFragment>();

    protected betrokkenenToegang = signal<Map<string, boolean>>(new Map<string, boolean>());
    protected eigenNotitie = computed(() => this.notitie().auteur.id === this.medewerkerDataService.medewerkerId);
    protected mentorNotitie = computed(
        () =>
            this.notitie().stamgroepBetrokkenen.some((betrokkene) => betrokkene.geschrevenInMentorContext) ||
            this.notitie().lesgroepBetrokkenen.some((betrokkene) => betrokkene.geschrevenInMentorContext)
    );
    protected huidigSchooljaar = computed(
        () => getSchooljaar(this.notitie().createdAt).start.getFullYear() === getSchooljaar(new Date()).start.getFullYear()
    );
    protected isGedeeldVoorDocenten = signal(false);
    protected isGedeeldVoorMentoren = signal(false);
    protected isGewijzigd = computed(() => this.notitie().createdAt.toString() !== this.notitie().lastModifiedAt.toString());
    protected leerlingBetrokkenenIds = computed(() =>
        JSON.stringify(this.notitie().leerlingBetrokkenen.map((betrokkene) => betrokkene.id))
    );
    protected leerlingen = computed(() => this.notitie().leerlingBetrokkenen.map((betrokkene) => betrokkene.leerling));
    protected lesgroepen = computed(() => this.notitie().lesgroepBetrokkenen.map((betrokkene) => betrokkene.lesgroep));
    protected meerdereBetrokkenen = computed(() => this.betrokkenenCount(this.notitie()) > 1);
    protected scrollWrapperMaxHeight = signal<string>('calc(90vh - 164px');
    protected showDelete = signal(false);
    protected showVisibility = signal(false);
    protected stamgroepen = computed(() => this.notitie().stamgroepBetrokkenen.map((betrokkene) => betrokkene.stamgroep));
    protected zichtbaarheidForm: FormGroup = new FormGroup({
        docenten: new FormControl({ value: false, disabled: false }, { nonNullable: true, validators: [Validators.required] }),
        mentoren: new FormControl({ value: false, disabled: false }, { nonNullable: true, validators: [Validators.required] })
    });

    private docentenDisabled = () => isNotitieDelenDisabled(this.notitie(), 'Docenten');
    private mentorenDisabled = () => isNotitieDelenDisabled(this.notitie(), 'Mentoren');

    public ngOnInit(): void {
        this.isGedeeldVoorDocenten.set(this.notitie().gedeeldVoorDocenten);
        this.isGedeeldVoorMentoren.set(this.notitie().gedeeldVoorMentoren);
        this.resetZichtbaarheidForm();

        // Ensure no scrollbar is shown on the whole rollup
        this.viewContainerRef.element.nativeElement.parentElement?.style.setProperty('overflow-y', 'hidden');

        const initialToegang = new Map<string, boolean>();
        [...this.notitie().stamgroepBetrokkenen, ...this.notitie().lesgroepBetrokkenen, ...this.notitie().leerlingBetrokkenen].forEach(
            (betrokkene) => initialToegang.set(betrokkene.id, true)
        );
        this.notitieboekDataService
            .getNotitieBetrokkeneToegang(this.notitie(), this.context().context, this.context().id)
            .pipe(
                map((toegang: NotitieBetrokkeneToegang[]) => {
                    const map = new Map<string, boolean>();
                    toegang.forEach((x: NotitieBetrokkeneToegang) => map.set(x.betrokkeneId, x.notitieboekToegankelijk));
                    return map;
                }),
                startWith(initialToegang),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((toegang) => this.betrokkenenToegang.set(toegang));
    }

    public ngAfterViewInit(): void {
        if (this.footerRef()) {
            this.resizeObserver = new ResizeObserver((entries) => {
                if (entries[0]) {
                    const footerHeight = this.footerRef()!.element.nativeElement.clientHeight ?? 0;
                    const additionalHeight = 70; // Size of padding, header, etc.
                    this.scrollWrapperMaxHeight.set(`calc(90vh - ${footerHeight + additionalHeight}px)`);
                }
            });

            this.resizeObserver.observe(this.footerRef()!.element.nativeElement);
        }
    }

    public ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    private betrokkenenCount(notitie: NotitieFieldsFragment) {
        return notitie.stamgroepBetrokkenen.length + notitie.lesgroepBetrokkenen.length + notitie.leerlingBetrokkenen.length;
    }

    protected toggleDelete() {
        if (this.showDelete()) {
            this.closeDelete();
        } else {
            this.openDelete();
        }
    }

    private openDelete() {
        this.showVisibility.set(false);
        this.showDelete.set(true);
    }

    protected closeDelete() {
        this.showDelete.set(false);
    }

    protected toggleVisibility() {
        if (this.showVisibility()) {
            this.closeVisibility();
        } else {
            this.openVisibility();
        }
    }

    protected openVisibility() {
        this.resetZichtbaarheidForm();
        this.showDelete.set(false);
        this.showVisibility.set(true);
    }

    protected closeVisibility() {
        this.showVisibility.set(false);
    }

    protected onVisibilitySubmit() {
        const formResult = this.zichtbaarheidForm.getRawValue();
        this.notitieboekDataService.updateZichtbaarheid(this.notitie(), {
            gedeeldVoorDocenten: formResult.docenten,
            gedeeldVoorMentoren: formResult.mentoren,
            reactiesToegestaan: this.notitie().reactiesToegestaan
        });

        // Allow further uses of the visibility dialog.
        this.isGedeeldVoorDocenten.set(formResult.docenten);
        this.isGedeeldVoorMentoren.set(formResult.mentoren);

        this.closeVisibility();
    }

    protected resetZichtbaarheidForm() {
        this.zichtbaarheidForm.patchValue({
            docenten: this.isGedeeldVoorDocenten() && !this.docentenDisabled(),
            mentoren: this.isGedeeldVoorMentoren() && !this.mentorenDisabled()
        });

        if (this.docentenDisabled()) {
            this.zichtbaarheidForm.controls['docenten'].disable();
        } else {
            this.zichtbaarheidForm.controls['docenten'].enable();
        }
        if (this.mentorenDisabled()) {
            this.zichtbaarheidForm.controls['mentoren'].disable();
        } else {
            this.zichtbaarheidForm.controls['mentoren'].enable();
        }

        this.zichtbaarheidForm.markAsPristine();
        this.zichtbaarheidForm.markAsUntouched();
    }
}
