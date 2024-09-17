import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { CijferPeriodeWeek, Sjabloon } from '@docent/codegen';
import { getISOWeek } from 'date-fns';
import { IconPijlLinks, IconSjabloon, provideIcons } from 'harmony-icons';
import { Observable, Subject } from 'rxjs';
import { SidebarPage } from '../../../core/models/studiewijzers/studiewijzer.model';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { SjabloonSelectieComponent } from '../../sjabloon-selectie/sjabloon-selectie.component';
import { StudiewijzerDataService } from '../../studiewijzer-data.service';
import { SjabloonWeergaveComponent } from '../../studiewijzer-overzicht/edit-studiewijzer-sidebar/sjabloon-weergave/sjabloon-weergave.component';

const overzichtSidebarPage: SidebarPage = {
    titel: 'Sjablonen importeren',
    icon: 'sjabloon',
    iconClickable: false,
    pagenumber: 1
};

@Component({
    selector: 'dt-sjabloon-importeren-sidebar',
    templateUrl: './sjabloon-importeren-sidebar.component.html',
    styleUrls: ['./sjabloon-importeren-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, SjabloonSelectieComponent, SjabloonWeergaveComponent, OutlineButtonComponent, ButtonComponent, AsyncPipe],
    providers: [provideIcons(IconSjabloon, IconPijlLinks)]
})
export class SjabloonImporterenSidebarComponent extends BaseSidebar implements OnInit, OnDestroy {
    public sidebarService = inject(SidebarService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @Input() id: string;
    @Input() lesgroepId: string;
    @Input() schooljaar: number;
    @Input() studiewijzerId: string;

    onImporteren = output<void>();

    geselecteerdeSjablonen: { sjabloon: Sjabloon; weeknummer: number }[] = [];
    checkedSjablonen: Sjabloon[] = [];
    genegeerdeSjablonen: Sjabloon[] = [];

    cijferPeriodeWeken$: Observable<CijferPeriodeWeek[]>;

    private destroy$ = new Subject<void>();

    constructor() {
        super();
        this.sidebarService.changePage(overzichtSidebarPage);
    }

    ngOnInit() {
        this.cijferPeriodeWeken$ = this.studiewijzerDataService.getCijferPeriodeWekenMetVakantie(this.lesgroepId, this.studiewijzerId);
    }

    selecteerSjabloon(sjabloon: Sjabloon) {
        if (this.checkedSjablonen.some((s) => s.id === sjabloon.id)) {
            this.checkedSjablonen = this.checkedSjablonen.filter((s) => s.id !== sjabloon.id);
        } else {
            this.checkedSjablonen.push(sjabloon);
        }
    }

    selecteerWeekVoorSjabloon(sjabloon: Sjabloon, weeknummer: number) {
        this.geselecteerdeSjablonen = this.geselecteerdeSjablonen.map((sjabloonContainer) =>
            sjabloonContainer.sjabloon.id === sjabloon.id ? { sjabloon, weeknummer } : sjabloonContainer
        );
    }

    verwijderSjabloonUitSelectie(sjabloon: Sjabloon) {
        this.geselecteerdeSjablonen = this.geselecteerdeSjablonen.filter(
            (sjabloonContainer) => sjabloonContainer.sjabloon.id !== sjabloon.id
        );
        this.genegeerdeSjablonen = this.geselecteerdeSjablonen.map((sjabloonContainer) => sjabloonContainer.sjabloon);
    }

    onKiesSjabloonClick() {
        this.sidebarService.changePage({
            titel: 'Kies sjabloon',
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 2,
            onIconClick: () => this.sidebarService.previousPage()
        });
    }

    onToevoegenClick() {
        this.geselecteerdeSjablonen = [
            ...this.geselecteerdeSjablonen,
            ...this.checkedSjablonen.map((sjabloon: Sjabloon) => ({ sjabloon, weeknummer: getISOWeek(new Date()) }))
        ];
        this.checkedSjablonen = [];
        this.genegeerdeSjablonen = this.geselecteerdeSjablonen.map((sjabloonContainer) => sjabloonContainer.sjabloon);
        this.sidebarService.changePage(overzichtSidebarPage);
    }

    onImporterenClick() {
        const sjablonenContainer = this.geselecteerdeSjablonen.map((container) => ({
            sjabloonId: container.sjabloon.id,
            weeknummer: container.weeknummer
        }));
        this.studiewijzerDataService.importeerSjablonen$(this.id, sjablonenContainer).subscribe(() => {
            this.onImporteren.emit();
            this.sidebarService.closeSidebar();
        });
    }

    onCancelClick(page: number) {
        if (page === 1) {
            this.sidebarService.closeSidebar();
        } else {
            this.checkedSjablonen = [];
            this.sidebarService.previousPage();
        }
    }

    hideHeader(page: number): boolean {
        return page === 1 && this.geselecteerdeSjablonen.length === 0;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isEigenaar(sjabloon: Sjabloon): boolean {
        return sjabloon.eigenaar.uuid === this.medewerkerDataService.medewerkerUuid;
    }
}
