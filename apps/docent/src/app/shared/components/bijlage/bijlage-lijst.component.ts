import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Bijlage } from '@docent/codegen';
import { IconBijlage, provideIcons } from 'harmony-icons';
import { BijlageComponent } from './bijlage/bijlage.component';

@Component({
    selector: 'dt-bijlage-lijst',
    template: `
        @for (bijlage of bijlagen; track bijlage; let isLast = $last) {
            <dt-bijlage [bijlage]="bijlage" [last]="isLast" [toekomend]="toekomend"></dt-bijlage>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BijlageComponent],
    providers: [provideIcons(IconBijlage)]
})
export class BijlageLijstComponent {
    @HostBinding('class.toekomend') @Input() toekomend = false;
    @Input() bijlagen: Bijlage[];
}
