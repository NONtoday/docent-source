import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconDirective } from 'harmony';
import {
    IconBewerken,
    IconName,
    IconNietZichtbaar,
    IconNietZichtbaarCheckbox,
    IconOpties,
    IconVerwijderen,
    IconZichtbaarCheckbox,
    provideIcons
} from 'harmony-icons';
import { Bijlage, BijlageType } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import {
    ActionButton,
    ActionsPopupComponent,
    bewerkButton,
    verwijderButton
} from '../../../../rooster-shared/components/actions-popup/actions-popup.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { ActionColor } from '../../../../rooster-shared/utils/color-token-utils';
import { BijlageExtensieComponent } from '../../bijlage-extensie/bijlage-extensie.component';
import { InlineEditComponent } from '../../inline-edit/inline-edit.component';
import { ZichtbaarheidstoggleComponent } from '../../zichtbaarheidstoggle/zichtbaarheidstoggle.component';

@Component({
    selector: 'dt-bijlage',
    templateUrl: './bijlage.component.html',
    styleUrls: ['./bijlage.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, BijlageExtensieComponent, ZichtbaarheidstoggleComponent, InlineEditComponent, IconDirective],
    providers: [
        provideIcons(IconNietZichtbaar, IconOpties, IconBewerken, IconVerwijderen, IconNietZichtbaarCheckbox, IconZichtbaarCheckbox)
    ]
})
export class BijlageComponent implements OnChanges {
    private changeDet = inject(ChangeDetectorRef);
    private popupService = inject(PopupService);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;

    @Input() public inEditMode = false;
    @Input() public bijlage: Partial<Bijlage>;
    @Input() public heeftToegangTotElo = true;
    @Input() public toonZichtbaarheidToggle = true;
    @HostBinding('class.can-open') @Input() public canOpen = true;
    @HostBinding('class.last') @Input() public last = false;
    @HostBinding('class.toekomend') @Input() public toekomend = false;
    @HostBinding('class.disabled') noUrl: boolean;
    @HostBinding('class.edit-bijlage') editBijlage = false;
    @HostBinding('class.alleen-delete') @Input() public alleenDeleteIcon = false;

    public editUrl = output<any>();
    protected removeBijlage = output<any>();
    public saveBijlage = output<any>();

    bijlageType = BijlageType;

    ngOnChanges() {
        this.noUrl = !this.inEditMode && this.bijlage && this.bijlage.type === BijlageType.BESTAND && this.bijlage.url === null;
        this.changeDet.markForCheck();
    }

    public toggleZichtbaarheid() {
        if (this.heeftToegangTotElo) {
            this.bijlage.zichtbaarVoorLeerling = !this.bijlage.zichtbaarVoorLeerling;
        }
    }

    onEditClick() {
        if (this.bijlage.type === BijlageType.URL) {
            this.editUrl.emit(this.bijlage);
        } else {
            this.editBijlage = true;
            this.changeDet.markForCheck();
        }
    }

    public onRemoveClick() {
        this.removeBijlage.emit(this.bijlage);
    }

    @HostListener('click')
    public open() {
        if (this.bijlage && this.bijlage.url && this.canOpen) {
            window.open(this.bijlage.url, '_blank');
        }
    }

    geenUrlBijBijlage() {
        return;
    }

    updateTitel(value: string) {
        this.bijlage = { ...this.bijlage, titel: value };
        this.editBijlage = false;
        this.saveBijlage.emit(this.bijlage);
    }

    cancelEdit() {
        this.editBijlage = false;
    }

    openActionsPopup() {
        const icon: IconName = this.bijlage.zichtbaarVoorLeerling ? 'nietZichtbaarCheckbox' : 'zichtbaarCheckbox';
        const color: ActionColor = this.bijlage.zichtbaarVoorLeerling ? 'negative' : 'primary';
        const customButtons: ActionButton[] = [
            this.toonZichtbaarheidToggle
                ? {
                      icon,
                      color: color,
                      onClickFn: () => this.toggleZichtbaarheid(),
                      text: this.bijlage.zichtbaarVoorLeerling ? 'Maak onzichtbaar voor leerling' : 'Maak zichtbaar voor leerling'
                  }
                : null,
            verwijderButton(() => {
                this.onRemoveClick();
            }),
            bewerkButton(() => {
                this.onEditClick();
            })
        ].filter(Boolean) as ActionButton[];
        const popup = this.popupService.popup(this.moreOptionsIcon, ActionsPopupComponent.defaultPopupsettings, ActionsPopupComponent);
        popup.customButtons = customButtons;
        popup.onActionClicked = () => this.popupService.closePopUp();
    }
}
