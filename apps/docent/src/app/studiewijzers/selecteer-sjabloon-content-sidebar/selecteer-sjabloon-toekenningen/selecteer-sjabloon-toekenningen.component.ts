import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Sjabloon, SjabloonViewQuery, WeekToekenning } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconChevronOnder, provideIcons } from 'harmony-icons';
import { uniq } from 'lodash-es';
import { Subject } from 'rxjs';
import { debounceTime, map, startWith, takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SelectableItemComponent } from '../../../shared-studiewijzer-les/selectable-item/selectable-item.component';
import { SjabloonDataService } from '../../sjabloon-data.service';

@Component({
    selector: 'dt-selecteer-sjabloon-toekenningen',
    templateUrl: './selecteer-sjabloon-toekenningen.component.html',
    styleUrls: ['./selecteer-sjabloon-toekenningen.component.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SelectableItemComponent, OutlineButtonComponent, ButtonComponent, SpinnerComponent, IconDirective],
    providers: [provideIcons(IconChevronOnder)]
})
export class SelecteerSjabloonToekenningenComponent implements OnInit, OnDestroy {
    private sjabloonDataService = inject(SjabloonDataService);
    private changeDetector = inject(ChangeDetectorRef);
    @Input() sjabloon: Sjabloon;

    onToevoegen = output<string[]>();

    toekenningenFormGroup: UntypedFormGroup;
    sjabloonWeken: SjabloonViewQuery['sjabloonView']['weken'];
    amountSelected: number;

    private openWeken: number[] = [];
    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.toekenningenFormGroup = new UntypedFormGroup({});

        this.sjabloonDataService
            .getSjabloonView(this.sjabloon.id)
            .pipe(
                map((sjabloonView) => sjabloonView.weken),
                takeUntil(this.destroy$)
            )
            .subscribe((sjabloonWeken) => {
                this.openWeken = sjabloonWeken.map((week) => week.weeknummer);
                this.sjabloonWeken = sjabloonWeken;
                this.changeDetector.markForCheck();
            });

        this.toekenningenFormGroup.valueChanges
            .pipe(
                debounceTime(20),
                map(() => this.getSelectedToekenningen().length),
                startWith(0),
                takeUntil(this.destroy$)
            )
            .subscribe((amount) => {
                this.amountSelected = amount;
                this.changeDetector.detectChanges();
            });
    }

    onFormSubmit() {
        this.onToevoegen.emit(this.getSelectedToekenningen());
    }

    deselectAll() {
        this.toekenningenFormGroup.reset(false);
    }

    isWeekOpen(weeknummer: number) {
        return this.openWeken.some((w: number) => w === weeknummer);
    }

    toggleToekenningenTonenVoorWeek(weeknummer: number) {
        if (this.isWeekOpen(weeknummer)) {
            this.sluitWeek(weeknummer);
        } else {
            this.openWeek(weeknummer);
        }
    }

    sluitWeek(weeknummer: number) {
        this.openWeken = this.openWeken.filter((w: number) => w !== weeknummer);
        this.changeDetector.markForCheck();
    }

    openWeek(weeknummer: number) {
        if (!this.isWeekOpen(weeknummer)) {
            this.openWeken.push(weeknummer);
            this.changeDetector.markForCheck();
        }
    }

    public openWeekBijhorendeToekenning({ id, isStart }: { id: string; isStart: boolean }) {
        const isBijhorendeToekenning = (toekenning: WeekToekenning) =>
            toekenning.id === id && toekenning.isStartInleverperiode === !isStart;

        const weekMetBijhorendeToekenning = this.sjabloonWeken.find((week) =>
            (<WeekToekenning[]>week.toekenningen).some(isBijhorendeToekenning)
        );
        if (weekMetBijhorendeToekenning && !this.isWeekOpen(weekMetBijhorendeToekenning.weeknummer)) {
            this.openWeek(weekMetBijhorendeToekenning.weeknummer);
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private getSelectedToekenningen() {
        const removeInleveropdrachtSuffix = (controlId: string) =>
            controlId.endsWith(':0') || controlId.endsWith(':1') ? controlId.slice(0, -2) : controlId;
        const isGeselecteerd = (controlId: string) => this.toekenningenFormGroup.value[controlId];

        return uniq(Object.keys(this.toekenningenFormGroup.value).filter(isGeselecteerd).map(removeInleveropdrachtSuffix));
    }
}
