import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconDirective } from 'harmony';
import { IconReeks, IconToevoegen, IconVerwijderen, provideIcons } from 'harmony-icons';
import { of } from 'rxjs';
import { CijferPeriodeWeek, Sjabloon } from '../../../../../generated/_types';
import { PopupService } from '../../../../core/popup/popup.service';
import { PopupDirection } from '../../../../core/popup/popup.settings';
import { DeviceService } from '../../../../core/services/device.service';
import { SidebarService } from '../../../../core/services/sidebar.service';
import { AvatarComponent } from '../../../../rooster-shared/components/avatar/avatar.component';
import { TooltipDirective } from '../../../../rooster-shared/directives/tooltip.directive';
import { PersonenNamenPipe } from '../../../../rooster-shared/pipes/personen-namen.pipe';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';
import { WeekSelectiePopupComponent } from '../week-selectie-popup/week-selectie-popup.component';

@Component({
    selector: 'dt-sjabloon-weergave',
    templateUrl: './sjabloon-weergave.component.html',
    styleUrls: ['./sjabloon-weergave.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, PersonenNamenPipe, VolledigeNaamPipe, IconDirective],
    providers: [provideIcons(IconReeks, IconVerwijderen, IconToevoegen)]
})
export class SjabloonWeergaveComponent implements OnInit {
    private popupService = inject(PopupService);
    public overzichtService = inject(SidebarService);
    private deviceService = inject(DeviceService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() sjabloon: Sjabloon;
    @Input() weeknummer: number;
    @Input() schooljaar: number;
    @Input() cijferPeriodeWeken: CijferPeriodeWeek[];
    @Input() isEigenaar: boolean;
    @HostBinding('class.last') @Input() last = false;
    @HostBinding('class.clickable') clickable = false;

    @ViewChild('weekSelectie', { read: ViewContainerRef }) weekSelector: ViewContainerRef;

    onSelectSjabloonWeek = output<{
        sjabloon: Sjabloon;
        weeknummer: number;
    }>();
    onVerwijderSjabloon = output<Sjabloon>();

    ngOnInit(): void {
        this.clickable = this.weeknummer ? false : true;
    }

    selecteerWeek = (weeknummer: number): void => {
        this.weeknummer = weeknummer;
        this.onSelectSjabloonWeek.emit({ sjabloon: this.sjabloon, weeknummer: this.weeknummer });
        this.changeDetector.markForCheck();
    };

    openWeekSelectiePopup(): void {
        const popupSettings = WeekSelectiePopupComponent.getDefaultPopupsettings(this.deviceService.isPhone());
        popupSettings.title = 'Inplannen vanaf';
        popupSettings.headerLabel = `${this.schooljaar}/${this.schooljaar + 1}`;
        popupSettings.preferedDirection = [PopupDirection.Bottom];

        const popup = this.popupService.popup(this.weekSelector, popupSettings, WeekSelectiePopupComponent);
        popup.cijferPeriodeWeken$ = of(this.cijferPeriodeWeken);
        popup.geselecteerdeWeek = this.weeknummer;
        popup.selecteerWeek = this.selecteerWeek;
    }
}
