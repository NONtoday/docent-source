import { AsyncPipe } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    HostBinding,
    OnChanges,
    QueryList,
    ViewChildren,
    ViewContainerRef
} from '@angular/core';
import { KeuzelijstWaardeMogelijkheid, LesRegistratieQuery, VrijVeld, VrijVeldWaarde } from '@docent/codegen';
import { IconDirective, IconPillComponent, MEDIUM_PX, PillComponent } from 'harmony';
import {
    IconChevronBoven,
    IconChevronOnder,
    IconKlok,
    IconLeerlingVerwijderdCheckbox,
    IconNoCheckbox,
    IconNoRadio,
    IconReacties,
    IconSlot,
    IconSluiten,
    IconTaart,
    IconToevoegen,
    IconVideo,
    IconYesRadio,
    provideIcons
} from 'harmony-icons';
import { PopupDirection } from '../../../core/popup/popup.settings';
import { ActionsPopupComponent } from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { createVrijVeldKeuzePopupCustomButtons } from '../../../rooster-shared/utils/registratie.utils';
import { Optional } from '../../../rooster-shared/utils/utils';
import { LeerlingComponent } from '../../../shared/components/leerling/leerling.component';
import { BooleanVrijVeldActivePipe } from '../../boolean-vrij-veld-active.pipe';
import { KeuzeVrijVeldActivePipe } from '../../keuze-vrij-veld-active.pipe';
import { FlexibeleRegistratiePopupComponent } from '../flexibele-registratie-popup/flexibele-registratie-popup.component';
import { LeerlingRegistratieComponent } from '../leerling-registratie/leerling-registratie.component';

@Component({
    selector: 'dt-leerling-list-registratie',
    templateUrl: './leerling-list-registratie.component.html',
    styleUrls: ['./leerling-list-registratie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        VolledigeNaamPipe,
        provideIcons(
            IconChevronOnder,
            IconYesRadio,
            IconNoRadio,
            IconReacties,
            IconKlok,
            IconSlot,
            IconLeerlingVerwijderdCheckbox,
            IconNoCheckbox,
            IconChevronBoven,
            IconSluiten,
            IconToevoegen,
            IconVideo,
            IconTaart
        )
    ],
    standalone: true,
    imports: [
        LeerlingComponent,
        TooltipDirective,
        AsyncPipe,
        BooleanVrijVeldActivePipe,
        KeuzeVrijVeldActivePipe,
        IconDirective,
        IconPillComponent,
        PillComponent
    ]
})
export class LeerlingListRegistratieComponent extends LeerlingRegistratieComponent implements OnChanges, AfterViewInit {
    @ViewChildren('extraRegistratieContainer', { read: ViewContainerRef }) extraRegistratieContainers: QueryList<ViewContainerRef>;

    registratieIconSizes: number[] = [MEDIUM_PX, MEDIUM_PX, MEDIUM_PX, 32];
    keuzeOptiesPopupOpenFor: Optional<VrijVeld>;

    heeftTeLaat = true;

    @HostBinding('class.popup-open')
    get popupOpen(): boolean {
        return Boolean(this.keuzeOptiesPopupOpenFor) || Boolean(this.popupFlexibeleRegistratiesOpen);
    }

    ngOnChanges() {
        super.ngOnChanges();
        this.heeftTeLaat = this.teLaatMeldingToegestaan || Boolean(this.registratie.teLaat && !this.externeRegistratie);
        this.elementRef.nativeElement.style.setProperty('--mobile-aanwezigheid-width', this.heeftTeLaat ? '3fr' : '2fr');
        this.setAantalExtraRegistratiesCssVar();
    }

    ngAfterViewInit(): void {
        this.setAantalExtraRegistratiesCssVar();
    }

    private setAantalExtraRegistratiesCssVar() {
        this.extraRegistraties?.nativeElement.style.setProperty('--aantal-extra-registraties-tonen', this.aantalExtraRegistratiesTonen);
    }

    public onFlexibeleRegistratiePopupCreated(popup: FlexibeleRegistratiePopupComponent): void {
        popup.vrijveldDefinities = this.nietZichtbareExtraVrijeVelden;
    }

    get isExtraRegistratiesVisible() {
        return this.vrijveldDefinities?.length > 0;
    }

    get flexibeleRegistratiesLabel(): Optional<string> {
        const nietZichtbareExtraVrijeVelden = this.nietZichtbareExtraVrijeVelden;
        const inExtraVrijVeldDefinities = (vvw: VrijVeldWaarde) => nietZichtbareExtraVrijeVelden.some((vv) => vvw.vrijveld.id === vv.id);
        const extraRegistraties = this.registratie.overigeVrijVeldWaarden.filter(
            (vw) => (vw.booleanWaarde || vw.keuzelijstWaarde !== null) && inExtraVrijVeldDefinities(vw)
        );

        if (extraRegistraties.length > 1) {
            return '+' + extraRegistraties.length.toString() + ' registraties';
        }
        if (extraRegistraties.length === 1) {
            const extraRegistratie = extraRegistraties[0];
            if (extraRegistratie.booleanWaarde) {
                return extraRegistratie.vrijveld.naam;
            } else {
                return extraRegistratie.vrijveld.naam + ': ' + extraRegistratie.keuzelijstWaarde!.waarde;
            }
        }
        return null;
    }

    public verwijderFlexibeleRegistraties(): void {
        this.stopPropagation = true;
        if (!this.disabled) {
            const nietZichtbareExtraVrijeVelden = this.nietZichtbareExtraVrijeVelden;
            const vrijVeldWaarden = this.registratie.overigeVrijVeldWaarden.map((vvw) =>
                this.isVrijVeldInDefinities(vvw.vrijveld, nietZichtbareExtraVrijeVelden)
                    ? {
                          ...vvw,
                          booleanWaarde: vvw.booleanWaarde === null ? null : false,
                          keuzelijstWaarde: null
                      }
                    : vvw
            );
            this.regDataService.registreerOverigeVrijVeldWaarden(
                this.afspraak.id,
                this.registratie.id,
                this.registratie.leerling.id,
                vrijVeldWaarden
            );
        }
    }

    private get nietZichtbareExtraVrijeVelden(): VrijVeld[] {
        return this.deviceService.isDesktop()
            ? [...this.vrijveldDefinities].splice(this.aantalExtraRegistratiesTonen)
            : [...this.vrijveldDefinities];
    }

    private isVrijVeldInDefinities(vrijveld: VrijVeld, vrijveldDefinities: VrijVeld[]) {
        return vrijveldDefinities.some((definitie) => definitie.id === vrijveld.id);
    }

    // Override de getter om rekening te houden met gefilterde vrije velden op desktop
    get flexibeleRegistratiesGeselecteerd(): boolean {
        const nietZichtbareExtraVrijeVelden = this.nietZichtbareExtraVrijeVelden;
        return (
            this.registratie.overigeVrijVeldWaarden.filter(
                (vvw) =>
                    (vvw.booleanWaarde || vvw.keuzelijstWaarde !== null) &&
                    this.isVrijVeldInDefinities(vvw.vrijveld, nietZichtbareExtraVrijeVelden)
            ).length > 0
        );
    }

    toggleAankruisvak(vrijveld: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'][number]) {
        if (this.disabled) return;

        const updatedVrijVeldWaardes: VrijVeldWaarde[] = [...this.registratie.overigeVrijVeldWaarden];
        const vrijveldIndex = updatedVrijVeldWaardes.findIndex((vvw) => vvw.vrijveld.id === vrijveld.id);

        if (vrijveldIndex >= 0) {
            const vvw = updatedVrijVeldWaardes[vrijveldIndex];
            updatedVrijVeldWaardes[vrijveldIndex] = { ...vvw, booleanWaarde: !vvw.booleanWaarde };
        } else {
            const newVrijveld = {
                __typename: 'VrijVeldWaarde' as const,
                id: this.registratie.leerling.id + '-' + vrijveld.id,
                booleanWaarde: true,
                vrijveld,
                keuzelijstWaarde: null
            };
            updatedVrijVeldWaardes.push(newVrijveld);
        }

        this.regDataService.registreerOverigeVrijVeldWaarden(
            this.afspraak.id,
            this.registratie.id,
            this.registratie.leerling.id,
            updatedVrijVeldWaardes
        );
    }

    updateKeuze(
        vrijveld: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'][number],
        keuze: KeuzelijstWaardeMogelijkheid | null
    ) {
        if (this.disabled) return;

        const updatedVrijVeldWaardes: VrijVeldWaarde[] = [...this.registratie.overigeVrijVeldWaarden];
        const vrijveldIndex = updatedVrijVeldWaardes.findIndex((vvw) => vvw.vrijveld.id === vrijveld.id);

        if (vrijveldIndex >= 0) {
            const vvw = updatedVrijVeldWaardes[vrijveldIndex];
            updatedVrijVeldWaardes[vrijveldIndex] = { ...vvw, keuzelijstWaarde: keuze };
        } else {
            const newVrijveld = {
                __typename: 'VrijVeldWaarde' as const,
                id: this.registratie.leerling.id + '-' + vrijveld.id,
                booleanWaarde: null,
                vrijveld,
                keuzelijstWaarde: keuze
            };
            updatedVrijVeldWaardes.push(newVrijveld);
        }

        this.regDataService.registreerOverigeVrijVeldWaarden(
            this.afspraak.id,
            this.registratie.id,
            this.registratie.leerling.id,
            updatedVrijVeldWaardes
        );
    }

    openKeuzePopup(vrijveld: VrijVeld, index: number) {
        if (this.keuzeOptiesPopupOpenFor === vrijveld || this.disabled) return;

        this.keuzeOptiesPopupOpenFor = vrijveld;
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 156;
        popupSettings.preferedDirection = [PopupDirection.Bottom, PopupDirection.Top];
        popupSettings.onCloseFunction = () => {
            this.keuzeOptiesPopupOpenFor = null;
            this.changeDetector.detectChanges();
        };

        const waarde = this.registratie.overigeVrijVeldWaarden.find((vvw) => vvw.vrijveld.id === vrijveld.id);

        const popup = this.popupService.popup(this.extraRegistratieContainers.get(index)!, popupSettings, ActionsPopupComponent);
        popup.onActionClicked = () => {
            this.popupService.closePopUp();
        };
        popup.customButtons = createVrijVeldKeuzePopupCustomButtons(vrijveld, waarde, this.updateKeuze.bind(this));
        popup.buttonsBeforeDivider = popup.customButtons.length - 1;
    }
}
