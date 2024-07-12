import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BorderToken, CssVarPipe, OnColorToken } from 'harmony';
import { match } from 'ts-pattern';
import { Optional } from '../../../../rooster-shared/utils/utils';
import { CommaResultPipe } from '../../../../shared/pipes/comma-result.pipe';
import { LeerlingoverzichtResultatenCijferBalk } from '../../leerlingoverzicht.model';

@Component({
    selector: 'dt-leerlingoverzicht-resultaten-cijferbalk',
    standalone: true,
    imports: [CssVarPipe, CommaResultPipe, CommonModule],
    templateUrl: './leerlingoverzicht-resultaten-cijferbalk.component.html',
    styleUrl: './leerlingoverzicht-resultaten-cijferbalk.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingoverzichtResultatenCijferbalkComponent {
    private readonly scaleXMinimum = 0.15;
    private readonly borderXMinimum = 85;
    private readonly cijferLabelHoogte = 4;
    private readonly translateXMinimum = 95;
    private readonly geenCijferTranslateXMinimum = 98;
    private readonly ontheffingTranslateXMinimum = 93;
    private readonly vrijstellingTranslateXMinimum = 96;

    label = input<Optional<string>>();
    isFirst = input.required<boolean>();
    isLast = input.required<boolean>();

    vrijstelling = input.required<boolean>();
    ontheffing = input.required<boolean>();
    cijfer = input.required<Optional<number>>();
    vergelijking = input.required<Optional<number>>();
    color = input.required<LeerlingoverzichtResultatenCijferBalk['color']>();

    validCijfer = computed(() => !this.vrijstelling() && !this.ontheffing() && this.cijfer() !== null);

    height = computed(() => {
        const cijfer = this.cijfer();
        return this.validCijfer() && cijfer ? cijfer / 10 : 0;
    });
    scaleX = computed(() => 'scaleX(' + Math.max(this.height(), this.scaleXMinimum) + ')');

    translateBorderX = computed(() => {
        const cijfer = this.cijfer();
        const translateX = this.validCijfer() && cijfer ? -Math.min(100 - cijfer * 10, this.borderXMinimum) : -this.borderXMinimum;
        return 'translateX(' + translateX + '%)';
    });

    translateVergelijkingX = computed(() => {
        const vergelijking = this.vergelijking();
        const translateX = vergelijking ? 100 - vergelijking * 10 : 0;
        return 'translateX(' + translateX + '%)';
    });

    borderheight = computed(() => {
        const cijfer = this.cijfer();
        return this.validCijfer() && cijfer ? 100 - cijfer * 10 : 100;
    });

    translateBorderHeight = computed(() => 'translateY(' + this.borderheight() + '%)');

    vergelijkingHeight = computed(() => {
        const vergelijking = this.vergelijking();
        const translateY = vergelijking ? 100 - vergelijking * 10 : 0;
        return 'translateY(' + translateY + '%)';
    });

    translateY = computed(() => {
        const cijfer = this.cijfer();
        const translateY = this.validCijfer() && cijfer ? 100 - cijfer * 10 + (cijfer * 10) / 2 - this.cijferLabelHoogte : 50;
        return 'translateY(' + translateY + '%)';
    });

    translateX = computed(() => {
        const cijfer = this.cijfer();
        // De Math.min zorgt ervoor dat een 1.2 ook nog in de balk past
        const translateX =
            this.validCijfer() && cijfer
                ? -Math.min(100 - cijfer * 10 + (cijfer * 10) / 2 + this.cijferLabelHoogte, this.translateXMinimum)
                : -this.geenCijferTranslateXMin();
        return 'translateX(' + translateX + '%)';
    });

    geenCijferTranslateXMin = computed(() => {
        if (this.ontheffing()) return this.ontheffingTranslateXMinimum;
        if (this.vrijstelling()) return this.vrijstellingTranslateXMinimum;
        return this.geenCijferTranslateXMinimum;
    });

    fgColor = computed(() =>
        this.validCijfer()
            ? match(this.color())
                  .returnType<OnColorToken>()
                  .with('neutral', () => 'fg-on-neutral-weak')
                  .with('positive', () => 'fg-on-positive-weak')
                  .with('negative', () => 'fg-on-negative-weak')
                  .with('warning', () => 'fg-on-warning-weak')
                  .exhaustive()
            : 'disabled-fg'
    );
    hoverBorder = computed(() =>
        this.validCijfer()
            ? match(this.color())
                  .returnType<BorderToken>()
                  .with('neutral', () => 'thinnest-solid-neutral-strong')
                  .with('positive', () => 'thinnest-solid-positive-strong')
                  .with('negative', () => 'thinnest-solid-negative-strong')
                  .with('warning', () => 'thinnest-solid-warning-strong')
                  .exhaustive()
            : 'thinnest-solid-neutral-strong'
    );
}
