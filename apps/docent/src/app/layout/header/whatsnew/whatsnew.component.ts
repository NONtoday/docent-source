import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconCadeau, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { isPresent } from '../../../rooster-shared/utils/utils';
import { latestDevUpdateId } from '../../whatsnew-sidebar/updates';

@Component({
    selector: 'dt-whatsnew',
    template: `
        <i
            class="menu-icon"
            [class.alternative-theme]="alternativeTheme()"
            [elementOffset]="12"
            [sizeInPx]="24"
            hmyIcon="cadeau"
            dtTooltip="What's new"
            position="right"></i>
        <div class="unread notificatie-small-alt" [ngClass]="{ hidden: hideAlert$ | async }"></div>
    `,
    styleUrls: ['./whatsnew.component.scss'],
    standalone: true,
    imports: [CommonModule, TooltipDirective, IconDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconCadeau)]
})
export class WhatsnewComponent implements OnInit {
    private router = inject(Router);
    private medewerkerDataService = inject(MedewerkerDataService);
    public alternativeTheme = input(false);
    public hideAlert$: Observable<boolean>;

    ngOnInit() {
        this.hideAlert$ = this.medewerkerDataService.getLaatstGelezenUpdate().pipe(
            filter(isPresent),
            map((laatsteGelezen) => laatsteGelezen >= latestDevUpdateId),
            startWith(true)
        );
    }

    @HostListener('click')
    public openWhatsNewSidebar() {
        this.router.navigate([], {
            queryParams: { whatsnew: true },
            queryParamsHandling: 'merge'
        });
    }
}
