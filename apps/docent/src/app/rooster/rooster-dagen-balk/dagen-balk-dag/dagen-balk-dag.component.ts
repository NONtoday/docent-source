import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
import { isSameDay } from 'date-fns';
import { DtDatePipe } from '../../../rooster-shared/pipes/dt-date.pipe';
import { formatNL } from '../../../rooster-shared/utils/utils';
import { RoosterDagenBalkComponent } from './../rooster-dagen-balk.component';

@Component({
    selector: 'dt-dagen-balk-dag',
    templateUrl: './dagen-balk-dag.component.html',
    styleUrls: ['./dagen-balk-dag.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLinkActive, DtDatePipe]
})
export class DagenBalkDagComponent implements OnChanges {
    private _router = inject(Router);
    @Input() dag: Date;
    @Input() datum: Date;
    @HostBinding('class.vandaag') vandaag: boolean;

    dagenBalkComponent: RoosterDagenBalkComponent;

    geselecteerdeDag: boolean;

    ngOnChanges() {
        this.vandaag = isSameDay(this.dag, new Date());
        this.geselecteerdeDag = isSameDay(this.datum, this.dag);
    }

    /**
     * Nagiveert naar de url op het moment dat deze afwijkend is.
     * In het geval dat dit gelijk is wordt er via het RoosterDagenBalkComponent
     * een funcie aangeroepen in het RoosterComponent om de pagina te scrollen.
     *
     * Geïmplementeerd omdat navigatie naar dezelfde url niet ondersteund wordt door Angular.
     */
    navigateOrScroll() {
        const url = `/rooster/${formatNL(this.dag, 'yyyy/M/d')}`;
        if (this._router.url.indexOf(url) >= 0) {
            this.dagenBalkComponent.scrollToDatumInRooster(this.dag);
        } else {
            this._router.navigate([url]);
        }
    }
}
