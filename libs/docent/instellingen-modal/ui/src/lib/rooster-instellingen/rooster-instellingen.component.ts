import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from 'harmony';

@Component({
    selector: 'dt-rooster-instellingen',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
    templateUrl: './rooster-instellingen.component.html',
    styleUrl: './rooster-instellingen.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoosterInstellingenComponent implements OnInit {
    dagBegin = input.required<string>();
    tijd = new FormControl('08:00', { nonNullable: true, validators: [Validators.required] });

    saveDagBeginTijd = output<string>();

    ngOnInit() {
        this.tijd.setValue(this.dagBegin(), { emitEvent: false });
    }

    opslaan() {
        this.saveDagBeginTijd.emit(this.tijd.value);
        this.tijd.markAsPristine();
    }
}
