import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnInit,
    QueryList,
    SimpleChanges,
    ViewChildren,
    inject,
    output
} from '@angular/core';
import { IconDirective, IconPillComponent, PillTagColor } from 'harmony';
import { IconDeeltoets, IconSamengesteldeToets, IconSlot, IconSlotOpen, provideIcons } from 'harmony-icons';
import { intersection, memoize } from 'lodash-es';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    Advieskolom,
    BevrorenStatus,
    KolomActie,
    LeerlingMissendeToets,
    MatrixResultaatkolomFieldsFragment,
    RapportCijferkolom,
    ResultaatInputParam,
    Resultaatkolom,
    ResultaatkolomType,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../../generated/_types';
import { toetskolommenConfig } from '../../core/models/resultaten/resultaten.model';
import { DeviceService } from '../../core/services/device.service';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional, isStringNullOrEmpty } from '../../rooster-shared/utils/utils';
import { KolomHeaderTooltipPipe } from '../pipes/kolom-header-tooltip.pipe';
import { ResultaatKeyPipe } from '../pipes/resultaat-key.pipe';
import { ResultaatCellComponent, getInputDisabledBijResultaatLabels$ } from '../resultaat-cell/resultaat-cell.component';
import { ResultaatService, SelecteerCellNaOpslaan } from '../resultaat.service';
import {
    LeerlingResultaat,
    getBevrorenOfVastgezetStatusTooltip,
    getGemiddeldekolomTooltip,
    getLeerlingResultaat,
    isKolomOfType,
    isToetskolom,
    magOpmerkingToevoegen
} from '../resultaten.utils';

@Component({
    selector: 'dt-toetskolom',
    templateUrl: './toetskolom.component.html',
    styleUrls: ['./toetskolom.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        TooltipDirective,
        ResultaatCellComponent,
        AsyncPipe,
        ResultaatKeyPipe,
        KolomHeaderTooltipPipe,
        IconDirective,
        IconPillComponent
    ],
    providers: [provideIcons(IconSlot, IconSlotOpen, IconSamengesteldeToets, IconDeeltoets)]
})
export class ToetskolomComponent implements OnInit, OnChanges {
    public resultaatService = inject(ResultaatService);
    public deviceService = inject(DeviceService);
    @ViewChildren('cel', { read: ElementRef }) cellen: QueryList<ElementRef>;
    @HostBinding('class.with-color') mobileBackgroundColor: boolean;
    @HostBinding('class.mobile-alternatief') mobileAlternatief: boolean;
    @HostBinding('class.dark-background') darkBackground: boolean;
    @HostBinding('class.is-herkansing') isHerkansing: boolean;
    @HostBinding('attr.cy') cy: string;
    @Input() kolom: MatrixResultaatkolomFieldsFragment;
    @Input() leerlingen: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'] = [];
    @Input() alternatiefNiveau = false;
    @Input() leerlingMissendeToetsen: LeerlingMissendeToets[] = [];
    @Input() highlight: Optional<number>;
    @Input() pinned: Optional<number>;
    @Input() periode: number;
    @Input() lesgroepId: string;

    onHeaderClick = output<void>();

    public leerlingResultaten: LeerlingResultaat[];

    public kolomHeaderBackground: Optional<boolean> = false;
    public kolomCellenBackground: Optional<boolean> = false;
    public kolomIcon: Optional<string>;
    public headerLetter: Optional<string>;
    public headerLetterClass: Optional<string | string[]>;
    public showKolomAfkorting: Optional<boolean> = true;
    public showAantallen: Optional<boolean> = true;
    public hideGemiddelde: Optional<boolean> = false;
    public readOnlyCellen: Optional<boolean> = false;
    public isToetskolom = false;
    public centerHeaderLetter: Optional<boolean> = false;
    public vastgezet = false;

    public klasgemiddelde: Optional<string>;
    public aantalResultaten = 0;
    public aantalResultatenPillClass: PillTagColor = 'neutral';

    public headerTooltip: string;

    public isTabletOrDesktop$: Observable<boolean>;
    public categorie$: Observable<Optional<string>>;

    public toetskolomGesloten: boolean;
    public bekoeldEnBewerkbaar: boolean;

    public isRapportGemiddeldekolom: boolean;
    public isRapportCijferkolom: boolean;

    public magResultatenInvoeren: boolean;
    public magOpmerkingToevoegen: boolean;

    public getCellTooltipFn = memoize(getGemiddeldekolomTooltip, (...args) => JSON.stringify(args));
    public getBevrorenOfVastgezetStatusTooltipFn = memoize(getBevrorenOfVastgezetStatusTooltip, (...args) => JSON.stringify(args));

    public inputDisabledBijResultaatLabels$: Observable<boolean>;

    ngOnInit() {
        this.isTabletOrDesktop$ = this.deviceService.isTabletOrDesktop$;
        this.categorie$ = this.isTabletOrDesktop$.pipe(
            map((isTabletOrDesktop) => {
                const resultaatkolom = this.kolom.resultaatkolom;
                if (!isTabletOrDesktop && isKolomOfType<Advieskolom>(resultaatkolom, ResultaatkolomType.ADVIES)) {
                    return resultaatkolom.categorie;
                }
                return null;
            })
        );
        const isBerekendRapportCijfer = this.kolom.resultaatkolom.type === ResultaatkolomType.RAPPORT_GEMIDDELDE;
        const code = isBerekendRapportCijfer ? this.kolom.resultaatkolom.code.replace('R', 'r') : this.kolom.resultaatkolom.code;
        this.cy = `${code}${this.kolom.herkansingsNummer ?? ''}`;
    }

    ngOnChanges(changes: SimpleChanges) {
        const resultaatkolom = this.kolom.resultaatkolom;
        if (changes['kolom'] && changes['kolom'].currentValue !== changes['kolom'].previousValue) {
            const kolomConfig = toetskolommenConfig[resultaatkolom.type];
            this.readOnlyCellen = kolomConfig.readOnlyCellen;
            this.isRapportGemiddeldekolom = resultaatkolom.type === ResultaatkolomType.RAPPORT_GEMIDDELDE;
            this.kolomIcon = kolomConfig.kolomIcon;
            this.isHerkansing = Boolean(this.kolom.herkansingsNummer! > 0);
            this.kolomHeaderBackground = kolomConfig.kolomHeaderBackground || this.isHerkansing || !!this.kolom.resultaatAnderVakKolom;
            this.kolomCellenBackground = kolomConfig.kolomCellenBackground;
            this.headerLetter = kolomConfig.headerLetter;
            this.headerLetterClass = kolomConfig.headerLetterClass;
            this.showKolomAfkorting = kolomConfig.showKolomAfkorting ?? true;
            this.showAantallen = kolomConfig.showAantallen ?? true;
            this.hideGemiddelde = kolomConfig.hideGemiddelde;
            this.centerHeaderLetter = kolomConfig.centerHeaderLetter;
            this.darkBackground = this.headerLetter === 'R';
            this.isToetskolom = isToetskolom(resultaatkolom);
            this.magResultatenInvoeren = this.kolom.toegestaneKolomActies.includes(KolomActie.ResultatenInvoeren);
            this.toetskolomGesloten =
                resultaatkolom.bevrorenStatus !== BevrorenStatus.Ontdooid ||
                resultaatkolom.type === ResultaatkolomType.RAPPORT_TOETS ||
                !!this.kolom.resultaatAnderVakKolom;
            this.bekoeldEnBewerkbaar = resultaatkolom.bevrorenStatus === BevrorenStatus.Bekoeld && this.magResultatenInvoeren;
            this.isRapportCijferkolom = isKolomOfType<RapportCijferkolom>(resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER);
            this.vastgezet =
                isKolomOfType<RapportCijferkolom>(resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER) && resultaatkolom.vastgezet;

            this.aantalResultaten = intersection(
                this.kolom.resultaten.filter((resultaat) => !!resultaat.formattedResultaat).map((resultaat) => resultaat.leerlingUUID),
                this.leerlingen.map((leerling) => leerling.uuid)
            ).length;
            this.mobileBackgroundColor = this.kolomHeaderBackground;
            this.mobileAlternatief = !!this.headerLetter;

            const sommigeOfAlleResultatenPill = this.aantalResultaten === this.leerlingen.length ? 'positive' : 'primary';

            if (this.toetskolomGesloten) {
                this.aantalResultatenPillClass = 'warning';
            } else {
                this.aantalResultatenPillClass = this.aantalResultaten > 0 ? sommigeOfAlleResultatenPill : 'neutral';
            }

            this.magOpmerkingToevoegen = magOpmerkingToevoegen(this.kolom);
            this.inputDisabledBijResultaatLabels$ = getInputDisabledBijResultaatLabels$(this.deviceService, this.kolom?.resultaatkolom);
            this.updateKlasgemiddelde();
        }
        if (changes['leerlingen'] && changes['leerlingen'].currentValue !== changes['leerlingen'].previousValue) {
            this.leerlingResultaten = this.leerlingen.map((leerling) =>
                getLeerlingResultaat(leerling, this.kolom, this.leerlingMissendeToetsen)
            );
        }

        if (changes['alternatiefNiveau'] && changes['alternatiefNiveau'].currentValue !== changes['alternatiefNiveau'].previousValue) {
            this.updateKlasgemiddelde();
        }
    }

    private updateKlasgemiddelde() {
        const gemiddelde = this.alternatiefNiveau ? this.kolom.klasgemiddeldeAlternatiefNiveau : this.kolom.klasgemiddelde;
        this.klasgemiddelde = isStringNullOrEmpty(gemiddelde) ? '-' : gemiddelde;
    }

    onNieuwResultaat(
        resultaatInput: string,
        isCijfer: boolean,
        selecteerCellNaOpslaan: SelecteerCellNaOpslaan,
        leerlingUUID: string,
        oudeResultaat: Optional<string>
    ) {
        const resultaat: ResultaatInputParam = {
            resultaatInput,
            isCijfer,
            resultaatKey: {
                leerlingUUID,
                resultaatkolomId: this.kolom.id,
                herkansingsNummer: this.kolom.herkansingsNummer
            },
            isAlternatiefNiveau: this.alternatiefNiveau
        };

        this.resultaatService.registreerResultaat(resultaat, selecteerCellNaOpslaan, this.cellen, oudeResultaat ?? '');
    }

    /**
     * Om met cypress rechtstreeks een cell te kunnen selecteren, hangen we er een cell id aan
     * die niet afhankelijk is van db id's. De memoize zit erop zodat die niet bij elke mouseover
     * opnieuw afgaat. Default gebruikt de lodash memoize alleen het eerste argument voor de cache key,
     * daarom geven we de JSON.stringify mee als tweede argument.
     */
    cyCellId = memoize(
        (kolom: Resultaatkolom, achternaam: string, herkansingsnummer: Optional<number>) => {
            const code = kolom.type === ResultaatkolomType.RAPPORT_GEMIDDELDE ? kolom.code.replace('R', 'r') : kolom.code;
            return `${code}${herkansingsnummer ? '-' + herkansingsnummer.toString() : ''}-${achternaam}`;
        },
        (...args) => JSON.stringify(args)
    );

    trackByLeerlingId(index: number, item: LeerlingResultaat) {
        return item.leerling.id;
    }
}
