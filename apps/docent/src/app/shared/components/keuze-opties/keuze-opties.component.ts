import { ChangeDetectionStrategy, Component, Input, OnInit, output } from '@angular/core';
import { SwitchComponent, SwitchGroupComponent } from 'harmony';
import { FormDropdownComponent } from '../../../rooster-shared/components/form-dropdown/form-dropdown.component';
import { DropDownOption } from '../../../rooster-shared/utils/dropdown.util';

export interface KeuzeOptie {
    text: string;
    onClickFn: () => void;
}

@Component({
    selector: 'dt-keuze-opties',
    templateUrl: './keuze-opties.component.html',
    styleUrls: ['./keuze-opties.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FormDropdownComponent, SwitchComponent, SwitchGroupComponent]
})
export class KeuzeOptiesComponent<T> implements OnInit {
    @Input() textproperty: string;
    @Input() opties: T[] = [];
    @Input() selectedOptie: T;
    @Input() isHoofdNavigatie: boolean;
    @Input() verbergDropdownVanafAantalItems: number;
    @Input() selectBoxHeight: number;

    onselect = output<T>();

    dropdownOpties: DropDownOption<T>[];

    ngOnInit() {
        this.dropdownOpties = this.opties.map((optie) => ({
            value: optie,
            text: (<any>optie)[this.textproperty]
        }));
    }

    onClick(optie: T) {
        this.onselect.emit(optie);
    }

    isSelected(optie: T): boolean {
        return optie === this.selectedOptie;
    }

    get verbergDropdown(): boolean {
        if (this.verbergDropdownVanafAantalItems) {
            return this.opties.length >= this.verbergDropdownVanafAantalItems;
        }

        return false;
    }
}
