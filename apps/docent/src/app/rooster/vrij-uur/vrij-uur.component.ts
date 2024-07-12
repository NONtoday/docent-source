import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener,
    Input,
    ViewChild,
    ViewContainerRef,
    inject
} from '@angular/core';
import { addMinutes } from 'date-fns';

import { IconDirective } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { SidebarService } from '../../core/services/sidebar.service';
import { AfspraakSidebarComponent, NieuweAfspraak } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { DurationPipe } from '../../rooster-shared/pipes/duration.pipe';
import { VrijUur } from './../../core/models/afspraak.model';

@Component({
    selector: 'dt-vrij-uur',
    templateUrl: './vrij-uur.component.html',
    styleUrls: ['./vrij-uur.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [DurationPipe, IconDirective],
    providers: [provideIcons(IconToevoegen)]
})
export class VrijUurComponent {
    private sidebarService = inject(SidebarService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('addIcon', { read: ViewContainerRef, static: true }) addIcon: ViewContainerRef;
    @Input() vrijUur: VrijUur;

    public isPopupOpen = false;

    @HostListener('click') onclick() {
        this.addAfspraak();
    }

    addAfspraak(): void {
        const afspraak: NieuweAfspraak = {
            begin: new Date(this.vrijUur.begin),
            eind: addMinutes(this.vrijUur.begin, Math.min(this.vrijUur.aantalMinuten, 30)),
            participantenEigenAfspraak: [],
            bijlagen: []
        };
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak, bewerkenState: true });
    }

    onPopUpClose = () => {
        this.isPopupOpen = false;
        this.changeDetector.markForCheck();
    };
}
