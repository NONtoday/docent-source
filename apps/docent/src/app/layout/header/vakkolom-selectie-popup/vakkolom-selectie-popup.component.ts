import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { VakKolom } from '../../../core/models/mentordashboard.model';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-vakkolom-selectie-popup',
    templateUrl: './vakkolom-selectie-popup.component.html',
    styleUrls: ['./vakkolom-selectie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent]
})
export class VakKolomSelectiePopupComponent implements AfterViewInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChildren('item', { read: ElementRef }) items: QueryList<ElementRef>;

    currentItemId: Optional<string>;
    kolommen: VakKolom[];

    onKolomSelectie: (index: number) => void;

    ngAfterViewInit(): void {
        const elementId = `header-item-${this.currentItemId}`;
        const item = this.items.find((item) => item.nativeElement.id === elementId);
        item?.nativeElement.scrollIntoView({
            behavior: 'auto',
            block: 'center'
        });
    }

    mayClose(): boolean {
        return true;
    }
}
