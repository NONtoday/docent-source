import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { getYear } from 'date-fns';
import { IconDirective } from 'harmony';
import {
    IconChevronBoven,
    IconKlok,
    IconLetOp,
    IconName,
    IconPersoon,
    IconReactieToevoegen,
    IconReacties,
    IconWaarschuwing,
    provideIcons
} from 'harmony-icons';
import { escapeRegExp, isEmpty, memoize } from 'lodash-es';
import { NgClickOutsideDelayOutsideDirective, NgClickOutsideDirective, NgClickOutsideExcludeDirective } from 'ng-click-outside2';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import {
    Advieskolom,
    Maybe,
    PeriodeGemiddeldekolom,
    RapportCijferkolom,
    RapportGemiddeldekolom,
    Resultaat,
    ResultaatLabel,
    ResultaatLabelLijst,
    Resultaatkolom,
    ResultaatkolomType
} from '../../../generated/_types';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { PopupDirection } from '../../core/popup/popup.settings';
import { DeviceService, desktopQuery } from '../../core/services/device.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { AutoSelectDirective } from '../../rooster-shared/directives/auto-select.directive';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { Optional, equalsId, isPresent, isStringNullOrEmpty } from '../../rooster-shared/utils/utils';
import { CijferhistoriePopupComponent } from '../cijferhistorie-popup/cijferhistorie-popup.component';
import { OpmerkingPopupComponent } from '../opmerking-popup/opmerking-popup.component';
import { OnvoldoendePipe } from '../pipes/onvoldoende.pipe';
import { getResultaatKey } from '../pipes/resultaat-key.pipe';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatBerekeningResultMetIcon, ResultaatService, SelecteerCellNaOpslaan } from '../resultaat.service';
import {
    BasisResultaat,
    allowedCharacters,
    allowedRapportCijferCharacters,
    cijferResultaatRegex,
    getGemiddeldekolomTooltip,
    getOpmerkingTooltip,
    isKolomOfType,
    isOverschrevenRapportCijfer,
    isToetskolom,
    parseCellId
} from '../resultaten.utils';
import { ImporteerbaarResultaat, SelecteerResultaatPopupComponent } from '../selecteer-resultaat-popup/selecteer-resultaat-popup.component';
import {
    ResultaatInvoerSelectiePopupComponent,
    SpecialeWaarde
} from './resultaat-invoer-selectie-popup/resultaat-invoer-selectie-popup.component';

export const getInputDisabledBijResultaatLabels$ = (deviceService: DeviceService, kolom: Optional<Resultaatkolom>): Observable<boolean> => {
    let labelLijst: Optional<ResultaatLabelLijst> = null;
    if (isToetskolom(kolom)) {
        labelLijst = kolom.resultaatLabelLijst;
    } else if (isKolomOfType<Advieskolom>(kolom, ResultaatkolomType.ADVIES)) {
        labelLijst = kolom.adviesWeergave;
    }
    return deviceService.onDeviceChange$.pipe(map((state) => Boolean(labelLijst?.id) && !state.breakpoints[desktopQuery]));
};

@Component({
    selector: 'dt-resultaat-cell',
    templateUrl: './resultaat-cell.component.html',
    styleUrls: ['./resultaat-cell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        AutoSelectDirective,
        ReactiveFormsModule,
        NgClickOutsideDirective,
        NgClickOutsideExcludeDirective,
        NgClickOutsideDelayOutsideDirective,
        TooltipDirective,
        AsyncPipe,
        OnvoldoendePipe,
        IconDirective
    ],
    providers: [provideIcons(IconKlok, IconReacties, IconReactieToevoegen, IconLetOp, IconPersoon, IconChevronBoven, IconWaarschuwing)]
})
export class ResultaatCellComponent implements OnInit, OnChanges, OnDestroy {
    private resultaatService = inject(ResultaatService);
    private popupService = inject(PopupService);
    private viewContainerRef = inject(ViewContainerRef);
    private resultaatDataService = inject(ResultaatDataService);
    private deviceService = inject(DeviceService);
    private elementRef = inject(ElementRef);
    private changeDetector = inject(ChangeDetectorRef);
    private medewerkerDataService = inject(MedewerkerDataService);
    @HostBinding('class.active') active: boolean;
    @HostBinding('class.read-only') @Input() readOnly = true;
    @HostBinding('class.read-only-dark') @Input() readOnlyDarkBackground = false;
    @HostBinding('class.pinned') @Input() pinned: boolean;
    @HostBinding('class.invalid') invalid: boolean;
    @HostBinding('class.left') showLeft: boolean;

    @ViewChild('resultaatInput', { read: ElementRef }) resultaatInput: ElementRef;

    @Input() resultaatkolom: Resultaatkolom;
    @Input() resultaat: Optional<Resultaat>;
    @Input() alternatiefNiveau = false;
    @Input() missendeToets: boolean;
    @Input() toonMissendeToetsIcoon = true;
    @Input() opmerkingToevoegenToegestaan = !this.readOnly;
    @Input() maxCharCount = 4;
    @Input() kolomHerkansingsNummer: Optional<number>;
    @Input() inputDisabledBijResultaatLabels: boolean;
    @Input() lesgroepId: string;
    @Input() datumInLesgroepVoorOvernemenResultaten: Optional<Date>;
    @Input() basisResultaat: BasisResultaat;
    @Input() vastgezet: boolean;

    onNieuwResultaat = output<any>();

    public gemiddeldeTooltip = memoize(getGemiddeldekolomTooltip, (...args) => JSON.stringify(args));
    public opmerkingTooltip = memoize(getOpmerkingTooltip, (...args) => JSON.stringify(args));
    private nonMatchingLabels$ = new BehaviorSubject<ResultaatLabel[]>([]);

    private resultaatLabelCharCount = 6;
    public errorMessage: Optional<string>;
    public errorIcon: IconName = 'waarschuwing';
    public resultaatUpdated: boolean;
    public toonImporteerCijferButton: boolean;

    public cijferhistorieTonen: boolean;
    public cijferHistoriePopupOpen: boolean;
    public opmerkingPopupOpen: boolean;
    public resultaatInvoerPopupOpen: boolean;
    private _forceResultaatPopupOpen: boolean;
    private _cellDownKeys: Readonly<string[]> = ['Enter', 'Tab', 'ArrowDown'];
    private _cellUpKeys: Readonly<string[]> = ['ArrowUp'];

    @HostListener('click') onClick() {
        if (!this.readOnly && !this.active) {
            setTimeout(() => {
                this.resultaatService.activeCell$.next(this.elementRef);
            }, 10);
        }
    }

    @HostListener('keydown', ['$event']) keyDown(event: KeyboardEvent) {
        if ([...this._cellDownKeys, ...this._cellUpKeys].includes(event.key)) {
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
            }

            const selecteerCellNaOpslaan: SelecteerCellNaOpslaan = this._cellDownKeys.includes(event.key) ? 'volgende' : 'vorige';

            if (this.resultaatLabelLijst) {
                this.onResultaatLabelInput(selecteerCellNaOpslaan);
            } else {
                this.saveResultaat(this.formControl.value, selecteerCellNaOpslaan);
            }
        }
    }

    resultaatLabelLijst: Maybe<ResultaatLabelLijst>;

    error$: Observable<ResultaatBerekeningResultMetIcon>;
    inEditState$ = new BehaviorSubject<boolean>(false);
    formControl: UntypedFormControl;
    cellId: string;
    toonMissendeToets: boolean;
    overschrevenRapportcijfer: boolean;

    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.formControl = new UntypedFormControl(this.formattedResultaat, Validators.pattern(cijferResultaatRegex));
        this.updateResultaatLabelsEnValidators();

        this.resultaatService.activeCell$.pipe(filter(Boolean), takeUntil(this.destroy$)).subscribe((ref: ElementRef) => {
            this.active = ref.nativeElement.id === this.elementRef?.nativeElement.id;
            const grootstePopupBreedte = 90;

            if (this.active) {
                const leerlingUUID = parseCellId(this.elementRef?.nativeElement.id)?.leerlingUUID;
                this.resultaatService.activeLeerlingUUID = leerlingUUID;

                this.showLeft = this.shouldDisplayPopoutLeft(grootstePopupBreedte);
                this.inEditState$.next(true);

                // Default de popup alleen openen voor resultaat labels
                if (this.resultaatLabelLijst || this._forceResultaatPopupOpen) {
                    this.openResultaatInvoerSelectiePopup();
                    this._forceResultaatPopupOpen = false;
                }
            }
        });

        this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
            const heeftKommaOfPunt = value.includes(',') || value.includes('.');
            const cijferCharCount = !heeftKommaOfPunt ? this.maxCharCount - 1 : this.maxCharCount;
            this.formControl.setValue(value.slice(0, this.resultaatLabelLijst ? this.resultaatLabelCharCount : cijferCharCount), {
                emitEvent: false
            });
            this.invalid = this.formControl.enabled && !this.formControl.valid;
            this.resultaatUpdated = true;
        });

        this.resultaatService.cellenMetErrors$
            .pipe(
                map((cellen) =>
                    cellen.find(
                        (cell) =>
                            getResultaatKey(
                                cell.resultaatKey.resultaatkolomId,
                                cell.resultaatKey.leerlingUUID,
                                cell.resultaatKey.herkansingsNummer
                            ) === this.cellId
                    )
                ),
                filter(isPresent),
                takeUntil(this.destroy$)
            )
            .subscribe((cell) => {
                this.invalid = true;
                this.errorMessage = cell.errorMessage;
                this.errorIcon = cell.icon ?? 'waarschuwing';
                this.changeDetector.markForCheck();
            });

        // Als de cell in edit-state wordt geset moet deze ook active worden,
        // dit geldt niet als deze uit edit-state gehaald wordt.
        this.inEditState$.pipe(takeUntil(this.destroy$), filter(Boolean)).subscribe(() => (this.active = true));
    }

    ngOnChanges() {
        this.toonMissendeToets =
            this.toonMissendeToetsIcoon &&
            isKolomOfType<Resultaatkolom>(
                this.resultaatkolom,
                ResultaatkolomType.SAMENGESTELDE_TOETS,
                ResultaatkolomType.PERIODE_GEMIDDELDE,
                ResultaatkolomType.RAPPORT_CIJFER
            );
        this.overschrevenRapportcijfer = isOverschrevenRapportCijfer(this.resultaatkolom, this.resultaat, this.alternatiefNiveau);
        this.cellId = this.elementRef.nativeElement.id;
        this.toonImporteerCijferButton = Boolean(
            this.datumInLesgroepVoorOvernemenResultaten &&
                !!this.lesgroepId &&
                this.resultaatkolom.type !== ResultaatkolomType.SAMENGESTELDE_TOETS
        );
        this.cijferhistorieTonen = !isKolomOfType(this.resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS);

        if (this.formControl) {
            this.updateResultaatLabelsEnValidators();
        }

        // Update alleen de inhoud van de cell als deze geen focus heeft na het opslaan e.d.
        if (this.resultaatService.activeCell$.value?.nativeElement.id !== this.cellId) {
            this.formControl?.setValue(this.formattedResultaat);
            this.resultaatUpdated = false;
        }
    }

    updateResultaatLabelsEnValidators() {
        this.updateTekstInvoerBijResultaatLabelsToegestaan();
        if (
            isToetskolom(this.resultaatkolom) ||
            isKolomOfType<RapportCijferkolom>(this.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER)
        ) {
            this.setResultaatLabelLijstEnValidator(this.resultaatkolom.resultaatLabelLijst);
        } else if (isKolomOfType<Advieskolom>(this.resultaatkolom, ResultaatkolomType.ADVIES)) {
            this.setResultaatLabelLijstEnValidator(this.resultaatkolom.adviesWeergave);
        } else if (
            isKolomOfType<PeriodeGemiddeldekolom | RapportGemiddeldekolom>(
                this.resultaatkolom,
                ResultaatkolomType.PERIODE_GEMIDDELDE,
                ResultaatkolomType.RAPPORT_GEMIDDELDE
            )
        ) {
            this.formControl.clearValidators();
            this.formControl.updateValueAndValidity();
        }
    }

    updateTekstInvoerBijResultaatLabelsToegestaan() {
        if (this.inputDisabledBijResultaatLabels) {
            this.formControl?.disable();
        } else {
            this.formControl?.enable();
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get formattedResultaat(): string {
        const resultaat = this.alternatiefNiveau ? this.resultaat?.formattedResultaatAfwijkendNiveau : this.resultaat?.formattedResultaat;
        return resultaat ?? '';
    }

    clickOutside(event: Event) {
        let target = <HTMLElement>event.target;
        const isHuidigeCellArrowIcon = target.parentElement?.id === this.cellId && target.classList.contains('arrow-icon');
        this.resultaatService.activeLeerlingUUID = null;

        // Update de target tot de i-tag voor een SVGElement d.m.v. een while-loop omdat zowel svg als path een SVGElement is.
        while (target instanceof SVGElement) {
            if (!target.parentElement) {
                break;
            }
            target = target.parentElement;
        }

        if (
            !target.classList.contains('popout-option-icon') &&
            !target.parentElement?.classList.contains('custom-button') &&
            !isHuidigeCellArrowIcon &&
            target.id !== `${this.cellId}:input`
        ) {
            if (this.resultaatLabelLijst) {
                this.onResultaatLabelInput('geen');
            } else {
                this.saveResultaat(this.formControl.value, 'geen');
            }
        }
    }

    setResultaatLabelLijstEnValidator(lijst: Optional<ResultaatLabelLijst>) {
        if (!lijst?.id) {
            this.resultaatLabelLijst = null;
            return;
        }
        this.resultaatLabelLijst = lijst;
        const allowedCharacters = [...lijst.resultaatLabels.map((label) => `(${escapeRegExp(label.afkorting)})`)].join('|');
        // De 'i' als tweede param is een regex flag zodat dit case insensitive gecontroleerd wordt.
        this.formControl.setValidators(Validators.pattern(new RegExp(`^${allowedCharacters}$`, 'i')));
        this.formControl.updateValueAndValidity();
    }

    get kanLeegRapportCijferOpslaan(): boolean {
        return this.resultaat?.teltNietMee || isOverschrevenRapportCijfer(this.resultaatkolom, this.resultaat, this.alternatiefNiveau);
    }

    saveResultaat(resultaatInput: string, selecteerCellNaOpslaan: SelecteerCellNaOpslaan = 'volgende') {
        if (this.inEditState$.value) {
            this.inEditState$.next(false);
            this.active = false;
            this.errorMessage = null;

            const isRapportCijferKolom = isKolomOfType<RapportCijferkolom>(this.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER);
            if (isRapportCijferKolom && this.formControl.value === '' && !this.kanLeegRapportCijferOpslaan) {
                this.formControl.setValue(this.formattedResultaat);
                return;
            }

            this.onNieuwResultaat.emit({ resultaatInput, isCijfer: !this.resultaatLabelLijst, selecteerCellNaOpslaan });
        }
    }

    onInput = (event: KeyboardEvent): boolean => {
        if (this.resultaatLabelLijst) {
            return true;
        }
        const characters = isKolomOfType(this.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER)
            ? allowedRapportCijferCharacters
            : allowedCharacters;
        return characters.includes(event.key);
    };

    onKeyUp = (event: KeyboardEvent): boolean => {
        if (event.key === 'Enter' || event.key === 'Tab') {
            return false;
        }
        this.updateNonMatchingLabels();
        return true;
    };

    // closePopup moet niet aangeroepen worden als het resultaat wordt opgeslagen als het gevolg van het openen van een popup.
    onResultaatLabelInput(selecteerCellNaOpslaan: SelecteerCellNaOpslaan = 'volgende', closePopup = true) {
        const labelInput: string = this.formControl.value.toUpperCase();
        if (isStringNullOrEmpty(labelInput)) {
            this.saveResultaatLabel('', selecteerCellNaOpslaan, closePopup);
            return;
        }

        const matchingLabels =
            this.resultaatLabelLijst?.resultaatLabels.filter((label) => label.afkorting.toUpperCase() === labelInput) ?? [];
        if (matchingLabels.length === 1) {
            this.formControl.setValue(matchingLabels[0].afkorting);
            this.saveResultaatLabel(matchingLabels[0].id, selecteerCellNaOpslaan, closePopup);
        } else {
            this.updateNonMatchingLabels(true);
        }
    }

    saveResultaatLabel(labelId: string, selecteerCellNaOpslaan: SelecteerCellNaOpslaan = 'geen', closePopup = true) {
        setTimeout(() => {
            this.saveResultaat(labelId, selecteerCellNaOpslaan);
            if (closePopup) {
                this.popupService.closePopUp();
            }
        });
    }

    updateNonMatchingLabels(exactMatch = false) {
        if (this.resultaatLabelLijst) {
            const inputValue: string = this.formControl.value.toUpperCase();
            if (isStringNullOrEmpty(inputValue)) {
                this.nonMatchingLabels$.next([]);
            } else {
                this.nonMatchingLabels$.next(
                    this.resultaatLabelLijst.resultaatLabels.filter((label) =>
                        exactMatch ? label.afkorting.toUpperCase() !== inputValue : !label.afkorting.toUpperCase().includes(inputValue)
                    )
                );
            }
        }
    }

    opmerkingPopupOpenen(event?: Event) {
        event?.stopPropagation();
        const schooljaar = getYear(getSchooljaar(new Date()).start);

        this.medewerkerDataService
            .getLesgroepenVanSchooljaar(schooljaar)
            .pipe(
                map((lesgroepen) => lesgroepen.find(equalsId(this.lesgroepId))),
                switchMap((lesgroep) =>
                    lesgroep ? this.medewerkerDataService.resultaatOpmerkingTonenInELOToegestaan(lesgroep.vestigingId) : of(false)
                ),
                take(1)
            )
            .subscribe((opmerkingToegestaan) => {
                const cellId = this.viewContainerRef.element.nativeElement.id;
                const waardes = parseCellId(cellId);
                const resultaat: Resultaat = this.resultaat ?? {
                    cellId,
                    leerlingUUID: waardes.leerlingUUID,
                    rapportCijferEnOverschreven: false,
                    rapportCijferEnOverschrevenAfwijkendNiveau: false,
                    toonOpmerkingInELO: false,
                    opmerkingen: null
                };
                const settings = OpmerkingPopupComponent.defaultPopupsettings;
                settings.onCloseFunction = () =>
                    setTimeout(() => {
                        this.active = false;
                        this.opmerkingPopupOpen = false;
                        this.changeDetector.detectChanges();
                    });
                settings.offsets = {
                    ...settings.offsets,
                    right: {
                        left: 100,
                        top: 20
                    },
                    left: {
                        left: -368,
                        top: 20
                    }
                };
                settings.preferedDirection = [this.shouldDisplayPopoutLeft(settings.width) ? PopupDirection.Left : PopupDirection.Right];
                settings.appendAsChild = true;
                this.opmerkingPopupOpen = true;
                const popup = this.popupService.popup(this.viewContainerRef, settings, OpmerkingPopupComponent);
                popup.isZichtbaar = resultaat.toonOpmerkingInELO;
                popup.opmerkingen = resultaat.opmerkingen;
                popup.opmerkingInELOTonenToegestaan = opmerkingToegestaan;
                popup.onBewerken = (opmerkingen: string, isZichtbaar: boolean) => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroepId,
                        cellId,
                        opmerkingen,
                        isZichtbaar
                    );
                    this.popupService.closePopUp();
                };
                popup.onVerwijderen = () => {
                    this.resultaatDataService.saveResultaatOpmerkingen(
                        this.resultaatService.voortgangsdossierId,
                        this.lesgroepId,
                        cellId,
                        null,
                        false
                    );
                    popup.popup.onClose();
                };

                this.setActiveForPopup(true);
            });
    }

    get heeftBestaandeOpmerking() {
        return !isEmpty(this.resultaat?.opmerkingen);
    }

    openCijferhistorie(event?: Event) {
        event?.stopPropagation();
        const popupSettings = CijferhistoriePopupComponent.defaultPopupsettings;
        popupSettings.onCloseFunction = () =>
            setTimeout(() => {
                this.active = false;
                this.cijferHistoriePopupOpen = false;
                this.changeDetector.detectChanges();
            });
        popupSettings.offsets = {
            ...popupSettings.offsets,
            right: {
                left: 100,
                top: 0
            },
            left: {
                left: -popupSettings.width,
                top: 0
            }
        };
        popupSettings.preferedDirection = [this.shouldDisplayPopoutLeft(popupSettings.width) ? PopupDirection.Left : PopupDirection.Right];
        popupSettings.appendAsChild = true;
        this.cijferHistoriePopupOpen = true;
        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, CijferhistoriePopupComponent);
        popup.cellId = this.cellId;
        popup.alternatiefNiveau = this.alternatiefNiveau;
        this.setActiveForPopup(true);
    }

    openResultaatSelectie() {
        const popupSettings = SelecteerResultaatPopupComponent.defaultPopupsettings;
        popupSettings.offsets = {
            ...popupSettings.offsets,
            right: {
                left: 100,
                top: 0
            },
            left: {
                left: -popupSettings.width,
                top: 0
            }
        };
        popupSettings.appendAsChild = true;
        popupSettings.onCloseFunction = () =>
            setTimeout(() => {
                this.active = this.inEditState$.value;
                this.changeDetector.detectChanges();
            });

        const popup = this.popupService.popup(this.viewContainerRef, popupSettings, SelecteerResultaatPopupComponent);
        const cellId = parseCellId(this.cellId);

        popup.leerlingUUID = cellId.leerlingUUID;
        popup.lesgroepId = this.lesgroepId;
        popup.alternatiefNiveau = this.alternatiefNiveau;
        popup.onResultaatClick = (resultaatValue: ImporteerbaarResultaat) => {
            this.popupService.closePopUp();
            this.formControl.setValue(resultaatValue.resultaatLabel?.afkorting ?? resultaatValue.formattedResultaat);
            this.inEditState$.next(true);
            setTimeout(() => {
                const labelAfkorting = resultaatValue.resultaatLabel?.afkorting;
                const alternatiefLabelAfkorting = resultaatValue.resultaatLabelAfwijkendNiveau?.afkorting;

                if ((this.alternatiefNiveau && alternatiefLabelAfkorting) || (!this.alternatiefNiveau && labelAfkorting)) {
                    this.formControl.setValue(this.alternatiefNiveau ? alternatiefLabelAfkorting : labelAfkorting);
                    this.onResultaatLabelInput('geen');
                } else if (this.formControl.valid) {
                    this.saveResultaat(
                        this.alternatiefNiveau ? resultaatValue.formattedResultaatAfwijkendNiveau! : resultaatValue.formattedResultaat!,
                        'geen'
                    );
                    this.inEditState$.next(false);
                }
            });
        };
        this.setActiveForPopup(false);
    }

    onChevronClick() {
        if (this.resultaatInvoerPopupOpen) {
            this.popupService.closePopUp();
        } else {
            if (this.resultaatService.activeCell$.value?.nativeElement?.id !== this.cellId) {
                this._forceResultaatPopupOpen = true;
            } else {
                this.openResultaatInvoerSelectiePopup();
            }
        }
        setTimeout(() => {
            this.resultaatInput?.nativeElement.select();
        });
    }

    openResultaatInvoerSelectiePopup() {
        if (this.resultaatInvoerPopupOpen) {
            return;
        }
        this.updateNonMatchingLabels();

        const settings = ResultaatInvoerSelectiePopupComponent.getDefaultPopupsettings(this.toonImporteerCijferButton);
        settings.appendAsChild = true;
        settings.onCloseFunction = () => {
            this.resultaatInvoerPopupOpen = false;
            this.active = this.inEditState$.value;
        };

        const isDesktop = this.deviceService.isDesktop();
        const elementHeight = isDesktop ? 28 : 36; // Hoogte + padding
        const popupMargin = isDesktop ? 26 : 18; // Margin om 16 top/bottom te hebben + border top/bottom

        const aantalLabels = this.resultaatLabelLijst?.resultaatLabels.length ?? 0;

        let aantalExtraOpties = isKolomOfType<RapportCijferkolom>(this.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER) ? 2 : 3;

        // Alleen leeg resultaat
        if (this.resultaatLabelLijst) {
            aantalExtraOpties = 1;
        }

        if (this.toonImporteerCijferButton) {
            aantalExtraOpties += 1;
        }

        const popupHeight = (aantalLabels + aantalExtraOpties) * elementHeight + popupMargin;

        if (this.deviceService.isPhoneOrTabletPortrait()) {
            settings.margin.right = 0;
            settings.applicationOffset = 0;
            settings.offsets = {
                ...settings.offsets,
                top: {
                    top: -popupHeight - 4,
                    left: 0
                },
                bottom: {
                    top: 34,
                    left: 0
                }
            };
        } else {
            settings.offsets = {
                ...settings.offsets,
                top: {
                    top: -popupHeight - 4,
                    left: 47
                },
                bottom: {
                    top: 52,
                    left: 47
                }
            };
        }

        this.resultaatInvoerPopupOpen = true;

        const popup = this.popupService.popup(this.viewContainerRef, settings, ResultaatInvoerSelectiePopupComponent);
        popup.toonImporteerButton = this.toonImporteerCijferButton;
        popup.isRapportCijferKolom = isKolomOfType<RapportCijferkolom>(this.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER);
        popup.labels = this.resultaatLabelLijst?.resultaatLabels;
        popup.nonMatchingLabels$ = this.nonMatchingLabels$.pipe(shareReplayLastValue());
        popup.activeLabel = this.resultaat?.resultaatLabel;
        popup.onImporteren = () => {
            setTimeout(() => {
                this.popupService.closePopUp();
                this.openResultaatSelectie();
            });
        };
        popup.onLabelSelected = (label: ResultaatLabel) => {
            this.formControl.setValue(label.afkorting ?? '');
            this.saveResultaatLabel(label.id);
        };
        popup.onSpecialeWaardeSelected = (waarde: SpecialeWaarde) => {
            const value = waarde === 'leeg' ? '' : waarde;
            this.formControl.setValue(value);
            this.saveResultaatLabel(value);
        };
    }

    shouldDisplayPopoutLeft(popoutWidth: number): boolean {
        const scrollContainer = document.getElementsByClassName('scroll-wrapper')?.[0];
        const clientWidth = scrollContainer?.clientWidth ?? window.innerWidth;
        const elementClientRect = this.elementRef.nativeElement.getBoundingClientRect();
        // 16 px de spacing tussen het element en de popout
        return (elementClientRect.right as number) + popoutWidth + 16 > clientWidth;
    }

    private setActiveForPopup(saveResultaat: boolean) {
        setTimeout(() => {
            if (saveResultaat) {
                if (this.resultaatLabelLijst) {
                    this.onResultaatLabelInput('geen', false);
                } else {
                    this.saveResultaat(this.formControl.value, 'geen');
                }
                this.resultaatService.saveAllResultaten();
            }

            this.active = true;
            this.inEditState$.next(false);
            this.changeDetector.detectChanges();
        });
    }
}
