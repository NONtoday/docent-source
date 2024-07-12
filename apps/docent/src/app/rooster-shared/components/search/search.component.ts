import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconZoeken, provideIcons } from 'harmony-icons';
import { AutofocusDirective } from '../../directives/autofocus.directive';

@Component({
    selector: 'dt-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ReactiveFormsModule, AutofocusDirective, SpinnerComponent, IconDirective],
    providers: [provideIcons(IconZoeken)]
})
export class SearchComponent {
    @Input() searchControl: FormControl<string>;
    @Input() autofocus = false;
    @Input() placeholder = 'Typ om te zoeken';
    @Input() showSpinner = false;
}
