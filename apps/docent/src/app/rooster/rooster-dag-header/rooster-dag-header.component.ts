import { Component, Input, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { SidebarService } from '../../core/services/sidebar.service';
import { AfspraakSidebarComponent, NieuweAfspraak } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';

@Component({
    selector: 'dt-rooster-dag-header',
    templateUrl: './rooster-dag-header.component.html',
    styleUrls: ['./rooster-dag-header.component.scss'],
    standalone: true,
    imports: [DtDatePipe, IconDirective, BackgroundIconComponent],
    providers: [provideIcons(IconToevoegen)]
})
export class RoosterDagHeaderComponent {
    private sidebarService = inject(SidebarService);
    @Input() datum: Date;
    @Input() vandaag: boolean;

    @ViewChild('addIcon', { read: ViewContainerRef, static: true }) addIcon: ViewContainerRef;
    public isPopupOpen = false;
    onPopUpClose = () => {
        this.isPopupOpen = false;
    };

    addAfspraak(): void {
        const afspraak = {
            begin: this.datum,
            participantenEigenAfspraak: [],
            bijlagen: []
        } as NieuweAfspraak;
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak, bewerkenState: true });
    }
}
