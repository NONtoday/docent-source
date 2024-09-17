import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChildren, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CachedStudiewijzeritemQuery, Differentiatiegroep, Leerling, Projectgroep, ProjectgroepFieldsFragment } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconPijlKleinOnder, IconToevoegen, provideIcons } from 'harmony-icons';
import flatMap from 'lodash-es/flatMap';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ProjectgroepenDataService } from '../../../core/services/projectgroepen-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional, equalsId, toId } from '../../../rooster-shared/utils/utils';
import { LeerlingGroepFormControlComponent } from '../leerling-groep-form-control/leerling-groep-form-control.component';
import { ProjectgroepComponent } from '../projectgroep/projectgroep.component';

@Component({
    selector: 'dt-projectgroepen',
    templateUrl: './projectgroepen.component.html',
    styleUrls: ['./projectgroepen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 })],
    standalone: true,
    imports: [
        LeerlingGroepFormControlComponent,
        FormsModule,
        ReactiveFormsModule,
        OutlineButtonComponent,
        ButtonComponent,
        CdkDropListGroup,
        TooltipDirective,
        ProjectgroepComponent,
        CdkDropList,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconToevoegen, IconPijlKleinOnder)]
})
export class ProjectgroepenComponent implements OnInit, OnDestroy {
    private projectDataService = inject(ProjectgroepenDataService);
    private sidebarService = inject(SidebarService);
    @ViewChildren(ProjectgroepComponent) projectgroepen: ProjectgroepComponent[];

    @Input() lesgroepId: string;
    @Input() studiewijzeritemId: string;
    @Input() toekenningId: string;
    @Input() differentiatiegroepen: Differentiatiegroep[];
    @Input() differentiatieleerlingen: Leerling[];

    onSaveProjectgroep = output<void>();

    public projectgroepen$: Observable<CachedStudiewijzeritemQuery['studiewijzeritem']['projectgroepen']>;
    public teKiezenLeerlingen$: Observable<Leerling[]>;
    public leerlingAantalZonderProjectgroep$: Observable<number>;
    public showLeerlingSelectie$: BehaviorSubject<Optional<ProjectgroepFieldsFragment>> = new BehaviorSubject(null);
    public formGroup = new UntypedFormGroup({});
    public aantalGeselecteerdeLeerlingen$: Observable<number>;

    private projectgroepInEditMode = false;
    private unsubscribe$ = new Subject<void>();

    terug = output<void>();

    ngOnInit() {
        const createControl = (leerlingId: string) => this.formGroup.addControl(leerlingId, new UntypedFormControl(false));
        const createControls = (leerlingenIds: string[]) => leerlingenIds.forEach(createControl);

        this.projectgroepen$ = this.projectDataService.getCachedStudiewijzeritem(this.studiewijzeritemId).pipe(
            map((studiewijzeritem) => studiewijzeritem.projectgroepen),
            shareReplay(1)
        );

        this.teKiezenLeerlingen$ = combineLatest([
            this.projectgroepen$,
            this.projectDataService.getLeerlingenVanLesgroep(this.lesgroepId)
        ]).pipe(
            map(([projectgroepen, leerlingen]) => {
                const ingedeeldeLeerlingIds = flatMap(projectgroepen, (groep) => groep.leerlingen).map((leerling) => leerling.id);

                return leerlingen
                    .map((leerling) => leerling as Leerling)
                    .filter((leerling) => !ingedeeldeLeerlingIds.includes(leerling.id));
            }),
            map((leerlingen) => leerlingen.filter(this.diffLeerlingenFilter)),
            tap((leerlingen: Leerling[]) => createControls(leerlingen.map(toId))),
            shareReplay(1)
        );

        this.leerlingAantalZonderProjectgroep$ = this.teKiezenLeerlingen$.pipe(map((leerlingen) => leerlingen.length));
    }

    saveProjectgroep(projectgroep: ProjectgroepFieldsFragment) {
        this.projectDataService.saveProjectgroep(projectgroep, this.studiewijzeritemId).subscribe();
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    openLeerlingSelectie(projectgroep: ProjectgroepFieldsFragment) {
        this.projectgroepInEditMode = true;
        this.showLeerlingSelectie$.next(projectgroep);
        this.aantalGeselecteerdeLeerlingen$ = this.formGroup.valueChanges.pipe(
            map((values: boolean[]) => Object.values(values).filter(Boolean).length)
        );

        const page = this.sidebarService.currentPage;
        this.sidebarService.changePage({
            ...page,
            titel: 'Kies leerlingen',
            previousPage: page,
            onIconClick: () => this.sluitLeerlingSelectie()
        });
    }

    sluitLeerlingSelectie() {
        this.projectgroepInEditMode = false;
        this.showLeerlingSelectie$.next(null);
        this.formGroup.reset();
        this.sidebarService.previousPage();
    }

    onLeerlingenSelected(projectgroep: ProjectgroepFieldsFragment, leerlingen: Leerling[]) {
        const editedProjectgroep = {
            ...projectgroep,
            leerlingen: [...projectgroep.leerlingen, ...leerlingen.filter((leerling) => this.formGroup.controls[leerling.id].value)]
        } as ProjectgroepFieldsFragment;
        this.projectDataService.saveProjectgroep(editedProjectgroep, this.studiewijzeritemId).subscribe();
        this.sluitLeerlingSelectie();
    }

    deleteProjectgroep(projectgroep: ProjectgroepFieldsFragment, isLast: boolean) {
        this.projectDataService.deleteProjectgroep(projectgroep.id, this.studiewijzeritemId, this.toekenningId, isLast);
    }

    canDeactivate(): boolean {
        return !this.projectgroepInEditMode;
    }

    nieuweProjectgroep(projectgroepnummer: number) {
        const nieuweProjectgroep = {
            naam: `Projectgroep ${projectgroepnummer}`,
            leerlingen: [],
            heeftInlevering: false
        } as any as ProjectgroepFieldsFragment;

        this.projectDataService.saveProjectgroep(nieuweProjectgroep, this.studiewijzeritemId).subscribe(() => {
            this.onSaveProjectgroep.emit();
        });
    }

    trackById(index: number, item: CachedStudiewijzeritemQuery['studiewijzeritem']['projectgroepen'][number]) {
        return item ? item.id : null;
    }

    leerlingenZonderGroepTooltip = (leerlingen: Leerling[]) => leerlingen.map(getVolledigeNaam).join(', ');

    bevatLeerlingNiet = (item: CdkDrag<Leerling>, drop: CdkDropList<Projectgroep>) => {
        const leerlingen = drop.data.leerlingen ?? [];
        return !leerlingen.some(equalsId(item.data.id));
    };

    leerlingVerplaatst(dragDropData: any) {
        const van: Projectgroep = dragDropData.previousContainer.data;
        const naar: Projectgroep = dragDropData.container.data;
        const leerlingId: string = dragDropData.item.data.id;
        if (van.id !== naar.id) {
            this.projectDataService.verplaatsLeerling(this.studiewijzeritemId, leerlingId, van, naar).subscribe();
        }
    }

    diffLeerlingenFilter = (leerling: Leerling) => {
        const differentatiegroepLeerlingIds =
            this.differentiatiegroepen
                ?.flatMap((groep) => groep.leerlingen)
                ?.map((leerling) => leerling?.id)
                .filter(Boolean) ?? [];
        const leerlingIds = this.differentiatieleerlingen?.map(toId);
        const diffLeerlingenIds = differentatiegroepLeerlingIds.concat(leerlingIds);

        return diffLeerlingenIds.length === 0 ? true : diffLeerlingenIds.some((id) => id === leerling.id);
    };
}
