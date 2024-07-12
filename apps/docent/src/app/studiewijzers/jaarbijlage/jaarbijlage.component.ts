import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { IconDirective } from 'harmony';
import { IconCheckbox, IconInformatie, IconNietZichtbaar, IconOpties, provideIcons } from 'harmony-icons';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { set } from 'shades';
import { Bijlage, BijlageMap, BijlageType, Differentiatiegroep, Leerling, Sjabloon, Studiewijzer } from '../../../generated/_types';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService, desktopQuery } from '../../core/services/device.service';
import { mapDifferentiatieToKleurenStackElements } from '../../rooster-shared/colors';
import {
    ActionButton,
    ActionsPopupComponent,
    bewerkButton,
    kopieerButton,
    verplaatsButton,
    verwijderButton,
    zichtbaarheidButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { CheckboxComponent } from '../../rooster-shared/components/checkbox/checkbox.component';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { BijlageExtensieComponent } from '../../shared/components/bijlage-extensie/bijlage-extensie.component';
import { InlineEditComponent } from '../../shared/components/inline-edit/inline-edit.component';
import { KleurenStackComponent, KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';
import { ZichtbaarheidstoggleComponent } from '../../shared/components/zichtbaarheidstoggle/zichtbaarheidstoggle.component';
import { JaarbijlagePopupComponent } from '../jaarbijlage-popup/jaarbijlage-popup.component';
import { JaarbijlagenDifferentiatiePopupComponent } from '../jaarbijlagen-sidebar/jaarbijlagen-differentiatie-popup/jaarbijlagen-differentiatie-popup.component';
import { PopupService } from './../../core/popup/popup.service';

@Component({
    selector: 'dt-jaarbijlage',
    templateUrl: './jaarbijlage.component.html',
    styleUrls: ['./jaarbijlage.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CheckboxComponent,
        TooltipDirective,
        BijlageExtensieComponent,
        KleurenStackComponent,
        ZichtbaarheidstoggleComponent,
        IconComponent,
        InlineEditComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconInformatie, IconNietZichtbaar, IconOpties, IconCheckbox)]
})
export class JaarbijlageComponent implements OnChanges, OnDestroy {
    private deviceService = inject(DeviceService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsIcon: ViewContainerRef;
    @ViewChild(KleurenStackComponent, { read: ViewContainerRef }) kleurenstackContainer: ViewContainerRef;

    @HostBinding('class.is-url') isUrl: boolean;
    @HostBinding('class.edit-bijlage') editBijlage = false;
    @HostBinding('class.disabled') disabled: boolean;
    @HostBinding('class.is-selected') isSelected: Optional<boolean>;
    @HostBinding('class.is-popup-open') isPopupOpen: boolean;
    @HostBinding('class.toon-sync-info') toonSyncInfo: boolean;
    @HostBinding('class.geen-extensie') geenExtensie: boolean;
    @Input() @HostBinding('class.niet-editbaar') isReadOnly: boolean;
    @Input() @HostBinding('class.in-bulkmode') inBulkMode = false;
    @Input() bijlage: Bijlage;
    @Input() synchroniseerbaar: boolean;
    @Input() bijlageMap: BijlageMap;
    @Input() studiewijzer: Studiewijzer;
    @Input() kanVerplaatsen: boolean;
    @Input() differentieerbaar: boolean;

    editUrl = output<Bijlage>();
    onEditBijlage = output<Bijlage>();
    zichtbaarheidEmitter = output<Bijlage>();
    verwijderEmitter = output<Bijlage>();
    toggleSelection = output<Bijlage>();
    verplaatsEmitter = output<Bijlage>();
    kopieerBijlage = output<Bijlage>();
    synchroniseerBijlageEmitter = output<Sjabloon>();
    openDifferentiatie = output<Bijlage>();
    removeDifferentiatiegroep = output<{
        bijlage: Bijlage;
        groep: Differentiatiegroep;
    }>();
    removeDifferentiatieleerling = output<{
        bijlage: Bijlage;
        leerling: Leerling;
    }>();
    verwijderDifferentiaties = output<Bijlage>();

    icon: string;
    kleuren: KleurenStackElement[] = [];
    differentiatiegroepenSubject = new ReplaySubject<Differentiatiegroep[]>();
    differentiatieleerlingenSubject = new ReplaySubject<Leerling[]>();

    private customButtons: ActionButton[] = [];
    private keepActiveState: boolean;

    isDesktop$: Observable<boolean>;
    onDestroy$ = new Subject<boolean>();

    ngOnChanges() {
        this.isUrl = this.bijlage.type === BijlageType.URL;
        this.disabled = !this.bijlage.url;
        this.isSelected = this.bijlage.isSelected;
        this.geenExtensie = !this.bijlage.extensie;

        this.kleuren = mapDifferentiatieToKleurenStackElements(this.bijlage.differentiatiegroepen, this.bijlage.differentiatieleerlingen);
        this.differentiatiegroepenSubject.next(this.bijlage.differentiatiegroepen);
        this.differentiatieleerlingenSubject.next(this.bijlage.differentiatieleerlingen);

        this.isDesktop$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[desktopQuery]),
            takeUntil(this.onDestroy$)
        );

        const kopierenNaarButton = kopieerButton(() => this.kopieerBijlage.emit(this.bijlage), 'kopieer-jaarbijlage');
        this.customButtons = [];
        if (!this.isReadOnly) {
            this.customButtons.push(
                zichtbaarheidButton(
                    this.bijlage.zichtbaarVoorLeerling,
                    'zichtbaarheid hide-for-desktop',
                    () => {
                        this.zichtbaarheidEmitter.emit(this.bijlage);
                    },
                    null
                ),
                bewerkButton(() => this.onEditClick(), 'bewerk-jaarbijlage'),
                kopierenNaarButton
            );
            if (this.bijlage.synchroniseertMet) {
                this.toonSyncInfo = this.bijlageMap ? false : true;
            } else {
                const isGedifferentieerd =
                    this.bijlage.differentiatiegroepen.length > 0 || this.bijlage.differentiatieleerlingen.length > 0;
                if (this.kanVerplaatsen && !isGedifferentieerd) {
                    this.customButtons.push(verplaatsButton(() => this.verplaatsEmitter.emit(this.bijlage), 'jaarbijlage-verplaatsen'));
                }
                this.customButtons.push(verwijderButton(() => this.verwijderEmitter.emit(this.bijlage)));
            }
        } else {
            this.customButtons = [kopierenNaarButton];
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    public open() {
        if (this.bijlage && this.bijlage.url) {
            window.open(this.bijlage.url, '_blank');
        }
    }

    toggleBijlageSelection(event: Event) {
        // hack om dubbel event te voorkomen
        if ((event.target as HTMLInputElement).type === 'checkbox') {
            this.toggleSelection.emit(this.bijlage);
        }
    }

    openOptiesPopup() {
        if (this.popupService.isPopupOpenFor(this.moreOptionsIcon)) {
            this.popupService.closePopUp();
            return;
        }

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.margin.right = 8;
        settings.width = 240;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.onCloseFunction = () => {
            if (!this.keepActiveState) {
                this.isPopupOpen = false;
                this.changeDetector.markForCheck();
            }
            this.keepActiveState = false;
        };
        this.isPopupOpen = true;

        const popup = this.popupService.popup(this.moreOptionsIcon, settings, JaarbijlagePopupComponent);
        popup.actions = this.customButtons;
        popup.titel = this.bijlage.titel;
        popup.synchroniseerbaar = !this.isReadOnly && this.synchroniseerbaar;
        popup.synchroniseertMet = this.bijlage.synchroniseertMet;
        popup.toonDifferentieren = this.differentieerbaar;
        popup.toonVerwijderDifferentiaties =
            this.bijlage.differentiatiegroepen.length > 0 || this.bijlage.differentiatieleerlingen.length > 0;
        popup.differentierenGtmTag = 'differentiatie-jaarbijlage';
        popup.synchronisatieFunctie = this.onSynchronisatie;
        popup.differentiatieFunctie = () => {
            this.openDifferentiatie.emit(this.bijlage);
            this.popupService.closePopUp();
        };
        popup.verwijderDifferentiatiesFunctie = () => {
            this.verwijderDifferentiaties.emit(this.bijlage);
            this.popupService.closePopUp();
        };
    }

    onVerplaatsenClick() {
        this.verplaatsEmitter.emit(this.bijlage);
    }

    onEditClick() {
        if (this.isUrl) {
            this.editUrl.emit(this.bijlage);
        } else {
            this.editBijlage = true;
            this.changeDetector.markForCheck();
        }
    }

    saveBestand(newValue: string) {
        this.bijlage = set('titel')(newValue)(this.bijlage);
        this.onEditBijlage.emit(this.bijlage);
        this.editBijlage = false;
    }

    cancelEdit() {
        this.editBijlage = false;
    }

    onSynchronisatie = () => {
        this.keepActiveState = true;

        const toSjabloonButton = (sjabloon: Sjabloon): ActionButton => ({
            text: sjabloon.naam,
            textcolor: 'primary_1',
            icon: null,
            iconcolor: null,
            onClickFn: () => {
                this.synchroniseerBijlageEmitter.emit(sjabloon);
                this.popupService.closePopUp();
            },
            gtmTag: 'jaarbijlage-synchroniseren'
        });

        const sjabloonButtons: Sjabloon[] = this.bijlageMap
            ? this.studiewijzer.gesynchroniseerdeSjablonen.filter((syncSjabloon) => syncSjabloon.id === this.bijlageMap.synchroniseertMetId)
            : this.studiewijzer.gesynchroniseerdeSjablonen;

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.margin.right = 8;
        settings.width = 220;
        settings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        settings.onCloseFunction = () => {
            this.keepActiveState = false;
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.moreOptionsIcon, settings, ActionsPopupComponent);
        popup.customButtons = sjabloonButtons.map(toSjabloonButton);
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
        popup.differentierenGtmTag = 'differentiatie-jaarbijlage';
        popup.onToevoegenFunction = () => {
            this.openDifferentiatie.emit(this.bijlage);
            this.popupService.closePopUp();
        };
        popup.removeGroepFunction = (groep: Differentiatiegroep) => this.removeDifferentiatiegroep.emit({ bijlage: this.bijlage, groep });
        popup.removeLeerlingFunction = (leerling: Leerling) => this.removeDifferentiatieleerling.emit({ bijlage: this.bijlage, leerling });
    }
}
