import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild, inject } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective, IconPillComponent, SpinnerComponent, TooltipDirective } from 'harmony';
import { IconKlok, IconLesplanning, provideIcons } from 'harmony-icons';
import { Afspraak, HuiswerkType } from '../../../../../generated/_types';
import { StudiewijzeritemPreview } from '../../../../core/models/studiewijzers/shared.model';
import { DeviceService } from '../../../../core/services/device.service';
import { LesplanningDataService } from '../../../../les/lesplanning/lesplanning-data.service';
import * as HarmonyColors from '../../../colors';
import { AfspraakTitelPipe } from '../../../pipes/afspraak-titel.pipe';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { HuiswerkTypeColorPipe } from '../../../pipes/huiswerk-type-color.pipe';
import { HuiswerkTypeIconPipe } from '../../../pipes/huiswerk-type-icon.pipe';
import { HuiswerkTypeTitelPipe } from '../../../pipes/huiswerk-type-titel.pipe';
import { RoosterToetsPipe } from '../../../pipes/roostertoets.pipe';
import { Optional } from '../../../utils/utils';
import { BackgroundIconComponent } from '../../background-icon/background-icon.component';
import { LesuurComponent } from '../../lesuur/lesuur.component';
import { LinkComponent } from '../../link/link.component';
import { OutlineButtonComponent } from '../../outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../popup/popup.component';

@Component({
    selector: 'dt-lesplanning-preview-popup',
    templateUrl: './lesplanning-preview-popup.component.html',
    styleUrls: ['./lesplanning-preview-popup.component.scss', './../../../scss/bullet.list.view.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        NgStyle,
        BackgroundIconComponent,
        LesuurComponent,
        TooltipDirective,
        LinkComponent,
        RouterLink,
        OutlineButtonComponent,
        SpinnerComponent,
        DtDatePipe,
        HuiswerkTypeTitelPipe,
        HuiswerkTypeColorPipe,
        HuiswerkTypeIconPipe,
        AfspraakTitelPipe,
        RoosterToetsPipe,
        IconDirective,
        IconPillComponent
    ],
    providers: [provideIcons(IconKlok, IconLesplanning)]
})
export class LesplanningPreviewPopupComponent implements AfterViewInit, OnDestroy, Popup {
    private lesplanningDataService = inject(LesplanningDataService);
    private deviceService = inject(DeviceService);
    private renderer = inject(Renderer2);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('content', { read: ElementRef, static: true }) contentRef: ElementRef;
    @ViewChild('previewContainer', { read: ElementRef }) previewContainer: ElementRef;

    afspraak: Afspraak;
    huiswerkType: HuiswerkType;
    roosterPreviews: Optional<StudiewijzeritemPreview[]>;
    moetOverflowGradientTonen = false;
    canScrollUp = false;
    canScrollDown = false;
    harmonyColors = HarmonyColors;

    private unsubscribe$ = new Subject<void>();

    ngAfterViewInit() {
        this.lesplanningDataService
            .getRoosterPreview(this.afspraak.id, this.afspraak.begin, this.afspraak.eind, this.huiswerkType)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((roosterPreviews) => {
                this.roosterPreviews = roosterPreviews;

                // De setTimeout is nodig zodat er een drawcycle gewacht wordt en de ngIf in de html gewoon blijft werken
                setTimeout(() => {
                    if (this.deviceService.isDesktop()) {
                        this.moetOverflowGradientTonen =
                            this.previewContainer &&
                            this.previewContainer.nativeElement.scrollHeight > this.previewContainer.nativeElement.clientHeight;
                    } else {
                        if (this.deviceService.isPhone()) {
                            this.renderer.setStyle(this.previewContainer.nativeElement, 'max-height', `${window.innerHeight - 225}px`);
                        }

                        this.updateScrollValues();
                    }
                });
            });

        if (this.deviceService.isDesktop()) {
            fromEvent(this.contentRef.nativeElement, 'mouseleave')
                .pipe(take(1))
                .subscribe(() => {
                    this.popup.onClose();
                });
        }
    }

    updateScrollValues() {
        const element = this.previewContainer.nativeElement;

        if (element.scrollHeight > element.clientHeight) {
            this.canScrollUp = element.scrollTop > 0;
            this.canScrollDown = element.scrollHeight - element.scrollTop > element.clientHeight;
        }
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    mayClose(): boolean {
        return true;
    }

    onCancelClick(): void {
        this.popup.onClose();
    }
}
