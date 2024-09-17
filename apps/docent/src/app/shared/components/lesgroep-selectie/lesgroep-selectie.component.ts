import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Lesgroep } from '@docent/codegen';
import { getYear } from 'date-fns';
import { CheckboxComponent } from 'harmony';
import { IconGroep, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';
import { Optional, toId } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-lesgroep-selectie',
    templateUrl: './lesgroep-selectie.component.html',
    styleUrls: ['./lesgroep-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CheckboxComponent,
        BackgroundIconComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe
    ],
    providers: [provideIcons(IconGroep)]
})
export class LesgroepSelectieComponent implements OnInit {
    private medewerkerDataService = inject(MedewerkerDataService);
    public sidebarService = inject(SidebarService);
    @Input() initieleSelectie: Lesgroep[] = [];
    @Input() schooljaar: number = getYear(getSchooljaar(new Date()).start);
    onSelectie = output<Lesgroep[]>();

    public lesgroepen$: Observable<Lesgroep[]>;
    public selecterenEnabled$: Observable<Optional<boolean>>;
    public selecterenText$: Observable<string>;
    public formgroup: UntypedFormGroup;

    constructor() {
        this.formgroup = new UntypedFormGroup({});
    }

    ngOnInit(): void {
        const isSelected = (id: string) => this.initieleSelectie.map(toId).includes(id);
        const createControl = (lesgroep: Lesgroep) =>
            this.formgroup.addControl(lesgroep.id, new UntypedFormControl(isSelected(lesgroep.id)));
        const createControls = (lesgroepen: Lesgroep[]) => lesgroepen.forEach(createControl);

        this.lesgroepen$ = this.medewerkerDataService.getLesgroepenVanSchooljaar(this.schooljaar).pipe(tap(createControls));

        this.selecterenEnabled$ = this.formgroup.valueChanges.pipe(
            map((values) => Object.values(values).includes(true) ?? null),
            startWith(this.initieleSelectie.length !== 0 ? true : null),
            shareReplayLastValue()
        );

        this.selecterenText$ = this.selecterenEnabled$.pipe(
            map((enabled) => (enabled ? 'Selecteren' : 'Selecteer een groep')),
            startWith(this.initieleSelectie.length !== 0 ? 'Selecteren' : 'Selecteer een groep')
        );
    }

    selectAll() {
        Object.keys(this.formgroup.controls).forEach((key) => {
            this.formgroup.controls[key].setValue(true);
        });
    }

    onSelecteren(lesgroepen: Lesgroep[]) {
        const selectedGroepen = lesgroepen.filter((lesgroep) => this.formgroup.value[lesgroep.id]);
        if (selectedGroepen.length > 0) {
            this.onSelectie.emit(selectedGroepen);
        }
    }
}
