import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { take } from 'rxjs/operators';

import { AfspraakMedewerkerFragment } from '@docent/codegen';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { PersonenNamenPipe } from '../../pipes/personen-namen.pipe';
import { VolledigeNaamPipe } from '../../pipes/volledige-naam.pipe';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
    selector: 'dt-collega-avatars',
    templateUrl: './collega-avatars.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AvatarComponent, TooltipDirective, PersonenNamenPipe, VolledigeNaamPipe]
})
export class CollegaAvatarsComponent implements OnChanges {
    private medewerkerService = inject(MedewerkerDataService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() medewerkers: AfspraakMedewerkerFragment[];
    @Input() verbergIngelogdeMedewerker = true;
    @Input() aantalTeTonenMedewerkers: number;
    @Input() avatarAltTag = '';

    public collegas: AfspraakMedewerkerFragment[];

    ngOnChanges() {
        this.medewerkerService
            .getMedewerker()
            .pipe(take(1))
            .subscribe((me) => {
                let teTonenCollegas = [...this.medewerkers];

                if (this.verbergIngelogdeMedewerker) {
                    teTonenCollegas = teTonenCollegas.filter((medewerker) => medewerker.id !== me.id);
                }

                if (this.aantalTeTonenMedewerkers) {
                    teTonenCollegas = teTonenCollegas.slice(0, this.aantalTeTonenMedewerkers);
                }

                this.collegas = teTonenCollegas;
                this.changeDetector.detectChanges();
            });
    }

    trackById(index: number, item: AfspraakMedewerkerFragment) {
        return item.id;
    }
}
