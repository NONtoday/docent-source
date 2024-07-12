import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconPlagiaat, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Leerling, Projectgroep } from '../../../../generated/_types';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../rooster-shared/utils/utils';
import { LeerlingComponent } from '../../../shared/components/leerling/leerling.component';
import { PlagiaatKleurPipe } from '../../../shared/pipes/plagiaat-kleur.pipe';
import { ProjectgroepNaamComponent } from '../../projectgroep-naam/projectgroep-naam.component';

@Component({
    selector: 'dt-inleveringen-overzicht-item',
    templateUrl: './inleveringen-overzicht-item.component.html',
    styleUrls: ['./inleveringen-overzicht-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [LeerlingComponent, ProjectgroepNaamComponent, TooltipDirective, AsyncPipe, PlagiaatKleurPipe, IconDirective],
    providers: [provideIcons(IconPlagiaat)]
})
export class InleveringenOverzichtItemComponent implements OnInit, OnChanges {
    private activatedRoute = inject(ActivatedRoute);
    @Input() leerling: Leerling;
    @Input() projectgroep: Projectgroep;

    isActief$: Observable<boolean>;
    hoogstePlagiaat: Optional<number>;

    ngOnInit() {
        const inleveraarId = this.leerling ? this.leerling?.id : this.projectgroep?.id;
        this.isActief$ = this.activatedRoute.queryParamMap.pipe(map((queryParamMap) => queryParamMap.get('detail') === inleveraarId));
    }

    ngOnChanges() {
        this.hoogstePlagiaat = this.leerling?.hoogstePlagiaat ?? this.projectgroep?.hoogstePlagiaat;
    }
}
