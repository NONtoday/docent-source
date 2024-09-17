import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, output } from '@angular/core';
import { WatchQueryFetchPolicy } from '@apollo/client/core';
import { Sjabloon, SjabloonCategorie, SjabloonFieldsFragment, Vaksectie, VaksectieView } from '@docent/codegen';
import { IconSjabloon, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { Optional } from '../../rooster-shared/utils/utils';
import { SidebarCategorieDividerComponent } from '../sidebar-categorie-divider/sidebar-categorie-divider.component';
import { SjabloonDataService } from '../sjabloon-data.service';
import { VestigingSchooljaar } from '../sjabloon-synchronisatie-selectie-sidebar/sjabloon-synchronisatie-selectie-sidebar.component';
import { SjabloonSelectieItemComponent } from './sjabloon-selectie-item/sjabloon-selectie-item.component';

@Component({
    selector: 'dt-sjabloon-selectie',
    templateUrl: './sjabloon-selectie.component.html',
    styleUrls: ['./sjabloon-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SjabloonSelectieItemComponent, SidebarCategorieDividerComponent, AsyncPipe],
    providers: [provideIcons(IconSjabloon)]
})
export class SjabloonSelectieComponent implements OnInit {
    private sjabloonDataService = inject(SjabloonDataService);
    public medewerkerDataService = inject(MedewerkerDataService);
    @Input() negeerSjablonen: SjabloonFieldsFragment[] = [];
    @Input() heeftVerdieping = true;
    @Input() alleenMetBijlagen = false;
    @Input() alleenEigenSjablonen = false;
    @Input() displayCheckbox: boolean;
    @Input() displaySynchronisatieStartWeek: boolean;
    @Input() selectedSjablonen: Sjabloon[] = [];
    @Input() sjabloonOverzichtFetchPolicy: WatchQueryFetchPolicy;

    @Input() disabledCheckboxTooltip: string;

    @Input() vestigingSchooljaar?: Optional<VestigingSchooljaar>;
    disabledSjablonen: Sjabloon[] = [];

    onSelect = output<Sjabloon>();

    public vaksecties$: Observable<Vaksectie[]>;
    public sjabloonOverzichtView$: Observable<VaksectieView>;
    public selectedVaksectie$ = new BehaviorSubject<Optional<Vaksectie>>(null);
    public heeftSjablonen$: Observable<boolean>;

    ngOnInit() {
        const viewdata$ = this.sjabloonDataService.getSjabloonOverzichtView(
            this.medewerkerDataService.medewerkerUuid,
            this.sjabloonOverzichtFetchPolicy
        );

        this.vaksecties$ = viewdata$.pipe(
            take(1),
            tap((views) => this.selectedVaksectie$.next(views[0].vaksectie)),
            map((views) => views.map((v) => v.vaksectie)),
            shareReplayLastValue()
        );

        this.sjabloonOverzichtView$ = combineLatest([this.selectedVaksectie$, viewdata$]).pipe(
            map(([selectedVaksectie, views]) => views.find((vaksectieView) => vaksectieView.vaksectie.uuid === selectedVaksectie?.uuid)),
            map((view: VaksectieView) => ({
                ...view,
                sjablonen: this.filterSjablonen(view.sjablonen),
                categorieen: view.categorieen
                    .map((categorie) => ({
                        ...categorie,
                        sjablonen: this.filterSjablonen(categorie.sjablonen)
                    }))
                    .filter((categorie) => categorie.sjablonen.length > 0)
            })),
            shareReplayLastValue()
        );

        this.heeftSjablonen$ = this.sjabloonOverzichtView$.pipe(
            map((view) => {
                const heeftSjabloonBuitenCategorie = view.sjablonen.length > 0;
                const heeftCategorieSjabloon = view.categorieen.some((categorie) => categorie.sjablonen.length > 0);

                return heeftCategorieSjabloon || heeftSjabloonBuitenCategorie;
            }),
            startWith(true)
        );
    }

    filterSjablonen(sjablonen: Sjabloon[]): Sjabloon[] {
        const result = sjablonen
            .filter((sjabloon) => !this.negeerSjablonen.some((ignored) => ignored.id === sjabloon.id))
            .filter((sjabloon) => (this.alleenEigenSjablonen ? sjabloon.eigenaar.id === this.medewerkerDataService.medewerkerId : true))
            .filter((sjabloon) => (this.alleenMetBijlagen ? sjabloon.aantalBijlagen > 0 : true));

        if (this.vestigingSchooljaar) {
            result.forEach((sjabloon) => this.checkIfDisabled(sjabloon));
        }

        return result;
    }

    // Sjabloon is disabled als de vestiging afwijkt of als deze al gesynchroniseert is met een studiewijzer van een ander schooljaar.
    checkIfDisabled(sjabloon: Sjabloon) {
        const studiewijzers = sjabloon.gesynchroniseerdeStudiewijzers;
        if (
            studiewijzers.some((sw) => sw.vestigingId !== this.vestigingSchooljaar?.vestigingId) ||
            studiewijzers.some((sw) => sw.schooljaar !== this.vestigingSchooljaar?.schooljaar)
        ) {
            this.disabledSjablonen.push(sjabloon);
        }
    }

    isEigenaar(sjabloon: Sjabloon): boolean {
        return sjabloon.eigenaar.uuid === this.medewerkerDataService.medewerkerUuid;
    }

    isSelected(sjabloon: Sjabloon) {
        return this.selectedSjablonen.some((s) => s.id === sjabloon.id);
    }

    isDisabled(sjabloon: Sjabloon) {
        return this.disabledSjablonen.some((s) => s.id === sjabloon.id);
    }

    trackById(index: number, item: Sjabloon | SjabloonCategorie | Vaksectie) {
        return item.id;
    }
}
