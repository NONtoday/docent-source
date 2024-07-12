import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconChevronOnder, provideIcons } from 'harmony-icons';
import { difference } from 'lodash-es';
import { Subject, fromEvent, of } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { QueriedWerkdrukLeerlingen, QueriedWerkdrukStudiewijzerItem } from '../../../../core/models/werkdruk.model';
import { PopupService } from '../../../../core/popup/popup.service';
import { LeerlingenPopupComponent } from '../../../../shared/components/leerlingen-popup/leerlingen-popup.component';
import { StudiewijzeritemOmschrijvingPipe } from '../../../../shared/pipes/studiewijzeritem-omschrijving.pipe';
import { WerkdrukitemDocentLesgroepPipe } from '../../../../shared/pipes/werkdrukitem-docent-lesgroep.pipe';
import { DtDatePipe } from '../../../pipes/dt-date.pipe';
import { StudiewijzeritemTitelPipe } from '../../../pipes/studiewijzeritem-titel.pipe';

@Component({
    selector: 'dt-werkdruk-detail-item',
    templateUrl: './werkdruk-detail-item.component.html',
    styleUrls: ['./werkdruk-detail-item.component.scss', '../../../scss/bullet.list.view.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [StudiewijzeritemTitelPipe, StudiewijzeritemOmschrijvingPipe, DtDatePipe, WerkdrukitemDocentLesgroepPipe, IconDirective],
    providers: [provideIcons(IconChevronOnder)]
})
export class WerkdrukDetailItemComponent implements OnChanges, AfterViewInit {
    private popupService = inject(PopupService);
    @ViewChild('leerlingen', { read: ViewContainerRef }) leerlingenRef: ViewContainerRef;

    @Input() werkdrukStudiewijzeritem: QueriedWerkdrukStudiewijzerItem;
    @Input() leerlingen: QueriedWerkdrukLeerlingen = [];

    public aantalTekst: string;

    public expanded = false;

    private mouseLeaveSubject = new Subject<void>();

    ngOnChanges(): void {
        const leerlingen = this.werkdrukStudiewijzeritem.leerlingUuids;
        const lesgroepenUuids = this.leerlingen.map((leerling) => leerling.uuid);
        const nietIedereen = difference(lesgroepenUuids, leerlingen).length > 0;

        this.aantalTekst = nietIedereen ? `${leerlingen.length} leerling${leerlingen.length > 1 ? 'en' : ''}` : 'Iedereen';
    }

    openLeerlingenPopup(event?: Event) {
        if (!this.popupService.isPopupOpen() && this.aantalTekst !== 'Iedereen') {
            const leerlingen = this.leerlingen.filter((leerling) => this.werkdrukStudiewijzeritem.leerlingUuids.includes(leerling.uuid));

            const popup = this.popupService.popup(
                this.leerlingenRef,
                LeerlingenPopupComponent.defaultPopupSettings,
                LeerlingenPopupComponent
            );
            popup.leerlingen$ = of(leerlingen);
        }

        // om het openen/sluiten van de header te voorkomen
        event?.stopPropagation();
    }

    ngAfterViewInit(): void {
        this.initLeerlingHover();
        this.initLeerlingHoverExit();
    }

    private initLeerlingHover() {
        fromEvent(this.leerlingenRef.element.nativeElement, 'mouseenter')
            .pipe(debounceTime(300), takeUntil(fromEvent(this.leerlingenRef.element.nativeElement, 'mouseleave')))
            .subscribe(() => {
                this.openLeerlingenPopup();
            });
    }

    private initLeerlingHoverExit() {
        fromEvent(this.leerlingenRef.element.nativeElement, 'mouseleave').subscribe((event: MouseEvent) => {
            if (this.popupService.isPopupOpenFor(this.leerlingenRef)) {
                const popup = document.getElementsByClassName('leerlingen-popup')[0];

                const viewRect = this.leerlingenRef.element.nativeElement.getBoundingClientRect();
                if (popup && viewRect) {
                    this.mouseCloserToPopupHandler(popup, this.leerlingenRef, event);
                } else {
                    this.popupService.closePopUp();
                }
            }
            this.initLeerlingHover();
        });
    }

    private mouseCloserToPopupHandler(popup: Element, viewContainerRef: ViewContainerRef, event: MouseEvent) {
        const popupRect = popup.getBoundingClientRect();
        if (this.isCloser(viewContainerRef, popupRect, event)) {
            fromEvent(document, 'mousemove')
                .pipe(takeUntil(this.mouseLeaveSubject))
                .subscribe((e: MouseEvent) => {
                    if (!this.isCloser(viewContainerRef, popupRect, e)) {
                        this.popupService.closePopUp();
                        this.mouseLeaveSubject.next();
                    }
                });
        } else {
            this.popupService.closePopUp();
        }
    }

    private isCloser(viewContainerRef: ViewContainerRef, popupRect: ClientRect, event: MouseEvent): boolean {
        const viewRect = viewContainerRef.element.nativeElement.getBoundingClientRect();
        if (!popupRect) {
            return false;
        }

        if (event.clientY < popupRect.top || event.clientY > popupRect.bottom) {
            return false;
        }

        // Popup links van het element
        if (popupRect.left < viewRect.left) {
            if (event.clientX <= popupRect.right) {
                return event.clientX >= popupRect.left;
            }
            return event.clientX <= viewRect.right && event.clientX > popupRect.right;
        } else {
            /* Popup rechts van het element */
            if (event.clientX >= popupRect.left) {
                return event.clientX <= popupRect.right;
            }
            return event.clientX >= viewRect.left && event.clientX < popupRect.left;
        }
    }

    toggleDetails(): void {
        this.expanded = !this.expanded;
    }
}
