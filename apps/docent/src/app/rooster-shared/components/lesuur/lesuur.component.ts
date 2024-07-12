import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { PillComponent, PillTagColor, TooltipDirective } from 'harmony';
import { Optional } from '../../utils/utils';

@Component({
    selector: 'dt-lesuur',
    templateUrl: './lesuur.component.html',
    styleUrls: ['./lesuur.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [PillComponent]
})
export class LesuurComponent implements OnChanges {
    private tooltipDirective = inject(TooltipDirective, { optional: true });
    @Input() beginlesuur: Optional<number>;
    @Input() eindlesuur: Optional<number>;
    @Input() presentieVerwerkt = false;
    @Input() isNu: Optional<boolean> = false;
    @Input() isKwt = false;
    @Input() isRoosterToets = false;

    isBlokuur: boolean;

    public lesuurHasTooltip: boolean;
    public lesuurText: string;
    public lesuurColor: PillTagColor;

    ngOnChanges(): void {
        this.isBlokuur = this.eindlesuur !== undefined && this.eindlesuur !== null && this.beginlesuur !== this.eindlesuur;
        this.lesuurText = this.determineLesuurText();
        this.lesuurColor = this.determineLesuurColor();
        this.lesuurHasTooltip = !!this.tooltipDirective && this.tooltipDirective.isDisplayable();
    }

    private determineLesuurText(): string {
        if (this.isKwt) {
            return 'kwt';
        }
        if (this.isRoosterToets) {
            return 'toets';
        }
        if (this.beginlesuur !== undefined && this.beginlesuur !== null) {
            if (this.isBlokuur) {
                return `${this.beginlesuur}e ${this.eindlesuur}e`;
            }
            return `${this.beginlesuur}e`;
        }
        return 'les';
    }

    private determineLesuurColor(): PillTagColor {
        if (this.isRoosterToets) {
            return 'warning';
        } else if (this.isNu) {
            return 'primary';
        } else return 'primary-strong';
    }
}
