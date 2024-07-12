import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { IconDirective, IconPillComponent, PillComponent, TooltipDirective } from 'harmony';
import {
    IconCheck,
    IconChevronOnder,
    IconGroep,
    IconInleveropdracht,
    IconKlok,
    IconNietZichtbaar,
    IconNotificatie,
    IconSlot,
    IconTijd,
    IconUitklappenRechts,
    provideIcons
} from 'harmony-icons';
import { Observable, of } from 'rxjs';
import { Afrondingsoverzicht, LesgroepFieldsFragment, Studiewijzeritem } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { OutlineButtonComponent } from '../../../../rooster-shared/components/outline-button/outline-button.component';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';
import { sortLocale } from '../../../../rooster-shared/utils/utils';
import { AfrondingsoverzichtPopupComponent } from '../../../../shared-studiewijzer-les/afrondingsoverzicht-popup/afrondingsoverzicht-popup.component';
import { StudiewijzerDataService } from '../../../../studiewijzers/studiewijzer-data.service';
import { DagenDurationPipe } from '../../../pipes/dagen-duration.pipe';

@Component({
    selector: 'dt-inleveropdracht-inhoud',
    templateUrl: './inleveropdracht-inhoud.component.html',
    styleUrls: ['./inleveropdracht-inhoud.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, OutlineButtonComponent, DtDatePipe, DagenDurationPipe, IconDirective, IconPillComponent, PillComponent],
    providers: [
        provideIcons(
            IconNietZichtbaar,
            IconInleveropdracht,
            IconChevronOnder,
            IconUitklappenRechts,
            IconTijd,
            IconNotificatie,
            IconCheck,
            IconGroep,
            IconKlok,
            IconSlot
        )
    ]
})
export class InleveropdrachtInhoudComponent {
    private popupService = inject(PopupService);
    private studiewijzerDataService = inject(StudiewijzerDataService);
    @ViewChild('inleveringen', { read: ViewContainerRef, static: false }) inleveringenPill: ViewContainerRef;

    @Input() lesgroep: LesgroepFieldsFragment;
    @Input() studiewijzeritem: Studiewijzeritem;
    @Input() isProjectgroepenEditable: boolean;
    @Input() toekenningId: string;
    @Input() toonLesgroep = false;

    openProjectgroepen = output<void>();

    onOpenProjectgroepenClick() {
        if (!this.heeftInleveringen) {
            this.openProjectgroepen.emit();
        }
    }

    get heeftInleveringen() {
        return this.studiewijzeritem.inleverperiode!.inleveringenAantal > 0;
    }

    openInleveringenPopup() {
        const popup = this.popupService.popup(
            this.inleveringenPill,
            AfrondingsoverzichtPopupComponent.defaultPopupSettings,
            AfrondingsoverzichtPopupComponent
        );
        const projectgroepen = this.studiewijzeritem.projectgroepen;
        popup.datasource$ =
            projectgroepen.length > 0
                ? of<Afrondingsoverzicht>({
                      afgerond: sortLocale(
                          projectgroepen.filter((g) => g.heeftInlevering),
                          ['hoogstePlagiaat', 'naam'],
                          ['desc', 'asc']
                      ),
                      nietAfgerond: projectgroepen.filter((g) => !g.heeftInlevering)
                  })
                : (this.studiewijzerDataService.getInleveroverzicht(this.toekenningId) as Observable<Afrondingsoverzicht>);
        popup.afgerondLabel = 'Ingeleverd';
        popup.onafgerondLabel = 'Niet ingeleverd';
        popup.typeLabel = projectgroepen.length > 0 ? 'projectgroepen' : 'leerlingen';
        popup.toekenningId = this.toekenningId;
    }
}
