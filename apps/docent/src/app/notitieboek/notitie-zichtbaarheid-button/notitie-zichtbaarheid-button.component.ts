import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { IconDirective, IconSize } from 'harmony';
import { IconChevronOnder, IconZichtbaar, provideIcons } from 'harmony-icons';
import { PopupOpenDirective } from '../../core/popup/popup-open.directive';
import { PopupService } from '../../core/popup/popup.service';
import { PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import {
    NotitieZichtbaarheidForm,
    NotitieZichtbaarheidPopupComponent
} from '../notitie-zichtbaarheid-popup/notitie-zichtbaarheid-popup.component';

@Component({
    selector: 'dt-notitie-zichtbaarheid-button',
    standalone: true,
    imports: [PopupOpenDirective, IconDirective],
    templateUrl: './notitie-zichtbaarheid-button.component.html',
    styleUrls: ['./notitie-zichtbaarheid-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconZichtbaar, IconChevronOnder)]
})
export class NotitieZichtbaarheidButtonComponent implements OnChanges {
    private popupService = inject(PopupService);
    @ViewChild('button', { read: ViewContainerRef }) buttonRef: ViewContainerRef;
    @Input() docenten = false;
    @Input() mentoren = false;
    @Input() docentenDisabled = true;
    @Input() mentorenDisabled = true;
    @Input() reactiesToegestaan = false;
    @Input() submitButtonText: 'Instellen' | 'Opslaan' = 'Instellen';
    @Input() iconSizesOog: IconSize[] = ['medium'];
    @Input() editMode = false;

    onSubmit = output<NotitieZichtbaarheidForm>();

    public gedeeldMet = 'Voor mijzelf';

    ngOnChanges() {
        if (this.docenten || this.mentoren) {
            this.gedeeldMet =
                this.docenten && this.mentoren ? 'Voor docenten en mentoren' : this.docenten ? 'Voor docenten' : 'Voor mentoren';
        } else {
            this.gedeeldMet = 'Voor mijzelf';
        }
    }

    openPopup() {
        const popup = this.popupService.popup(this.buttonRef, PopupComponent.defaultPopupsettings, NotitieZichtbaarheidPopupComponent);
        popup.docenten = this.docenten;
        popup.mentoren = this.mentoren;
        popup.docentenDisabled = this.docentenDisabled;
        popup.mentorenDisabled = this.mentorenDisabled;
        popup.reactiesToegestaan = this.reactiesToegestaan;
        popup.submitButtonText = this.submitButtonText;
        popup.onSave = (popupResults) => this.onSubmit.emit(popupResults);
    }
}
