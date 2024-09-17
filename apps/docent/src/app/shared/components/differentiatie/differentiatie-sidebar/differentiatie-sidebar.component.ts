import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Differentiatiegroep, DifferentiatiegroepKleur, Leerling, Lesgroep } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconDifferentiatie, IconPijlKleinOnder, IconPijlLinks, IconToevoegen, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DifferentiatiegroepenDataService } from '../../../../core/services/differentiatiegroepen-data.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../../rooster-shared/directives/base-sidebar.directive';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { Optional, notEqualsId, toId } from '../../../../rooster-shared/utils/utils';
import { LeerlingGroepFormControlComponent } from '../../leerling-groep-form-control/leerling-groep-form-control.component';
import { DifferentiatiegroepHeaderComponent } from '../differentiatiegroep-header/differentiatiegroep-header.component';
import { DifferentiatieLeerlingDropData, DifferentiatiegroepenComponent } from '../differentiatiegroepen/differentiatiegroepen.component';

const NIEUWE_DIFF_GROEP_ID = 'TEMP_DIFF_GROEP_ID';

@Component({
    selector: 'dt-differentiatie-sidebar',
    templateUrl: './differentiatie-sidebar.component.html',
    styleUrls: ['./differentiatie-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        TooltipDirective,
        DifferentiatiegroepenComponent,
        DifferentiatiegroepHeaderComponent,
        OutlineButtonComponent,
        LeerlingGroepFormControlComponent,
        FormsModule,
        ReactiveFormsModule,
        ButtonComponent,
        SpinnerComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconPijlKleinOnder, IconToevoegen, IconDifferentiatie, IconPijlLinks)]
})
export class DifferentiatieSidebarComponent extends BaseSidebar implements OnInit {
    private differentiatiegroepenDataService = inject(DifferentiatiegroepenDataService);
    public sidebarService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('sidebar', { read: ViewContainerRef }) sidebarViewContainerRef: ViewContainerRef;

    @Input() lesgroep: Lesgroep;

    differentiatiegroepen$: Observable<Differentiatiegroep[]>;
    leerlingen$: Observable<Leerling[]>;

    formGroup = new UntypedFormGroup({});
    selectedDifferentiatiegroep: Differentiatiegroep;
    aantalGeselecteerdeLeerlingen$: Observable<number>;
    leerlingenZonderGroep$: Observable<Leerling[]>;

    private leerlingenMetDifferentiatiegroepenVanLesgroep$: Observable<Leerling[]>;

    nieuweGroep$ = new BehaviorSubject<Optional<Differentiatiegroep>>(undefined);

    ngOnInit(): void {
        this.sidebarService.changePage({
            icon: 'differentiatie',
            titel: `Differentiatiegroepen ${this.lesgroep.naam}`,
            iconClickable: false,
            pagenumber: 1
        });
        this.differentiatiegroepen$ = this.differentiatiegroepenDataService.getDifferentiatiegroepen(this.lesgroep.id);
        this.leerlingenMetDifferentiatiegroepenVanLesgroep$ =
            this.differentiatiegroepenDataService.getLeerlingenMetDifferentiatiegroepenVanLesgroep(this.lesgroep.id);
        this.leerlingenZonderGroep$ = this.leerlingenMetDifferentiatiegroepenVanLesgroep$.pipe(
            map((leerlingen) =>
                leerlingen.filter((leerling) => !leerling.differentiatiegroepen || leerling.differentiatiegroepen.length === 0)
            ),
            filter((leerlingen) => leerlingen.length > 0)
        );
    }

    closeSidebar() {
        this.sidebarService.closeSidebar();
    }

    saveDifferentiatiegroep(differentiatiegroep: Differentiatiegroep) {
        let groep = differentiatiegroep;
        if (this.nieuweGroep$.value && differentiatiegroep.id === NIEUWE_DIFF_GROEP_ID) {
            this.nieuweGroep$.next(undefined);
            groep = {
                ...groep,
                id: undefined
            } as any as Differentiatiegroep;
        }
        this.differentiatiegroepenDataService.saveDifferentiatiegroep(groep, this.lesgroep.id).subscribe();
    }

    deleteDifferentiatiegroep(differentiatiegroep: Differentiatiegroep) {
        this.differentiatiegroepenDataService.deleteDifferentiatiegroep(differentiatiegroep.id);
    }

    onLeerlingenToevoegen(differentiatiegroep: Differentiatiegroep) {
        const createControl = (leerlingId: string) => this.formGroup.addControl(leerlingId, new UntypedFormControl(false));
        const createControls = (leerlingenIds: string[]) => leerlingenIds.forEach(createControl);

        this.formGroup.reset();
        this.selectedDifferentiatiegroep = differentiatiegroep;
        const differentiatieLeerlingenIds = (differentiatiegroep.leerlingen ?? []).map(toId);
        this.leerlingen$ = this.leerlingenMetDifferentiatiegroepenVanLesgroep$.pipe(
            map((leerlingen: Leerling[]) => leerlingen.filter((leerling) => !differentiatieLeerlingenIds.includes(leerling.id))),
            tap((leerlingen: Leerling[]) => createControls(leerlingen.map(toId)))
        );
        this.aantalGeselecteerdeLeerlingen$ = this.formGroup.valueChanges.pipe(
            map((values) => Object.values(values).filter(Boolean).length)
        );

        this.sidebarService.changePage({
            icon: 'pijlLinks',
            titel: 'Kies leerlingen',
            iconClickable: true,
            onIconClick: () => {
                this.sidebarService.previousPage();
                this.formGroup.reset();
            },
            pagenumber: 2
        });
    }

    voegLeerlingenToe(leerlingen: Leerling[]) {
        const selectedLeerlingen = leerlingen.filter((leerling) => this.formGroup.controls[leerling.id].value);
        const differentiatiegroepLeerlingen: Leerling[] = [...(this.selectedDifferentiatiegroep.leerlingen ?? []), ...selectedLeerlingen];
        const differentiatiegroepInput: Differentiatiegroep = {
            ...this.selectedDifferentiatiegroep,
            leerlingen: differentiatiegroepLeerlingen
        };

        this.differentiatiegroepenDataService.saveDifferentiatiegroep(differentiatiegroepInput, this.lesgroep.id).subscribe(() => {
            this.sidebarService.previousPage();
        });
    }

    onLeerlingVerplaatst(data: DifferentiatieLeerlingDropData) {
        this.differentiatiegroepenDataService.verplaatsLeerling(this.lesgroep.id, data.leerling.id, data.van, data.naar).subscribe();
    }

    addGroep() {
        this.nieuweGroep$.next({
            __typename: 'Differentiatiegroep',
            id: NIEUWE_DIFF_GROEP_ID,
            naam: '',
            kleur: DifferentiatiegroepKleur.BLAUW,
            leerlingen: []
        });
    }

    editCancelled() {
        this.nieuweGroep$.next(undefined);
        this.changeDetector.detectChanges();
    }
    verwijderLeerlingUitGroep(leerling: Leerling, differentiatiegroep: Differentiatiegroep) {
        const differentiatiegroepInput: Differentiatiegroep = {
            ...differentiatiegroep,
            leerlingen: [...(differentiatiegroep.leerlingen ?? []).filter(notEqualsId(leerling.id))]
        };

        this.differentiatiegroepenDataService.saveDifferentiatiegroep(differentiatiegroepInput, this.lesgroep.id).subscribe();
    }

    leerlingenZonderGroepTooltip = (leerlingen: Leerling[]) => leerlingen.map(getVolledigeNaam).join(', ');
}
