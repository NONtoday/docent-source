import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, output } from '@angular/core';
import { Sjabloon } from '@docent/codegen';
import { CheckboxComponent, IconDirective, PillComponent } from 'harmony';
import { IconCheckbox, IconChevronRechts, IconSynchroniseren, IconToevoegen, provideIcons } from 'harmony-icons';
import { accent_positive_1 } from '../../../rooster-shared/colors';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';

@Component({
    selector: 'dt-sjabloon-selectie-item',
    templateUrl: './sjabloon-selectie-item.component.html',
    styleUrls: ['./sjabloon-selectie-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CheckboxComponent,
        TooltipDirective,
        AvatarComponent,
        BackgroundIconComponent,
        VolledigeNaamPipe,
        IconDirective,
        PillComponent
    ],
    providers: [provideIcons(IconSynchroniseren, IconChevronRechts, IconToevoegen, IconCheckbox)]
})
export class SjabloonSelectieItemComponent {
    @HostBinding('class.met-checkbox') @Input() displayCheckbox: boolean;
    @Input() displaySynchronisatieStartWeek: boolean;

    @Input() sjabloon: Sjabloon;
    @Input() heeftVerdieping: boolean;
    @Input() isEigenaar: boolean;
    @Input() isSelected: boolean;
    @Input() isDisabled: boolean;
    @Input() disabledCheckboxTooltip: string;

    checkSjabloon = output<void>();
    sjabloonClick = output<void>();

    accent_positive_1 = accent_positive_1;

    @HostListener('click') onClick() {
        if (!this.displayCheckbox) {
            this.sjabloonClick.emit();
        }
    }

    onCheckSjabloon(event: MouseEvent) {
        if ((event.target as HTMLInputElement).type === 'checkbox') {
            this.checkSjabloon.emit();
        }
    }

    get gesynchroniseerdeStudiewijzersTooltip(): string {
        return `Gesynchroniseerd met ${this.sjabloon.gesynchroniseerdeStudiewijzers
            .map((studiewijzer) => studiewijzer.lesgroep.naam)
            .join(', ')}`;
    }
}
