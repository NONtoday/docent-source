import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconChevronOnder, IconChevronRechts, IconGroep, IconNotitieboek, provideIcons } from 'harmony-icons';
import { Observable, map, startWith } from 'rxjs';
import { LesgroepFieldsFragment, PartialLeerlingFragment, StamgroepFieldsFragment } from '../../../../generated/_types';
import { DeviceService } from '../../../core/services/device.service';
import { MentorLeerlingStamgroep } from '../../../mentordashboard/mentordashboard-navigatie/mentordashboard-navigatie.component';
import { HarmonyColorName } from '../../../rooster-shared/colors';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';
import { HeaderNavigatieButtonsComponent } from '../header-navigatie-buttons/header-navigatie-buttons.component';

export interface GroepLeerlingHeaderNavigatieItem {
    groep: Optional<LesgroepFieldsFragment | StamgroepFieldsFragment>;
    leerling: Optional<MentorLeerlingStamgroep>;
    prevId: Optional<string>;
    nextId: Optional<string>;
    beschrijving?: Optional<string>;
}

@Component({
    selector: 'dt-groep-leerling-header-navigatie',
    standalone: true,
    imports: [
        CommonModule,
        AvatarComponent,
        BackgroundIconComponent,
        VolledigeNaamPipe,
        HeaderNavigatieButtonsComponent,
        IconDirective,
        IconDirective
    ],
    templateUrl: './groep-leerling-header-navigatie.component.html',
    styleUrls: ['./groep-leerling-header-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGroep, IconNotitieboek, IconChevronRechts, IconChevronOnder)]
})
export class GroepLeerlingHeaderNavigatieComponent implements OnInit {
    private deviceService = inject(DeviceService);
    @ViewChild('popupRef', { read: ViewContainerRef }) popupRef: ViewContainerRef;

    @HostBinding('class.met-groep') @Input() groep: Optional<LesgroepFieldsFragment | StamgroepFieldsFragment>;
    @Input() leerling: Optional<PartialLeerlingFragment>;
    @Input() heeftVorige: boolean;
    @Input() heeftVolgende: boolean;
    @Input() beschrijving: Optional<string>;
    @Input() isActive = false;
    @Input() showMoreOptions = false;
    @Input() showBackgroundIcon = false;
    @Input() kanNavigerenNaarGroep = true;
    @Input() hideArrows = false;
    @HostBinding('class.met-gezamenlijk') @Input() isGezamenlijkOverzicht = false;

    public avatarSize$: Observable<number>;
    public avatarFontSize$: Observable<number>;

    leerlingClick = output<ViewContainerRef>();
    meerOptiesClick = output<ViewContainerRef>();
    vorigeClick = output<void>();
    volgendeClick = output<void>();
    terugClick = output<void>();
    groepClick = output<void>();

    ngOnInit(): void {
        const isPhoneOrTabletPortrait$ = this.deviceService.onDeviceChange$.pipe(
            map(() => this.deviceService.isPhoneOrTabletPortrait()),
            startWith(this.deviceService.isPhoneOrTabletPortrait())
        );

        this.avatarSize$ = isPhoneOrTabletPortrait$.pipe(map((isPhoneOrTabletPortrait) => (isPhoneOrTabletPortrait ? 24 : 32)));
        this.avatarFontSize$ = isPhoneOrTabletPortrait$.pipe(map((isPhoneOrTabletPortrait) => (isPhoneOrTabletPortrait ? 11 : 12)));
    }

    onMeerOptiesClick = (moreOptionsRef: ViewContainerRef) => this.meerOptiesClick.emit(moreOptionsRef);
    onLeerlingClick = () => this.leerlingClick.emit(this.popupRef);
    onGroepClick = () => (this.kanNavigerenNaarGroep ? this.groepClick.emit() : void 0);

    get groepColor(): HarmonyColorName {
        return (this.groep?.color as HarmonyColorName) || 'typography_1';
    }

    get groepName(): string {
        return this.isGezamenlijkOverzicht ? 'Individueel' : this.groep?.naam || '';
    }
}
