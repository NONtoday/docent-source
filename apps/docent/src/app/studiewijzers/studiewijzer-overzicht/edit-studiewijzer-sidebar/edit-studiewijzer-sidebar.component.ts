import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from 'harmony';
import { IconBewerken, IconName, IconToevoegen, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { LesgroepFieldsFragment, Sjabloon, StudiewijzerOverzichtViewQuery } from '../../../../generated/_types';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { AutofocusDirective } from '../../../rooster-shared/directives/autofocus.directive';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { LesgroepDropdownComponent } from '../../../shared/components/lesgroep-dropdown/lesgroep-dropdown.component';
import { StudiewijzerDataService } from '../../studiewijzer-data.service';

@Component({
    selector: 'dt-edit-studiewijzer-sidebar',
    templateUrl: './edit-studiewijzer-sidebar.component.html',
    styleUrls: ['./edit-studiewijzer-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        FormsModule,
        ReactiveFormsModule,
        AutofocusDirective,
        LesgroepDropdownComponent,
        OutlineButtonComponent,
        ButtonComponent,
        SpinnerComponent
    ],
    providers: [provideIcons(IconToevoegen, IconBewerken)]
})
export class EditStudiewijzerSidebarComponent extends BaseSidebar implements OnInit, OnChanges, OnDestroy {
    private formbuilder = inject(FormBuilder);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private router = inject(Router);
    public overzichtService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() studiewijzer: StudiewijzerOverzichtViewQuery['studiewijzerOverzichtView']['studiewijzers'][number];
    @Input() schooljaar: number;
    @Input() lesgroepen: LesgroepFieldsFragment[];

    public icon: IconName = 'toevoegen';
    public title: string;
    public submitText: string;
    public selectingSjabloon = false;
    public studiewijzerForm: UntypedFormGroup;
    public sjabloonSelectie = new Map<Sjabloon, number>();
    public sjabloonToevoegenButtonDisabled = true;
    public toonSjabloonWaarschuwing = false;
    public submitting = false;

    public naamControl: AbstractControl;
    public lesgroepControl: AbstractControl;

    public destroy$ = new Subject<void>();

    ngOnInit() {
        this.studiewijzerForm = this.formbuilder.group({
            naam: [this.studiewijzer.naam, [Validators.required, Validators.maxLength(255)]],
            lesgroep: [{ value: this.studiewijzer.lesgroep, disabled: this.studiewijzer.id }, [Validators.required]]
        });
        this.naamControl = this.studiewijzerForm.controls['naam'];
        this.lesgroepControl = this.studiewijzerForm.controls['lesgroep'];
    }

    ngOnChanges(): void {
        this.setIcon();
        this.setTitle();
        this.submitText = this.studiewijzer.id ? 'Opslaan' : 'Toevoegen';
    }

    submit() {
        this.studiewijzerForm.markAsDirty();
        if (!this.studiewijzerForm.valid) {
            return;
        }

        // de velden uit het formulier aan de bestaande studiewijzer toevoegen/overschrijven
        const studiewijzer = { ...this.studiewijzer, ...this.studiewijzerForm.value };

        if (studiewijzer.id) {
            this.studiewijzerDataService.editStudiewijzer(studiewijzer);
            this.overzichtService.closeSidebar();
        } else {
            this.submitting = true;
            this.studiewijzerDataService
                .createStudiewijzer(studiewijzer, this.schooljaar, this.medewerkerDataService.medewerkerUuid)
                .subscribe({
                    next: ({ data }) => {
                        const newStudiewijzer = data!.saveStudiewijzer;
                        if (newStudiewijzer) {
                            this.router.navigate(['/studiewijzers/' + String(newStudiewijzer.id)]);
                        }
                    },
                    error: () => {
                        this.submitting = false;
                        this.changeDetector.markForCheck();
                    }
                });
        }
    }

    terugNaarSWI() {
        if (this.selectingSjabloon) {
            this.selectingSjabloon = false;
            this.setTitle();
            this.setIcon();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get sjabloonSelectieKeys(): Sjabloon[] {
        return Array.from(this.sjabloonSelectie.keys());
    }

    private setTitle() {
        if (this.selectingSjabloon) {
            return 'Kies sjabloon';
        }
        this.title = this.studiewijzer.id ? 'Studiewijzer bewerken' : 'Nieuwe studiewijzer';
    }

    private setIcon() {
        this.icon = this.studiewijzer.id ? 'bewerken' : 'toevoegen';
    }
}
