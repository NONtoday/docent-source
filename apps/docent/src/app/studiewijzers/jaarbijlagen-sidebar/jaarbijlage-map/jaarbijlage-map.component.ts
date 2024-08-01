import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconDirective } from 'harmony';
import { IconCheckbox, IconInformatie, IconMap, IconMapVerwijderen, IconNietZichtbaar, IconOpties, provideIcons } from 'harmony-icons';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { set, updateAll } from 'shades';
import { BijlageMap, Differentiatiegroep, Leerling, Sjabloon, Studiewijzer } from '../../../../generated/_types';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupDirection } from '../../../core/popup/popup.settings';
import { DeviceService, desktopQuery } from '../../../core/services/device.service';
import {
    ActionsPopupComponent,
    bewerkButton,
    kopieerButton,
    verwijderButton,
    zichtbaarheidButton
} from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { CheckboxComponent } from '../../../rooster-shared/components/checkbox/checkbox.component';
import { IconComponent } from '../../../rooster-shared/components/icon/icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { mapDifferentiatieToKleurenStackElements } from '../../../rooster-shared/utils/color-token-utils';
import { InlineEditComponent } from '../../../shared/components/inline-edit/inline-edit.component';
import { KleurenStackComponent, KleurenStackElement } from '../../../shared/components/kleuren-stack/kleuren-stack.component';
import { ZichtbaarheidstoggleComponent } from '../../../shared/components/zichtbaarheidstoggle/zichtbaarheidstoggle.component';
import { JaarbijlagePopupComponent } from '../../jaarbijlage-popup/jaarbijlage-popup.component';
import { JaarbijlagenDifferentiatiePopupComponent } from '../jaarbijlagen-differentiatie-popup/jaarbijlagen-differentiatie-popup.component';

@Component({
    selector: 'dt-jaarbijlage-map',
    templateUrl: './jaarbijlage-map.component.html',
    styleUrls: ['./jaarbijlage-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CheckboxComponent,
        TooltipDirective,
        KleurenStackComponent,
        ZichtbaarheidstoggleComponent,
        IconComponent,
        InlineEditComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconMap, IconInformatie, IconNietZichtbaar, IconOpties, IconCheckbox, IconMapVerwijderen)]
})
export class JaarbijlageMapComponent implements OnInit, OnChanges, OnDestroy {
    private deviceService = inject(DeviceService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('verwijdericon', { read: ViewContainerRef }) verwijderIcon: ViewContainerRef;
    @ViewChild('meeropties', { read: ViewContainerRef }) meerOptiesIcon: ViewContainerRef;
    @ViewChild(KleurenStackComponent, { read: ViewContainerRef }) kleurenstackContainer: ViewContainerRef;

    @HostBinding('class.editing') editing = false;
    @HostBinding('class.is-popup-open') isPopupOpen = false;
    @Input() @HostBinding('class.is-editable') isEditable = false;
    @Input() @HostBinding('class.in-bulkmode') inBulkMode = false;
    @Input() @HostBinding('class.toon-sync-info') toonSyncInfo: boolean;
    // De readonly property is voor het selecteren van een jaarbijlage map tijdens verplaatsen van een bijlage
    @Input() @HostBinding('class.read-only') readonly = false;
    @Input() toonVerdiepingIcoon = true;
    @Input() bijlageMap: BijlageMap;
    @Input() synchroniseerbaar: boolean;
    @Input() studiewijzer: Studiewijzer;
    @Input() differentieerbaar: boolean;

    cancelToevoegen = output<void>();
    saveBijlageMap = output<BijlageMap>();
    verwijderBijlageMap = output<{
        bijlageMap: BijlageMap;
        inclBijlagen: boolean;
    }>();
    kopieerBijlageMap = output<BijlageMap>();
    toggleSelection = output<BijlageMap>();
    synchroniseerBijlageMapEmitter = output<Sjabloon>();

    openDifferentiatie = output<BijlageMap>();
    removeDifferentiatiegroep = output<{
        map: BijlageMap;
        groep: Differentiatiegroep;
    }>();
    removeDifferentiatieleerling = output<{
        map: BijlageMap;
        leerling: Leerling;
    }>();
    verwijderDifferentiaties = output<BijlageMap>();

    private keepActiveState: boolean;

    kleuren: KleurenStackElement[] = [];
    differentiatiegroepenSubject = new ReplaySubject<Differentiatiegroep[]>();
    differentiatieleerlingenSubject = new ReplaySubject<Leerling[]>();

    isDesktop$: Observable<boolean>;
    onDestroy$ = new Subject<boolean>();

    ngOnInit() {
        this.editing = this.bijlageMap.isNew ? this.bijlageMap.isNew : false;

        this.isDesktop$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[desktopQuery]),
            takeUntil(this.onDestroy$)
        );
    }

    ngOnChanges() {
        this.kleuren = mapDifferentiatieToKleurenStackElements(
            this.bijlageMap.differentiatiegroepen,
            this.bijlageMap.differentiatieleerlingen
        );
        this.differentiatiegroepenSubject.next(this.bijlageMap.differentiatiegroepen);
        this.differentiatieleerlingenSubject.next(this.bijlageMap.differentiatieleerlingen);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    onEditClicked = () => {
        this.editing = true;
        this.changeDetector.markForCheck();
    };

    toggleZichtbaarheid = () => {
        this.bijlageMap = set('zichtbaarVoorLeerling')(!this.bijlageMap.zichtbaarVoorLeerling)(this.bijlageMap);
        this.saveBijlageMap.emit(this.bijlageMap);
    };

    onSaveClicked(newValue: string) {
        this.bijlageMap = updateAll<BijlageMap>(set('isNew')(<any>false), set('naam')(newValue))(this.bijlageMap);
        this.editing = false;
        this.saveBijlageMap.emit(this.bijlageMap);
    }

    onCancelClicked() {
        if (this.bijlageMap.isNew) {
            this.cancelToevoegen.emit();
        }

        this.editing = false;
    }

    toggleMapSelection(event: Event) {
        // hack om dubbel event te voorkomen
        if ((event.target as HTMLInputElement).type === 'checkbox') {
            this.toggleSelection.emit(this.bijlageMap);
        }
    }

    openOptiesPopup() {
        if (this.popupService.isPopupOpenFor(this.meerOptiesIcon)) {
            this.popupService.closePopUp();
            return;
        }

        let customButtons = [kopieerButton(() => this.kopieerBijlageMap.emit(this.bijlageMap))];

        if (this.isEditable) {
            customButtons = [];

            customButtons.push(
                zichtbaarheidButton(
                    this.bijlageMap.zichtbaarVoorLeerling,
                    'hide-for-desktop',
                    this.toggleZichtbaarheid,
                    'zichtbaarheid-button'
                ),
                bewerkButton(this.onEditClicked, 'jaarbijlagemap-bewerken'),
                kopieerButton(() => this.kopieerBijlageMap.emit(this.bijlageMap), 'jaarbijlagemap-kopieren')
            );

            if (!this.bijlageMap.synchroniseertMet) {
                customButtons.push({
                    icon: 'mapVerwijderen',
                    color: 'positive',
                    text: 'Alleen map verwijderen',
                    isVerwijderButton: true,
                    onClickFn: () => this.verwijderBijlageMap.emit({ bijlageMap: this.bijlageMap, inclBijlagen: false })
                });
                if (this.bijlageMap.bijlagen.length > 0) {
                    customButtons.push({
                        ...verwijderButton(() => this.verwijderBijlageMap.emit({ bijlageMap: this.bijlageMap, inclBijlagen: true })),
                        text: 'Map en bijlagen verwijderen'
                    });
                }
            }
        }

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 260;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.onCloseFunction = () => {
            if (!this.keepActiveState) {
                this.isPopupOpen = false;
                this.changeDetector.markForCheck();
            }
            this.keepActiveState = false;
        };

        this.isPopupOpen = true;
        const popup = this.popupService.popup(this.meerOptiesIcon, settings, JaarbijlagePopupComponent);
        popup.actions = customButtons;
        popup.titel = this.bijlageMap.naam;
        popup.synchroniseerbaar = this.isEditable && this.synchroniseerbaar;
        popup.synchroniseertMet = this.bijlageMap.synchroniseertMet;
        popup.toonDifferentieren = this.differentieerbaar;
        popup.differentierenGtmTag = 'differentiatie-jaarbijlagemap';
        popup.toonVerwijderDifferentiaties =
            this.bijlageMap.differentiatiegroepen?.length > 0 || this.bijlageMap.differentiatieleerlingen?.length > 0;
        popup.synchronisatieFunctie = this.onSynchronisatie;
        popup.differentiatieFunctie = () => {
            this.openDifferentiatie.emit(this.bijlageMap);
            this.popupService.closePopUp();
        };
        popup.verwijderDifferentiatiesFunctie = () => {
            this.verwijderDifferentiaties.emit(this.bijlageMap);
            this.popupService.closePopUp();
        };
    }

    onSynchronisatie = () => {
        this.keepActiveState = true;

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.margin.right = 8;
        settings.width = 220;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.meerOptiesIcon, settings, ActionsPopupComponent);
        popup.customButtons = this.studiewijzer.gesynchroniseerdeSjablonen.map((sjabloon) => ({
            text: sjabloon.naam,
            color: 'primary',
            icon: null,
            onClickFn: () => {
                this.synchroniseerBijlageMapEmitter.emit(sjabloon);
                this.popupService.closePopUp();
            },
            gtmTag: 'jaarbijlagemap-synchroniseren'
        }));
    };

    openDifferentiatiePopup(event: Event) {
        event.stopPropagation();
        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 412;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.onCloseFunction = () => {
            if (!this.keepActiveState) {
                this.isPopupOpen = false;
                this.changeDetector.markForCheck();
            }
            this.keepActiveState = false;
        };
        this.isPopupOpen = true;

        const popup = this.popupService.popup(this.kleurenstackContainer, settings, JaarbijlagenDifferentiatiePopupComponent);
        popup.differentiatiegroepen = this.differentiatiegroepenSubject;
        popup.differentiatieleerlingen = this.differentiatieleerlingenSubject;
        popup.editAllowed = this.differentieerbaar;
        popup.differentierenGtmTag = 'differentiatie-jaarbijlagemap';
        popup.onToevoegenFunction = () => {
            this.openDifferentiatie.emit(this.bijlageMap);
            this.popupService.closePopUp();
        };
        popup.removeGroepFunction = (groep: Differentiatiegroep) => this.removeDifferentiatiegroep.emit({ map: this.bijlageMap, groep });
        popup.removeLeerlingFunction = (leerling: Leerling) => this.removeDifferentiatieleerling.emit({ map: this.bijlageMap, leerling });
    }
}
