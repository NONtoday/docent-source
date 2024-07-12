import { NgClass } from '@angular/common';
import { Component, ElementRef, HostBinding, Input, OnChanges, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { isSameDay, isToday, isYesterday } from 'date-fns';
import { IconDirective } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { RoosterItem, VRoosterDag, isAfspraak } from '../../core/models';
import { DeviceService } from '../../core/services/device.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AfspraakSidebarComponent, NieuweAfspraak } from '../../rooster-shared/components/afspraak-sidebar/afspraak-sidebar.component';
import { EigenAfspraakComponent } from '../../rooster-shared/components/rooster-afspraak/eigen-afspraak/eigen-afspraak.component';
import { LesuurAfspraakComponent } from '../../rooster-shared/components/rooster-afspraak/lesuur-afspraak/lesuur-afspraak.component';
import { RoosterDagHeaderComponent } from '../rooster-dag-header/rooster-dag-header.component';
import { VrijUurComponent } from '../vrij-uur/vrij-uur.component';

@Component({
    selector: 'dt-rooster-dag',
    templateUrl: './rooster-dag.component.html',
    styleUrls: ['./rooster-dag.component.scss'],
    standalone: true,
    imports: [RoosterDagHeaderComponent, LesuurAfspraakComponent, EigenAfspraakComponent, VrijUurComponent, NgClass, IconDirective],
    providers: [provideIcons(IconToevoegen)]
})
export class RoosterDagComponent implements OnInit, OnChanges {
    private element = inject(ElementRef);
    private deviceService = inject(DeviceService);
    public sidebarService = inject(SidebarService);
    @Input() dag: VRoosterDag;
    @Input() currentDateInView: Date;
    @Input() toonVrijeUren: boolean;

    @ViewChild('addIcon', { read: ViewContainerRef, static: true }) addIcon: ViewContainerRef;
    @HostBinding('class.vandaag') vandaag: boolean;
    @HostBinding('class.gisteren') gisteren: boolean;
    @HostBinding('class.current-day-view') currentDay: boolean;

    public isPopupOpen = false;
    public heeftGeenRoosteritems: boolean;

    ngOnInit(): void {
        this.vandaag = this.isVandaag();
        this.gisteren = this.isGisteren();
        this.currentDay = this.isCurrentDayInView();
        this.heeftGeenRoosteritems = this.dag.roosterItems.length === 0;
    }

    ngOnChanges(): void {
        this.currentDay = this.isCurrentDayInView();
    }

    onPopUpClose = () => {
        this.isPopupOpen = false;
    };

    scrollTo(behavior: ScrollBehavior = 'smooth') {
        const dagFrame = this.element.nativeElement.getBoundingClientRect();
        const headerFrame = document.getElementsByTagName('dt-header')[0].getBoundingClientRect();
        const offset = this.deviceService.isPhone() ? headerFrame.height : 0;

        window.scrollTo({
            top: window.scrollY + Number(dagFrame.top) + -offset,
            behavior
        });
    }

    addAfspraak(): void {
        const afspraak: NieuweAfspraak = {
            begin: this.dag.datum,
            participantenEigenAfspraak: [],
            bijlagen: []
        };
        this.sidebarService.openSidebar(AfspraakSidebarComponent, { afspraak, bewerkenState: true });
    }

    trackById(index: number, item: RoosterItem) {
        return 'id' in item ? item.id : item;
    }

    private isVandaag = () => isToday(this.dag.datum);
    private isGisteren = () => isYesterday(this.dag.datum);

    private isCurrentDayInView = () => isSameDay(this.dag.datum, this.currentDateInView);

    isAfspraakVoorVrijUur(index: number) {
        const items = this.dag.roosterItems;
        const nextIndex = index + 1;
        return this.toonVrijeUren && nextIndex < items.length && !isAfspraak(items[nextIndex]);
    }
}
