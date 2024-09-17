import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AfspraakQuery } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconInleveropdracht, IconLesplanning, IconYesRadio, provideIcons } from 'harmony-icons';
import { SidebarInputs, SidebarService } from '../../core/services/sidebar.service';
import { InleveropdrachtenOverzichtSidebarComponent } from '../lesplanning/inleveropdrachten-overzicht-sidebar/inleveropdrachten-overzicht-sidebar.component';

@Component({
    selector: 'dt-groep-navigatie',
    templateUrl: './groep-navigatie.component.html',
    styleUrls: ['./groep-navigatie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLinkActive, RouterLink, AsyncPipe, IconDirective],
    providers: [provideIcons(IconYesRadio, IconLesplanning, IconInleveropdracht)]
})
export class GroepNavigatieComponent implements OnInit, OnChanges {
    private sidebarService = inject(SidebarService);
    @Input() public afspraak: AfspraakQuery['afspraak'];
    @Input() public showInleveropdrachten: boolean;

    heeftLesplanning: boolean;

    public onInleveropdrachtenClick = output<void>();

    inleveropdrachtenOverzichtSidebar$: SidebarInputs<InleveropdrachtenOverzichtSidebarComponent>;

    ngOnInit() {
        this.inleveropdrachtenOverzichtSidebar$ = this.sidebarService.watchFor(InleveropdrachtenOverzichtSidebarComponent);
    }

    ngOnChanges() {
        this.heeftLesplanning = this.afspraak?.isRoosterAfspraak && !this.afspraak.isKwt && this.afspraak?.heeftLesgroepen;
    }
}
