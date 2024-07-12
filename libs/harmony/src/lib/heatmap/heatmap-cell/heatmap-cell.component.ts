import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge } from 'rxjs';
import { match } from 'ts-pattern';
import { CssColorVar, toCssVar } from '../../css-var-pipe/css-var.pipe';
import { BgColorToken } from '../../tokens/on-color-token';
import { HeatmapCell } from '../heatmap.component';

@Component({
    selector: 'hmy-heatmap-cell',
    standalone: true,
    template: `&nbsp;`,
    styleUrls: ['./heatmap-cell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeatmapCellComponent<T> implements OnChanges {
    @Input({ required: true }) cell: HeatmapCell<T>;
    @HostBinding('style.opacity') opacity = 0.1;
    @HostBinding('style.background-color') bgColor: CssColorVar<BgColorToken> = toCssVar('bg-neutral-max');

    elementRef = inject(ElementRef);

    // omdat we een hostbinding willen aanpassen via de changeDetectorRef, moeten we de ChangeDetectorRef van de host/parent hebben.
    // Door onze eigen te skippen krijgen we die van de parent.
    // kan weer weg wanneer hostbindings met signals overweg kunnen.
    changeDetectorRef = inject(ChangeDetectorRef, { skipSelf: true });

    constructor() {
        const mouseEnter$ = fromEvent(this.elementRef.nativeElement, 'mouseenter');
        const mouseLeave$ = fromEvent(this.elementRef.nativeElement, 'mouseleave');
        const touchStart$ = fromEvent(this.elementRef.nativeElement, 'touchstart');
        const touchEnd$ = fromEvent(this.elementRef.nativeElement, 'touchend');
        merge(mouseEnter$, touchStart$).pipe(takeUntilDestroyed()).subscribe(this.addOpacity);
        merge(mouseLeave$, touchEnd$).pipe(takeUntilDestroyed()).subscribe(this.removeOpacity);
    }

    ngOnChanges() {
        this.opacity = match(this.cell.sortering)
            .with(0, () => INTENSITY_HIGHEST)
            .with(1, () => INTENSITY_HIGH)
            .with(2, () => INTENSITY_MEDIUM)
            .with(3, () => INTENSITY_LOW)
            .with(4, () => INTENSITY_LOWEST)
            .otherwise(() => INTENSITY_NONE);

        this.bgColor = match(this.cell.sortering)
            .returnType<CssColorVar<BgColorToken>>()
            .with(0, 1, 2, 3, 4, () => toCssVar('bg-primary-normal'))
            .otherwise(() => toCssVar('bg-neutral-max'));
    }

    addOpacity = () => {
        this.opacity += 0.15;
        this.changeDetectorRef.markForCheck();
    };
    removeOpacity = () => {
        this.opacity -= 0.15;
        this.changeDetectorRef.markForCheck();
    };
}

const INTENSITY_HIGHEST = 0.85;
const INTENSITY_HIGH = 0.7;
const INTENSITY_MEDIUM = 0.5;
const INTENSITY_LOW = 0.3;
const INTENSITY_LOWEST = 0.15;
const INTENSITY_NONE = 0.1;
