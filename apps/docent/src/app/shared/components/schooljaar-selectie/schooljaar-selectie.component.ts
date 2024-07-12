import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { getYear } from 'date-fns';

import { RouterLink } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconChevronLinks, IconChevronRechts, provideIcons } from 'harmony-icons';
import { getSchooljaar } from '../../../rooster-shared/utils/date.utils';

@Component({
    selector: 'dt-schooljaar-selectie',
    templateUrl: './schooljaar-selectie.component.html',
    styleUrls: ['./schooljaar-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, IconDirective],
    providers: [provideIcons(IconChevronLinks, IconChevronRechts)]
})
export class SchooljaarSelectieComponent {
    @HostBinding('class.justify-right') @Input() justifyRight: boolean;

    @Input() schooljaar: number;
    @Input() hidePreviousButton: boolean;
    @Input() hideNextButton: boolean;
    @Input() gtmPreviousButton: string;
    @Input() gtmNextButton: string;

    public huidigSchooljaar = getYear(getSchooljaar(new Date()).start);
}
