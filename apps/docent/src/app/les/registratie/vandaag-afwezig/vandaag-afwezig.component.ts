import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { LeerlingRegistratie, LesRegistratieQuery } from '@docent/codegen';
import { Observable, map, startWith } from 'rxjs';
import { IdObject } from '../../../core/models/shared.model';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { DeviceService, phoneQuery, tabletPortraitQuery, tabletQuery } from '../../../core/services/device.service';
import { AccordionComponent } from '../../../shared/components/accordion/accordion.component';
import { blockInitialRenderAnimation } from './../../../core/core-animations';
import { VandaagAfwezigLeerlingComponent } from './vandaag-afwezig-leerling/vandaag-afwezig-leerling.component';

@Component({
    selector: 'dt-vandaag-afwezig',
    templateUrl: './vandaag-afwezig.component.html',
    styleUrls: ['./vandaag-afwezig.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [blockInitialRenderAnimation],
    standalone: true,
    imports: [AccordionComponent, VandaagAfwezigLeerlingComponent, AsyncPipe]
})
export class VandaagAfwezigComponent implements OnInit, OnChanges {
    private ref = inject(ElementRef);
    private deviceService = inject(DeviceService);
    afwezigen: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'] = [];
    aantalAfwezig = 0;
    aantalTotaal = 0;
    afwezigenInitieelTonen = false;

    leerlingElementHeight = 50;
    leerlingElementMaxWidth = 250;
    leerlingElementGridGap = 25;

    isPhoneOrTablet$: Observable<boolean>;

    ngOnInit() {
        this.afwezigenInitieelTonen = this.deviceService.isDesktop();
        this.isPhoneOrTablet$ = this.isPhoneOrTablet$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => state.breakpoints[phoneQuery] || state.breakpoints[tabletPortraitQuery] || state.breakpoints[tabletQuery]),
            startWith(this.deviceService.isPhoneOrTablet()),
            shareReplayLastValue()
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.deviceService.isDesktop()) {
            return;
        }
        const panel = this.ref.nativeElement.querySelector('.panel');
        if (panel.className.includes('expanded')) {
            const oldAfwezig = changes.leerlingRegistraties.previousValue.filter(
                (registratie: LeerlingRegistratie) => !registratie.aanwezig
            ).length;
            const panelWidth = panel.offsetWidth - 20; // 20 pixels voor padding
            let sideBySide = Math.floor(panelWidth / (this.leerlingElementMaxWidth + this.leerlingElementGridGap));
            const leftoverPixels = panelWidth % (this.leerlingElementMaxWidth + this.leerlingElementGridGap);
            if (leftoverPixels >= this.leerlingElementMaxWidth) {
                sideBySide++;
            }

            const eersteAfwezigeToegevoegd = oldAfwezig === 0;
            const laatsteAfwezigeVerwijderd = this.aantalAfwezig === 0;
            const afwezigeToegevoegd = oldAfwezig < this.aantalAfwezig;
            const afwezigeVerwijderd = oldAfwezig > this.aantalAfwezig;
            const rowAdded = this.aantalAfwezig % sideBySide === 1;
            const rowRemoved = this.aantalAfwezig % sideBySide === 0;

            if (eersteAfwezigeToegevoegd) {
                window.scrollBy(0, 10); // "Geen afwezigen" balk is 40 px hoog
            } else if (laatsteAfwezigeVerwijderd) {
                window.scrollBy(0, -10);
            } else if (afwezigeToegevoegd) {
                if (this.shouldScrollDown(rowAdded)) {
                    window.scrollBy(0, this.leerlingElementHeight);
                }
            } else if (afwezigeVerwijderd) {
                if (this.shouldScrollUp(rowRemoved)) {
                    window.scrollBy(0, -this.leerlingElementHeight);
                }
            }
        }
    }

    private shouldScrollDown(rowAdded: boolean) {
        return this.deviceService.isPhone() || rowAdded;
    }

    private shouldScrollUp(rowRemoved: boolean) {
        return this.deviceService.isPhone() || rowRemoved;
    }

    @Input() public set leerlingRegistraties(leerlingRegistraties: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties']) {
        this.afwezigen = leerlingRegistraties.filter((registratie) => !registratie.aanwezig);
        this.aantalAfwezig = this.afwezigen.length;
        this.aantalTotaal = leerlingRegistraties.length;
    }

    trackById(index: number, item: IdObject) {
        return item.id;
    }
}
