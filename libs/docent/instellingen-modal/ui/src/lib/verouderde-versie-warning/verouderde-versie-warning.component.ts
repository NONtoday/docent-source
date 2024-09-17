import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonComponent, IconDirective } from 'harmony';
import { IconSynchroniseren, provideIcons } from 'harmony-icons';

@Component({
    selector: 'dt-verouderde-versie-warning',
    standalone: true,
    imports: [CommonModule, ButtonComponent, IconDirective],
    providers: [provideIcons(IconSynchroniseren)],
    templateUrl: './verouderde-versie-warning.component.html',
    styleUrl: './verouderde-versie-warning.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerouderdeVersieWarningComponent {
    ververs() {
        window.location.reload();
    }
}
