import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, output } from '@angular/core';
import { IconCheckbox, IconGroep, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Studiewijzer, StudiewijzerFieldsFragment, StudiewijzerOverzichtViewQuery } from '../../../generated/_types';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { CheckboxComponent } from '../../rooster-shared/components/checkbox/checkbox.component';
import { SidebarCategorieDividerComponent } from '../sidebar-categorie-divider/sidebar-categorie-divider.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';

@Component({
    selector: 'dt-studiewijzer-multiselect',
    templateUrl: './studiewijzer-multiselect.component.html',
    styleUrls: ['./studiewijzer-multiselect.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CheckboxComponent, BackgroundIconComponent, SidebarCategorieDividerComponent, AsyncPipe],
    providers: [provideIcons(IconGroep, IconCheckbox)]
})
export class StudiewijzerMultiselectComponent implements OnInit {
    public sidebarService = inject(SidebarService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @Input() studiewijzer: StudiewijzerFieldsFragment;
    @Input() verbergMelding = false;

    selectie = output<Studiewijzer[]>();

    studiewijzerOverzichtView$: Observable<StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']>;
    geselecteerdeStudiewijzers: Studiewijzer[] = [];
    geenStudiewijzers: boolean;

    ngOnInit() {
        this.studiewijzerOverzichtView$ = this.studiewijzerDataService
            .getStudiewijzerOverzichtView(this.studiewijzer.schooljaar, this.medewerkerDataService.medewerkerUuid)
            .pipe(
                map((studiewijzerOverzichtView) => ({
                    studiewijzers: studiewijzerOverzichtView.studiewijzers.filter(
                        (studiewijzer) => studiewijzer.id !== this.studiewijzer.id
                    ),
                    categorieen: studiewijzerOverzichtView.categorieen.map((categorie) => ({
                        ...categorie,
                        studiewijzers: categorie.studiewijzers.filter((studiewijzer) => studiewijzer.id !== this.studiewijzer.id)
                    }))
                })),
                tap((studiewijzerOverzichtView) => {
                    const aantalStudiewijzers = studiewijzerOverzichtView.studiewijzers.length;
                    const aantalCategorieenMetStudiewijzers = studiewijzerOverzichtView.categorieen.map(
                        (categorie) => categorie.studiewijzers.length
                    );
                    let aantalStudiewijzersInCategorieen = 0;

                    if (aantalCategorieenMetStudiewijzers.length > 0) {
                        aantalStudiewijzersInCategorieen = aantalCategorieenMetStudiewijzers.reduce((a, b) => a + b);
                    }

                    this.geenStudiewijzers = aantalStudiewijzers + aantalStudiewijzersInCategorieen === 0;
                })
            );
    }

    onSelect(studiewijzer: StudiewijzerFieldsFragment, event: MouseEvent) {
        if ((event.target as HTMLInputElement).type === 'checkbox') {
            if (this.geselecteerdeStudiewijzers.some((sw) => sw.id === studiewijzer.id)) {
                this.geselecteerdeStudiewijzers = this.geselecteerdeStudiewijzers.filter((sw) => sw.id !== studiewijzer.id);
            } else {
                this.geselecteerdeStudiewijzers.push(studiewijzer as Studiewijzer);
            }

            this.selectie.emit(this.geselecteerdeStudiewijzers);
        }
    }
}
