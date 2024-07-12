import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconGroep, provideIcons } from 'harmony-icons';
import { MentorleerlingenQuery } from '../../../../../generated/_types';
import { HarmonyColorName } from '../../../../rooster-shared/colors';
import { BackgroundIconComponent } from '../../../../rooster-shared/components/background-icon/background-icon.component';

@Component({
    selector: 'dt-mentorgroep-popup-element',
    standalone: true,
    imports: [BackgroundIconComponent],
    templateUrl: './mentorgroep-popup-element.component.html',
    styleUrls: ['./mentorgroep-popup-element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGroep)]
})
export class MentorgroepPopupElementComponent {
    @Input() stamgroep: MentorleerlingenQuery['mentorleerlingen']['stamgroepMentorleerlingen'][number]['stamgroep'];
    @Input({ required: true }) text: string;

    get colorBgIcon(): HarmonyColorName {
        return (this.stamgroep?.color as HarmonyColorName) || 'typography_1';
    }
}
