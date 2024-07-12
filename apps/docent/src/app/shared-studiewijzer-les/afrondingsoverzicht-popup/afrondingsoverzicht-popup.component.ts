import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconDirective, SwitchComponent, SwitchGroupComponent } from 'harmony';
import { IconPlagiaat, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Afrondingsoverzicht } from '../../../generated/_types';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { SidebarService } from '../../core/services/sidebar.service';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { PlagiaatKleurPipe } from '../../shared/pipes/plagiaat-kleur.pipe';

type AfrondingsTab = 'afgerond' | 'nietAfgerond';

@Component({
    selector: 'dt-afrondingsoverzicht-popup',
    templateUrl: './afrondingsoverzicht-popup.component.html',
    styleUrls: ['./afrondingsoverzicht-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        AvatarComponent,
        TooltipDirective,
        AsyncPipe,
        VolledigeNaamPipe,
        PlagiaatKleurPipe,
        IconDirective,
        SwitchGroupComponent,
        SwitchComponent
    ],
    providers: [provideIcons(IconPlagiaat)]
})
export class AfrondingsoverzichtPopupComponent implements OnInit, Popup {
    private router = inject(Router);
    private sidebarService = inject(SidebarService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('content', { static: true }) feedbackRef: ElementRef;

    @Input({ required: true }) afgerondLabel: string;
    @Input({ required: true }) onafgerondLabel: string;
    @Input({ required: true }) typeLabel: string;
    @Input({ required: true }) toekenningId: string;

    datasource$: Observable<Afrondingsoverzicht>;
    activeView$: Observable<AfrondingsoverzichtPopupView>;
    activeTab$ = new BehaviorSubject<AfrondingsTab>('afgerond');

    ngOnInit(): void {
        this.activeView$ = combineLatest([this.datasource$, this.activeTab$]).pipe(
            map(([view, activeTab]) => ({
                items: activeTab === 'afgerond' ? view.afgerond : view.nietAfgerond,
                buttonLabelAfgerond: `${this.afgerondLabel} (${view.afgerond.length})`,
                buttonLabelOnafgerond: `${this.onafgerondLabel} (${view.nietAfgerond.length})`
            })),
            startWith({ items: [], buttonLabelAfgerond: '', buttonLabelOnafgerond: '' })
        );
    }

    setTab(tab: AfrondingsTab) {
        this.activeTab$.next(tab);
        this.feedbackRef.nativeElement.scrollTop = 0;
    }

    mayClose(): boolean {
        return true;
    }

    onInleveraarClick(inleveraarId: string) {
        this.sidebarService.closeSidebar();

        setTimeout(() => {
            const url = this.router.parseUrl(`/inleveropdrachten/${this.toekenningId}?detail=${inleveraarId}`);
            this.router.navigateByUrl(url);
        });
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.width = 348;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}

interface AfrondingsoverzichtPopupView {
    items: Afrondingsoverzicht['afgerond'];
    buttonLabelAfgerond: string;
    buttonLabelOnafgerond: string;
}
