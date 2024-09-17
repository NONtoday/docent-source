import { NgClass } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LeerlingSignaleringenFragment } from '@docent/codegen';
import { getVolledigeNaam } from '@shared/utils/persoon-utils';
import { IconDirective } from 'harmony';
import { IconSluiten, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../../../rooster-shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../../../rooster-shared/components/button/button.component';
import { LesuurComponent } from '../../../../rooster-shared/components/lesuur/lesuur.component';
import { Popup, PopupComponent } from '../../../../rooster-shared/components/popup/popup.component';
import { DtDatePipe } from '../../../../rooster-shared/pipes/dt-date.pipe';

@Component({
    selector: 'dt-signalering-afspraken-popup',
    templateUrl: './signalering-afspraken-popup.component.html',
    styleUrls: ['./signalering-afspraken-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, NgClass, AvatarComponent, LesuurComponent, ButtonComponent, DtDatePipe, IconDirective],
    providers: [provideIcons(IconSluiten)]
})
export class SignaleringAfsprakenPopupComponent implements Popup, AfterViewInit {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('afspraakContainer', { read: ElementRef, static: true }) afspraakContainerRef: ElementRef;

    // Properties gevuld via de PopupService
    titel: string;
    signalering: LeerlingSignaleringenFragment;

    canScrollUp = false;
    canScrollDown = false;

    ngAfterViewInit() {
        setTimeout(() => this.onScroll());
    }

    mayClose(): boolean {
        return true;
    }

    get leerlingNaam() {
        return getVolledigeNaam(this.signalering.leerling);
    }

    onScroll() {
        const element = this.afspraakContainerRef.nativeElement;
        if (element.scrollHeight > element.clientHeight) {
            this.canScrollUp = element.scrollTop > 0;
            this.canScrollDown = element.scrollHeight - Math.round(element.scrollTop) > element.clientHeight;
        }
    }
}
