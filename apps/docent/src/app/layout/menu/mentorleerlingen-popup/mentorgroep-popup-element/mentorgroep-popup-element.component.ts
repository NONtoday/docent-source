import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconGroep, provideIcons } from 'harmony-icons';
import { MentorleerlingenQuery } from '../../../../../generated/_types';
import { BackgroundIconComponent } from '../../../../rooster-shared/components/background-icon/background-icon.component';
import { BackgroundIconColor } from '../../../../rooster-shared/utils/color-token-utils';

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

    get colorBgIcon(): BackgroundIconColor {
        return this.stamgroep?.color as BackgroundIconColor;
    }
}
