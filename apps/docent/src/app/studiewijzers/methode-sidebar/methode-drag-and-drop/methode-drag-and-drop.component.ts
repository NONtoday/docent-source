import { CdkDrag, CdkDragPlaceholder, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { inject } from '@angular/core';

import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { Router } from '@angular/router';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconChevronBoven, IconDraggable, provideIcons } from 'harmony-icons';
import { partial } from 'lodash-es';
import { HuiswerkType, Methode, MethodeSubHoofdstuk, Toekenning } from '../../../../generated/_types';
import { MethodeSelectie } from '../../../core/models/studiewijzers/methode.model';
import { Optional } from '../../../rooster-shared/utils/utils';
import { SaveToekenningenCallback } from '../methode-sidebar.component';

@Component({
    selector: 'dt-methode-drag-and-drop',
    templateUrl: './methode-drag-and-drop.component.html',
    styleUrls: ['./methode-drag-and-drop.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragPreview, IconDirective],
    providers: [provideIcons(IconChevronBoven, IconDraggable)]
})
export class MethodeDragAndDropComponent {
    public router = inject(Router);
    @Input() methode: Methode;
    @Input() saveToekenningenFn: (selecties: MethodeSelectie[], createToekenningFn: (type: HuiswerkType) => Toekenning) => void;

    public closedHoofdstukken: { [key: string]: boolean } = {};

    onDragStart = output<void>();
    onDragEnd = output<void>();

    dragEnd() {
        this.onDragEnd.emit();
        (window as any)['dataLayer'] = (window as any)['dataLayer'] || [];
        (window as any)['dataLayer'].push({
            event: 'methode-dragend'
        });
    }

    toggleHoofdstuk = (hoofdstukId: string) => (this.closedHoofdstukken[hoofdstukId] = !this.closedHoofdstukken[hoofdstukId]);
    createDragAndDropCallback = (subHoofdstuk: MethodeSubHoofdstuk, hoofdstukNaam: Optional<string>): SaveToekenningenCallback =>
        partial(this.saveToekenningenFn, [{ subHoofdstuk, hoofdstukNaam }]);
}
