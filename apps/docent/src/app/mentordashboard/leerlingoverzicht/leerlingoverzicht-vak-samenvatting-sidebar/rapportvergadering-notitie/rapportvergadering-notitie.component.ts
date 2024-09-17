import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MedewerkerFieldsFragment } from '@docent/codegen';
import { TagComponent } from 'harmony';
import { VolledigeNaamPipe } from '../../../../rooster-shared/pipes/volledige-naam.pipe';
import { Optional } from '../../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-rapportvergadering-notitie',
    standalone: true,
    imports: [TagComponent, VolledigeNaamPipe],
    templateUrl: './rapportvergadering-notitie.component.html',
    styleUrl: './rapportvergadering-notitie.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportvergaderingNotitieComponent {
    @Input({ required: true }) notitie: Optional<string>;
    @Input({ required: true }) medewerker: MedewerkerFieldsFragment;
}
