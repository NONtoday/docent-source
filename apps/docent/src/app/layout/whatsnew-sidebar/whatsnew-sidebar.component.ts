import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconDirective } from 'harmony';
import { IconCadeau, IconChevronRechts, IconName, IconPijlLinks, provideIcons } from 'harmony-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { WhatsNewUpdate, latestDevUpdateId, whatsnewUpdates } from './updates';

@Component({
    selector: 'dt-whatsnew-sidebar',
    templateUrl: './whatsnew-sidebar.component.html',
    styleUrls: ['./whatsnew-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, NgClass, TooltipDirective, IconDirective],
    providers: [provideIcons(IconChevronRechts, IconCadeau, IconPijlLinks)]
})
export class WhatsnewSidebarComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private medewerkerDataService = inject(MedewerkerDataService);
    private changeDetectorRef = inject(ChangeDetectorRef);
    public titel = 'Wat is er nieuw?';
    public icon: IconName = 'cadeau';
    public detail: Optional<string>;
    public laatstGelezenId = 0;

    public updates = [...whatsnewUpdates];

    public onDestroy$ = new Subject<void>();

    ngOnInit() {
        this.medewerkerDataService
            .getLaatstGelezenUpdate()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((laatstgelezen) => {
                this.updates.forEach((update) => {
                    update.unread = laatstgelezen ? update.id > laatstgelezen : true;
                });
                this.laatstGelezenId = laatstgelezen ?? 0;

                this.changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    public setDetail(update: WhatsNewUpdate) {
        if (update.detail) {
            update.unread = false;
            this.detail = update.detail;
            this.titel = ' ';
            this.icon = 'pijlLinks';
        }
    }

    public terug() {
        if (this.detail) {
            this.detail = undefined;
            this.titel = 'Wat is er nieuw?';
            this.icon = 'cadeau';
        }
    }

    public closeSidebar() {
        if (this.laatstGelezenId < latestDevUpdateId) {
            this.medewerkerDataService.setLaatstGelezenUpdate(latestDevUpdateId);
        }
        this.router.navigate([], {
            queryParams: {
                whatsnew: null
            },
            queryParamsHandling: 'merge'
        });
    }
}
