import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    OutputEmitterRef,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { Router } from '@angular/router';
import { Differentiatiegroep, HuiswerkType, Leerling, Studiewijzeritem } from '@docent/codegen';
import { CheckboxComponent, IconDirective } from 'harmony';
import {
    IconCheckbox,
    IconDraggable,
    IconHuiswerk,
    IconInleveropdracht,
    IconLesstof,
    IconName,
    IconNietZichtbaar,
    IconOpties,
    IconSluiten,
    IconStartmoment,
    IconToets,
    IconToetsGroot,
    IconTypeWijzigen,
    provideIcons
} from 'harmony-icons';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Differentiatie } from '../../core/models/studiewijzers/shared.model';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import {
    ActionButton,
    ActionsPopupComponent,
    bewerkButton,
    dupliceerButton,
    kopieerButton,
    verwijderButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { StudiewijzeritemTitelPipe } from '../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { mapDifferentiatieToKleurenStackElements } from '../../rooster-shared/utils/color-token-utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { KleurenStackComponent, KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';
import { ZichtbaarheidstoggleComponent } from '../../shared/components/zichtbaarheidstoggle/zichtbaarheidstoggle.component';
import { BulkactiesDataService } from '../bulkacties-data.service';
import { SjabloonSelectieSidebarComponent } from '../sjabloon-selectie-sidebar/sjabloon-selectie-sidebar.component';
import { StudiewijzerDataService } from '../studiewijzer-data.service';
import { StudiewijzerSelectieSidebarComponent } from '../studiewijzer-selectie-sidebar/studiewijzer-selectie-sidebar.component';

export enum StudiewijzerAction {
    BEWERK,
    VERWIJDER,
    VERWIJDEROOKUITSJABLOON
}

@Component({
    selector: 'dt-studiewijzeritem',
    templateUrl: './studiewijzeritem.component.html',
    styleUrls: ['./studiewijzeritem.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CheckboxComponent, KleurenStackComponent, ZichtbaarheidstoggleComponent, StudiewijzeritemTitelPipe, IconDirective],
    providers: [
        provideIcons(
            IconNietZichtbaar,
            IconOpties,
            IconDraggable,
            IconInleveropdracht,
            IconStartmoment,
            IconToetsGroot,
            IconLesstof,
            IconCheckbox,
            IconTypeWijzigen,
            IconSluiten,
            IconHuiswerk,
            IconToets
        )
    ]
})
export class StudiewijzeritemComponent implements OnInit, OnChanges, OnDestroy {
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private bulkactiesDataService = inject(BulkactiesDataService);
    private changeDetector = inject(ChangeDetectorRef);
    private deviceService = inject(DeviceService);
    private router = inject(Router);
    private sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    @ViewChild('moreOptions', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;

    @Input() studiewijzeritem: Studiewijzeritem;
    @Input() toekenningId: string;
    @Input() differentiatiegroepen: Differentiatiegroep[];
    @Input() differentiatieleerlingen: Leerling[];
    @Input() @HostBinding('class.read-only') readOnly = false;
    @Input() @HostBinding('class.is-eigenaar') isEigenaar = true;
    @Input() @HostBinding('class.inlever-start') inleverstart: boolean;
    @HostBinding('class.is-nieuw') isNieuw: boolean;
    @HostBinding('class.is-checked') isChecked: boolean;
    @HostBinding('class.in-bulkmode') inBulkmode: boolean;
    @HostBinding('class.inleverperiode') isInleverperiode: boolean;
    @HostBinding('attr.type') huiswerkType: string;

    verwijder = output<void>();
    bewerken = output<void>();
    dupliceer = output<void>();
    onStudiewijzeritemClick = output<void>();
    onUpdateLesitemType = output<HuiswerkType>();

    iconClass: Optional<IconName>;
    isPopupOpen: boolean;
    kleuren: KleurenStackElement[] = [];

    private isSubscribed = false;
    private unsubscribe$ = new Subject<void>();

    private subscribeToCleanSubject() {
        if (!this.isSubscribed) {
            this.isSubscribed = true;
            this.bulkactiesDataService.cleanSubject.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
                this.updateCheckedState(false);
            });
        }
    }

    @HostListener('click') onClick() {
        if (!this.inBulkmode) {
            this.onStudiewijzeritemClick.emit();
        }
    }
    ngOnInit() {
        this.bulkactiesDataService.inEditMode.pipe(takeUntil(this.unsubscribe$)).subscribe((editmode) => {
            this.inBulkmode = editmode;
            this.changeDetector.markForCheck();
        });

        if (this.studiewijzeritem.inleverperiode || this.studiewijzeritem.conceptInleveropdracht) {
            this.bulkactiesDataService.itemChecked$
                .pipe(
                    filter((item) => item?.studiewijzeritemId === this.studiewijzeritem.id),
                    takeUntil(this.unsubscribe$)
                )
                .subscribe((item) => {
                    this.updateCheckedState(item.isChecked);
                    this.subscribeToCleanSubject();
                });
        }

        if (this.bulkactiesDataService.shouldBeSelected(this.studiewijzeritem.id)) {
            const differentiatie: Differentiatie = {
                differentiatiegroepen: this.differentiatiegroepen,
                differentiatieleerlingen: this.differentiatieleerlingen
            };
            this.bulkactiesDataService.toekenningGewijzigd(this.studiewijzeritem.id, differentiatie, this.toekenningId);
            this.updateCheckedState(true);
        }
    }

    ngOnChanges() {
        if (this.studiewijzeritem.isNieuw) {
            this.isNieuw = true;

            setTimeout(() => {
                this.isNieuw = false;
                this.studiewijzerDataService.removeIsNieuw(this.studiewijzeritem.id);
                this.changeDetector.markForCheck();
            }, 1000);
        }

        if (this.studiewijzeritem.inleverperiode || this.studiewijzeritem.conceptInleveropdracht) {
            this.isInleverperiode = !this.inleverstart && !!this.studiewijzeritem.inleverperiode;
            this.huiswerkType = 'inleveropdracht';
            this.iconClass = this.inleverstart ? 'startmoment' : 'inleveropdracht';
        } else {
            this.huiswerkType = this.studiewijzeritem.huiswerkType.toLocaleLowerCase();
            this.iconClass = this.studiewijzeritem.icon as IconName;
            switch (this.studiewijzeritem.icon) {
                case 'toetsGroot':
                    this.iconClass = 'toetsGroot';
                    break;
                case 'lesstof':
                    this.iconClass = 'lesstof';
                    break;
                default:
                    this.iconClass = this.studiewijzeritem.icon as IconName;
                    break;
            }
        }

        this.kleuren = mapDifferentiatieToKleurenStackElements(this.differentiatiegroepen, this.differentiatieleerlingen);
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    toggleChecked(event: any) {
        event.stopPropagation();
        const toontCheckbox = this.deviceService.isDesktop() || this.inBulkmode;
        if (toontCheckbox && event.target.type === 'checkbox') {
            this.isChecked = !this.isChecked;
            const differentiatie: Differentiatie = {
                differentiatiegroepen: this.differentiatiegroepen,
                differentiatieleerlingen: this.differentiatieleerlingen
            };
            this.bulkactiesDataService.toggleStudiewijzeritem(this.studiewijzeritem, this.isChecked, differentiatie, this.toekenningId);

            if (!this.studiewijzeritem.inleverperiode) {
                this.updateCheckedState(this.isChecked);
            }

            this.subscribeToCleanSubject();
        }
    }

    private updateCheckedState(isChecked: boolean) {
        this.isChecked = isChecked;
        if (isChecked && !this.isSubscribed) {
            this.isSubscribed = true;
            this.bulkactiesDataService.cleanSubject.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
                this.updateCheckedState(false);
            });
        }
        this.changeDetector.markForCheck();
    }

    updateZichtbaarheid(event: Event) {
        event.stopPropagation();
        this.studiewijzerDataService.updateZichtbaarheidToekenning(this.studiewijzeritem.id, !this.studiewijzeritem.zichtbaarVoorLeerling);
    }

    openMoreOptions(event: Event) {
        event.stopPropagation();
        this.isPopupOpen = true;

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 188;
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.detectChanges();
        };

        const lesitemTypeWijzigenAction: ActionButton = {
            text: 'Type wijzigen',
            icon: 'typeWijzigen',
            color: 'primary',
            onClickFn: this.openLesitemTypeWijzigenPopup
        };

        const popup = this.popupService.popup(this.moreOptionsRef, settings, ActionsPopupComponent);
        popup.customButtons = this.isEigenaar
            ? [
                  bewerkButton(() => this.closePopupAndEmit(this.bewerken), 'swi-bewerken'),
                  dupliceerButton(() => this.closePopupAndEmit(this.dupliceer), 'swi-dupliceren'),
                  kopieerButton(this.openKopieerSidebar, 'swi-kopieren'),
                  verwijderButton(() => this.closePopupAndEmit(this.verwijder), 'swi-verwijderen')
              ]
            : [kopieerButton(this.openKopieerSidebar)];

        if (this.isEigenaar) {
            if (!this.studiewijzeritem.inleverperiode && !this.studiewijzeritem.conceptInleveropdracht) {
                popup.customButtons.splice(2, 0, lesitemTypeWijzigenAction);
            }
            if (this.differentiatieleerlingen?.length > 0 || this.differentiatiegroepen?.length > 0) {
                const index = popup.customButtons.length - 1;
                popup.customButtons.splice(index, 0, {
                    icon: 'sluiten',
                    text: 'Differentiatie verwijderen',
                    color: 'negative',
                    gtmTag: 'toekenning-differentiatie-verwijderen',
                    onClickFn: () => {
                        this.studiewijzerDataService.verwijderToekenningDifferentiaties(
                            this.toekenningId,
                            Boolean(this.studiewijzeritem.inleverperiode)
                        );
                        this.popupService.closePopUp();
                    }
                });
                settings.width = 250;
            }
        }
        popup.onActionClicked = () => this.popupService.closePopUp();
    }

    closePopupAndEmit(emitter: OutputEmitterRef<void>) {
        this.isPopupOpen = false;
        this.changeDetector.markForCheck();

        emitter.emit();
    }

    onOnderwerpClick() {
        if (this.inBulkmode) {
            this.onStudiewijzeritemClick.emit();
        }
    }

    private get isSjabloon(): boolean {
        return this.router.url.includes('/sjablonen/');
    }

    openKopieerSidebar = () => {
        this.isPopupOpen = false;
        this.changeDetector.markForCheck();

        const toekenningIds = [this.toekenningId];
        const studiewijzerItems = [this.studiewijzeritem];
        if (this.isSjabloon) {
            this.sidebarService.openSidebar(SjabloonSelectieSidebarComponent, { toekenningIds, studiewijzerItems });
        } else {
            this.sidebarService.openSidebar(StudiewijzerSelectieSidebarComponent, { toekenningIds, studiewijzerItems });
        }
    };

    openLesitemTypeWijzigenPopup = () => {
        setTimeout(() => {
            this.isPopupOpen = true;
            this.changeDetector.markForCheck();
        });

        const settings = ActionsPopupComponent.defaultPopupsettings;
        settings.width = 188;
        settings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.markForCheck();
        };

        const popup = this.popupService.popup(this.moreOptionsRef, settings, ActionsPopupComponent);
        const huiswerkButton: ActionButton = {
            text: 'Huiswerk',
            icon: 'huiswerk',
            color: 'primary',
            gtmTag: 'swi-type-quickswitch',
            onClickFn: () => this.onUpdateLesitemType.emit(HuiswerkType.HUISWERK)
        };
        const toetsButton: ActionButton = {
            text: 'Toets',
            icon: 'toets',
            color: 'warning',
            gtmTag: 'swi-type-quickswitch',
            onClickFn: () => this.onUpdateLesitemType.emit(HuiswerkType.TOETS)
        };
        const groteToetsButton: ActionButton = {
            text: 'Grote toets',
            icon: 'toetsGroot',
            color: 'negative',
            gtmTag: 'swi-type-quickswitch',
            onClickFn: () => this.onUpdateLesitemType.emit(HuiswerkType.GROTE_TOETS)
        };
        const lesstofButton: ActionButton = {
            text: 'Lesstof',
            icon: 'lesstof',
            color: 'positive',
            gtmTag: 'swi-type-quickswitch',
            onClickFn: () => this.onUpdateLesitemType.emit(HuiswerkType.LESSTOF)
        };

        const buttons: ActionButton[] = [];

        if (this.studiewijzeritem.huiswerkType !== HuiswerkType.HUISWERK) {
            buttons.push(huiswerkButton);
        }
        if (this.studiewijzeritem.huiswerkType !== HuiswerkType.TOETS) {
            buttons.push(toetsButton);
        }
        if (this.studiewijzeritem.huiswerkType !== HuiswerkType.GROTE_TOETS) {
            buttons.push(groteToetsButton);
        }
        if (this.studiewijzeritem.huiswerkType !== HuiswerkType.LESSTOF) {
            buttons.push(lesstofButton);
        }

        popup.customButtons = buttons;
        popup.onActionClicked = () => this.popupService.closePopUp();
    };
}
