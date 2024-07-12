import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InleveringBerichtFieldsFragment } from '../../../../generated/_types';
import { primary_2 } from '../../../rooster-shared/colors';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { LinkComponent } from '../../../rooster-shared/components/link/link.component';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';

@Component({
    selector: 'dt-boodschap',
    templateUrl: './boodschap.component.html',
    styleUrls: ['./boodschap.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, LinkComponent, VolledigeNaamPipe, DtDatePipe]
})
export class BoodschapComponent {
    @Input() boodschap: InleveringBerichtFieldsFragment;

    primary_2 = primary_2;

    openBijlage(url: string) {
        if (url) {
            window.open(url, '_blank');
        }
    }
}
