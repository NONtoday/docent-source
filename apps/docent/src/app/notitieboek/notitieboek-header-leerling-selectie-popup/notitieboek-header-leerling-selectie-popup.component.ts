import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SpinnerComponent } from 'harmony';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { match } from 'ts-pattern';
import { NotitieboekMenuGroepFieldsFragment } from '../../../generated/_types';
import { NotitieboekDataService } from '../../core/services/notitieboek-data.service';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { SearchComponent } from '../../rooster-shared/components/search/search.component';
import { getVolledigeNaam } from '../../shared/utils/leerling.utils';
import { NotitieboekMenuLeerlingItemComponent } from '../notitieboek-menu-leerling-item/notitieboek-menu-leerling-item.component';

export type NotitieboekHeaderLeerlingSelectiePopupType = 'Lesgroep' | 'Stamgroep' | 'Individueel';
// aparte interface omdat ze afhankelijk zijn van elkaar of ze gevuld zijn ja of nee.
export type NotitieboekHeaderLeerlingSelectiePopupInput = GroepInput | IndividueelInput;
interface GroepInput {
    type: Extract<NotitieboekHeaderLeerlingSelectiePopupType, 'Lesgroep' | 'Stamgroep'>;
    groepId: string;
}
interface IndividueelInput {
    type: Extract<NotitieboekHeaderLeerlingSelectiePopupType, 'Individueel'>;
}

@Component({
    selector: 'dt-notitieboek-header-leerling-selectie-popup',
    standalone: true,
    imports: [SearchComponent, NotitieboekMenuLeerlingItemComponent, SpinnerComponent, RouterModule, PopupComponent, AsyncPipe],
    templateUrl: './notitieboek-header-leerling-selectie-popup.component.html',
    styleUrls: ['./notitieboek-header-leerling-selectie-popup.component.scss']
})
export class NotitieboekHeaderLeerlingSelectiePopupComponent implements OnInit, Popup {
    private notitieboekDataService = inject(NotitieboekDataService);
    private route = inject(ActivatedRoute);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @Input() input: NotitieboekHeaderLeerlingSelectiePopupInput;

    public searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    public leerlingMenuItems$: Observable<NotitieboekMenuGroepFieldsFragment['leerlingMenuItems']>;

    ngOnInit(): void {
        const menuGroep$ = match(this.input)
            .with({ type: 'Lesgroep' }, (input) => this.notitieboekDataService.notitieboekMenuLesgroepLeerlingen(input.groepId))
            .with({ type: 'Stamgroep' }, (input) => this.notitieboekDataService.notitieboekMenuStamgroepLeerlingen(input.groepId))
            .with({ type: 'Individueel' }, () => this.notitieboekDataService.notitieboekMenuIndividueleMentorLeerlingen())
            .exhaustive();

        this.leerlingMenuItems$ = combineLatest([this.searchControl.valueChanges.pipe(startWith('')), menuGroep$]).pipe(
            map(([search, menuGroep]) =>
                menuGroep.leerlingMenuItems
                    .filter((item) => item.leerling.id !== this.route.snapshot.queryParams.leerling)
                    .filter((item) => getVolledigeNaam(item.leerling).toLowerCase().includes(search.trim().toLowerCase()))
            )
        );
    }

    mayClose(): boolean {
        return true;
    }
}
