import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconOpties, IconReactieToevoegen, provideIcons } from 'harmony-icons';
import { Leerling } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { LeerlingDeeplinkPopupComponent } from '../../../les/leerling-deeplink-popup/leerling-deeplink-popup.component';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { getVolledigeNaam } from '../../utils/leerling.utils';

@Component({
    selector: 'dt-leerling',
    templateUrl: './leerling.component.html',
    styleUrls: ['./leerling.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, IconComponent, VolledigeNaamPipe],
    providers: [provideIcons(IconReactieToevoegen, IconOpties)]
})
export class LeerlingComponent {
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('avatar', { read: ElementRef, static: true }) avatar: ElementRef;
    @ViewChild('naam', { read: ElementRef, static: true }) naam: ElementRef;
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;

    @HostBinding('class.block-view') @Input() blockView = false;
    @HostBinding('class.actief') @Input() actief = false;
    @HostBinding('class.toon-hoverstate') @Input() toonHoverstate = false;

    @Input() leerling: Leerling;
    @Input() avatarsize = AvatarComponent.defaultsize;
    @Input() avatarfontsize = AvatarComponent.defaultfontsize;
    @Input() toonJarigIcoon = false;
    @Input() toonOnlineIcoon = false;
    @Input() toonMoreOptions = false;
    @Input() toonWerkdruk = true;
    @Input() verkleinLeerlingNaamFontsize = false;
    @Input() heeftNotificatie = false;
    @Input() notificatieTooltip: string;
    @Input() offsetNameBottom: boolean;
    @Input() notitieboekToegankelijk = false;
    @Input() toonNieuweNotitie = false;

    onWerkdrukSelected = output<Leerling>();
    nieuweNotitieClicked = output<void>();

    isPopupOpen = false;

    getVolledigeNaam(): string {
        return getVolledigeNaam(this.leerling);
    }

    onNieuweNotitie() {
        this.nieuweNotitieClicked.emit();
    }

    get heeftIcons() {
        return (this.notitieboekToegankelijk && this.toonNieuweNotitie) || this.toonMoreOptions;
    }

    onMoreOptions(event: Event) {
        event.stopPropagation();
        this.isPopupOpen = true;
        const settings = LeerlingDeeplinkPopupComponent.defaultPopupsettings;
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.moreOptionsRef, settings, LeerlingDeeplinkPopupComponent);
        popup.leerling = this.leerling;
        popup.toonWerkdruk = this.toonWerkdruk;
        popup.notitieboekToegankelijk = this.notitieboekToegankelijk;
        popup.toonNieuweNotitie = this.toonNieuweNotitie;
        popup.onWerkdrukClickedCallback = () => {
            this.onWerkdrukSelected.emit(this.leerling);
            this.popupService.closePopUp();
            this.isPopupOpen = false;
            this.changeDetector.detectChanges();
        };
        popup.onNieuweNotitieClickedCallback = () => {
            this.onNieuweNotitie();
            this.popupService.closePopUp();
            this.isPopupOpen = false;
            this.changeDetector.detectChanges();
        };
    }
}
