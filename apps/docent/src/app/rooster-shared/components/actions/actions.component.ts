import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, output } from '@angular/core';
import { chunk } from 'lodash-es';
import { ActionButton } from '../../../rooster-shared/components/actions-popup/actions-popup.component';
import { LinkComponent } from '../link/link.component';
import { OutlineButtonComponent } from '../outline-button/outline-button.component';
import { VerwijderButtonComponent } from '../verwijder-button/verwijder-button.component';

@Component({
    selector: 'dt-actions',
    templateUrl: './actions.component.html',
    styleUrls: ['./actions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [VerwijderButtonComponent, OutlineButtonComponent, NgClass, LinkComponent, AsyncPipe]
})
export class ActionsComponent implements OnChanges {
    @Input() actions: ActionButton[] = [];
    @Input() alignLeft: boolean;
    @Input() buttonsBeforeDivider: number;

    onActionClicked = output<void>();

    // Voor nu max 2 lijsten waartussen de divider wordt geplaatst
    buttons: ActionButton[][];

    ngOnChanges() {
        this.buttons = chunk(this.actions ?? [], this.buttonsBeforeDivider ?? this.actions?.length ?? 1);
    }
}
