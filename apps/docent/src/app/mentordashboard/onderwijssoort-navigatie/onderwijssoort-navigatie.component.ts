import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, QueryList, ViewChildren, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GetMentorDashboardResultatenContextQuery } from '@docent/codegen';
import { Optional } from '../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-onderwijssoort-navigatie',
    templateUrl: './onderwijssoort-navigatie.component.html',
    styleUrls: ['./onderwijssoort-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: []
})
export class OnderwijssoortNavigatieComponent implements AfterViewInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    @ViewChildren('soort', { read: ElementRef }) soorten: QueryList<ElementRef>;

    @Input() stamgroepId: Optional<string>;
    @Input() plaatsingId: Optional<string>;
    @Input() lichtingId: Optional<string>;
    @Input() contexten: GetMentorDashboardResultatenContextQuery['getMentorDashboardResultatenContext'];
    @Input() isAlternatieveNormering: Optional<boolean>;

    elementRef = inject(ElementRef);

    onStamgroepSelected(
        stamgroepId: Optional<string>,
        plaatsingId: Optional<string>,
        lichtingId: Optional<string>,
        alternatieveNormering: Optional<boolean>
    ) {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                stamgroep: stamgroepId,
                plaatsing: plaatsingId,
                lichting: lichtingId,
                alternatieveNormering: alternatieveNormering || null // null i.p.v. false voor observables
            },
            queryParamsHandling: 'merge'
        });
    }

    ngAfterViewInit(): void {
        const activeElement = this.soorten.map((element) => element.nativeElement).find((element) => element.classList.contains('active'));
        this.elementRef.nativeElement.scroll(activeElement?.offsetLeft, 0);
    }
}
