import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { CijferPeriode, Studiewijzer } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { getISOWeek } from 'date-fns';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconChevronOnder, provideIcons } from 'harmony-icons';
import { uniq } from 'lodash-es';
import { Subject } from 'rxjs';
import { debounceTime, filter, map, startWith, takeUntil } from 'rxjs/operators';
import {
    StudiewijzerViewAfspraakToekenning,
    StudiewijzerViewDagToekenning,
    StudiewijzerViewWeekToekenning
} from '../../../core/models/studiewijzers/studiewijzer.model';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { SelectableItemComponent } from '../../../shared-studiewijzer-les/selectable-item/selectable-item.component';
import { SjabloonDataService } from '../../sjabloon-data.service';
import { StudiewijzerDataService } from '../../studiewijzer-data.service';

interface Week {
    weeknummer: number;
    periode: CijferPeriode;
    toekenningen: (StudiewijzerViewWeekToekenning | StudiewijzerViewDagToekenning | StudiewijzerViewAfspraakToekenning)[];
}

@Component({
    selector: 'dt-selecteer-content-page',
    templateUrl: './selecteer-content-page.component.html',
    styleUrls: ['./selecteer-content-page.component.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SelectableItemComponent, OutlineButtonComponent, ButtonComponent, SpinnerComponent, IconDirective],
    providers: [provideIcons(IconChevronOnder)]
})
export class SelecteerContentPageComponent implements OnInit, OnDestroy {
    private studiewijzerDataService = inject(StudiewijzerDataService);
    private changeDetector = inject(ChangeDetectorRef);
    private sjabloonDataService = inject(SjabloonDataService);
    @Input() studiewijzer: Studiewijzer;
    @Input() weeknummer: number;
    @Input() sjabloonId: string;
    closeSidebar = output<string>();

    public weken: Week[];
    toekenningenFormGroup: UntypedFormGroup;
    amountSelected: number;

    private openWeken: number[] = [];
    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.toekenningenFormGroup = new UntypedFormGroup({});

        this.studiewijzerDataService
            .getStudiewijzerView(this.studiewijzer.id)
            .pipe(
                filter((v) => !!v),
                map((view) => view.weken),
                takeUntil(this.destroy$)
            )
            .subscribe((studiewijzerWeken) => {
                this.openWeken = studiewijzerWeken.map((week) => week.weeknummer);
                this.weken = studiewijzerWeken.map((week) => {
                    const toekenningen: Week['toekenningen'] = [];
                    toekenningen.push(...week.toekenningen);
                    week.dagen.forEach((dag) => {
                        toekenningen.push(...dag.toekenningen);
                        dag.afspraken.forEach((afspraak) => toekenningen.push(...afspraak.toekenningen));
                    });

                    return {
                        weeknummer: week.weeknummer,
                        periode: week.periode!,
                        toekenningen
                    };
                });
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
                this.changeDetector.markForCheck();
            });
    }

    onFormSubmit() {
        const toekenningIds = this.getSelectedToekenningen();
        this.sjabloonDataService.kopieerToekenningenNaarSjabloon$(this.sjabloonId, this.weeknummer, toekenningIds).subscribe(() => {
            this.closeSidebar.emit('close');
        });
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

    deselectAll() {
        this.toekenningenFormGroup.reset(false);
    }

    public openWeekBijhorendeToekenning({ id, isStart }: { id: string; isStart: boolean }) {
        const isBijhorendeToekenning = (toekenning: Week['toekenningen'][number]) =>
            toekenning.id === id && toekenning.isStartInleverperiode === !isStart;

        const weekMetBijhorendeToekenning = this.weken.find((week) => week.toekenningen.some(isBijhorendeToekenning));
        if (weekMetBijhorendeToekenning && !this.isWeekOpen(weekMetBijhorendeToekenning.weeknummer)) {
            this.openWeek(weekMetBijhorendeToekenning.weeknummer);
        }
    }

    getSelectedToekenningen() {
        const removeInleveropdrachtSuffix = (controlId: string) =>
            controlId.endsWith(':0') || controlId.endsWith(':1') ? controlId.slice(0, -2) : controlId;
        const isGeselecteerd = (controlId: string) => this.toekenningenFormGroup.value[controlId];

        return uniq(Object.keys(this.toekenningenFormGroup.value).filter(isGeselecteerd).map(removeInleveropdrachtSuffix));
    }

    isEersteWeekVanPeriode(week: Week) {
        return week.periode && week.weeknummer === getISOWeek(week.periode.begin!);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
