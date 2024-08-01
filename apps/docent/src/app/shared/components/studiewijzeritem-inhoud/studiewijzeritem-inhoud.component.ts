import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, output } from '@angular/core';
import { collapseAnimation } from 'angular-animations';
import { CounterTagComponent, IconDirective, TagComponent } from 'harmony';
import { IconChevronBoven, IconLeerdoel, IconLijst, IconNietZichtbaar, IconReacties, IconToevoegen, provideIcons } from 'harmony-icons';
import { Differentiatiegroep, HuiswerkType, ItemFieldsFragment, Leerling, Studiewijzeritem } from '../../../../generated/_types';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../rooster-shared/utils/utils';
import { KleurToTagColorPipe } from '../../pipes/color-to-text-color.pipe';
import { StudiewijzeritemOmschrijvingPipe } from '../../pipes/studiewijzeritem-omschrijving.pipe';
import { groepTooltip, leerlingenTooltip } from '../../utils/tooltips.utils';
import { BijlageComponent } from '../bijlage/bijlage/bijlage.component';

@Component({
    selector: 'dt-studiewijzeritem-inhoud',
    templateUrl: './studiewijzeritem-inhoud.component.html',
    styleUrls: ['./studiewijzeritem-inhoud.component.scss', './../../../rooster-shared/scss/bullet.list.view.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        TagComponent,
        CounterTagComponent,
        TooltipDirective,
        BackgroundIconComponent,
        BijlageComponent,
        VolledigeNaamPipe,
        KleurToTagColorPipe,
        StudiewijzeritemOmschrijvingPipe,
        IconDirective
    ],
    providers: [provideIcons(IconToevoegen, IconLeerdoel, IconLijst, IconReacties, IconNietZichtbaar, IconChevronBoven)]
})
export class StudiewijzeritemInhoudComponent implements OnChanges {
    @Input() @HostBinding('class.in-sidebar') sidebar = false;
    @Input() @HostBinding('class.is-toekomend') toekomend = false;
    @Input() studiewijzeritem: Studiewijzeritem | ItemFieldsFragment;
    @Input() differentiatiegroepen: Differentiatiegroep[];
    @Input() differentiatieleerlingen: Leerling[];
    @Input() toonDifferentiatie = true;
    @Input() toonNamenInTags = true;
    @Input() readOnlyDifferentiatie = false;

    verwijderAlleDiffLeerlingen = output<void>();
    verwijderDiffGroep = output<string>();
    verwijderDiffLeerling = output<string>();
    onDifferentiatieToekenning = output<void>();

    public swiType = HuiswerkType;
    public heeftNotitie = false;
    public heeftOmschrijving = false;
    public heeftLeerdoelen = false;
    public isNotitieOpen = false;
    public heeftGeenInhoud = false;
    public showIedereenTag = true;
    public aantalLeerlingenTag: string;

    groepTooltip = groepTooltip;
    leerlingTooltip = leerlingenTooltip;

    ngOnChanges() {
        this.heeftNotitie = this.isNotEmpty(this.studiewijzeritem.notitie);
        this.heeftLeerdoelen = this.isNotEmpty(this.studiewijzeritem.leerdoelen);
        this.heeftOmschrijving = this.isNotEmpty(this.studiewijzeritem.omschrijving);
        this.heeftGeenInhoud =
            !this.heeftNotitie && !this.heeftOmschrijving && !this.heeftLeerdoelen && this.studiewijzeritem?.bijlagen.length === 0;
        this.showIedereenTag = this.differentiatiegroepen.length === 0 && this.differentiatieleerlingen.length === 0;
        this.aantalLeerlingenTag =
            this.differentiatieleerlingen.length > 1 ? `${this.differentiatieleerlingen.length} leerlingen` : `1 leerling`;
    }

    private isNotEmpty(value: Optional<string>): boolean {
        if (value) {
            const trimmed = value.trim();
            return trimmed.length > 0 && trimmed !== '<ul></ul>';
        }
        return false;
    }
}
