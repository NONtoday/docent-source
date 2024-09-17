import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CijferhistorieQuery } from '@docent/codegen';
import { SpinnerComponent } from 'harmony';
import { Observable } from 'rxjs';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { ResultaatDataService } from '../resultaat-data.service';
import { ResultaatService } from '../resultaat.service';

@Component({
    selector: 'dt-cijferhistorie',
    templateUrl: './cijferhistorie.component.html',
    styleUrls: ['./cijferhistorie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SpinnerComponent, AsyncPipe, VolledigeNaamPipe, DtDatePipe]
})
export class CijferhistorieComponent implements OnInit {
    private resultaatService = inject(ResultaatService);
    private resultaatDataService = inject(ResultaatDataService);
    private activatedRoute = inject(ActivatedRoute);
    @Input() cellId: string;
    @Input() alternatiefNiveau = false;

    historischeResultaten$: Observable<CijferhistorieQuery['cijferhistorie']>;

    ngOnInit() {
        const lesgroepId = this.activatedRoute.snapshot.paramMap.get('id')!;
        this.historischeResultaten$ = this.resultaatDataService.getCijferhistorie(
            this.resultaatService.voortgangsdossierId,
            lesgroepId,
            this.cellId
        );
    }
}
