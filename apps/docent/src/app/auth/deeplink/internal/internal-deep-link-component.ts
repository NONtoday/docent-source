import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, isNull } from 'lodash-es';

/**
 * Component voor het intern redirecten binnen de applicatie.
 * Wordt bijvoorbeeld gebruikt bij de wisselen tussen studiewijzers om
 * component reuse te voorkomen.
 */
@Component({
    selector: 'dt-internal-deep-link',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class InternalDeepLinkComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    ngOnInit(): void {
        const paramMap = this.route.snapshot.queryParamMap;
        const url = paramMap.get('url');
        if (isNull(url) || isEmpty(url)) {
            this.router.navigate(['/']);
        } else {
            this.router.navigateByUrl(decodeURIComponent(url));
        }
    }
}
