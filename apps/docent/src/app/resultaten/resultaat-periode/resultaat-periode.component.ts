import { AsyncPipe } from '@angular/common';
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
import { IconNormaleToets, IconSamengesteldeToets, IconToevoegen, IconUitklappenLinks, provideIcons } from 'harmony-icons';
import { memoize } from 'lodash-es';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    BevrorenStatus,
    LeerlingMissendeToets,
    MatrixResultaatkolomFieldsFragment,
    RapportCijferkolom,
    ResultaatkolomType,
    SamengesteldeToetskolom,
    Toetskolom,
    VoortgangsdossierKolomZichtbaarheidQuery,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../../generated/_types';
import { KolomZichtbaarheidKey } from '../../core/models/resultaten/resultaten.model';
import { PopupService } from '../../core/popup/popup.service';
import { DeviceService, phoneQuery, tabletPortraitQuery } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ActionsPopupComponent, primaryButton } from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { formatDateNL } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { GemiddeldekolomComponent } from '../gemiddeldekolom/gemiddeldekolom.component';
import { ResultaatService } from '../resultaat.service';
import { isKolomOfType } from '../resultaten.utils';
import { ToetskolomSidebarComponent } from '../toetskolom-sidebar/toetskolom-sidebar.component';
import { ToetskolomComponent } from '../toetskolom/toetskolom.component';

@Component({
    selector: 'dt-resultaat-periode',
    templateUrl: './resultaat-periode.component.html',
    styleUrls: ['./resultaat-periode.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, ToetskolomComponent, BackgroundIconComponent, GemiddeldekolomComponent, AsyncPipe, IconDirective],
    providers: [provideIcons(IconUitklappenLinks, IconToevoegen, IconNormaleToets, IconSamengesteldeToets)]
})
export class ResultaatPeriodeComponent implements OnInit {
    private deviceService = inject(DeviceService);
    private sidebarService = inject(SidebarService);
    public resultaatService = inject(ResultaatService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('toevoegen', { read: ViewContainerRef }) toevoegenRef: ViewContainerRef;

    @Input() @HostBinding('class.collapsed') collapsed = true;
    @Input() periode: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number];
    @Input() leerlingen: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'] = [];
    @Input() alternatiefNiveau = false;
    @Input() magBewerken: boolean;
    @Input() magBekoeldePeriodeBewerken: boolean;
    @Input() highlight: Optional<number>;
    @Input() pinned: Optional<number>;
    @Input() kolomZichtbaarheid: VoortgangsdossierKolomZichtbaarheidQuery['voortgangsdossierKolomZichtbaarheid'][number];
    @Input() lesgroepId: string;

    onCollapseToggle = output<boolean>();
    onKolomToggle = output<KolomZichtbaarheidKey>();

    public isPopupOpen = false;
    public isPhoneOrTabletPortrait$: Observable<boolean>;

    public gemiddeldetypes = {
        periodeGemiddelde: ResultaatkolomType.PERIODE_GEMIDDELDE,
        rapportGemiddelde: ResultaatkolomType.RAPPORT_GEMIDDELDE,
        rapportCijfer: ResultaatkolomType.RAPPORT_CIJFER
    };

    ngOnInit() {
        this.isPhoneOrTabletPortrait$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery])
        );
    }

    toggleKolomZichtbaarheid(event: Event, kolom: KolomZichtbaarheidKey) {
        event.stopPropagation(); // voorkom dat de periode dichtklapt
        this.onKolomToggle.emit(kolom);
    }

    headerClicked(event: Event) {
        event.stopPropagation();
        this.onCollapseToggle.emit(!this.collapsed);
        this.changeDetector.detectChanges();
    }

    openToetsKolomMobile(kolom: MatrixResultaatkolomFieldsFragment) {
        if (this.deviceService.isPhoneOrTabletPortrait()) {
            this.openToetsKolom(kolom);
        }
    }

    openToetsKolom(kolom: MatrixResultaatkolomFieldsFragment) {
        const leerlingMissendeToetsen: LeerlingMissendeToets[] = [];
        if (isKolomOfType<RapportCijferkolom>(kolom.resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER)) {
            leerlingMissendeToetsen.push(...this.periode.leerlingMissendeToetsen);
        } else if (isKolomOfType<SamengesteldeToetskolom>(kolom.resultaatkolom, ResultaatkolomType.SAMENGESTELDE_TOETS)) {
            leerlingMissendeToetsen.push(...kolom.resultaatkolom.leerlingMissendeToetsen);
        }

        this.sidebarService.openSidebar(ToetskolomSidebarComponent, {
            voortgangsdossierId: this.resultaatService.voortgangsdossierId,
            kolomId: kolom.resultaatkolom.id,
            herkansingsNummer: kolom.herkansingsNummer,
            periode: this.periode.cijferPeriode,
            alternatiefNiveau: this.alternatiefNiveau,
            leerlingen: this.leerlingen,
            kolomType: kolom.resultaatkolom.type,
            leerlingMissendeToetsen
        });
    }

    openNieuweToetskolom(kolomType?: ResultaatkolomType) {
        this.sidebarService.openSidebar(ToetskolomSidebarComponent, {
            kolomId: null,
            periode: this.periode.cijferPeriode,
            leerlingen: this.leerlingen,
            kolomType
        });
    }

    openToevoegenPopup() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 222;
        popupSettings.onCloseFunction = () => {
            this.isPopupOpen = false;
            this.changeDetector.detectChanges();
        };

        const popup = this.popupService.popup(this.toevoegenRef, popupSettings, ActionsPopupComponent);

        popup.customButtons = [
            primaryButton(
                'normaleToets',
                'Normale toets',
                () => {
                    this.openNieuweToetskolom(ResultaatkolomType.TOETS);
                },
                'toets-toevoegen'
            ),
            primaryButton(
                'samengesteldeToets',
                'Samengestelde toets',
                () => {
                    this.openNieuweToetskolom(ResultaatkolomType.SAMENGESTELDE_TOETS);
                },
                'samengesteldetoets-toevoegen'
            )
        ];
        popup.onActionClicked = () => {
            this.isPopupOpen = false;
            this.popupService.closePopUp();
            this.changeDetector.detectChanges();
        };

        this.isPopupOpen = true;
    }

    trackById(
        index: number,
        item: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number]['advieskolommen'][number]
    ) {
        return item.id;
    }

    trackByKolom(
        index: number,
        kolom: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number]['resultaatkolommen'][number]
    ) {
        const toetsKolom = <Toetskolom>kolom.resultaatkolom;

        return `${toetsKolom.id}-
            ${toetsKolom.omschrijving}-
            ${toetsKolom.type.valueOf()}-
            ${toetsKolom.code}-
            ${toetsKolom.weging}-
            ${toetsKolom.periode}-
            ${toetsKolom.resultaatLabelLijst?.id}`;
    }

    periodeTooltip = memoize(
        (periode: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['periodes'][number]['cijferPeriode']) => {
            if (periode.begin) {
                const startDatum = formatDateNL(periode.begin, 'dagnummer_maand_kort');
                const eindDatum = formatDateNL(periode.eind!, 'dagnummer_maand_kort');

                return `<span class="text-small-content-semi">Cijferperiode</span><br><span text-small-content>${startDatum} tot ${eindDatum}</span>`;
            }

            return `<span class="text-small-content-semi">Cijferperiode</span><br><span class="text-small-content">Geen data ingesteld voor periode ${periode.nummer}</span>`;
        },
        (...args) => JSON.stringify(args)
    );

    get magKolomToevoegenInPeriode(): boolean {
        return (
            this.periode.bevrorenStatus === BevrorenStatus.Ontdooid ||
            (this.periode.bevrorenStatus === BevrorenStatus.Bekoeld && this.magBekoeldePeriodeBewerken)
        );
    }
}
