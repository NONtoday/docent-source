import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { collapseAnimation } from 'angular-animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Toekenning, ToekenningFieldsFragment } from '@docent/codegen';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconChevronOnder, IconInleveropdracht, IconName, IconStartmoment, IconSynchroniseren, provideIcons } from 'harmony-icons';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { StudiewijzeritemTitelPipe } from '../../rooster-shared/pipes/studiewijzeritem-titel.pipe';
import { getVerschilTussenStartEnEindInleveropdracht } from '../../rooster-shared/utils/date.utils';
import { Optional } from '../../rooster-shared/utils/utils';
import { StudiewijzeritemInhoudComponent } from '../../shared/components/studiewijzeritem-inhoud/studiewijzeritem-inhoud.component';

@Component({
    selector: 'dt-selectable-item',
    templateUrl: './selectable-item.component.html',
    styleUrls: ['./selectable-item.component.scss'],
    animations: [collapseAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CheckboxComponent,
        TooltipDirective,
        StudiewijzeritemInhoudComponent,
        StudiewijzeritemTitelPipe,
        IconDirective
    ],
    providers: [provideIcons(IconSynchroniseren, IconChevronOnder, IconStartmoment, IconInleveropdracht)]
})
export class SelectableItemComponent implements OnInit, OnChanges, OnDestroy {
    @Input() toekenning: Toekenning | ToekenningFieldsFragment;
    @Input() group: UntypedFormGroup;

    public expanded = false;
    public icon: Optional<IconName>;
    public controlId: string;
    public labels: string[];

    public selected = signal(false);

    /**
     * event voor wanneer er van een inleveropdracht het start of eind wordt aangevinkt,
     * maar de bijhorende toekenning dichtgeklapt is
     */
    conceptOpdrachtAangevinkt = output<{
        id: string;
        isStart: boolean;
    }>();

    private destroy$ = new Subject<void>();

    ngOnInit() {
        if (this.toekenning.studiewijzeritem.conceptInleveropdracht || this.toekenning.studiewijzeritem.inleverperiode) {
            const opdrachtIdSuffix = this.toekenning.isStartInleverperiode ? '1' : '0';
            this.controlId = `${this.toekenning.id}:${opdrachtIdSuffix}`;
            this.group.addControl(this.controlId, new UntypedFormControl(false));

            const toekenningControl = this.group.get(this.controlId)!;

            const bijhorendOpdrachtIdSuffix = this.toekenning.isStartInleverperiode ? '0' : '1';
            const bijhorendeControl = this.group.get(`${this.toekenning.id}:${bijhorendOpdrachtIdSuffix}`);

            // wannneer bij het aanmaken de bijhorende toekenning al bestaat, zet dan de waardes gelijk
            if (bijhorendeControl) {
                toekenningControl.setValue(bijhorendeControl.value);
                this.selected.set(bijhorendeControl.value);
            }

            toekenningControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isAangevinkt) => {
                const bijhorendeCtrl = this.group.get(`${this.toekenning.id}:${bijhorendOpdrachtIdSuffix}`);
                if (bijhorendeCtrl) {
                    bijhorendeCtrl.setValue(isAangevinkt, { emitEvent: false });
                }
                if (isAangevinkt) {
                    this.conceptOpdrachtAangevinkt.emit({
                        id: this.toekenning.id,
                        isStart: Boolean(this.toekenning.isStartInleverperiode)
                    });
                }
            });

            if (this.toekenning.isStartInleverperiode) {
                this.labels = [`Deadline ${getVerschilTussenStartEnEindInleveropdracht(this.toekenning)} later`];
            } else {
                this.labels = [`Start ${getVerschilTussenStartEnEindInleveropdracht(this.toekenning)} eerder`];
            }
        } else {
            this.controlId = this.toekenning.id;
            this.group.addControl(this.controlId, new UntypedFormControl(false));
        }
    }

    ngOnChanges() {
        this.icon = this.toekenning.studiewijzeritem.icon as IconName;
        if (this.toekenning.studiewijzeritem.conceptInleveropdracht || this.toekenning.studiewijzeritem.inleverperiode) {
            this.icon = this.toekenning.isStartInleverperiode ? 'startmoment' : 'inleveropdracht';
        }
    }

    onCheckboxClick() {
        this.selected.set(!this.selected());
        if (this.selected()) {
            this.group.get(this.controlId)!.setValue(true);
        } else {
            this.group.get(this.controlId)!.setValue(false);
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleDetails(): void {
        this.expanded = !this.expanded;
    }
}
