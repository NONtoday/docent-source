import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { Afspraak } from '@docent/codegen';
import { IconDirective, TagComponent } from 'harmony';
import { IconBewerken, IconCheck, IconKalenderDag, IconVerversen, IconVerwijderen, IconYesRadio, provideIcons } from 'harmony-icons';
import { PopupService } from '../../../../core/popup/popup.service';
import { PopupDirection } from '../../../../core/popup/popup.settings';
import { BijlageLijstComponent } from '../../../../shared/components/bijlage/bijlage-lijst.component';
import { VerwijderPopupComponent } from '../../../../shared/components/verwijder-popup/verwijder-popup.component';
import { AfspraakTitelPipe } from '../../../pipes/afspraak-titel.pipe';
import { AfspraakParticipantNaamPipe } from '../../../pipes/afspraakparticipant-naam.pipe';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { HerhalendeAfspraakInfoPipe } from '../../../pipes/herhalende-afspraak-info.pipe';
import { VolledigeNaamPipe } from '../../../pipes/volledige-naam.pipe';
import { OutlineButtonComponent } from '../../outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../../verwijder-button/verwijder-button.component';

@Component({
    selector: 'dt-afspraak-tonen',
    templateUrl: './afspraak-tonen.component.html',
    styleUrls: ['./afspraak-tonen.component.scss', '../../../scss/bullet.list.view.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TagComponent,
        BijlageLijstComponent,
        VerwijderButtonComponent,
        OutlineButtonComponent,
        DtDatePipe,
        VolledigeNaamPipe,
        AfspraakParticipantNaamPipe,
        HerhalendeAfspraakInfoPipe,
        AfspraakTitelPipe,
        IconDirective
    ],
    providers: [provideIcons(IconKalenderDag, IconCheck, IconVerversen, IconVerwijderen, IconBewerken, IconYesRadio)]
})
export class AfspraakTonenComponent {
    private popupService = inject(PopupService);
    @ViewChild('deleteHerhalingRef', { read: ViewContainerRef }) deleteHerhalingRef: ViewContainerRef;

    @Input() afspraak: Afspraak;

    onEdit = output<void>();
    onDelete = output<void>();
    onDeleteHerhaling = output<void>();
    onRegistreren = output<void>();

    deleteHerhaling() {
        const settings = VerwijderPopupComponent.defaultPopupSettings;
        settings.preferedDirection = [PopupDirection.Bottom];
        const popup = this.popupService.popup(this.deleteHerhalingRef, settings, VerwijderPopupComponent);
        popup.onDeleteClick = () => this.onDeleteHerhaling.emit();
    }
}
