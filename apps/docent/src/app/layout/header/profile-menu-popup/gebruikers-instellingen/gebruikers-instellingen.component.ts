import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconCheck, IconKlok, IconTijd, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MedewerkerDataService } from '../../../../core/services/medewerker-data.service';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { TimeInputHelperDirective } from '../../../../rooster-shared/directives/time-input-helper.directive';

@Component({
    selector: 'dt-gebruikers-instellingen',
    templateUrl: './gebruikers-instellingen.component.html',
    styleUrls: ['./gebruikers-instellingen.component.scss'],
    animations: [collapseAnimation()],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, TimeInputHelperDirective, ButtonComponent, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconKlok, IconCheck, IconTijd)]
})
export class GebruikersInstellingenComponent implements OnInit, OnDestroy {
    private formbuilder = inject(UntypedFormBuilder);
    private medewerkerDataService = inject(MedewerkerDataService);
    instellingenForm: UntypedFormGroup;
    begintijd: AbstractControl;
    showBegintijdInfo = false;
    magOpslaan = false;
    opgeslagen = false;

    tijdValue: string;
    hideSave = true;

    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.instellingenForm = this.formbuilder.group({
            tijd: [Validators.required]
        });

        this.begintijd = this.instellingenForm.controls['tijd'];

        this.begintijd.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((tijd) => {
            this.hideSave = tijd === this.tijdValue;
        });

        this.medewerkerDataService.getDagBegintijd().subscribe((starttijd) => {
            this.hideSave = true;
            this.tijdValue = starttijd;
            this.begintijd.setValue(starttijd);
        });
    }

    onSubmit() {
        if (this.instellingenForm.valid && this.begintijd.value !== this.tijdValue) {
            this.medewerkerDataService.setDagBegintijd(this.begintijd.value);
            this.instellingenForm.markAsPristine();
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
