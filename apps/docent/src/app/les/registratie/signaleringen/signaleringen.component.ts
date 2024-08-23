import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ViewContainerRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IconSettings, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { LesRegistratie, PeriodeQuery, SignaleringenInstellingenQuery, SignaleringenQuery } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../../core/services/device.service';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { ToCyTagPipe } from '../../../rooster-shared/pipes/to-cy-tag.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';
import { AccordionComponent } from '../../../shared/components/accordion/accordion.component';
import { RegistratieDataService } from '../registratie-data.service';
import { blockInitialRenderAnimation } from './../../../core/core-animations';
import { MedewerkerDataService } from './../../../core/services/medewerker-data.service';
import { SignaleringSettingPopupComponent } from './signalering-setting-popup/signalering-setting-popup.component';
import { SignaleringComponent } from './signalering/signalering.component';

@Component({
    selector: 'dt-signaleringen',
    templateUrl: './signaleringen.component.html',
    styleUrls: ['./signaleringen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [blockInitialRenderAnimation],
    standalone: true,
    imports: [AccordionComponent, TooltipDirective, IconComponent, SignaleringComponent, AsyncPipe, ToCyTagPipe, DtDatePipe],
    providers: [provideIcons(IconSettings)]
})
export class SignaleringenComponent implements OnInit {
    private registratieDataService = inject(RegistratieDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private deviceService = inject(DeviceService);
    @ViewChild('settings', { read: ViewContainerRef, static: false }) settingRef: ViewContainerRef;
    @ViewChild(AccordionComponent) accordion: AccordionComponent;
    @Input() vrijveldDefinities: LesRegistratie['overigeVrijVeldDefinities'];
    @Input() periode: PeriodeQuery['periode'];
    @Input() signaleringen: Optional<SignaleringenQuery['signaleringen']>;

    getSignaleringen = output<void>();

    public isPhoneOrTablet$: Observable<boolean>;

    public signaleringenInstellingen$: Observable<SignaleringenInstellingenQuery['signaleringenInstellingen']>;

    router = inject(Router);

    constructor() {
        // Sluit accordion bij navigatie
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed()
            )
            .subscribe(() => {
                if (this.accordion.expanded) {
                    this.accordion.toggle();
                }
            });
    }

    ngOnInit() {
        this.isPhoneOrTablet$ = this.isPhoneOrTablet$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery] || state.breakpoints[tabletQuery]),
            startWith(this.deviceService.isPhoneOrTablet())
        );
        this.signaleringenInstellingen$ = this.registratieDataService.getSignaleringenInstellingen(this.medewerkerDataService.medewerkerId);
    }

    onSettingsClicked(event: any) {
        event.stopPropagation();
        const popupSettings = new PopupSettings();

        popupSettings.showHeader = false;
        popupSettings.width = 300;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Window,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };

        const popup = this.popupService.popup(this.settingRef, popupSettings, SignaleringSettingPopupComponent);
        popup.vrijVeldDefinities = this.vrijveldDefinities;
        popup.settings$ = this.signaleringenInstellingen$;
    }

    accordionToggled(expanded: boolean) {
        if (expanded) {
            this.getSignaleringen.emit();
        }
    }
}
