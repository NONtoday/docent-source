import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { InboxBericht } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBericht, IconBijlage, IconInleveropdracht, IconName, provideIcons } from 'harmony-icons';
import { DtDatePipe } from '../../pipes/dt-date.pipe';

@Component({
    selector: 'dt-inbox-bericht',
    templateUrl: './inbox-bericht.component.html',
    styleUrls: ['./inbox-bericht.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [DtDatePipe, IconDirective],
    providers: [provideIcons(IconBijlage, IconInleveropdracht, IconBericht)]
})
export class InboxBerichtComponent implements OnChanges {
    @Input() bericht: InboxBericht;

    icon: IconName;
    verzenderEnVerzendDatum: string;

    ngOnChanges() {
        this.icon = this.isInlevercontextGevuld ? 'inleveropdracht' : 'bericht';
    }

    get isInlevercontextGevuld(): boolean {
        return !!this.bericht.inleveropdrachtContext?.inleveraarId && !!this.bericht.inleveropdrachtContext?.toekenningId;
    }
}
