import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconLink, IconName, provideIcons } from 'harmony-icons';
import { isFunction, isNumber } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { MentordashboardService } from '../../mentordashboard.service';

@Component({
    selector: 'dt-mentordashboard-navigatie-item',
    templateUrl: './mentordashboard-navigatie-item.component.html',
    styleUrls: ['./mentordashboard-navigatie-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLinkActive, RouterLink, AsyncPipe, IconDirective],
    providers: [provideIcons(IconLink)]
})
export class MentordashboardNavigatieItemComponent implements OnChanges {
    private mentordashboardService = inject(MentordashboardService);
    @Input() navigatieItem: NavigatieItem;

    badge$: Observable<number> | undefined;

    ngOnChanges(): void {
        const badge = this.navigatieItem.badge;
        this.badge$ = isNumber(badge) ? of(badge) : badge;
    }

    navigate() {
        if (this.navigatieItem.deeplink) {
            window.location.assign(isFunction(this.navigatieItem.deeplink) ? this.navigatieItem.deeplink() : this.navigatieItem.deeplink);
        }

        this.mentordashboardService.setCurrentNavItem(this.navigatieItem);
    }
}

export interface NavigatieItem {
    titel: string;
    icon: IconName;
    badge?: number | Observable<number>;
    routerlinkExactMatch: boolean;
    deeplink?: string | (() => string);
    routerLink?: string;
    dataGtm?: string;
}
