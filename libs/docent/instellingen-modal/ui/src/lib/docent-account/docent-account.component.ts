import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IngelogdeMedewerkerQuery } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { AvatarComponent } from 'harmony';
import { VerouderdeVersieWarningComponent } from '../verouderde-versie-warning/verouderde-versie-warning.component';

@Component({
    selector: 'dt-docent-account',
    standalone: true,
    imports: [CommonModule, AvatarComponent, VerouderdeVersieWarningComponent],
    templateUrl: './docent-account.component.html',
    styleUrl: './docent-account.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocentAccountComponent {
    docent = input.required<IngelogdeMedewerkerQuery['ingelogdeMedewerker']>();
    volledigeNaamEnAfkorting = computed(() => `${getVolledigeNaam(this.docent())} (${this.docent().afkorting})`);
}
