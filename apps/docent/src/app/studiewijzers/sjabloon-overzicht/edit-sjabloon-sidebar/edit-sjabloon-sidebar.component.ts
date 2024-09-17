import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Sjabloon, Studiewijzer, Vaksectie } from '@docent/codegen';
import { IconDirective, SpinnerComponent } from 'harmony';
import {
    IconGroep,
    IconName,
    IconNietZichtbaarCheckbox,
    IconPijlLinks,
    IconSjabloon,
    IconStudiewijzer,
    IconVerwijderen,
    IconZichtbaarCheckbox,
    provideIcons
} from 'harmony-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { EditAction } from '../../../core/models/shared.model';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { FormDropdownComponent } from '../../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { AutofocusDirective } from '../../../rooster-shared/directives/autofocus.directive';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { DropDownOption } from '../../../rooster-shared/utils/dropdown.util';
import { Optional } from '../../../rooster-shared/utils/utils';
import { SjabloonDataService } from '../../sjabloon-data.service';
import { StudiewijzerSelectieComponent } from '../../studiewijzer-selectie/studiewijzer-selectie.component';

@Component({
    selector: 'dt-edit-sjabloon-sidebar',
    templateUrl: './edit-sjabloon-sidebar.component.html',
    styleUrls: ['./edit-sjabloon-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        FormsModule,
        ReactiveFormsModule,
        AutofocusDirective,
        FormDropdownComponent,
        OutlineButtonComponent,
        BackgroundIconComponent,
        IconComponent,
        NgClass,
        ButtonComponent,
        SpinnerComponent,
        StudiewijzerSelectieComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconStudiewijzer,
            IconGroep,
            IconVerwijderen,
            IconZichtbaarCheckbox,
            IconNietZichtbaarCheckbox,
            IconSjabloon,
            IconPijlLinks
        )
    ]
})
export class EditSjabloonSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private formbuilder = inject(UntypedFormBuilder);
    private medewerkerService = inject(MedewerkerDataService);
    private sjabloonDataService = inject(SjabloonDataService);
    private router = inject(Router);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() sjabloon: Sjabloon;
    @Input() vaksectie: Vaksectie;
    @Input() vanuitDetail: boolean;

    public icon: IconName = 'sjabloon';
    public title = 'Nieuw sjabloon';
    public submitting = false;

    public editSjabloonForm: UntypedFormGroup;
    public naamControl: AbstractControl;
    public selectedStudiewijzer: Optional<Studiewijzer>;
    public selectingStudiewijzer = false;
    public vaksecties$: Observable<DropDownOption<Vaksectie>[]>;
    public selectedVaksectie$ = new BehaviorSubject<Optional<DropDownOption<Vaksectie>>>(null);
    public oudeVaksectie: Vaksectie;

    ngOnInit() {
        this.oudeVaksectie = this.vaksectie;
        this.vaksecties$ = this.sjabloonDataService.getVaksecties().pipe(
            tap((vaksecties) => {
                const selected = vaksecties.find((v) => v.uuid === this.vaksectie.uuid);
                const dropDownOption = selected
                    ? { value: selected, text: selected.naam }
                    : { value: vaksecties[0], text: vaksecties[0].naam };
                this.selectedVaksectie$.next(dropDownOption);
                this.vaksectie = dropDownOption.value;
            }),
            map((vaksecties) => vaksecties.map((v) => ({ value: v, text: v.naam })))
        );

        this.editSjabloonForm = this.formbuilder.group({
            naam: [this.sjabloon.naam, [Validators.required, Validators.maxLength(255)]],
            isGedeeld: [!!this.sjabloon.gedeeldMetVaksectie]
        });
        this.naamControl = this.editSjabloonForm.controls['naam'];
        if (this.sjabloon.id) {
            this.title = 'Sjabloon bewerken';
        }
    }

    updateGedeeld() {
        const attribute = this.editSjabloonForm.get('isGedeeld')!;
        attribute.setValue(!attribute.value);
    }

    get gedeeld() {
        return this.editSjabloonForm.get('isGedeeld')!.value;
    }

    toonStudiewijzerOverzicht() {
        this.selectingStudiewijzer = true;
        this.icon = 'pijlLinks';
        this.title = 'Kies studiewijzer';
    }

    stopSelecteren() {
        this.selectingStudiewijzer = false;
        this.icon = 'sjabloon';
        this.title = 'Nieuw sjabloon';
        this.changeDetector.markForCheck();
    }

    selecteerStudiewijzer(studiewijzer: Studiewijzer) {
        this.selectedStudiewijzer = studiewijzer;
        this.stopSelecteren();
    }

    deselecteerStudiewijzer() {
        this.selectedStudiewijzer = null;
    }

    submit() {
        if (this.editSjabloonForm.valid) {
            if (this.sjabloon.id) {
                const sjabloonCopy = { ...this.sjabloon };

                sjabloonCopy.naam = this.naamControl.value;
                sjabloonCopy.gedeeldMetVaksectie = this.gedeeld;
                sjabloonCopy.vaksectie = this.vaksectie;
                const closeSidebar = () => {
                    this.sidebarService.closeSidebar();
                };
                const oudeVaksectieUuid = this.oudeVaksectie !== this.vaksectie ? this.oudeVaksectie.uuid : null;
                if (this.vanuitDetail) {
                    this.sjabloonDataService.saveSjabloonVanuitDetail(sjabloonCopy, oudeVaksectieUuid).subscribe(closeSidebar);
                } else {
                    this.sjabloonDataService
                        .saveSjabloonVanuitOverzicht(sjabloonCopy, EditAction.UPDATE, null, oudeVaksectieUuid)
                        .subscribe(closeSidebar);
                }
            } else {
                this.medewerkerService
                    .getMedewerker()
                    .pipe(take(1))
                    .subscribe((medewerker) => {
                        const newSjabloon = {
                            naam: this.naamControl.value,
                            gedeeldMetVaksectie: this.gedeeld,
                            eigenaar: medewerker,
                            vaksectie: this.vaksectie
                        } as Sjabloon;
                        const studiewijzerId = this.selectedStudiewijzer ? this.selectedStudiewijzer.id : undefined;
                        this.submitting = true;
                        this.sjabloonDataService.saveSjabloonVanuitOverzicht(newSjabloon, EditAction.CREATE, studiewijzerId).subscribe(
                            (response) => {
                                this.sidebarService.closeSidebar();
                                if (response.data) {
                                    setTimeout(() => {
                                        this.router.navigate(['/studiewijzers/sjablonen/' + response.data!.saveSjabloon.sjabloon.id], {
                                            queryParamsHandling: 'merge'
                                        });
                                    });
                                }
                            },
                            () => {
                                this.submitting = false;
                                this.changeDetector.markForCheck();
                            }
                        );
                    });
            }
        }
    }
}
