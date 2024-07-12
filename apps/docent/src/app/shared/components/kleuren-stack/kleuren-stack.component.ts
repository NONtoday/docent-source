import { NgStyle, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { HarmonyColor } from '../../../rooster-shared/colors';
import { TooltipDirective, TooltipPosition } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../rooster-shared/utils/utils';
import { KleurenStackNgstylePipe } from './kleuren-stack-ngstyle.pipe';
import { KleurenStackOverigeRightPipe } from './kleuren-stack-overige-right.pipe';

export interface KleurenStackElement {
    kleur: HarmonyColor;
    border: HarmonyColor;
    content?: string;
}

export const KLEUREN_STACK_HORIZONTAL_PADDING = 4;

@Component({
    selector: 'dt-kleuren-stack',
    templateUrl: './kleuren-stack.component.html',
    styleUrls: ['./kleuren-stack.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, NgStyle, SlicePipe, KleurenStackOverigeRightPipe, KleurenStackNgstylePipe, IconDirective],
    providers: [provideIcons(IconToevoegen)]
})
export class KleurenStackComponent implements OnChanges {
    @HostBinding('style.width.px') width: number;

    @Input() showBackground = false;
    @Input() kleuren: Optional<KleurenStackElement[]>;
    @Input() maxGetoondeKleuren = 4;
    @Input() nummerKleur: number;
    @Input() displayTooltip = true;
    @Input() tooltipPosition: TooltipPosition = 'top';
    @Input() showBorder = false;

    public tooltip: Optional<string>;

    ngOnChanges() {
        this.width = this.getWidth();
        this.tooltip = this.kleuren
            ?.map(
                (kleurContent) =>
                    `<div style="height: 12px; width: 12px; border-radius: 50%; background-color: ${kleurContent.kleur};
            border: 1px solid ${kleurContent.border}; display: inline-block; margin-right: 8px"></div>
        <span>${kleurContent.content}</span>`
            )
            .join('<br>');
    }

    getWidth = () => {
        const aantalKleuren = this.kleuren?.length ?? 0;
        const aantalGetoond = aantalKleuren > this.maxGetoondeKleuren ? this.maxGetoondeKleuren + 1 : aantalKleuren;
        // Bolletjes zijn 16 px dus voor de eerste nog + 8
        return aantalGetoond * 8 + 8 + KLEUREN_STACK_HORIZONTAL_PADDING;
    };
}
