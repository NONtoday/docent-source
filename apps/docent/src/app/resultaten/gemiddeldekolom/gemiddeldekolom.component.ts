import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, inject, output } from '@angular/core';
import { BgColorToken } from 'harmony';
import { IconPinned, provideIcons } from 'harmony-icons';
import {
    LeerlingMissendeToets,
    MatrixResultaatkolomFieldsFragment,
    Maybe,
    ResultaatkolomType,
    VoortgangsdossierMatrixVanLesgroepQuery
} from '../../../generated/_types';
import { toetskolommenConfig } from '../../core/models/resultaten/resultaten.model';
import { DeviceService } from '../../core/services/device.service';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { ToetskolomComponent } from '../toetskolom/toetskolom.component';

@Component({
    selector: 'dt-gemiddeldekolom',
    templateUrl: './gemiddeldekolom.component.html',
    styleUrls: ['../toetskolom/toetskolom.component.scss', './gemiddeldekolom.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ToetskolomComponent, TooltipDirective, AsyncPipe],
    providers: [provideIcons(IconPinned)]
})
export class GemiddeldekolomComponent implements OnChanges {
    public deviceService = inject(DeviceService);
    @HostBinding('class.heeft-kolom') public heeftKolom: boolean;
    @HostBinding('class.mobile-alternatief') public mobileAlternatief = true;
    @HostBinding('class.dark-background') public kolomHeaderBackground?: boolean;

    @Input() kolom: MatrixResultaatkolomFieldsFragment;
    @Input() type: ResultaatkolomType;
    @Input() leerlingen: VoortgangsdossierMatrixVanLesgroepQuery['voortgangsdossierMatrixVanLesgroep']['leerlingen'] = [];
    @Input() pinned: Optional<number>;
    @Input() lesgroepId: string;
    @Input() alternatiefNiveau: boolean;
    @Input() leerlingMissendeToetsen: LeerlingMissendeToets[] = [];

    onKolomClick = output<void>();

    public darkBackground: boolean;
    public headerLetter?: string;
    public headerLetterClass?: string | string[];
    public hideGemiddelde?: boolean;

    public omschrijving: string;
    public tooltip: Maybe<string>;
    public backgroundColor: BgColorToken;

    ngOnChanges(): void {
        this.heeftKolom = Boolean(this.kolom);

        const kolomConfig = toetskolommenConfig[this.type];
        this.kolomHeaderBackground = kolomConfig.kolomHeaderBackground;
        this.headerLetter = kolomConfig.headerLetter;
        this.headerLetterClass = kolomConfig.headerLetterClass;
        this.hideGemiddelde = kolomConfig.hideGemiddelde;
        this.darkBackground = this.type === ResultaatkolomType.RAPPORT_CIJFER;

        this.backgroundColor = this.darkBackground ? 'bg-neutral-weak' : 'bg-neutral-weakest';

        switch (this.type) {
            case ResultaatkolomType.PERIODE_GEMIDDELDE:
                this.omschrijving = 'Periodegemiddelde';
                this.tooltip = '<div style="font-weight: 600">Periodegemiddelde</div>';
                break;
            case ResultaatkolomType.RAPPORT_GEMIDDELDE:
                this.omschrijving = 'Rapportgemiddelde';
                this.tooltip = '<div style="font-weight: 600">Berekend rapportcijfer</div>';
                break;
            case ResultaatkolomType.RAPPORT_CIJFER:
                this.omschrijving = 'Rapportcijfer';
                this.tooltip = '<div style="font-weight: 600">Rapportcijfer</div><div>Waarbij een overschreven cijfer voorrang heeft</div>';
                break;
            default:
                this.omschrijving = '';
                this.tooltip = null;
        }
    }
}
