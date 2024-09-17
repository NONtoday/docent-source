import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    Inlevering,
    InleveringStatus,
    InleveringenConversatieQuery,
    InleveringenOverzichtQuery,
    Inleverperiode,
    Leerling,
    LesgroepFieldsFragment,
    Maybe,
    PlagiaatVerwerkingStatus,
    Projectgroep
} from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { isEqual } from 'date-fns';
import { IconDirective, PillComponent } from 'harmony';
import { IconPijlLinks, provideIcons } from 'harmony-icons';
import { sortBy } from 'lodash-es';
import { Observable, Subject, Subscription, combineLatest, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { InleveropdrachtenDataService } from '../../core/services/inleveropdrachten-data.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional, isPresent } from '../../rooster-shared/utils/utils';
import { InleveringConversatieComponent } from '../inlevering-conversatie/inlevering-conversatie.component';
import { InleveringenBeoordelingsmomentComponent } from '../inleveringen-beoordelingsmoment/inleveringen-beoordelingsmoment.component';
import { ProjectgroepNaamComponent } from '../projectgroep-naam/projectgroep-naam.component';
import { InleveringenDetailLeerlingComponent } from './inleveringen-detail-leerling/inleveringen-detail-leerling.component';

interface BeoordelingsMoment {
    beoordelingsMoment: Optional<Date>;
    inleveringen: Inlevering[];
}

@Component({
    selector: 'dt-inleveringen-detail',
    templateUrl: './inleveringen-detail.component.html',
    styleUrls: ['./inleveringen-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        RouterLink,
        AvatarComponent,
        ProjectgroepNaamComponent,
        InleveringenDetailLeerlingComponent,
        InleveringenBeoordelingsmomentComponent,
        InleveringConversatieComponent,
        AsyncPipe,
        VolledigeNaamPipe,
        IconDirective,
        PillComponent
    ],
    providers: [provideIcons(IconPijlLinks)]
})
export class InleveringenDetailComponent implements OnInit, OnChanges, OnDestroy {
    private inleveropdrachtenDataService = inject(InleveropdrachtenDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private changeDetector = inject(ChangeDetectorRef);
    @HostBinding('class.bericht-opstellen') berichtOpstellen: boolean;

    @Input() inleveringen: Inlevering[];
    @Input() inleverperiode: Inleverperiode;
    @Input() toekenningId: string;
    @Input() inleveraar: InleveringenOverzichtQuery['inleveringenOverzicht']['teBeoordelen'][number];
    @Input() berichtenMogelijkOpVestiging: boolean;
    @Input() conversatie: InleveringenConversatieQuery['inleveringenConversatie'];
    @Input() lesgroep: LesgroepFieldsFragment;

    public beoordelingsMomenten: BeoordelingsMoment[];
    public leerling: Optional<Leerling>;
    public projectgroep: Optional<Projectgroep>;
    public geenTeBeoordelenInleveringen: boolean;
    public heeftBerichtenInzienRecht$: Observable<boolean>;
    public heeftBerichtenWijzigenRecht$: Observable<boolean>;

    private inleveringInPlagiaatVerwerking: string[];

    private onDestroy$ = new Subject<void>();
    private plagiaatVerwerkingSubscription$: Maybe<Subscription>;

    ngOnInit() {
        this.heeftBerichtenInzienRecht$ = this.medewerkerDataService.heeftBerichtenInzienRecht().pipe(shareReplayLastValue());
        this.heeftBerichtenWijzigenRecht$ = this.medewerkerDataService.heeftBerichtenWijzigenRecht().pipe(shareReplayLastValue());
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['inleveringen']?.currentValue !== changes['inleveringen']?.previousValue) {
            this.initBeoordelingsMomementen();
        }

        this.geenTeBeoordelenInleveringen =
            this.inleveringen.length === 0 || this.beoordelingsMomenten[0].inleveringen[0].status === InleveringStatus.AFGEWEZEN;

        this.leerling = (<Leerling>this.inleveraar)?.achternaam ? <Leerling>this.inleveraar : null;
        this.projectgroep = (<Leerling>this.inleveraar)?.achternaam ? null : <Projectgroep>this.inleveraar;

        // Polling logica
        this.inleveringInPlagiaatVerwerking =
            this.inleveringen?.filter((inlevering) => inlevering.plagiaatInfo?.inVerwerking).map((inlevering) => inlevering.id) ?? [];
        if (this.plagiaatVerwerkingSubscription$) {
            this.plagiaatVerwerkingSubscription$.unsubscribe();
        }

        // Heeft na changes nog in verwerking, start polling
        if (this.inleveringInPlagiaatVerwerking.length > 0) {
            this.startPlagiaatVerwerkingPolling();
        } else {
            this.plagiaatVerwerkingSubscription$ = null;
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onBerichtOpstellen(opstellen: boolean) {
        this.berichtOpstellen = opstellen;
        this.changeDetector.detectChanges();
    }

    private beoordelingMetDatum = (date: Date) => (moment: BeoordelingsMoment) =>
        (!moment.beoordelingsMoment && !date) || (isPresent(moment.beoordelingsMoment) && isEqual(moment.beoordelingsMoment, date));

    private inleveringenToMomentenReducer = (momenten: BeoordelingsMoment[], inlevering: Inlevering) => {
        const bestaandMoment = momenten.find(this.beoordelingMetDatum(inlevering.wijzigingsDatum!));
        bestaandMoment
            ? bestaandMoment.inleveringen.push(inlevering)
            : momenten.push({
                  beoordelingsMoment: inlevering.wijzigingsDatum!,
                  inleveringen: [inlevering]
              });

        return momenten;
    };

    private initBeoordelingsMomementen() {
        const teBeoordelen: Inlevering[] = [];
        const inBeoordeling: Inlevering[] = [];
        const overige: Inlevering[] = [];

        this.inleveringen.forEach((inlevering) => {
            if (inlevering.status === InleveringStatus.TE_BEOORDELEN) {
                teBeoordelen.push(inlevering);
            } else if (inlevering.status === InleveringStatus.IN_BEOORDELING) {
                inBeoordeling.push(inlevering);
            } else if (inlevering) {
                overige.push(inlevering);
            }
        });

        const teBeoordelenMoment = this.mapInleveringenNaarBeoordelingsmoment(teBeoordelen);
        const inBeoordelingMoment = this.mapInleveringenNaarBeoordelingsmoment(inBeoordeling);
        const overigeMomemnten = sortBy(overige.reduce(this.inleveringenToMomentenReducer, []), 'inleveringen[0].wijzigingsDatum')
            .reverse()
            .filter((beoordelingsMoment) => beoordelingsMoment.inleveringen.length > 0);

        this.beoordelingsMomenten = [teBeoordelenMoment, inBeoordelingMoment, ...overigeMomemnten]
            .filter(Boolean)
            .filter((beoordelingsMoment) => beoordelingsMoment.inleveringen.length > 0);
    }

    private mapInleveringenNaarBeoordelingsmoment(inleveringen: Inlevering[]): BeoordelingsMoment {
        const sorted = sortBy(inleveringen, 'inleveringen[0].wijzigingsDatum').reverse();
        return {
            beoordelingsMoment: sorted[0]?.wijzigingsDatum,
            inleveringen: sorted
        };
    }

    private plagiaatVerwerkingCallback(status: PlagiaatVerwerkingStatus) {
        const nietMeerInVerwerking = this.inleveringInPlagiaatVerwerking?.filter((value) => status.nietInVerwerking.includes(value)) ?? [];
        if (nietMeerInVerwerking.length > 0) {
            this.plagiaatVerwerkingSubscription$?.unsubscribe();
            this.plagiaatVerwerkingSubscription$ = null;

            //  Vraag PlagiaatInfo op voor elementen die niet meer in verwerking zijn.
            this.inleveropdrachtenDataService.updatePlagiaatInfo(this.toekenningId, this.inleveraar.id, nietMeerInVerwerking);

            this.inleveringInPlagiaatVerwerking = this.inleveringInPlagiaatVerwerking.filter(
                (value) => !nietMeerInVerwerking.includes(value)
            );
            if (this.inleveringInPlagiaatVerwerking.length > 0) {
                // Er zijn nog inleveringen inverwerking, start pollen met een delay.
                this.startPlagiaatVerwerkingPolling();
            }
        }
    }

    private startPlagiaatVerwerkingPolling() {
        // Begin met pollen na één minuut
        this.plagiaatVerwerkingSubscription$ = combineLatest([
            timer(60000),
            this.inleveropdrachtenDataService.pollPlagiaatVerwerkingStatus(this.inleveringInPlagiaatVerwerking)
        ])
            .pipe(
                map(([, status]) => status),
                takeUntil(this.onDestroy$)
            )
            .subscribe(this.plagiaatVerwerkingCallback.bind(this));
    }

    startPlagiaatcontrole(inlevering: Inlevering) {
        this.inleveropdrachtenDataService.startPlagiaatcontrole(this.toekenningId, this.inleveraar.id, inlevering.id);
    }
}
