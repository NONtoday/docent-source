import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    input,
    output
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Maybe, NotitieBetrokkeneToegang, NotitieFieldsFragment, PartialLeerlingFragment, Vestiging } from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import {
    IconBewerken,
    IconChevronBoven,
    IconChevronOnder,
    IconNotitieboek,
    IconPijlLinks,
    IconToevoegen,
    IconVerwijderen,
    provideIcons
} from 'harmony-icons';
import { memoize } from 'lodash-es';
import { Observable, map, startWith, take } from 'rxjs';
import { P, match } from 'ts-pattern';
import { allowChildAnimations } from '../../core/core-animations';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../../rooster-shared/components/verwijder-button/verwijder-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional, sortLocale, sortLocaleNested } from '../../rooster-shared/utils/utils';
import { BijlageComponent } from '../../shared/components/bijlage/bijlage/bijlage.component';
import { BookmarkButtonComponent } from '../../shared/components/bookmark-button/bookmark-button.component';
import { EditorFormControlComponent } from '../../shared/components/editor-form-control/editor-form-control.component';
import { VerwijderPopupComponent } from '../../shared/components/verwijder-popup/verwijder-popup.component';
import { NotitieDetailLabelComponent } from '../notitie-detail-label/notitie-detail-label.component';
import { NotitieDetailToolbarPopupComponent } from '../notitie-detail-toolbar-popup/notitie-detail-toolbar-popup.component';
import { NotitieVastprikkenButtonComponent } from '../notitie-vastprikken-button/notitie-vastprikken-button.component';
import { NotitieZichtbaarheidButtonComponent } from '../notitie-zichtbaarheid-button/notitie-zichtbaarheid-button.component';
import { NotitieZichtbaarheidForm } from '../notitie-zichtbaarheid-popup/notitie-zichtbaarheid-popup.component';
import { NotitieDelenDisabled } from '../notitieboek-delen.pipe';
import { NotitieTitelLeerlingenPipe } from './notitie-titel-leerlingen.pipe';

type LeerlingBetrokken = NotitieFieldsFragment['leerlingBetrokkenen'];
type GroepBetrokkenen = (NotitieFieldsFragment['stamgroepBetrokkenen'][number] | NotitieFieldsFragment['lesgroepBetrokkenen'][number]) & {
    naam: string;
    vestiging: Optional<Vestiging>;
};

@Component({
    selector: 'dt-notitie-detail',
    standalone: true,
    imports: [
        RouterModule,
        NotitieZichtbaarheidButtonComponent,
        NotitieVastprikkenButtonComponent,
        NotitieDetailLabelComponent,
        BookmarkButtonComponent,
        NotitieTitelLeerlingenPipe,
        NotitieDelenDisabled,
        IconDirective,
        TooltipDirective,
        AvatarComponent,
        DtDatePipe,
        VolledigeNaamPipe,
        BijlageComponent,
        EditorFormControlComponent,
        OutlineButtonComponent,
        VerwijderButtonComponent,
        AsyncPipe
    ],
    templateUrl: './notitie-detail.component.html',
    styleUrls: ['./../../rooster-shared/scss/bullet.list.view.scss', './notitie-detail-header.scss', './notitie-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 }), allowChildAnimations],
    providers: [
        provideIcons(IconPijlLinks, IconChevronBoven, IconChevronOnder, IconVerwijderen, IconBewerken, IconToevoegen, IconNotitieboek)
    ]
})
export class NotitieDetailComponent implements OnChanges {
    private notitieboekDataService = inject(NotitieboekDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private deviceService = inject(DeviceService);
    @ViewChild('nieuwButton', { read: ViewContainerRef }) nieuwButtonRef: ViewContainerRef;
    @Input() notitie: NotitieFieldsFragment;
    @Input() context: NotitieboekContext;
    @Input() nextNotitie?: Maybe<NotitieFieldsFragment>;
    @Input() prevNotitie?: Maybe<NotitieFieldsFragment>;
    public huidigeSchooljaarSelected = input.required<boolean>();

    onVerwijderNotitie = output<NotitieFieldsFragment>();

    isEigenNotitie = false;
    isGewijzigd = false;
    auteurHasMentorIcon = false;
    leerlingBetrokkenen: LeerlingBetrokken;
    groepBetrokkenen: GroepBetrokkenen[];
    reactieForm = new FormGroup({
        reactie: new FormControl('')
    });
    showInhoud = true;

    notitieBetrokkeneToegang$: Observable<Map<string, boolean>>;

    groepNavigatieTooltip = memoize(
        (groepBetrokkene: GroepBetrokkenen, heeftToegang: boolean) =>
            heeftToegang
                ? 'Navigeer naar notitieboek'
                : `Je hebt geen rechten om het notitieboek van ${groepBetrokkene.naam} ${
                      groepBetrokkene.vestiging ? `(${groepBetrokkene.vestiging.naam}) ` : ''
                  }te bekijken.`,
        (...args) => JSON.stringify(args)
    );

    ngOnChanges(changes: SimpleChanges): void {
        // Alleen gelezen markeren als er geswitched wordt naar een andere notitie.
        // Dit voorkomt een oneindige loop als het gelezenmarkeren fout gaat op de backend doordat de optimistic response wordt teruggedraaid en onChanges steeds opnieuw afgaat.
        if (changes.notitie && changes.notitie.currentValue.id !== changes.notitie.previousValue?.id) {
            this.notitieboekDataService.markeerGelezen(this.notitie, this.context);
        }
        const toegangStartWithValueMap = new Map<string, boolean>();
        [...this.notitie.leerlingBetrokkenen, ...this.notitie.lesgroepBetrokkenen, ...this.notitie.stamgroepBetrokkenen].forEach((x) =>
            toegangStartWithValueMap.set(x.id, true)
        );

        this.notitieBetrokkeneToegang$ = this.notitieboekDataService
            .getNotitieBetrokkeneToegang(this.notitie, this.context.context, this.context.id)
            .pipe(
                map((toegang: NotitieBetrokkeneToegang[]) => {
                    const map = new Map<string, boolean>();
                    toegang.forEach((x: NotitieBetrokkeneToegang) => map.set(x.betrokkeneId, x.notitieboekToegankelijk));
                    return map;
                }),
                startWith(toegangStartWithValueMap)
            );

        this.isEigenNotitie = this.notitie.auteur.id === this.medewerkerDataService.medewerkerId;
        this.auteurHasMentorIcon =
            !this.isEigenNotitie &&
            (this.notitie.stamgroepBetrokkenen.some((s) => s.geschrevenInMentorContext) ||
                this.notitie.leerlingBetrokkenen.some((l) => l.geschrevenInMentorContext) ||
                this.notitie.lesgroepBetrokkenen.some((l) => l.geschrevenInMentorContext));

        this.isGewijzigd = this.notitie.createdAt.toString() !== this.notitie.lastModifiedAt.toString();

        this.leerlingBetrokkenen = sortLocaleNested(this.notitie.leerlingBetrokkenen, (x) => x.leerling, ['voornaam'], ['asc']);

        this.groepBetrokkenen = sortLocale(
            [
                ...this.notitie.lesgroepBetrokkenen.map((lg) => ({
                    ...lg,
                    naam: lg.lesgroep.naam,
                    vestiging: lg.lesgroep.vestiging
                })),
                ...this.notitie.stamgroepBetrokkenen.map((sg) => ({
                    ...sg,
                    naam: sg.stamgroep.naam,
                    vestiging: sg.stamgroep.vestiging
                }))
            ],
            ['naam'],
            ['asc']
        );
        this.showInhoud = !this.notitie.privacygevoelig;
    }

    onReactieVersturenClick(): void {
        //TODO verzenden reactie, moet later geimplementeerd worden
        console.log('Verzend reactie', this.reactieForm.value);
    }

    onBookmark() {
        this.notitieboekDataService.bookmark(this.notitie, this.context.context, this.context.id);
    }

    onVastprikken() {
        this.notitieboekDataService.vastprikken(this.notitie, this.context.context, this.context.id);
    }

    onDetailLabelClickLeerling(toegankelijk: boolean, leerling: PartialLeerlingFragment) {
        if (!toegankelijk) {
            return;
        }
        const isMobielOfTabletPortrait = this.deviceService.isPhoneOrTabletPortrait();
        const notitie = this.route.snapshot.queryParams.notitie;
        if (this.router.routerState.snapshot.url.includes('mentordashboard')) {
            const betrokkenLeerling = this.notitie.leerlingBetrokkenen.find((l) => l.leerling.id === leerling.id);
            betrokkenLeerling?.geschrevenInMentorContext
                ? this.router.navigate(['/mentordashboard/leerling/', leerling.id, 'notitieboek'], {
                      queryParams: { scrollto: isMobielOfTabletPortrait ? notitie : null }
                  })
                : this.router.navigate(['/notitieboek'], {
                      queryParams: { leerling: leerling.id, scrollto: isMobielOfTabletPortrait ? notitie : null }
                  });
            return;
        }

        const contextLesgroepId = this.route.snapshot.queryParams.lesgroep ?? null;
        const contextStamgroepId = this.route.snapshot.queryParams.stamgroep ?? null;

        this.notitieboekDataService
            .zoekBetrokkenen(undefined, contextStamgroepId, contextLesgroepId)
            .pipe(
                take(1),
                map((zoekresults) => zoekresults.leerlingen.some((leerlingZr) => leerlingZr.leerling.id === leerling.id))
            )
            .subscribe((leerlingInDezelfdeGroep) => {
                const queryParams = {
                    leerling: leerling.id,
                    lesgroep: leerlingInDezelfdeGroep ? contextLesgroepId : null,
                    stamgroep: leerlingInDezelfdeGroep ? contextStamgroepId : null,
                    notitie: isMobielOfTabletPortrait ? null : notitie,
                    scrollto: isMobielOfTabletPortrait ? notitie : null
                };

                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams
                });
            });
    }

    onDetailLabelClickGroep(toegankelijk: boolean, groep: GroepBetrokkenen) {
        if (!toegankelijk) {
            return;
        }

        const isMobielOfTabletPortrait = this.deviceService.isPhoneOrTabletPortrait();
        const notitie = this.route.snapshot.queryParams.notitie;

        if (this.router.routerState.snapshot.url.includes('mentordashboard')) {
            if (groep.__typename === 'NotitieStamgroepBetrokkene') {
                groep.geschrevenInMentorContext
                    ? this.router.navigate(['/mentordashboard/stamgroep/', groep.stamgroep.id, 'notitieboek'], {
                          queryParams: { scrollto: isMobielOfTabletPortrait ? notitie : null }
                      })
                    : this.router.navigate(['/notitieboek'], {
                          queryParams: { stamgroep: groep.stamgroep.id, scrollto: isMobielOfTabletPortrait ? notitie : null }
                      });
                return;
            }
        }

        const groepQueryParam = match(groep)
            .with({ lesgroep: P.any }, (groep) => ({ lesgroep: groep.lesgroep.id }))
            .with({ stamgroep: P.any }, (groep) => ({ stamgroep: groep.stamgroep.id }))
            .exhaustive();

        this.router.navigate(['/notitieboek'], {
            queryParams: { ...groepQueryParam, scrollto: isMobielOfTabletPortrait ? notitie : null }
        });
    }

    onZichtbaarheid(form: NotitieZichtbaarheidForm) {
        this.notitieboekDataService.updateZichtbaarheid(this.notitie, {
            gedeeldVoorMentoren: form.mentoren,
            gedeeldVoorDocenten: form.docenten,
            reactiesToegestaan: form.reactiesToegestaan
        });
    }

    openVerwijderPopup() {
        const popup = this.popupService.popup(this.viewContainerRef, VerwijderPopupComponent.defaultPopupSettings, VerwijderPopupComponent);
        popup.onDeleteClick = () => this.onVerwijderNotitie.emit(this.notitie);
    }

    onNieuw() {
        const popup = this.popupService.popup(
            this.nieuwButtonRef,
            NotitieDetailToolbarPopupComponent.defaultPopupsettings,
            NotitieDetailToolbarPopupComponent
        );
        popup.notitie = this.notitie;
        popup.showBerichtNaarAanmaker = !this.isEigenNotitie;
    }

    toggleInhoud() {
        this.showInhoud = !this.showInhoud;
    }
}
