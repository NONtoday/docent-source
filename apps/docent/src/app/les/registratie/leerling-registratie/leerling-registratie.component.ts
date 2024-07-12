import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
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
import { isBefore, isSameDay } from 'date-fns';
import { Observable, Subject } from 'rxjs';
import {
    AbsentieMelding,
    AbsentieSoort,
    AfspraakQuery,
    Leerling,
    LesRegistratieQuery,
    NotitieContext,
    VrijVeldWaarde
} from '../../../../generated/_types';
import { ExterneRegistratieType } from '../../../core/models/lesregistratie.model';
import { PopupService } from '../../../core/popup/popup.service';
import { PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { DeviceService } from '../../../core/services/device.service';
import { ActueleNotitiesSidebarComponent } from '../../../notitieboek/actuele-notities-sidebar/actuele-notities-sidebar.component';
import { accent_negative_1, accent_positive_1, secondary_1 } from '../../../rooster-shared/colors';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { Persoon, VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import {
    bepaalExternRegistratieType,
    createDefaultRegistratiePopupSettings,
    isIngevoerdDoorDocentVanAfspraak,
    isTeLaatGemeldDoorAndereDocent,
    isTeLaatGemeldDoorAndereDocentZonderOfEigenConstatering,
    magAbsentieMeldingBewerken
} from '../../../rooster-shared/utils/registratie.utils';
import { Optional } from '../../../rooster-shared/utils/utils';
import { AbsentieMeldingPopupComponent } from '../absentie-melding-popup/absentie-melding-popup.component';
import { FlexibeleRegistratiePopupComponent } from '../flexibele-registratie-popup/flexibele-registratie-popup.component';
import { RegistratieDataService } from '../registratie-data.service';
import { SignaleringWeergevenPopupComponent } from '../signalering-weergeven-popup/signalering-weergeven-popup.component';
import { SidebarService } from './../../../core/services/sidebar.service';

@Directive()
export abstract class LeerlingRegistratieComponent implements OnInit, OnChanges, OnDestroy {
    public changeDetector = inject(ChangeDetectorRef);
    public deviceService = inject(DeviceService);
    public regDataService = inject(RegistratieDataService);
    public popupService = inject(PopupService);
    private volledigeNaamPipe = inject(VolledigeNaamPipe);
    private sidebarService = inject(SidebarService);
    public elementRef = inject(ElementRef);
    @HostBinding('class.disabled') @Input() disabled: boolean;
    @HostBinding('class.externe-registratie') externeRegistratie: ExterneRegistratieType | null;

    @Input() vrijveldDefinities: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'];
    @Input() registratie: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number];
    @Input() afspraak: AfspraakQuery['afspraak'];
    @Input() verwijderdMeldingToegestaan: boolean;
    @Input() teLaatMeldingToegestaan: boolean;
    @Input() paginaEnabled: boolean;
    @Input() aantalExtraRegistratiesTonen = 0;

    @HostBinding('class.disabled-zonder-statussen') disabledZonderStatussen: boolean;

    onWerkdrukSelected = output<Leerling>();

    @ViewChild('afwezigIcon', { read: ViewContainerRef }) afwezigIcon: ViewContainerRef;
    @ViewChild('teLaatIcon', { read: ViewContainerRef }) teLaatIcon: ViewContainerRef;
    @ViewChild('verwijderdIcon', { read: ViewContainerRef }) verwijderdIcon: ViewContainerRef;
    @ViewChild('externGeregistreerdChevron', { read: ViewContainerRef }) externGeregistreerdChevron: ViewContainerRef;
    @ViewChild('flexibeleRegistratie', { read: ViewContainerRef }) flexibeleRegistratie: ViewContainerRef;
    @ViewChild('extraRegistraties', { read: ElementRef }) extraRegistraties: ElementRef;

    public popupAbsentOpen = false;
    public popupTelaatOpen = false;
    public popupVerwijderOpen = false;
    public popupFlexibeleRegistratiesOpen = false;
    public avatarsize = AvatarComponent.defaultsize;
    public avatarfontsize = AvatarComponent.defaultfontsize;
    public externeRegistratieTypeEnum = ExterneRegistratieType;
    public externeRegistratieTooltip: string;

    afspraakInVerleden: boolean;
    teLaatAndereDocentZonderOfEigenConst = false;
    isDesktop$: Observable<boolean>;

    private onDestroy$ = new Subject<boolean>();
    public stopPropagation = false;

    ngOnInit() {
        if (this.deviceService.isPhone()) {
            this.avatarsize = 32;
            this.avatarfontsize = 11;
        }

        this.isDesktop$ = this.deviceService.isDesktop$;
    }

    ngOnChanges() {
        this.afspraakInVerleden = isBefore(this.afspraak.begin, new Date());
        this.disabledZonderStatussen = !this.paginaEnabled && !this.afspraakInVerleden;
        this.teLaatAndereDocentZonderOfEigenConst = isTeLaatGemeldDoorAndereDocentZonderOfEigenConstatering(
            this.afspraak,
            this.registratie
        );

        this.externeRegistratie = bepaalExternRegistratieType(this.afspraak, this.registratie);

        switch (this.externeRegistratie) {
            case ExterneRegistratieType.TE_LAAT:
                this.externeRegistratieTooltip = this.getExterneRegistratieTooltip(this.registratie.teLaat!.ingevoerdDoor);
                break;
            case ExterneRegistratieType.VERWIJDERD:
                this.externeRegistratieTooltip = this.getExterneRegistratieTooltip(this.registratie.verwijderd!.ingevoerdDoor);
                break;
            case ExterneRegistratieType.AANWEZIG:
                this.externeRegistratieTooltip = this.getExterneRegistratieTooltip(this.registratie.waarneming!.ingevoerdDoor);
                break;
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    registreerAanwezig() {
        if (this.disabled || this.externeRegistratie) {
            return;
        }

        this.regDataService.registreerAanwezig(this.registratie.id, this.afspraak.id);
    }

    registreerAfwezig() {
        const wasAlAfwezig = !this.registratie.aanwezig;

        if (this.disabled || this.externeRegistratie) {
            if (this.registratie.absent) {
                this.openAfwezigheidsredenInzienPopup(this.afwezigIcon);
            }
            return;
        }

        const toegestaneAbsentRedenen = this.registratie.absentieRedenenToegestaanVoorDocent.filter(
            (absentieReden) => absentieReden.absentieSoort === AbsentieSoort.Absent
        );
        if (toegestaneAbsentRedenen.length === 0) {
            this.regDataService.registreerAfwezig(this.registratie.id, this.afspraak.id, this.registratie.absent);
            if (wasAlAfwezig && this.registratie.absent) {
                this.openAfwezigheidsredenInzienPopup(this.afwezigIcon);
            }
        } else {
            const popupSettings = this.createDefaultRegistratiePopupSettings();
            popupSettings.showHeader = false;
            popupSettings.onCloseFunction = () => {
                this.popupAbsentOpen = false;
                this.changeDetector.detectChanges();
            };
            if (this.registratie.absent) {
                if (wasAlAfwezig || magAbsentieMeldingBewerken(this.afspraak, this.registratie)) {
                    this.openAfwezigheidsredenInzienBewerkenPopup(popupSettings);
                } else {
                    this.regDataService.registreerAfwezig(this.registratie.id, this.afspraak.id, this.registratie.absent);
                }
            } else {
                if (magAbsentieMeldingBewerken(this.afspraak, this.registratie)) {
                    this.popupAbsentOpen = true;
                    this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Absent, this.afwezigIcon);
                } else {
                    this.regDataService.registreerAfwezig(this.registratie.id, this.afspraak.id, this.registratie.absent);
                }
            }
        }
    }

    public registreerVrijveldWaardes(vrijveldWaardes: VrijVeldWaarde[]): void {
        if (!this.disabled) {
            this.regDataService.registreerOverigeVrijVeldWaarden(
                this.afspraak.id,
                this.registratie.id,
                this.registratie.leerling.id,
                vrijveldWaardes
            );
        }
    }

    private createDefaultRegistratiePopupSettings(): PopupSettings {
        return createDefaultRegistratiePopupSettings(this.deviceService.isPhoneOrTablet());
    }

    private createAfwezigheidsredenPopupSettings(): PopupSettings {
        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.showHeader = false;
        popupSettings.data = {
            absentieMelding: this.registratie.absent
        };
        popupSettings.width = 320;
        return popupSettings;
    }

    private createFlexibeleRegistratiesPopupSettings(): PopupSettings {
        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.showHeader = false;
        popupSettings.width = 320;
        popupSettings.onCloseFunction = () => {
            this.popupFlexibeleRegistratiesOpen = false;
            this.changeDetector.detectChanges();
        };
        return popupSettings;
    }

    public openFlexibeleRegistratiesPopup() {
        if (this.stopPropagation) {
            this.stopPropagation = false;
            return;
        }
        if (!this.disabled) {
            const connectedComponent = this.flexibeleRegistratie;
            if (this.popupService.isPopupOpenFor(connectedComponent)) {
                this.popupService.closePopUp();
            } else {
                const popupSettings = this.createFlexibeleRegistratiesPopupSettings();
                const popup = this.popupService.popup(connectedComponent, popupSettings, FlexibeleRegistratiePopupComponent);
                popup.leerlingRegistratie = this.registratie;
                popup.vrijveldDefinities = this.vrijveldDefinities;
                popup.toonHWenMT = this.deviceService.isPhoneOrTabletPortrait();
                popup.save = (vrijveldWaardes: VrijVeldWaarde[]) => this.registreerVrijveldWaardes(vrijveldWaardes);
                popup.saveHW = (hw: boolean) => this.setHuiswerk(hw);
                popup.saveMT = (mt: boolean) => this.setMateriaal(mt);
                this.popupFlexibeleRegistratiesOpen = true;
                this.onFlexibeleRegistratiePopupCreated(popup);
            }
        }
    }

    public abstract onFlexibeleRegistratiePopupCreated(popup: FlexibeleRegistratiePopupComponent): void;

    openAfwezigheidsredenInzienPopup(connectedComponent: ViewContainerRef, popupSettings = this.createAfwezigheidsredenPopupSettings()) {
        const isAanwezigMelding = this.registratie.absent?.absentieReden?.omschrijving === this.externeRegistratieTypeEnum.AANWEZIG;

        if (this.popupService.isPopupOpenFor(connectedComponent)) {
            this.popupService.closePopUp();
        } else {
            const popup = this.popupService.popup(connectedComponent, popupSettings, SignaleringWeergevenPopupComponent);
            popup.titel = isAanwezigMelding ? 'Aanwezig gemeld' : 'Afwezig gemeld';
            popup.absentieMelding = this.registratie.absent!;
            popup.geoorloofd = popup.absentieMelding.absentieReden!.geoorloofd;
            popup.isAfwezigMelding = !isAanwezigMelding;
            popup.registratieId = this.registratie.id;
            popup.icon = isAanwezigMelding ? 'yesRadio' : 'noRadio';
            popup.iconColor = isAanwezigMelding ? accent_positive_1 : accent_negative_1;
        }
    }

    openAfwezigheidsredenInzienBewerkenPopup(popupSettings: PopupSettings) {
        const popup = this.popupService.popup(this.afwezigIcon, popupSettings, SignaleringWeergevenPopupComponent);
        popup.titel = 'Afwezig';
        popup.absentieMelding = this.registratie.absent!;
        popup.isAbsentieMeldingToegestaan = magAbsentieMeldingBewerken(this.afspraak, this.registratie);
        popup.registratieId = this.registratie.id;
        popup.icon = 'noRadio';
        popup.iconColor = accent_negative_1;
        popup.isAfwezigMelding = true;
        popup.geoorloofd = popup.absentieMelding.absentieReden?.geoorloofd ?? false;

        popup.onVerwijderdClicked = () => this.registreerAanwezig();

        popup.onBewerkenClicked = () => {
            this.popupAbsentOpen = true;
            popupSettings.scrollable = true;

            setTimeout(() => {
                this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Absent, this.afwezigIcon);
            });
        };
    }

    openExterneAbsentiePopup() {
        const popupSettings = this.createAfwezigheidsredenPopupSettings();
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top, PopupDirection.Right, PopupDirection.Left];

        this.openAfwezigheidsredenInzienPopup(this.externGeregistreerdChevron, popupSettings);
    }

    openExterneTeLaatPopup() {
        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.showHeader = false;
        popupSettings.width = 320;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top, PopupDirection.Right, PopupDirection.Left];

        if (this.popupService.isPopupOpenFor(this.externGeregistreerdChevron)) {
            this.popupService.closePopUp();
        } else {
            const popup = this.popupService.popup(this.externGeregistreerdChevron, popupSettings, SignaleringWeergevenPopupComponent);
            popup.titel = 'Te laat gemeld';
            popup.absentieMelding = this.registratie.teLaat!;
            popup.registratieId = this.registratie.id;
            popup.icon = 'klok';
            popup.iconColor = secondary_1;
        }
    }

    openExterneVerwijderdPopup() {
        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.showHeader = false;
        popupSettings.width = 320;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top, PopupDirection.Right, PopupDirection.Left];

        if (this.popupService.isPopupOpenFor(this.externGeregistreerdChevron)) {
            this.popupService.closePopUp();
        } else {
            const popup = this.popupService.popup(this.externGeregistreerdChevron, popupSettings, SignaleringWeergevenPopupComponent);
            popup.titel = 'Verwijderd gemeld';
            popup.absentieMelding = this.registratie.verwijderd!;
            popup.registratieId = this.registratie.id;
            popup.icon = 'leerlingVerwijderdCheckbox';
            popup.iconColor = secondary_1;
        }
    }

    toggleHuiswerk() {
        this.setHuiswerk(!this.registratie.huiswerkNietInOrde);
    }

    setHuiswerk(hw: boolean) {
        if (!this.disabled) {
            this.regDataService.registreerHuiswerk(this.registratie.id, this.registratie.leerling.id, this.afspraak.id, hw);
        }
    }

    toggleMateriaal() {
        this.setMateriaal(!this.registratie.materiaalVergeten);
    }

    setMateriaal(mt: boolean) {
        if (!this.disabled) {
            this.regDataService.registreerMateriaal(this.registratie.id, this.registratie.leerling.id, this.afspraak.id, mt);
        }
    }

    openPopupAbsentieMelding(popupSettings: PopupSettings, absentieSoort: AbsentieSoort, connectedComponent: ViewContainerRef) {
        popupSettings.scrollable = true;
        const popup = this.popupService.popup(connectedComponent, popupSettings, AbsentieMeldingPopupComponent);
        popup.registratie = this.registratie;
        popup.afspraak = this.afspraak;
        popup.absentieSoort = absentieSoort;
        popup.onSave = (absentieMelding: AbsentieMelding | null) =>
            this.regDataService.registreerAfwezigTeLaatOfVerwijderd(this.registratie.id, this.afspraak.id, absentieSoort, absentieMelding);
    }

    registreerTeLaat() {
        if (this.externeRegistratie) {
            return;
        }

        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.onCloseFunction = () => {
            this.popupTelaatOpen = false;
            this.changeDetector.detectChanges();
        };
        popupSettings.showHeader = false;

        if (this.disabled) {
            if (this.registratie.teLaat) {
                this.popupTelaatOpen = true;
                const popup = this.popupService.popup(this.teLaatIcon, popupSettings, SignaleringWeergevenPopupComponent);
                popup.titel = 'Te laat gemeld';
                popup.icon = 'klok';
                popup.absentieMelding = this.registratie.teLaat;
                popup.registratieId = this.registratie.id;
            }
        } else {
            if (this.teLaatMeldingToegestaan && !this.registratie.teLaat) {
                this.popupTelaatOpen = true;
                this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Telaat, this.teLaatIcon);
            } else if (this.registratie.teLaat) {
                this.popupTelaatOpen = true;
                const popup = this.popupService.popup(this.teLaatIcon, popupSettings, SignaleringWeergevenPopupComponent);
                popup.titel = 'Te laat';
                popup.absentieMelding = this.registratie.teLaat;
                popup.registratieId = this.registratie.id;
                popup.icon = 'klok';

                // Bij een telaatmelding door een externe docent, zonder constatering is het geen externe registratie,
                // omdat er nog wel een eigen constatering toegevoegd mag worden. De bestaande telaatmelding mag dan echter niet bewerkt worden.
                popup.isAbsentieMeldingToegestaan = isIngevoerdDoorDocentVanAfspraak(this.afspraak, this.registratie.teLaat.ingevoerdDoor);

                popup.onVerwijderdClicked = () => this.registreerAanwezig();

                popup.onBewerkenClicked = () => {
                    this.popupTelaatOpen = true;
                    popupSettings.scrollable = true;

                    setTimeout(() => {
                        this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Telaat, this.teLaatIcon);
                    });
                };
            }
        }
    }

    onNieuweNotitie(leerling: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number]['leerling']) {
        this.sidebarService.openSidebar(ActueleNotitiesSidebarComponent, {
            context: {
                context: NotitieContext.LEERLING,
                id: leerling.id,
                leerling
            },
            nieuwOnEnter: true,
            afspraakId: this.afspraak.id
        });
    }

    verwijderLeerling() {
        if (this.externeRegistratie) {
            return;
        }

        const popupSettings = this.createDefaultRegistratiePopupSettings();
        popupSettings.onCloseFunction = () => {
            this.popupVerwijderOpen = false;
            this.changeDetector.detectChanges();
        };
        popupSettings.showHeader = false;

        if (!this.disabled) {
            if (this.verwijderdMeldingToegestaan && this.registratie.aanwezig && !this.registratie.verwijderd) {
                this.popupVerwijderOpen = true;
                this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Verwijderd, this.verwijderdIcon);
            } else if (this.registratie.verwijderd) {
                this.popupVerwijderOpen = true;
                const popup = this.popupService.popup(this.verwijderdIcon, popupSettings, SignaleringWeergevenPopupComponent);
                popup.titel = 'Verwijderd';
                popup.absentieMelding = this.registratie.verwijderd;
                popup.registratieId = this.registratie.id;
                popup.icon = 'leerlingVerwijderdCheckbox';

                // Strikt genomen hier niet nodig om te checken, want dit wordt al geblokkeerd doordat de verwijderdmelding dan een externe registratie is.
                // Alleen voor de duidelijkheid en als extra beveiliging.
                popup.isAbsentieMeldingToegestaan = isIngevoerdDoorDocentVanAfspraak(
                    this.afspraak,
                    this.registratie.verwijderd.ingevoerdDoor
                );

                popup.onVerwijderdClicked = () => this.regDataService.annuleerVerwijderdMelding(this.registratie.id);

                popup.onBewerkenClicked = () => {
                    this.popupTelaatOpen = true;
                    popupSettings.scrollable = true;

                    setTimeout(() => {
                        this.openPopupAbsentieMelding(popupSettings, AbsentieSoort.Verwijderd, this.verwijderdIcon);
                    });
                };
            }
        } else if (this.registratie.verwijderd) {
            this.popupVerwijderOpen = true;
            popupSettings.scrollable = true;
            const popup = this.popupService.popup(this.verwijderdIcon, popupSettings, SignaleringWeergevenPopupComponent);
            popup.titel = 'Verwijderd gemeld';
            popup.absentieMelding = this.registratie.verwijderd;
            popup.registratieId = this.registratie.id;
            popup.icon = 'leerlingVerwijderdCheckbox';
        }
    }

    private getExterneRegistratieTooltip(medewerker: Optional<Persoon>) {
        return `${this.externeRegistratie} door ${this.volledigeNaamPipe.transform(medewerker)}`;
    }

    get isAanwezigClassActive(): boolean {
        if (!this.registratie.aanwezig || this.popupAbsentOpen) {
            return false;
        }
        return !this.registratie.teLaat || !this.registratie.waarneming || isTeLaatGemeldDoorAndereDocent(this.afspraak, this.registratie);
    }

    get moetVerwijderdCommentIconTonen(): boolean {
        return (this.registratie.verwijderd || this.popupVerwijderOpen) && this.verwijderdMeldingToegestaan && !this.popupAbsentOpen;
    }

    get moetTeLaatCommentIconTonen(): boolean {
        return (
            (this.registratie.teLaat || this.popupTelaatOpen) &&
            this.teLaatMeldingToegestaan &&
            !this.teLaatAndereDocentZonderOfEigenConst &&
            !this.popupAbsentOpen
        );
    }

    get isJarigIcoonTonen(): boolean {
        return isSameDay(this.afspraak.begin, new Date()) && this.registratie.leerling.isJarig;
    }

    get moetAbsentieRedenIcoonTonen(): boolean {
        return !this.registratie.aanwezig && !this.popupTelaatOpen && !!this.registratie.absent;
    }

    get flexibeleRegistratiesGeselecteerd(): boolean {
        return this.registratie.overigeVrijVeldWaarden.filter((vd) => vd.booleanWaarde || vd.keuzelijstWaarde !== null).length > 0;
    }

    get flexibeleRegistratiesHwMtGeselecteerd(): boolean {
        return this.flexibeleRegistratiesGeselecteerd || this.registratie.huiswerkNietInOrde || this.registratie.materiaalVergeten;
    }

    get flexibeleRegistratiesHwMtLabel(): Optional<string> {
        const hw = this.registratie.huiswerkNietInOrde ? 1 : 0;
        const mt = this.registratie.materiaalVergeten ? 1 : 0;
        const extraRegistraties = this.registratie.overigeVrijVeldWaarden.filter((vw) => vw.booleanWaarde || vw.keuzelijstWaarde !== null);
        const aantalRegistraties = extraRegistraties.length + hw + mt;
        return aantalRegistraties > 0 ? `+${aantalRegistraties}` : null;
    }

    get flexibeleRegistratiesTooltip(): Optional<string> {
        const aankruisvakken = this.registratie.overigeVrijVeldWaarden.filter((vd) => vd.booleanWaarde);
        const keuzevakken = this.registratie.overigeVrijVeldWaarden.filter((vd) => vd.keuzelijstWaarde !== null);

        if (aankruisvakken.length + keuzevakken.length === 0) {
            return null;
        }

        let result = '';
        for (const vw of aankruisvakken) {
            result += vw.vrijveld.naam + ',<br>';
        }
        for (const vw of keuzevakken) {
            result += vw.vrijveld.naam + ': ' + vw.keuzelijstWaarde!.waarde + ',<br>';
        }

        return result.slice(0, -5);
    }

    get flexibeleRegistratiesHwMtTooltip(): string {
        if (this.flexibeleRegistratiesTooltip === null && !this.registratie.huiswerkNietInOrde && !this.registratie.materiaalVergeten) {
            return 'Extra registraties';
        }

        let result = '';
        if (this.registratie.huiswerkNietInOrde) {
            result += 'Huiswerk niet in orde,<br>';
        }
        if (this.registratie.materiaalVergeten) {
            result += 'Materiaal niet in orde,<br>';
        }
        if (this.flexibeleRegistratiesTooltip) {
            result += this.flexibeleRegistratiesTooltip;
        } else {
            result = result.slice(0, -5);
        }
        return result;
    }
}
